<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        $invoices = Invoice::query()
            ->forUser($request->user())
            ->with(['lead:id,name,phone', 'creator:id,name'])
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Invoices/Index', [
            'invoices' => $invoices,
            'statuses' => InvoiceStatus::options(),
            'filters' => $request->only('status'),
        ]);
    }

    public function show(Request $request, Invoice $invoice): Response
    {
        $this->authorizeView($request, $invoice);

        $invoice->load(['items.product:id,name', 'lead:id,name,phone,email', 'creator:id,name', 'quotation:id,quotation_number']);

        return Inertia::render('Sales/Invoices/Show', [
            'invoice' => $invoice,
            'statuses' => InvoiceStatus::options(),
        ]);
    }

    /**
     * Record an additional payment against the invoice (increases advance,
     * recomputes balance and status).
     */
    public function recordPayment(Request $request, Invoice $invoice): RedirectResponse
    {
        $this->authorizeView($request, $invoice);

        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
        ]);

        $advance = min((float) $invoice->total, (float) $invoice->advance_amount + (float) $data['amount']);
        $balance = round((float) $invoice->total - $advance, 2);

        $invoice->update([
            'advance_amount' => $advance,
            'balance_amount' => $balance,
            'status' => $balance <= 0 ? InvoiceStatus::Paid->value : InvoiceStatus::Partial->value,
        ]);

        return back()->with('success', 'Payment recorded.');
    }

    /**
     * Download the invoice as a PDF with the company logo and address.
     */
    public function download(Request $request, Invoice $invoice): HttpResponse
    {
        $this->authorizeView($request, $invoice);

        $invoice->load(['items', 'lead', 'quotation:id,quotation_number']);

        $company = config('telecrm.company');

        // Embed the logo as a data URI so dompdf renders it without file-path
        // / chroot concerns. Skipped gracefully if the file is missing.
        $logo = null;
        $logoPath = $company['logo'] ? public_path($company['logo']) : null;
        if ($logoPath && is_file($logoPath)) {
            $type = pathinfo($logoPath, PATHINFO_EXTENSION) === 'svg' ? 'svg+xml' : (pathinfo($logoPath, PATHINFO_EXTENSION) ?: 'png');
            $logo = 'data:image/'.$type.';base64,'.base64_encode((string) file_get_contents($logoPath));
        }

        $status = $invoice->status instanceof InvoiceStatus ? $invoice->status : InvoiceStatus::from($invoice->status);
        $statusPalette = [
            'unpaid' => ['#fee2e2', '#b91c1c'],
            'partial' => ['#fef3c7', '#b45309'],
            'paid' => ['#dcfce7', '#15803d'],
        ];
        [$statusBg, $statusColor] = $statusPalette[$status->value] ?? ['#e2e8f0', '#334155'];

        $pdf = Pdf::loadView('pdf.invoice', [
            'invoice' => $invoice,
            'company' => $company,
            'logo' => $logo,
            'statusLabel' => $status->label(),
            'statusBg' => $statusBg,
            'statusColor' => $statusColor,
            'money' => fn ($v) => 'Rs. '.number_format((float) $v, 2),
        ])->setPaper('a4');

        return $pdf->download($invoice->invoice_number.'.pdf');
    }

    private function authorizeView(Request $request, Invoice $invoice): void
    {
        $user = $request->user();
        abort_unless(
            $user->isAdmin() || $user->isManager() || $invoice->created_by === $user->id,
            403,
        );
    }
}
