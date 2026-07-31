<?php

namespace App\Services;

use App\Enums\InvoiceStatus;
use App\Enums\QuotationStatus;
use App\Models\Invoice;
use App\Models\Quotation;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class QuotationService
{
    /**
     * Compute a single line total: qty * unit_price, less discount %, plus tax %.
     *
     * @return array{net: float, tax: float, gross: float}
     */
    public function lineAmounts(array $item): array
    {
        $qty = (float) ($item['quantity'] ?? 1);
        $price = (float) ($item['unit_price'] ?? 0);
        $discPct = (float) ($item['discount_percent'] ?? 0);
        $taxPct = (float) ($item['tax_percent'] ?? 0);

        $gross = $qty * $price;
        $discount = $gross * $discPct / 100;
        $net = $gross - $discount;
        $tax = $net * $taxPct / 100;

        return [
            'gross' => round($gross, 2),
            'discount' => round($discount, 2),
            'net' => round($net, 2),
            'tax' => round($tax, 2),
            'line_total' => round($net + $tax, 2),
        ];
    }

    /**
     * Roll a set of raw item arrays into document totals.
     *
     * @return array{subtotal: float, discount_total: float, tax_total: float, total: float, items: array}
     */
    public function totalsFor(array $items): array
    {
        $subtotal = $discount = $tax = 0.0;
        $normalised = [];

        foreach ($items as $item) {
            $amounts = $this->lineAmounts($item);
            $subtotal += $amounts['gross'];
            $discount += $amounts['discount'];
            $tax += $amounts['tax'];

            $normalised[] = [
                'product_id' => $item['product_id'] ?? null,
                'name' => $item['name'],
                'quantity' => (float) ($item['quantity'] ?? 1),
                'unit_price' => (float) ($item['unit_price'] ?? 0),
                'discount_percent' => (float) ($item['discount_percent'] ?? 0),
                'tax_percent' => (float) ($item['tax_percent'] ?? 0),
                'line_total' => $amounts['line_total'],
            ];
        }

        return [
            'subtotal' => round($subtotal, 2),
            'discount_total' => round($discount, 2),
            'tax_total' => round($tax, 2),
            'total' => round($subtotal - $discount + $tax, 2),
            'items' => $normalised,
        ];
    }

    public function nextNumber(string $prefix, string $table): string
    {
        $id = (int) (DB::table($table)->max('id') ?? 0) + 1;

        return sprintf('%s-%s-%05d', $prefix, now()->format('Y'), $id);
    }

    /**
     * Create a quotation with its line items and computed totals.
     *
     * @param  array<int,array<string,mixed>>  $items
     */
    public function create(array $data, array $items, User $user): Quotation
    {
        return DB::transaction(function () use ($data, $items, $user) {
            $totals = $this->totalsFor($items);

            $quotation = Quotation::create([
                'quotation_number' => 'TMP',
                'lead_id' => $data['lead_id'],
                'created_by' => $user->id,
                'status' => QuotationStatus::Draft->value,
                'subtotal' => $totals['subtotal'],
                'discount_total' => $totals['discount_total'],
                'tax_total' => $totals['tax_total'],
                'total' => $totals['total'],
                'notes' => $data['notes'] ?? null,
                'valid_until' => $data['valid_until'] ?? null,
            ]);

            $quotation->update(['quotation_number' => sprintf('QUO-%s-%05d', now()->format('Y'), $quotation->id)]);
            $quotation->items()->createMany($totals['items']);

            return $quotation->load('items');
        });
    }

    /**
     * Convert a quotation into an invoice, recording the advance payment.
     */
    public function convertToInvoice(Quotation $quotation, float $advance, ?Carbon $issuedAt = null): Invoice
    {
        return DB::transaction(function () use ($quotation, $advance, $issuedAt) {
            $total = (float) $quotation->total;
            $advance = max(0, min($advance, $total));
            $balance = round($total - $advance, 2);

            $status = match (true) {
                $advance <= 0 => InvoiceStatus::Unpaid,
                $balance <= 0 => InvoiceStatus::Paid,
                default => InvoiceStatus::Partial,
            };

            $invoice = Invoice::create([
                'invoice_number' => 'TMP',
                'quotation_id' => $quotation->id,
                'lead_id' => $quotation->lead_id,
                'created_by' => $quotation->created_by,
                'status' => $status->value,
                'subtotal' => $quotation->subtotal,
                'discount_total' => $quotation->discount_total,
                'tax_total' => $quotation->tax_total,
                'total' => $total,
                'advance_amount' => $advance,
                'balance_amount' => $balance,
                'notes' => $quotation->notes,
                'issued_at' => ($issuedAt ?? now())->toDateString(),
            ]);

            $invoice->update(['invoice_number' => sprintf('INV-%s-%05d', now()->format('Y'), $invoice->id)]);

            foreach ($quotation->items as $item) {
                $invoice->items()->create([
                    'product_id' => $item->product_id,
                    'name' => $item->name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount_percent' => $item->discount_percent,
                    'tax_percent' => $item->tax_percent,
                    'line_total' => $item->line_total,
                ]);
            }

            $quotation->update([
                'status' => QuotationStatus::Converted->value,
                'converted_invoice_id' => $invoice->id,
            ]);

            return $invoice->load('items');
        });
    }
}
