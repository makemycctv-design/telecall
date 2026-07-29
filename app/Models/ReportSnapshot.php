<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReportSnapshot extends Model
{
    protected $fillable = [
        'type', 'period', 'period_start', 'period_end', 'generated_by',
        'filters', 'payload', 'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'filters' => 'array',
            'payload' => 'array',
            'period_start' => 'date',
            'period_end' => 'date',
            'generated_at' => 'datetime',
        ];
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
