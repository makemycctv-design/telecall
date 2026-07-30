<?php

namespace App\Http\Controllers;

use App\Enums\ProjectStatus;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Models\Lead;
use App\Models\Project;
use App\Models\User;
use App\Notifications\NewProjectAssignedNotification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    /**
     * Executors see their assigned projects (their "task list").
     * Managers/Admins see the management view: all projects + converted leads
     * still awaiting handoff to an executor.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Project::class);
        $user = $request->user();

        $filter = $request->string('filter', 'open')->toString();

        $projects = Project::query()
            ->forUser($user)
            ->with(['lead:id,name,phone,company', 'executor:id,name', 'assignedBy:id,name'])
            ->when($filter === 'open', fn ($q) => $q->open())
            ->when($filter === 'overdue', fn ($q) => $q->overdue())
            ->when($filter === 'completed', fn ($q) => $q->where('status', ProjectStatus::Completed->value))
            ->orderByRaw('deadline IS NULL, deadline asc')
            ->paginate(15)
            ->withQueryString();

        $props = [
            'projects' => $projects,
            'filter' => $filter,
            'counts' => [
                'open' => Project::query()->forUser($user)->open()->count(),
                'overdue' => Project::query()->forUser($user)->overdue()->count(),
                'completed' => Project::query()->forUser($user)->where('status', ProjectStatus::Completed->value)->count(),
            ],
            'statuses' => ProjectStatus::options(),
            'isManager' => $user->isManager() || $user->isAdmin(),
        ];

        // Manager/admin: also surface converted leads that still need assigning.
        if ($user->isManager() || $user->isAdmin()) {
            $props['awaitingHandoff'] = Lead::query()
                ->forUser($user)
                ->convertedAwaitingHandoff()
                ->with(['assignee:id,name', 'source:id,name'])
                ->latest('converted_at')
                ->limit(50)
                ->get(['id', 'name', 'phone', 'company', 'deal_value', 'assigned_to', 'lead_source_id', 'converted_at']);

            $props['executors'] = User::executors()->active()->get(['id', 'name']);
        }

        return Inertia::render($props['isManager'] ? 'Projects/Manage' : 'Projects/Index', $props);
    }

    public function show(Request $request, Project $project): Response
    {
        $this->authorize('view', $project);

        $project->load([
            'lead:id,name,phone,email,company,city,deal_value',
            'executor:id,name',
            'assignedBy:id,name',
            'logs.user:id,name',
        ]);

        return Inertia::render('Projects/Show', [
            'project' => $project,
            'statuses' => ProjectStatus::options(),
            'canManage' => $request->user()->isManager() || $request->user()->isAdmin(),
            'isExecutor' => $project->assigned_to === $request->user()->id,
        ]);
    }

    /**
     * Manager assigns a converted lead to an executor as a project.
     */
    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $data = $request->validated();

        $startDate = isset($data['start_date']) ? Carbon::parse($data['start_date']) : Carbon::today();

        // Resolve deadline: explicit date wins, else start + duration days.
        $deadline = null;
        if (! empty($data['deadline'])) {
            $deadline = Carbon::parse($data['deadline']);
        } elseif (! empty($data['duration_days'])) {
            $deadline = $startDate->copy()->addDays((int) $data['duration_days']);
        }

        $project = Project::create([
            'lead_id' => $data['lead_id'],
            'assigned_to' => $data['assigned_to'],
            'assigned_by' => $request->user()->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'status' => ProjectStatus::Pending->value,
            'progress_percent' => 0,
            'start_date' => $startDate->toDateString(),
            'duration_days' => $data['duration_days'] ?? null,
            'deadline' => $deadline?->toDateString(),
        ]);

        $project->executor?->notify(new NewProjectAssignedNotification($project));

        return back()->with('success', 'Project assigned to executor.');
    }

    /**
     * Update status / progress (executor or manager) or details (manager).
     */
    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $data = $request->validated();

        if (isset($data['status'])) {
            $status = ProjectStatus::from($data['status']);
            $project->status = $status;
            if ($status === ProjectStatus::Completed) {
                $project->completed_at = now();
                $project->progress_percent = 100;
            }
        }

        foreach (['progress_percent', 'title', 'description', 'deadline'] as $field) {
            if (array_key_exists($field, $data) && $data[$field] !== null) {
                $project->{$field} = $data[$field];
            }
        }

        $project->save();

        return back()->with('success', 'Project updated.');
    }

    public function destroy(Project $project): RedirectResponse
    {
        $this->authorize('delete', $project);
        $project->delete();

        return redirect()->route('projects.index')->with('success', 'Project removed.');
    }
}
