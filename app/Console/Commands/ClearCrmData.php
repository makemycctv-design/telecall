<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ClearCrmData extends Command
{
    protected $signature = 'telecrm:clear-data {--force : Skip the confirmation prompt}';

    protected $description = 'Delete all leads, tasks, projects and their related records (keeps users, roles, sources and tags)';

    /**
     * Tables cleared, in FK-safe order. Users, roles, role_user, lead_sources
     * and lead_tags are intentionally preserved.
     */
    private array $tables = [
        'project_logs',
        'projects',
        'call_logs',
        'tasks',
        'lead_status_histories',
        'lead_assignments',
        'lead_tag_map',
        'daily_staff_metrics',
        'app_notifications',
        'report_snapshots',
        'leads',
    ];

    public function handle(): int
    {
        if (! $this->option('force') && ! $this->confirm('This permanently deletes ALL leads, tasks and projects. Continue?')) {
            $this->info('Aborted.');

            return self::SUCCESS;
        }

        Schema::disableForeignKeyConstraints();
        DB::transaction(function () {
            foreach ($this->tables as $table) {
                if (Schema::hasTable($table)) {
                    $deleted = DB::table($table)->delete();
                    $this->line("  cleared {$table} ({$deleted} rows)");
                }
            }
        });
        Schema::enableForeignKeyConstraints();

        $this->info('CRM data cleared. Users, roles, lead sources and tags were preserved.');

        return self::SUCCESS;
    }
}
