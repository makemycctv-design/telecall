<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Project extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'lead_id', 'assigned_to', 'assigned_by', 'title', 'description', 'status',
        'progress_percent', 'start_date', 'duration_days', 'deadline', 'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ProjectStatus::class,
            'progress_percent' => 'integer',
            'duration_days' => 'integer',
            'start_date' => 'date',
            'deadline' => 'date',
            'completed_at' => 'datetime',
        ];
    }

    // ---- Relationships ---------------------------------------------------

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function executor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function assignedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(ProjectLog::class)->latest('log_date');
    }

    // ---- Scopes ----------------------------------------------------------

    public function scopeForUser(Builder $query, User $user): Builder
    {
        if ($user->isAdmin() || $user->isManager()) {
            return $query; // managers coordinate all handoffs
        }

        // Executors only see their own projects.
        return $query->where('assigned_to', $user->id);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', [
            ProjectStatus::Pending->value, ProjectStatus::InProgress->value, ProjectStatus::OnHold->value,
        ]);
    }

    public function scopeOverdue(Builder $query): Builder
    {
        return $query->open()->whereNotNull('deadline')->whereDate('deadline', '<', now());
    }

    // ---- Helpers ---------------------------------------------------------

    public function isOverdue(): bool
    {
        return $this->status->isOpen() && $this->deadline && $this->deadline->isPast();
    }

    public function daysRemaining(): ?int
    {
        return $this->deadline ? (int) now()->startOfDay()->diffInDays($this->deadline, false) : null;
    }
}
