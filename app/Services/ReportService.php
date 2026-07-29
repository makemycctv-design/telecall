<?php

namespace App\Services;

use App\Enums\LeadStatus;
use App\Enums\TaskStatus;
use App\Models\Lead;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;

class ReportService
{
    /**
     * Build one of the three categorised report payloads.
     *
     * Categories:
     *   - ongoing:   active leads currently in process (open pipeline)
     *   - completed: converted leads / closed-won tasks
     *   - pending:   overdue follow-ups, missed callbacks, unassigned leads
     *
     * @param  array<string,mixed>  $filters
     * @return array<string,mixed>
     */
    public function build(string $category, User $viewer, array $filters = []): array
    {
        return match ($category) {
            'completed' => $this->completed($viewer, $filters),
            'pending' => $this->pending($viewer, $filters),
            default => $this->ongoing($viewer, $filters),
        };
    }

    protected function ongoing(User $viewer, array $filters): array
    {
        $query = $this->baseLeadQuery($viewer, $filters)->open();

        $rows = (clone $query)
            ->with(['assignee:id,name', 'source:id,name'])
            ->latest('updated_at')
            ->paginate(20)
            ->withQueryString();

        return [
            'category' => 'ongoing',
            'cards' => [
                ['label' => 'Active Leads', 'value' => (clone $query)->count()],
                ['label' => 'Interested', 'value' => (clone $query)->where('status', LeadStatus::Interested->value)->count()],
                ['label' => 'Callbacks Due', 'value' => (clone $query)->where('status', LeadStatus::Callback->value)->count()],
                ['label' => 'In Progress', 'value' => (clone $query)->where('status', LeadStatus::InProgress->value)->count()],
            ],
            'series' => $this->statusBreakdown(clone $query),
            'rows' => $rows,
        ];
    }

    protected function completed(User $viewer, array $filters): array
    {
        $leadQuery = $this->baseLeadQuery($viewer, $filters)->where('status', LeadStatus::Converted->value);
        $taskQuery = $this->baseTaskQuery($viewer, $filters)->where('status', TaskStatus::Completed->value);

        $rows = (clone $leadQuery)
            ->with(['assignee:id,name', 'source:id,name'])
            ->latest('converted_at')
            ->paginate(20)
            ->withQueryString();

        $totalValue = (clone $leadQuery)->sum('deal_value');

        return [
            'category' => 'completed',
            'cards' => [
                ['label' => 'Converted Leads', 'value' => (clone $leadQuery)->count()],
                ['label' => 'Deal Value', 'value' => round((float) $totalValue, 2), 'format' => 'currency'],
                ['label' => 'Tasks Completed', 'value' => (clone $taskQuery)->count()],
            ],
            'series' => $this->conversionTrend(clone $leadQuery),
            'rows' => $rows,
        ];
    }

    protected function pending(User $viewer, array $filters): array
    {
        $overdueLeads = $this->baseLeadQuery($viewer, $filters)->overdueFollowUp();
        $overdueTasks = $this->baseTaskQuery($viewer, $filters)->overdue();
        $unassigned = Lead::query()->whereNull('assigned_to');

        $rows = (clone $overdueTasks)
            ->with(['assignee:id,name', 'lead:id,name,phone'])
            ->orderBy('due_at')
            ->paginate(20)
            ->withQueryString();

        return [
            'category' => 'pending',
            'cards' => [
                ['label' => 'Overdue Follow-ups', 'value' => (clone $overdueLeads)->count()],
                ['label' => 'Overdue Tasks', 'value' => (clone $overdueTasks)->count()],
                ['label' => 'Unassigned Leads', 'value' => $unassigned->count()],
            ],
            'series' => [],
            'rows' => $rows,
        ];
    }

    // ---- Query helpers ---------------------------------------------------

    protected function baseLeadQuery(User $viewer, array $filters)
    {
        $q = Lead::query()->forUser($viewer);

        if (! empty($filters['staff_id'])) {
            $q->where('assigned_to', $filters['staff_id']);
        }
        if (! empty($filters['source_id'])) {
            $q->where('lead_source_id', $filters['source_id']);
        }
        if (! empty($filters['status'])) {
            $q->where('status', $filters['status']);
        }
        if (! empty($filters['from'])) {
            $q->whereDate('created_at', '>=', Carbon::parse($filters['from']));
        }
        if (! empty($filters['to'])) {
            $q->whereDate('created_at', '<=', Carbon::parse($filters['to']));
        }

        return $q;
    }

    protected function baseTaskQuery(User $viewer, array $filters)
    {
        $q = Task::query()->forUser($viewer);

        if (! empty($filters['staff_id'])) {
            $q->where('assigned_to', $filters['staff_id']);
        }
        if (! empty($filters['from'])) {
            $q->whereDate('created_at', '>=', Carbon::parse($filters['from']));
        }
        if (! empty($filters['to'])) {
            $q->whereDate('created_at', '<=', Carbon::parse($filters['to']));
        }

        return $q;
    }

    protected function statusBreakdown($query): array
    {
        return $query->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->map(fn ($total, $status) => ['label' => LeadStatus::from($status)->label(), 'value' => $total])
            ->values()
            ->all();
    }

    protected function conversionTrend($query): array
    {
        return $query->selectRaw("DATE(converted_at) as day, COUNT(*) as total")
            ->whereNotNull('converted_at')
            ->groupBy('day')
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => ['label' => $row->day, 'value' => (int) $row->total])
            ->all();
    }
}
