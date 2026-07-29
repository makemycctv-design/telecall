<?php

namespace App\Services;

use App\Enums\RoleType;
use App\Models\Lead;
use App\Models\LeadAssignment;
use App\Models\User;
use App\Notifications\NewLeadAssignedNotification;
use Illuminate\Support\Facades\DB;

class LeadAssignmentService
{
    /**
     * Assign (or re-assign) a lead to a telecaller and record the audit trail.
     */
    public function assign(Lead $lead, User $assignee, ?User $assignedBy = null, string $strategy = 'manual', ?string $reason = null): Lead
    {
        return DB::transaction(function () use ($lead, $assignee, $assignedBy, $strategy, $reason) {
            // Close the currently open assignment, if any.
            LeadAssignment::where('lead_id', $lead->id)
                ->whereNull('unassigned_at')
                ->update(['unassigned_at' => now()]);

            LeadAssignment::create([
                'lead_id' => $lead->id,
                'assigned_to' => $assignee->id,
                'assigned_by' => $assignedBy?->id,
                'strategy' => $strategy,
                'reason' => $reason,
                'assigned_at' => now(),
            ]);

            $lead->forceFill(['assigned_to' => $assignee->id])->save();

            $assignee->notify(new NewLeadAssignedNotification($lead));

            return $lead->fresh(['assignee']);
        });
    }

    /**
     * Auto-assign a lead based on the configured strategy. No-op if a telecaller
     * cannot be resolved (lead stays unassigned for manual pickup).
     */
    public function autoAssign(Lead $lead, ?User $assignedBy = null): ?Lead
    {
        $strategy = config('telecrm.assignment_strategy', 'round_robin');

        if ($strategy === 'manual') {
            return null;
        }

        $telecaller = $this->pickTelecaller($strategy);

        return $telecaller ? $this->assign($lead, $telecaller, $assignedBy, $strategy) : null;
    }

    /**
     * Resolve the next telecaller for the given strategy.
     */
    public function pickTelecaller(string $strategy): ?User
    {
        $telecallers = User::query()
            ->active()
            ->whereHas('roles', fn ($q) => $q->where('slug', RoleType::Telecaller->value))
            ->withCount(['assignedLeads as open_leads_count' => fn ($q) => $q->open()])
            ->get();

        if ($telecallers->isEmpty()) {
            return null;
        }

        return match ($strategy) {
            // Fewest currently-open leads first.
            'least_loaded' => $telecallers->sortBy('open_leads_count')->first(),
            // Round-robin: the telecaller who was assigned longest ago (or never).
            default => $this->roundRobinPick($telecallers),
        };
    }

    protected function roundRobinPick($telecallers): User
    {
        $lastAssignedAt = LeadAssignment::select('assigned_to', DB::raw('MAX(assigned_at) as last_at'))
            ->groupBy('assigned_to')
            ->pluck('last_at', 'assigned_to');

        return $telecallers
            ->sortBy(fn (User $u) => $lastAssignedAt[$u->id] ?? '1970-01-01 00:00:00')
            ->first();
    }
}
