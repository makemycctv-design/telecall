<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCallLogRequest;
use App\Models\Lead;
use App\Services\CallLogService;
use Illuminate\Http\RedirectResponse;
use App\Models\CallLog;

class CallLogController extends Controller
{
    public function __construct(private CallLogService $service) {}

    public function store(StoreCallLogRequest $request): RedirectResponse
    {
        $this->authorize('create', CallLog::class);

        $lead = Lead::findOrFail($request->validated('lead_id'));
        $this->service->log($lead, $request->user(), $request->validated());

        return back()->with('success', 'Call logged.');
    }
}
