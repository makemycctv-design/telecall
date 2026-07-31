<?php

namespace App\Support;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class CrmDataCleaner
{
    /**
     * Tables cleared, in FK-safe order. Users, roles, role_user, lead_sources
     * and lead_tags are intentionally preserved.
     *
     * @var array<int,string>
     */
    public const TABLES = [
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

    /**
     * Delete all leads, tasks, projects and related records.
     *
     * @return array<string,int> rows deleted per table
     */
    public static function clear(): array
    {
        $result = [];

        Schema::disableForeignKeyConstraints();
        DB::transaction(function () use (&$result) {
            foreach (self::TABLES as $table) {
                if (Schema::hasTable($table)) {
                    $result[$table] = DB::table($table)->delete();
                }
            }
        });
        Schema::enableForeignKeyConstraints();

        return $result;
    }
}
