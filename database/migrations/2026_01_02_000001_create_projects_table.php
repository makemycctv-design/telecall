<?php

use App\Enums\ProjectStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // A "project" is the execution work handed off to an Executor after a
        // telecaller converts a lead. The Manager reviews conversions and
        // assigns them here.
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();      // executor
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete(); // manager

            $table->string('title');
            $table->text('description')->nullable();          // details of the work to be completed
            $table->string('status', 20)->default(ProjectStatus::Pending->value)->index();
            $table->unsignedTinyInteger('progress_percent')->default(0);

            $table->date('start_date')->nullable();
            $table->unsignedSmallInteger('duration_days')->nullable(); // days to complete
            $table->date('deadline')->nullable()->index();            // computed or explicit
            $table->timestamp('completed_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['assigned_to', 'status']);
            $table->index(['status', 'deadline']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
