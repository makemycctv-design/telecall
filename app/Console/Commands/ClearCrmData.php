<?php

namespace App\Console\Commands;

use App\Support\CrmDataCleaner;
use Illuminate\Console\Command;

class ClearCrmData extends Command
{
    protected $signature = 'telecrm:clear-data {--force : Skip the confirmation prompt}';

    protected $description = 'Delete all leads, tasks, projects and their related records (keeps users, roles, sources and tags)';

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('This permanently deletes ALL leads, tasks and projects. Continue?')) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        foreach (CrmDataCleaner::clear() as $table => $deleted) {
            $this->line("  cleared {$table} ({$deleted} rows)");
        }

        $this->info('CRM data cleared. Users, roles, lead sources and tags were preserved.');

        return self::SUCCESS;
    }
}
