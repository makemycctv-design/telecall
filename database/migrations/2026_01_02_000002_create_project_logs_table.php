<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Daily work log entries an Executor records against a project:
        // what was done that day, updated progress, and any remarks/issues.
        Schema::create('project_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // executor who logged

            $table->date('log_date')->index();
            $table->text('activities');                       // activities completed that day
            $table->unsignedTinyInteger('progress_percent')->nullable(); // optional overall progress update
            $table->decimal('hours_spent', 5, 2)->nullable();
            $table->text('remarks')->nullable();              // notes / issues encountered

            $table->timestamps();

            $table->index(['project_id', 'log_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_logs');
    }
};
