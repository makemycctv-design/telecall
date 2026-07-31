<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        * { font-family: DejaVu Sans, sans-serif; }
        body { color: #1e293b; font-size: 12px; margin: 0; }
        .wrap { padding: 32px 36px; }
        .head { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .head td { vertical-align: top; }
        .logo { height: 48px; }
        .company-name { font-size: 18px; font-weight: bold; color: #4f46e5; }
        .muted { color: #64748b; }
        .doc-title { font-size: 22px; font-weight: bold; text-align: right; color: #0f172a; }
        .meta { text-align: right; font-size: 11px; }
        .section { margin-top: 18px; }
        .billto-label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #94a3b8; }
        table.items { width: 100%; border-collapse: collapse; margin-top: 14px; }
        table.items th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; color: #475569; }
        table.items td { padding: 8px; border-bottom: 1px solid #e2e8f0; }
        .right { text-align: right; }
        .totals { width: 46%; margin-left: 54%; margin-top: 14px; border-collapse: collapse; }
        .totals td { padding: 6px 8px; }
        .totals .grand { border-top: 2px solid #0f172a; font-weight: bold; font-size: 14px; }
        .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: bold; }
        .footer { margin-top: 36px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
    </style>
</head>
<body>
<div class="wrap">
    <table class="head">
        <tr>
            <td style="width:60%;">
                @if ($logo)
                    <img src="{{ $logo }}" class="logo" alt="logo"><br>
                @endif
                <div class="company-name">{{ $company['name'] }}</div>
                @if ($company['address'])<div class="muted">{{ $company['address'] }}</div>@endif
                @if ($company['phone'])<div class="muted">Phone: {{ $company['phone'] }}</div>@endif
                @if ($company['email'])<div class="muted">{{ $company['email'] }}</div>@endif
                @if ($company['gstin'])<div class="muted">GSTIN: {{ $company['gstin'] }}</div>@endif
            </td>
            <td style="width:40%;">
                <div class="doc-title">INVOICE</div>
                <div class="meta">
                    <div><strong>{{ $invoice->invoice_number }}</strong></div>
                    @if ($invoice->issued_at)<div>Date: {{ $invoice->issued_at->format('d M Y') }}</div>@endif
                    @if ($invoice->quotation)<div class="muted">Ref: {{ $invoice->quotation->quotation_number }}</div>@endif
                    <div style="margin-top:6px;">
                        <span class="badge" style="background:{{ $statusBg }}; color:{{ $statusColor }};">{{ $statusLabel }}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <div class="section">
        <div class="billto-label">Bill To</div>
        <div><strong>{{ $invoice->lead->name }}</strong></div>
        @if ($invoice->lead->company)<div class="muted">{{ $invoice->lead->company }}</div>@endif
        @if ($invoice->lead->phone)<div class="muted">{{ $invoice->lead->phone }}</div>@endif
        @if ($invoice->lead->email)<div class="muted">{{ $invoice->lead->email }}</div>@endif
    </div>

    <table class="items">
        <thead>
            <tr>
                <th>#</th>
                <th>Item</th>
                <th class="right">Qty</th>
                <th class="right">Unit</th>
                <th class="right">Disc %</th>
                <th class="right">Tax %</th>
                <th class="right">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($invoice->items as $i => $item)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $item->name }}</td>
                    <td class="right">{{ rtrim(rtrim(number_format($item->quantity, 2), '0'), '.') }}</td>
                    <td class="right">{{ $money($item->unit_price) }}</td>
                    <td class="right">{{ number_format($item->discount_percent, 2) }}</td>
                    <td class="right">{{ number_format($item->tax_percent, 2) }}</td>
                    <td class="right">{{ $money($item->line_total) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals">
        <tr><td class="muted">Subtotal</td><td class="right">{{ $money($invoice->subtotal) }}</td></tr>
        <tr><td class="muted">Discount</td><td class="right">- {{ $money($invoice->discount_total) }}</td></tr>
        <tr><td class="muted">Tax</td><td class="right">{{ $money($invoice->tax_total) }}</td></tr>
        <tr class="grand"><td>Total</td><td class="right">{{ $money($invoice->total) }}</td></tr>
        <tr><td class="muted">Advance / Paid</td><td class="right">{{ $money($invoice->advance_amount) }}</td></tr>
        <tr><td class="muted"><strong>Balance Due</strong></td><td class="right"><strong>{{ $money($invoice->balance_amount) }}</strong></td></tr>
    </table>

    @if ($invoice->notes)
        <div class="section muted"><strong>Notes:</strong> {{ $invoice->notes }}</div>
    @endif

    <div class="footer">
        {{ $company['name'] }}@if ($company['website']) · {{ $company['website'] }}@endif — This is a computer-generated invoice.
    </div>
</div>
</body>
</html>
