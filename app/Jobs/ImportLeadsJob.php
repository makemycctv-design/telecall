<?php

namespace App\Jobs;

use App\Models\User;
use App\Services\LeadImportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class ImportLeadsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 600;

    public function __construct(
        public string $storedPath,
        public int $importedById,
        public bool $autoAssign = true,
    ) {}

    public function handle(LeadImportService $service): void
    {
        $user = User::findOrFail($this->importedById);
        $absolute = Storage::path($this->storedPath);

        $rows = $service->parseCsv($absolute);
        $service->importRows($rows, $user, $this->autoAssign);

        Storage::delete($this->storedPath);
    }
}
