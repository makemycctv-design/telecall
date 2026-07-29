<?php

use App\Jobs\AggregateDailyMetricsJob;
use App\Jobs\ScanFollowUpsJob;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Scheduled tasks
|--------------------------------------------------------------------------
| Run the scheduler in production via a single cron entry:
|   * * * * * cd /path && php artisan schedule:run >> /dev/null 2>&1
*/

// Fire follow-up reminders and overdue alerts every 15 minutes.
Schedule::job(new ScanFollowUpsJob)->everyFifteenMinutes()->withoutOverlapping();

// Roll up per-telecaller KPIs shortly after midnight (previous day) and hourly
// for the current day so dashboards stay fresh.
Schedule::job(new AggregateDailyMetricsJob(now()->subDay()->toDateString()))->dailyAt('00:15');
Schedule::job(new AggregateDailyMetricsJob)->hourly();
