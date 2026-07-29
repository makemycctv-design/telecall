<?php

namespace App\Http\Controllers;

use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string'],
            'keys.p256dh' => ['nullable', 'string'],
            'keys.auth' => ['nullable', 'string'],
            'contentEncoding' => ['nullable', 'string'],
        ]);

        $subscription = PushSubscription::updateOrCreate(
            ['endpoint_hash' => PushSubscription::hashFor($data['endpoint'])],
            [
                'user_id' => $request->user()->id,
                'endpoint' => $data['endpoint'],
                'public_key' => $data['keys']['p256dh'] ?? null,
                'auth_token' => $data['keys']['auth'] ?? null,
                'content_encoding' => $data['contentEncoding'] ?? null,
                'user_agent' => $request->userAgent(),
                'last_used_at' => now(),
            ],
        );

        return response()->json(['id' => $subscription->id], 201);
    }

    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['endpoint' => ['required', 'string']]);

        $request->user()->pushSubscriptions()
            ->where('endpoint_hash', PushSubscription::hashFor($request->string('endpoint')))
            ->delete();

        return response()->json(['deleted' => true]);
    }
}
