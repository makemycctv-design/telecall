<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    /** Admins bypass all checks. */
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return true; // scoped by Lead::forUser() in the query layer
    }

    public function view(User $user, Lead $lead): bool
    {
        return $this->owns($user, $lead);
    }

    public function create(User $user): bool
    {
        return $user->isManager() || $user->isTelecaller();
    }

    public function update(User $user, Lead $lead): bool
    {
        return $this->owns($user, $lead);
    }

    public function delete(User $user, Lead $lead): bool
    {
        // Managers/admins can delete team leads; telecallers their own.
        return $user->isManager() || $lead->assigned_to === $user->id;
    }

    public function assign(User $user, Lead $lead): bool
    {
        return $user->isManager();
    }

    /** Managers own their team's leads; telecallers only their own. */
    protected function owns(User $user, Lead $lead): bool
    {
        if ($user->isManager()) {
            $teamIds = $user->teamMembers()->pluck('id')->push($user->id);

            return $lead->assigned_to === null || $teamIds->contains($lead->assigned_to);
        }

        return $lead->assigned_to === $user->id;
    }
}
