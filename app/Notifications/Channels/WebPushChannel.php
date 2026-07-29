<?php

namespace App\Notifications\Channels;

use App\Jobs\SendWebPushJob;
use Illuminate\Notifications\Notification;

class WebPushChannel
{
    /**
     * Fan the notification out to every push subscription of the notifiable.
     * The notification must implement toWebPush($notifiable): array.
     */
    public function send(object $notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toWebPush')) {
            return;
        }

        $payload = $notification->toWebPush($notifiable);

        foreach ($notifiable->pushSubscriptions as $subscription) {
            SendWebPushJob::dispatch($subscription->id, $payload);
        }
    }
}
