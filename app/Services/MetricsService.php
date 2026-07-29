<?php

namespace App\Services;

use App\Enums\CallOutcome;
use App\Enums\LeadStatus;
use App\Enums\TaskStatus;
use App\Models\CallLog;
use App\Models\DailyStaffMetric;
use App\Models\Lead;
use App\Models\Task;
use App\Models\User;
use Illuminate\Support\Carbon;

class MetricsService
{
    /**
     * Compute and upsert the daily KPI row for a telecaller on a given date.
     */
    public function aggregateForUserDate(User $user, Carbon $date): DailyStaffMetric
    {
        $calls = CallLog::where('user_id', $user->id)->forDate($date)->get();

        $callsMade = $calls->count();
        $callsConnected = $calls->filter(fn (CallLog $c) => $c->outcome->isConnected())->count();
        $talkTime = (int) $calls->sum('duration_seconds');

        $tasks = Task::where('assigned_to', $user->id)
            ->whereDate('updated_at', $date)
            ->get();

        $tasksCompleted = $tasks->where('status', TaskStatus::Completed)->count();
        $followUpsCompleted = $tasks
            ->where('status', TaskStatus::Completed)
            ->whereIn('type', ['follow_up', 'callback'])
            ->count();
        $taskTime = (int) Task::where('assigned_to', $user->id)
            ->whereDate('completed_at', $date)
            ->sum('time_spent_seconds');

        $tasksOverdue = Task::where('assigned_to', $user->id)->overdue()->count();

        $leadsInterested = $calls->where('outcome', CallOutcome::Interested)->count();
        $leadsConverted = Lead::where('assigned_to', $user->id)
            ->where('status', LeadStatus::Converted)
            ->whereDate('converted_at', $date)
            ->count();

        return DailyStaffMetric::updateOrCreate(
            ['user_id' => $user->id, 'metric_date' => $date->toDateString()],
            [
                'calls_made' => $callsMade,
                'calls_connected' => $callsConnected,
                'talk_time_seconds' => $talkTime,
                'follow_ups_completed' => $followUpsCompleted,
                'tasks_completed' => $tasksCompleted,
                'tasks_overdue' => $tasksOverdue,
                'leads_interested' => $leadsInterested,
                'leads_converted' => $leadsConverted,
                'task_time_seconds' => $taskTime,
            ],
        );
    }

    /**
     * Aggregate metrics for all telecallers for a date (used by the nightly job).
     */
    public function aggregateAllForDate(Carbon $date): int
    {
        $count = 0;
        User::telecallers()->active()->chunk(50, function ($users) use ($date, &$count) {
            foreach ($users as $user) {
                $this->aggregateForUserDate($user, $date);
                $count++;
            }
        });

        return $count;
    }
}
