<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Lead;
use App\Notifications\Channels\AppDatabaseChannel;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewLeadAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(public Lead $lead) {}

    public function via(object $notifiable): array
    {
        return [AppDatabaseChannel::class, WebPushChannel::class];
    }

    public function toAppNotification(object $notifiable): array
    {
        return [
            'type' => NotificationType::NewAssignment->value,
            'title' => 'New lead assigned',
            'body' => "{$this->lead->name} ({$this->lead->phone}) has been assigned to you.",
            'action_url' => "/leads/{$this->lead->id}",
            'data' => ['lead_id' => $this->lead->id],
        ];
    }

    public function toWebPush(object $notifiable): array
    {
        return [
            'title' => 'New lead assigned',
            'body' => "{$this->lead->name} — {$this->lead->phone}",
            'url' => "/leads/{$this->lead->id}",
            'tag' => "lead-{$this->lead->id}",
        ];
    }
}
