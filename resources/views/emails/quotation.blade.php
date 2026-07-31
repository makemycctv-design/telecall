<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #1e293b; }
        table { border-collapse: collapse; width: 100%; margin-top: 12px; }
        th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        th { background: #f8fafc; }
        .right { text-align: right; }
        .totals td { border: 0; }
    </style>
</head>
<body>
    <h2>Quotation {{ $quotation->quotation_number }}</h2>
    <p>Dear {{ $quotation->lead->name }},</p>
    <p>Please find your quotation below.</p>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th class="right">Qty</th>
                <th class="right">Unit</th>
                <th class="right">Disc %</th>
                <th class="right">Line total</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($quotation->items as $item)
                <tr>
                    <td>{{ $item->name }}</td>
                    <td class="right">{{ rtrim(rtrim(number_format($item->quantity, 2), '0'), '.') }}</td>
                    <td class="right">{{ number_format($item->unit_price, 2) }}</td>
                    <td class="right">{{ number_format($item->discount_percent, 2) }}</td>
                    <td class="right">{{ number_format($item->line_total, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals" style="margin-top:12px; width:280px; margin-left:auto;">
        <tr><td>Subtotal</td><td class="right">{{ number_format($quotation->subtotal, 2) }}</td></tr>
        <tr><td>Discount</td><td class="right">-{{ number_format($quotation->discount_total, 2) }}</td></tr>
        <tr><td>Tax</td><td class="right">{{ number_format($quotation->tax_total, 2) }}</td></tr>
        <tr><td><strong>Total</strong></td><td class="right"><strong>{{ number_format($quotation->total, 2) }}</strong></td></tr>
    </table>

    @if ($quotation->valid_until)
        <p style="margin-top:16px; font-size:13px; color:#64748b;">Valid until {{ $quotation->valid_until->format('M j, Y') }}.</p>
    @endif
    @if ($quotation->notes)
        <p style="font-size:13px;">{{ $quotation->notes }}</p>
    @endif
</body>
</html>
