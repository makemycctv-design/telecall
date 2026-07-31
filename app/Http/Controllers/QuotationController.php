<?php

namespace App\Http\Controllers;

use App\Enums\QuotationStatus;
use App\Http\Requests\ConvertQuotationRequest;
use App\Http\Requests\StoreQuotationRequest;
use App\Mail\QuotationMail;
use App\Models\Lead;
use App\Models\Product;
use App\Models\Quotation;
use App\Services\QuotationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class QuotationController extends Controller
{
    public function __construct(private QuotationService $service) {}

    public function index(Request $request): Response
    {
        $quotations = Quotation::query()
            ->forUser($request->user())
            ->with(['lead:id,name,phone', 'creator:id,name'])
            ->when($request->input('status'), fn ($q, $v) => $q->where('status', $v))
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Sales/Quotations/Index', [
            'quotations' => $quotations,
            'statuses' => QuotationStatus::options(),
            'filters' => $request->only('status'),
        ]);
    }

    public function create(Request $request): Response
    {
        return Inertia::render('Sales/Quotations/Create', [
            'leads' => Lead::query()->forUser($request->user())
                ->orderBy('name')->get(['id', 'name', 'phone', 'email']),
            'products' => Product::where('is_active', true)
                ->orderBy('name')->get(['id', 'name', 'price', 'tax_percent']),
            'preselectLead' => $request->integer('lead_id') ?: null,
        ]);
    }

    public function store(StoreQuotationRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $quotation = $this->service->create($data, $data['items'], $request->user());

        return redirect()->route('quotations.show', $quotation)->with('success', 'Quotation created.');
    }

    public function show(Request $request, Quotation $quotation): Response
    {
        $this->authorizeView($request, $quotation);

        $quotation->load(['items.product:id,name', 'lead:id,name,phone,email', 'creator:id,name', 'invoice:id,invoice_number']);

        return Inertia::render('Sales/Quotations/Show', [
            'quotation' => $quotation,
            'statuses' => QuotationStatus::options(),
        ]);
    }

    public function updateStatus(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizeView($request, $quotation);
        $data = $request->validate(['status' => ['required', Rule::enum(QuotationStatus::class)]]);
        $quotation->update(['status' => $data['status']]);

        return back()->with('success', 'Quotation status updated.');
    }

    public function sendEmail(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizeView($request, $quotation);

        if (! $quotation->lead->email) {
            return back()->with('error', 'This lead has no email address.');
        }

        Mail::to($quotation->lead->email)->send(new QuotationMail($quotation));

        if ($quotation->status === QuotationStatus::Draft) {
            $quotation->update(['status' => QuotationStatus::Sent->value]);
        }

        return back()->with('success', "Quotation emailed to {$quotation->lead->email}.");
    }

    public function convert(ConvertQuotationRequest $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizeView($request, $quotation);

        if ($quotation->converted_invoice_id) {
            return redirect()->route('invoices.show', $quotation->converted_invoice_id)
                ->with('error', 'This quotation was already converted.');
        }

        $invoice = $this->service->convertToInvoice(
            $quotation,
            (float) $request->validated('advance_amount', 0),
            $request->filled('issued_at') ? Carbon::parse($request->validated('issued_at')) : null,
        );

        return redirect()->route('invoices.show', $invoice)->with('success', 'Invoice created from quotation.');
    }

    public function destroy(Request $request, Quotation $quotation): RedirectResponse
    {
        $this->authorizeView($request, $quotation);
        $quotation->delete();

        return redirect()->route('quotations.index')->with('success', 'Quotation deleted.');
    }

    private function authorizeView(Request $request, Quotation $quotation): void
    {
        $user = $request->user();
        abort_unless(
            $user->isAdmin() || $user->isManager() || $quotation->created_by === $user->id,
            403,
        );
    }
}
