<?php

namespace App\Jobs;

use App\Models\ReportSnapshot;
use App\Models\User;
use App\Services\ReportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class GenerateReportSnapshotJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<string,mixed>  $filters
     */
    public function __construct(
        public string $category,
        public int $generatedById,
        public array $filters = [],
    ) {}

    public function handle(ReportService $reports): void
    {
        $user = User::findOrFail($this->generatedById);
        $data = $reports->build($this->category, $user, $this->filters);

        // Strip paginator from the persisted payload; keep cards + series.
        unset($data['rows']);

        ReportSnapshot::create([
            'type' => $this->category,
            'period' => $this->filters['period'] ?? 'custom',
            'period_start' => $this->filters['from'] ?? null,
            'period_end' => $this->filters['to'] ?? null,
            'generated_by' => $user->id,
            'filters' => $this->filters,
            'payload' => $data,
            'generated_at' => now(),
        ]);
    }
}
