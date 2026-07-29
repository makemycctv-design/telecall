<?php

namespace App\Jobs;

use App\Services\MetricsService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class AggregateDailyMetricsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(public ?string $date = null) {}

    public function handle(MetricsService $metrics): void
    {
        $date = $this->date ? Carbon::parse($this->date) : Carbon::today();
        $metrics->aggregateAllForDate($date);
    }
}
