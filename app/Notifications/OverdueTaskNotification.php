<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Task;
use App\Notifications\Channels\AppDatabaseChannel;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class OverdueTaskNotification extends Notification
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
            'type' => NotificationType::OverdueAlert->value,
            'title' => 'Task overdue',
            'body' => "{$this->task->title} was due ".($this->task->due_at?->diffForHumans() ?? ''),
            'action_url' => $this->task->lead_id ? "/leads/{$this->task->lead_id}" : '/tasks',
            'data' => ['task_id' => $this->task->id],
        ];
    }

    public function toWebPush(object $notifiable): array
    {
        return [
            'title' => 'Task overdue',
            'body' => $this->task->title,
            'url' => '/tasks',
            'tag' => "overdue-{$this->task->id}",
        ];
    }
}
