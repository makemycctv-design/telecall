<?php

namespace App\Http\Controllers;

use App\Enums\LeadStatus;
use App\Enums\ProjectStatus;
use App\Models\CallLog;
use App\Models\DailyStaffMetric;
use App\Models\Lead;
use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        return match (true) {
            $user->isAdmin() => $this->adminDashboard($user),
            $user->isManager() => $this->managerDashboard($user),
            $user->isExecutor() => $this->executorDashboard($user),
            default => $this->telecallerDashboard($user),
        };
    }

    protected function adminDashboard(User $user): Response
    {
        return Inertia::render('Dashboard/Admin', [
            'kpis' => [
                'total_leads' => Lead::count(),
                'converted' => Lead::where('status', LeadStatus::Converted->value)->count(),
                'active_staff' => User::telecallers()->active()->count(),
                'calls_today' => CallLog::whereDate('created_at', today())->count(),
                'overdue_tasks' => Task::overdue()->count(),
                'conversion_rate' => $this->conversionRate(Lead::query()),
            ],
            'pipeline' => $this->pipelineSummary(Lead::query()),
            'leaderboard' => $this->leaderboard(),
            'recent_activity' => $this->recentActivity(Lead::query()),
        ]);
    }

    protected function managerDashboard(User $user): Response
    {
        $teamIds = $user->teamMembers()->pluck('id')->push($user->id);
        $leadQuery = Lead::query()->whereIn('assigned_to', $teamIds);

        return Inertia::render('Dashboard/Manager', [
            'kpis' => [
                'team_leads' => (clone $leadQuery)->count(),
                'converted' => (clone $leadQuery)->where('status', LeadStatus::Converted->value)->count(),
                'interested' => (clone $leadQuery)->where('status', LeadStatus::Interested->value)->count(),
                'overdue_tasks' => Task::whereIn('assigned_to', $teamIds)->overdue()->count(),
                'calls_today' => CallLog::whereIn('user_id', $teamIds)->whereDate('created_at', today())->count(),
                'conversion_rate' => $this->conversionRate(clone $leadQuery),
            ],
            'pipeline' => $this->pipelineSummary(clone $leadQuery),
            'leaderboard' => $this->leaderboard($teamIds->all()),
            'recent_activity' => $this->recentActivity(clone $leadQuery),
            // Converted leads from the team that still need handoff to an executor.
            'converted_pending' => (clone $leadQuery)
                ->convertedAwaitingHandoff()
                ->with(['assignee:id,name', 'source:id,name'])
                ->latest('converted_at')
                ->limit(10)
                ->get(['id', 'name', 'phone', 'company', 'deal_value', 'assigned_to', 'lead_source_id', 'converted_at']),
            'executors' => User::executors()->active()->get(['id', 'name']),
        ]);
    }

    protected function executorDashboard(User $user): Response
    {
        $base = Project::where('assigned_to', $user->id);

        return Inertia::render('Dashboard/Executor', [
            'kpis' => [
                'active' => (clone $base)->open()->count(),
                'in_progress' => (clone $base)->where('status', ProjectStatus::InProgress->value)->count(),
                'overdue' => (clone $base)->overdue()->count(),
                'completed' => (clone $base)->where('status', ProjectStatus::Completed->value)->count(),
                'due_soon' => (clone $base)->open()->whereNotNull('deadline')
                    ->whereBetween('deadline', [today(), today()->addDays(3)])->count(),
                'logged_today' => $user->projectLogs()->whereDate('log_date', today())->count(),
            ],
            'active_projects' => (clone $base)->open()
                ->with('lead:id,name,company')
                ->orderByRaw('deadline IS NULL, deadline asc')
                ->limit(8)
                ->get(),
        ]);
    }

    protected function telecallerDashboard(User $user): Response
    {
        $leadQuery = Lead::where('assigned_to', $user->id);
        $today = DailyStaffMetric::where('user_id', $user->id)
            ->where('metric_date', today()->toDateString())
            ->first();

        return Inertia::render('Dashboard/Telecaller', [
            'kpis' => [
                'my_leads' => (clone $leadQuery)->open()->count(),
                'calls_today' => CallLog::where('user_id', $user->id)->whereDate('created_at', today())->count(),
                'talk_time' => (int) ($today?->talk_time_seconds ?? 0),
                'converted' => (clone $leadQuery)->where('status', LeadStatus::Converted->value)->count(),
                'due_today' => Task::where('assigned_to', $user->id)->dueToday()->count(),
                'overdue' => Task::where('assigned_to', $user->id)->overdue()->count(),
            ],
            'pipeline' => $this->pipelineSummary(clone $leadQuery),
            'due_tasks' => Task::where('assigned_to', $user->id)->open()
                ->with('lead:id,name,phone')
                ->orderByRaw('due_at IS NULL, due_at asc')
                ->limit(8)
                ->get(),
            'pending_callbacks' => (clone $leadQuery)
                ->where('status', LeadStatus::Callback->value)
                ->orderBy('next_follow_up_at')
                ->limit(8)
                ->get(['id', 'name', 'phone', 'next_follow_up_at']),
        ]);
    }

    // ---- Shared aggregate helpers ---------------------------------------

    protected function pipelineSummary($query): array
    {
        $counts = (clone $query)
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        return collect(LeadStatus::cases())->map(fn (LeadStatus $s) => [
            'status' => $s->value,
            'label' => $s->label(),
            'color' => $s->color(),
            'count' => (int) ($counts[$s->value] ?? 0),
        ])->all();
    }

    protected function conversionRate($query): float
    {
        $total = (clone $query)->count();
        if ($total === 0) {
            return 0.0;
        }
        $converted = (clone $query)->where('status', LeadStatus::Converted->value)->count();

        return round($converted / $total * 100, 1);
    }

    protected function leaderboard(?array $userIds = null): array
    {
        $query = User::telecallers()->active()
            ->withCount([
                'assignedLeads as converted_count' => fn ($q) => $q->where('status', LeadStatus::Converted->value),
                'callLogs as calls_today' => fn ($q) => $q->whereDate('created_at', today()),
            ]);

        if ($userIds !== null) {
            $query->whereIn('users.id', $userIds);
        }

        return $query->orderByDesc('converted_count')
            ->limit(8)
            ->get(['id', 'name'])
            ->all();
    }

    protected function recentActivity($query): array
    {
        return (clone $query)
            ->with('assignee:id,name')
            ->latest('updated_at')
            ->limit(8)
            ->get(['id', 'name', 'phone', 'status', 'assigned_to', 'updated_at'])
            ->all();
    }
}
