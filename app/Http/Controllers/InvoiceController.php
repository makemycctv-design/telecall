<?php

namespace App\Http\Controllers;

use App\Enums\InvoiceStatus;
use App\Models\Invoice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

    private function authorizeView(Request $request, Invoice $invoice): void
    {
        $user = $request->user();
        abort_unless(
            $user->isAdmin() || $user->isManager() || $invoice->created_by === $user->id,
            403,
        );
    }
}
