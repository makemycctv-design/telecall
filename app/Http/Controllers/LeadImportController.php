<?php

namespace App\Http\Controllers;

use App\Http\Requests\ImportLeadsRequest;
use App\Jobs\ImportLeadsJob;
use App\Services\LeadImportService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeadImportController extends Controller
{
    public function __construct(private LeadImportService $service) {}

    public function store(ImportLeadsRequest $request): RedirectResponse
    {
        $path = $request->file('file')->store('imports');
        $autoAssign = $request->boolean('auto_assign', true);

        $rowCount = count($this->service->parseCsv(Storage::path($path)));

        // Small files import synchronously for instant feedback; large files
        // are queued to avoid request timeouts.
        if ($rowCount <= 200) {
            $summary = $this->service->importRows(
                $this->service->parseCsv(Storage::path($path)),
                $request->user(),
                $autoAssign,
            );
            Storage::delete($path);

            return back()->with('success', "Imported {$summary['imported']} lead(s), skipped {$summary['skipped']}.");
        }

        ImportLeadsJob::dispatch($path, $request->user()->id, $autoAssign);

        return back()->with('success', "Import of {$rowCount} rows queued. You'll be notified when it finishes.");
    }

    /** Download a CSV template with the expected headers. */
    public function template(): StreamedResponse
    {
        $headers = ['name', 'phone', 'email', 'company', 'city', 'source', 'priority', 'notes'];

        return response()->stream(function () use ($headers) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $headers);
            fputcsv($out, ['Jane Doe', '+15551234567', 'jane@acme.co', 'Acme Co', 'Austin', 'Website', 'high', 'Requested a demo']);
            fclose($out);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="leads-template.csv"',
        ]);
    }
}
