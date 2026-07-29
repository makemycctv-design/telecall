<?php

namespace App\Http\Controllers;

use App\Enums\CallOutcome;
use App\Enums\LeadPriority;
use App\Enums\LeadStatus;
use App\Http\Requests\AssignLeadRequest;
use App\Http\Requests\StoreLeadRequest;
use App\Http\Requests\UpdateLeadRequest;
use App\Http\Requests\UpdateLeadStatusRequest;
use App\Models\Lead;
use App\Models\LeadSource;
use App\Models\LeadTag;
use App\Models\User;
use App\Services\LeadAssignmentService;
use App\Services\LeadStatusService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function __construct(
        private LeadAssignmentService $assignment,
        private LeadStatusService $statusService,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Lead::class);

        $filters = $request->only(['search', 'status', 'priority', 'source_id', 'assigned_to', 'from', 'to', 'sort']);

        $leads = Lead::query()
            ->forUser($request->user())
            ->with(['assignee:id,name', 'source:id,name', 'tags:id,name,color'])
            ->when($filters['search'] ?? null, fn ($q, $s) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$s}%")
                ->orWhere('phone', 'like', "%{$s}%")
                ->orWhere('email', 'like', "%{$s}%")
                ->orWhere('company', 'like', "%{$s}%")))
            ->when($filters['status'] ?? null, fn ($q, $v) => $q->where('status', $v))
            ->when($filters['priority'] ?? null, fn ($q, $v) => $q->where('priority', $v))
            ->when($filters['source_id'] ?? null, fn ($q, $v) => $q->where('lead_source_id', $v))
            ->when($filters['assigned_to'] ?? null, fn ($q, $v) => $q->where('assigned_to', $v))
            ->when($filters['from'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['to'] ?? null, fn ($q, $v) => $q->whereDate('created_at', '<=', $v))
            ->orderByDesc('updated_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Leads/Index', [
            'leads' => $leads,
            'filters' => $filters,
            'options' => $this->filterOptions($request->user()),
        ]);
    }

    public function show(Request $request, Lead $lead): Response
    {
        $this->authorize('view', $lead);

        $lead->load([
            'assignee:id,name',
            'source:id,name',
            'creator:id,name',
            'tags:id,name,color',
            'callLogs.user:id,name',
            'tasks.assignee:id,name',
            'statusHistories.changedBy:id,name',
            'assignments.assignee:id,name',
            'assignments.assignedBy:id,name',
        ]);

        return Inertia::render('Leads/Show', [
            'lead' => $lead,
            'timeline' => $this->buildTimeline($lead),
            'options' => $this->filterOptions($request->user()),
            'callOutcomes' => CallOutcome::options(),
        ]);
    }

    public function store(StoreLeadRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $tags = $data['tags'] ?? [];
        unset($data['tags']);

        $data['created_by'] = $request->user()->id;
        $data['status'] ??= LeadStatus::New->value;
        $data['priority'] ??= LeadPriority::Medium->value;

        $lead = Lead::create($data);

        if (! empty($tags)) {
            $lead->tags()->sync($tags);
        }

        if ($lead->assigned_to) {
            $this->assignment->assign($lead, User::find($lead->assigned_to), $request->user(), 'manual');
        } else {
            $this->assignment->autoAssign($lead, $request->user());
        }

        return redirect()->route('leads.show', $lead)->with('success', 'Lead created.');
    }

    public function update(UpdateLeadRequest $request, Lead $lead): RedirectResponse
    {
        $data = $request->validated();
        $tags = $data['tags'] ?? null;
        unset($data['tags']);

        $lead->update($data);

        if ($tags !== null) {
            $lead->tags()->sync($tags);
        }

        return back()->with('success', 'Lead updated.');
    }

    public function destroy(Lead $lead): RedirectResponse
    {
        $this->authorize('delete', $lead);
        $lead->delete();

        return redirect()->route('leads.index')->with('success', 'Lead deleted.');
    }

    public function updateStatus(UpdateLeadStatusRequest $request, Lead $lead): RedirectResponse
    {
        $this->statusService->transition(
            $lead,
            LeadStatus::from($request->validated('status')),
            $request->user(),
            $request->validated('note'),
        );

        return back()->with('success', 'Status updated.');
    }

    public function assign(AssignLeadRequest $request, Lead $lead): RedirectResponse
    {
        $assignee = User::findOrFail($request->validated('assigned_to'));
        $this->assignment->assign($lead, $assignee, $request->user(), 'manual', $request->validated('reason'));

        return back()->with('success', "Lead assigned to {$assignee->name}.");
    }

    // ---- Helpers ---------------------------------------------------------

    protected function filterOptions(User $user): array
    {
        $telecallers = User::telecallers()->active();
        if ($user->isManager()) {
            $telecallers->where('manager_id', $user->id);
        }

        return [
            'statuses' => LeadStatus::options(),
            'priorities' => LeadPriority::options(),
            'sources' => LeadSource::where('is_active', true)->get(['id', 'name']),
            'tags' => LeadTag::get(['id', 'name', 'color']),
            'telecallers' => $telecallers->get(['id', 'name']),
        ];
    }

    protected function buildTimeline(Lead $lead): array
    {
        $events = collect();

        foreach ($lead->callLogs as $call) {
            $events->push([
                'type' => 'call',
                'at' => $call->created_at,
                'title' => 'Call · '.$call->outcome->label(),
                'body' => $call->notes,
                'meta' => ['by' => $call->user?->name, 'duration' => $call->duration_seconds],
            ]);
        }
        foreach ($lead->statusHistories as $history) {
            $events->push([
                'type' => 'status',
                'at' => $history->created_at,
                'title' => 'Status → '.$history->to_status->label(),
                'body' => $history->note,
                'meta' => ['by' => $history->changedBy?->name],
            ]);
        }
        foreach ($lead->assignments as $assignment) {
            $events->push([
                'type' => 'assignment',
                'at' => $assignment->assigned_at,
                'title' => 'Assigned to '.$assignment->assignee?->name,
                'body' => $assignment->reason,
                'meta' => ['by' => $assignment->assignedBy?->name, 'strategy' => $assignment->strategy],
            ]);
        }

        return $events->sortByDesc('at')->values()->all();
    }
}
