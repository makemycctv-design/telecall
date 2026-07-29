<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('call_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete(); // telecaller
            $table->foreignId('task_id')->nullable()->constrained('tasks')->nullOnDelete();

            $table->string('outcome', 30)->index(); // App\Enums\CallOutcome
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->unsignedInteger('duration_seconds')->default(0); // denormalised for reporting
            $table->text('notes')->nullable();
            $table->timestamp('next_follow_up_at')->nullable();

            // Supports offline background-sync de-duplication (client generated uuid).
            $table->uuid('client_uuid')->nullable()->unique();

            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['lead_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_logs');
    }
};
