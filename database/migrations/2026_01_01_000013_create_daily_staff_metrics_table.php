<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Pre-aggregated per-telecaller, per-day KPIs. Rebuilt nightly (or on
        // demand) by AggregateDailyMetrics job for fast dashboard reads.
        Schema::create('daily_staff_metrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->date('metric_date')->index();

            $table->unsignedInteger('calls_made')->default(0);
            $table->unsignedInteger('calls_connected')->default(0);
            $table->unsignedInteger('talk_time_seconds')->default(0);
            $table->unsignedInteger('follow_ups_completed')->default(0);
            $table->unsignedInteger('tasks_completed')->default(0);
            $table->unsignedInteger('tasks_overdue')->default(0);
            $table->unsignedInteger('leads_interested')->default(0);
            $table->unsignedInteger('leads_converted')->default(0);
            $table->unsignedInteger('task_time_seconds')->default(0);

            $table->timestamps();

            $table->unique(['user_id', 'metric_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('daily_staff_metrics');
    }
};
