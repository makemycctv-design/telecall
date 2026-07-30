<?php

namespace App\Policies;

use App\Models\CallLog;
use App\Models\User;

class CallLogPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function view(User $user, CallLog $callLog): bool
    {
        if ($user->isManager()) {
            $teamIds = $user->teamMembers()->pluck('id')->push($user->id);

            return $teamIds->contains($callLog->user_id);
        }

        return $callLog->user_id === $user->id;
    }

    /** Only telecallers log calls (admins via before()); managers review only. */
    public function create(User $user): bool
    {
        return $user->isTelecaller();
    }
}
