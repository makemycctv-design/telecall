<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DailyStaffMetric extends Model
{
    protected $fillable = [
        'user_id', 'metric_date', 'calls_made', 'calls_connected', 'talk_time_seconds',
        'follow_ups_completed', 'tasks_completed', 'tasks_overdue', 'leads_interested',
        'leads_converted', 'task_time_seconds',
    ];

    protected function casts(): array
    {
        return ['metric_date' => 'date'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** Connect rate KPI: connected / made. */
    public function connectRate(): float
    {
        return $this->calls_made > 0
            ? round($this->calls_connected / $this->calls_made * 100, 1)
            : 0.0;
    }
}
