<?php

namespace App\Jobs;

use App\Models\PushSubscription;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendWebPushJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<string,mixed>  $payload
     */
    public function __construct(public int $subscriptionId, public array $payload) {}

    public function handle(): void
    {
        $subscription = PushSubscription::find($this->subscriptionId);
        if (! $subscription) {
            return;
        }

        $vapid = config('telecrm.vapid');

        // Gracefully degrade when the web-push library or VAPID keys are absent
        // (e.g. local/dev). Install minishlink/web-push to enable delivery.
        if (! class_exists(\Minishlink\WebPush\WebPush::class) || empty($vapid['public_key'])) {
            Log::info('Web push skipped (library/keys unavailable)', [
                'subscription' => $subscription->id,
                'payload' => $this->payload,
            ]);

            return;
        }

        try {
            $webPush = new \Minishlink\WebPush\WebPush([
                'VAPID' => [
                    'subject' => $vapid['subject'],
                    'publicKey' => $vapid['public_key'],
                    'privateKey' => $vapid['private_key'],
                ],
            ]);

            $report = $webPush->sendOneNotification(
                \Minishlink\WebPush\Subscription::create([
                    'endpoint' => $subscription->endpoint,
                    'keys' => [
                        'p256dh' => $subscription->public_key,
                        'auth' => $subscription->auth_token,
                    ],
                ]),
                json_encode($this->payload),
            );

            if ($report->isSubscriptionExpired()) {
                $subscription->delete();
            } else {
                $subscription->forceFill(['last_used_at' => now()])->save();
            }
        } catch (\Throwable $e) {
            Log::warning('Web push failed', ['error' => $e->getMessage()]);
        }
    }
}
