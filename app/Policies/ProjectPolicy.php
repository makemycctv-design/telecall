<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->isManager() || $user->isExecutor();
    }

    public function view(User $user, Project $project): bool
    {
        return $user->isManager() || $project->assigned_to === $user->id;
    }

    /** Only managers assign converted leads to executors. */
    public function create(User $user): bool
    {
        return $user->isManager();
    }

    public function assign(User $user): bool
    {
        return $user->isManager();
    }

    /** Managers may edit any project; the assigned executor may update status/progress. */
    public function update(User $user, Project $project): bool
    {
        return $user->isManager() || $project->assigned_to === $user->id;
    }

    /** Only the assigned executor records daily work logs (admins via before()). */
    public function addLog(User $user, Project $project): bool
    {
        return $project->assigned_to === $user->id;
    }

    public function delete(User $user, Project $project): bool
    {
        return $user->isManager();
    }
}
