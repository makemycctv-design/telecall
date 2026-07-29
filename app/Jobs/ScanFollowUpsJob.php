<?php

namespace App\Jobs;

use App\Models\Task;
use App\Notifications\FollowUpReminderNotification;
use App\Notifications\OverdueTaskNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ScanFollowUpsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Fires reminders for tasks due within the next hour and overdue alerts for
     * tasks past due. Intended to run every 15 minutes via the scheduler.
     */
    public function handle(): void
    {
        // Upcoming reminders (due in the next 60 minutes).
        Task::query()->open()
            ->whereBetween('due_at', [now(), now()->addHour()])
            ->with('assignee')
            ->chunk(100, function ($tasks) {
                foreach ($tasks as $task) {
                    $task->assignee?->notify(new FollowUpReminderNotification($task));
                }
            });

        // Overdue alerts.
        Task::query()->overdue()
            ->with('assignee')
            ->chunk(100, function ($tasks) {
                foreach ($tasks as $task) {
                    $task->assignee?->notify(new OverdueTaskNotification($task));
                }
            });
    }
}
