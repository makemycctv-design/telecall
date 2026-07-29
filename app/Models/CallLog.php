<?php

namespace App\Models;

use App\Enums\CallOutcome;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id', 'user_id', 'task_id', 'outcome', 'started_at', 'ended_at',
        'duration_seconds', 'notes', 'next_follow_up_at', 'client_uuid',
    ];

    protected function casts(): array
    {
        return [
            'outcome' => CallOutcome::class,
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'next_follow_up_at' => 'datetime',
            'duration_seconds' => 'integer',
        ];
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    public function scopeConnected(Builder $query): Builder
    {
        return $query->whereIn('outcome', [
            CallOutcome::Connected->value, CallOutcome::Interested->value,
            CallOutcome::NotInterested->value, CallOutcome::CallbackRequested->value,
            CallOutcome::Converted->value,
        ]);
    }

    public function scopeForDate(Builder $query, $date): Builder
    {
        return $query->whereDate('created_at', $date);
    }
}
