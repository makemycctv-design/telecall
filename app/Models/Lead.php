<?php

namespace App\Models;

use App\Enums\LeadPriority;
use App\Enums\LeadStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name', 'company', 'email', 'phone', 'alt_phone', 'city',
        'status', 'priority', 'lead_source_id', 'assigned_to', 'created_by',
        'deal_value', 'notes', 'last_contacted_at', 'next_follow_up_at', 'converted_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => LeadStatus::class,
            'priority' => LeadPriority::class,
            'deal_value' => 'decimal:2',
            'last_contacted_at' => 'datetime',
            'next_follow_up_at' => 'datetime',
            'converted_at' => 'datetime',
        ];
    }

    // ---- Relationships ---------------------------------------------------

    public function source(): BelongsTo
    {
        return $this->belongsTo(LeadSource::class, 'lead_source_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(LeadTag::class, 'lead_tag_map');
    }

    public function callLogs(): HasMany
    {
        return $this->hasMany(CallLog::class)->latest();
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class)->latest();
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(LeadAssignment::class)->latest('assigned_at');
    }

    public function statusHistories(): HasMany
    {
        return $this->hasMany(LeadStatusHistory::class)->latest();
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class)->latest();
    }

    // ---- Scopes ----------------------------------------------------------

    /** Converted leads that have not yet been handed off to an executor. */
    public function scopeConvertedAwaitingHandoff(Builder $query): Builder
    {
        return $query->where('status', LeadStatus::Converted->value)
            ->whereDoesntHave('projects');
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
        return $query->whereIn('status', LeadStatus::openStatuses());
    }

    public function scopeOverdueFollowUp(Builder $query): Builder
    {
        return $query->whereNotNull('next_follow_up_at')
            ->where('next_follow_up_at', '<', now())
            ->whereNotIn('status', [LeadStatus::Converted->value, LeadStatus::NotInterested->value]);
    }

    public function scopeStatus(Builder $query, ?string $status): Builder
    {
        return $status ? $query->where('status', $status) : $query;
    }

    // ---- Helpers ---------------------------------------------------------

    public function isOverdue(): bool
    {
        return $this->next_follow_up_at
            && $this->next_follow_up_at->isPast()
            && ! in_array($this->status, [LeadStatus::Converted, LeadStatus::NotInterested], true);
    }

    public function ageInHours(): int
    {
        return (int) $this->created_at->diffInHours(now());
    }
}
