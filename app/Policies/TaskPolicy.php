<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function before(User $user, string $ability): ?bool
    {
        return $user->isAdmin() ? true : null;
    }

    public function view(User $user, Task $task): bool
    {
        return $this->owns($user, $task);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Task $task): bool
    {
        return $this->owns($user, $task);
    }

    public function delete(User $user, Task $task): bool
    {
        return $user->isManager() || $task->created_by === $user->id;
    }

    protected function owns(User $user, Task $task): bool
    {
        if ($user->isManager()) {
            $teamIds = $user->teamMembers()->pluck('id')->push($user->id);

            return $teamIds->contains($task->assigned_to);
        }

        return $task->assigned_to === $user->id;
    }
}
