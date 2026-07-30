<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectLog extends Model
{
    protected $fillable = [
        'project_id', 'user_id', 'log_date', 'activities', 'progress_percent', 'hours_spent', 'remarks',
    ];

    protected function casts(): array
    {
        return [
            'log_date' => 'date',
            'progress_percent' => 'integer',
            'hours_spent' => 'decimal:2',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
