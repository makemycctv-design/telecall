<?php

namespace App\Http\Controllers;

use App\Models\LeadSource;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function index(Request $request): Response
    {
        $category = $request->string('category', 'ongoing')->toString();
        $filters = $request->only(['staff_id', 'source_id', 'status', 'from', 'to']);

        $report = $this->reports->build($category, $request->user(), $filters);

        return Inertia::render('Reports/Index', [
            'report' => $report,
            'category' => $category,
            'filters' => $filters,
            'options' => [
                'staff' => User::telecallers()->active()->get(['id', 'name']),
                'sources' => LeadSource::where('is_active', true)->get(['id', 'name']),
            ],
        ]);
    }

    /** Export the current report category as CSV. */
    public function export(Request $request): StreamedResponse
    {
        $category = $request->string('category', 'ongoing')->toString();
        $filters = $request->only(['staff_id', 'source_id', 'status', 'from', 'to']);
        $report = $this->reports->build($category, $request->user(), $filters);

        $rows = $report['rows']->getCollection();
        $filename = "report-{$category}-".now()->format('Ymd_His').'.csv';

        $callback = function () use ($rows) {
            $out = fopen('php://output', 'w');
            if ($rows->isNotEmpty()) {
                fputcsv($out, array_keys($rows->first()->toArray()));
                foreach ($rows as $row) {
                    fputcsv($out, array_map(fn ($v) => is_array($v) ? json_encode($v) : $v, $row->toArray()));
                }
            }
            fclose($out);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}
