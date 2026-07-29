<?php

namespace App\Notifications\Channels;

use App\Models\AppNotification;
use Illuminate\Notifications\Notification;

class AppDatabaseChannel
{
    /**
     * Persist the notification into the app_notifications feed.
     * The notification must implement toAppNotification($notifiable): array.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toAppNotification')) {
            return;
        }

        $payload = $notification->toAppNotification($notifiable);

        AppNotification::create(array_merge([
            'user_id' => $notifiable->id,
        ], $payload));
    }
}
