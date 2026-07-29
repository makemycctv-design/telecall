<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Task;
use App\Notifications\Channels\AppDatabaseChannel;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class FollowUpReminderNotification extends Notification
{
    use Queueable;

    public function __construct(public Task $task) {}

    public function via(object $notifiable): array
    {
        return [AppDatabaseChannel::class, WebPushChannel::class];
    }

    public function toAppNotification(object $notifiable): array
    {
        return [
            'type' => NotificationType::FollowUpReminder->value,
            'title' => 'Follow-up reminder',
            'body' => $this->task->title.($this->task->due_at ? ' · due '.$this->task->due_at->format('M j, g:i A') : ''),
            'action_url' => $this->task->lead_id ? "/leads/{$this->task->lead_id}" : '/tasks',
            'data' => ['task_id' => $this->task->id],
        ];
    }

    public function toWebPush(object $notifiable): array
    {
        return [
            'title' => 'Follow-up reminder',
            'body' => $this->task->title,
            'url' => $this->task->lead_id ? "/leads/{$this->task->lead_id}" : '/tasks',
            'tag' => "task-{$this->task->id}",
        ];
    }
}
