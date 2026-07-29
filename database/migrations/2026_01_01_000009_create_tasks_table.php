<?php

use App\Enums\TaskStatus;
use App\Enums\TaskType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->cascadeOnDelete();
            $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('type', 20)->default(TaskType::FollowUp->value);   // App\Enums\TaskType
            $table->string('status', 20)->default(TaskStatus::Pending->value)->index(); // App\Enums\TaskStatus

            $table->timestamp('due_at')->nullable()->index();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->unsignedInteger('time_spent_seconds')->default(0); // task timer accumulation

            // Loose link to the call log that spawned this task (e.g. callback).
            // Kept without a DB FK to avoid a circular constraint with call_logs.
            $table->unsignedBigInteger('call_log_id')->nullable()->index();

            $table->timestamps();
            $table->softDeletes();

            $table->index(['assigned_to', 'status', 'due_at']);
            $table->index(['assigned_to', 'due_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
