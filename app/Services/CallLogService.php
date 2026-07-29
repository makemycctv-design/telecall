<?php

namespace App\Services;

use App\Enums\CallOutcome;
use App\Enums\TaskStatus;
use App\Enums\TaskType;
use App\Models\CallLog;
use App\Models\Lead;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CallLogService
{
    public function __construct(private LeadStatusService $leadStatus) {}

    /**
     * Persist a call log and run its side effects:
     *   - compute duration
     *   - auto-transition the lead status from the outcome (if configured)
     *   - schedule a callback follow-up task when requested
     *   - stamp the lead's last_contacted_at / next_follow_up_at
     *
     * @param  array<string,mixed>  $data
     */
    public function log(Lead $lead, User $user, array $data): CallLog
    {
        return DB::transaction(function () use ($lead, $user, $data) {
            $outcome = $data['outcome'] instanceof CallOutcome
                ? $data['outcome']
                : CallOutcome::from($data['outcome']);

            $startedAt = isset($data['started_at']) ? Carbon::parse($data['started_at']) : null;
            $endedAt = isset($data['ended_at']) ? Carbon::parse($data['ended_at']) : null;

            $duration = $data['duration_seconds']
                ?? (($startedAt && $endedAt) ? max(0, $endedAt->diffInSeconds($startedAt)) : 0);

            $nextFollowUp = isset($data['next_follow_up_at']) ? Carbon::parse($data['next_follow_up_at']) : null;

            // Idempotent create for offline background-sync replays.
            $callLog = CallLog::updateOrCreate(
                ['client_uuid' => $data['client_uuid'] ?? null],
                [
                    'lead_id' => $lead->id,
                    'user_id' => $user->id,
                    'task_id' => $data['task_id'] ?? null,
                    'outcome' => $outcome->value,
                    'started_at' => $startedAt,
                    'ended_at' => $endedAt,
                    'duration_seconds' => (int) $duration,
                    'notes' => $data['notes'] ?? null,
                    'next_follow_up_at' => $nextFollowUp,
                ],
            );

            // Stamp lead contact fields.
            $lead->last_contacted_at = now();
            if ($nextFollowUp) {
                $lead->next_follow_up_at = $nextFollowUp;
            }
            $lead->save();

            // Auto lead-status transition based on outcome.
            if ($newStatus = $outcome->toLeadStatus()) {
                $this->leadStatus->transition($lead, $newStatus, $user, "Auto from call outcome: {$outcome->label()}");
            }

            // Auto-create a callback task when the caller requested one.
            if ($outcome === CallOutcome::CallbackRequested && $nextFollowUp) {
                Task::create([
                    'lead_id' => $lead->id,
                    'assigned_to' => $lead->assigned_to ?? $user->id,
                    'created_by' => $user->id,
                    'title' => "Callback: {$lead->name}",
                    'description' => $data['notes'] ?? null,
                    'type' => TaskType::Callback->value,
                    'status' => TaskStatus::Pending->value,
                    'due_at' => $nextFollowUp,
                    'call_log_id' => $callLog->id,
                ]);
            }

            return $callLog;
        });
    }
}
