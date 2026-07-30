<?php

namespace App\Notifications;

use App\Enums\NotificationType;
use App\Models\Project;
use App\Notifications\Channels\AppDatabaseChannel;
use App\Notifications\Channels\WebPushChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class NewProjectAssignedNotification extends Notification
{
    use Queueable;

    public function __construct(public Project $project) {}

    public function via(object $notifiable): array
    {
        return [AppDatabaseChannel::class, WebPushChannel::class];
    }

    public function toAppNotification(object $notifiable): array
    {
        $deadline = $this->project->deadline ? ' · due '.$this->project->deadline->format('M j, Y') : '';

        return [
            'type' => NotificationType::ProjectAssigned->value,
            'title' => 'New project assigned',
            'body' => $this->project->title.$deadline,
            'action_url' => "/projects/{$this->project->id}",
            'data' => ['project_id' => $this->project->id],
        ];
    }

    public function toWebPush(object $notifiable): array
    {
        return [
            'title' => 'New project assigned',
            'body' => $this->project->title,
            'url' => "/projects/{$this->project->id}",
            'tag' => "project-{$this->project->id}",
        ];
    }
}
