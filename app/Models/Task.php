<?php

namespace App\Models;

use App\Enums\TaskStatus;
use App\Enums\TaskType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Task extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'lead_id', 'assigned_to', 'created_by', 'title', 'description', 'type', 'status',
        'due_at', 'started_at', 'completed_at', 'time_spent_seconds', 'call_log_id',
    ];

    protected function casts(): array
    {
        return [
            'type' => TaskType::class,
            'status' => TaskStatus::class,
            'due_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'time_spent_seconds' => 'integer',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ---- Scopes ----------------------------------------------------------

    public function scopeForUser(Builder $query, User $user): Builder
    {
        if ($user->isAdmin()) {
            return $query;
        }
        if ($user->isManager()) {
            $teamIds = $user->teamMembers()->pluck('id')->push($user->id);

            return $query->whereIn('assigned_to', $teamIds);
        }

        return $query->where('assigned_to', $user->id);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', [TaskStatus::Pending->value, TaskStatus::InProgress->value]);
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->open()->whereNotNull('due_at')->where('due_at', '<', now());
    }

    public function scopeDueToday(Builder $query): Builder
    {
        return $query->open()->whereDate('due_at', today());
    }

    // ---- Helpers ---------------------------------------------------------

    public function isOverdue(): bool
    {
        return $this->status->isOpen() && $this->due_at && $this->due_at->isPast();
    }
}
