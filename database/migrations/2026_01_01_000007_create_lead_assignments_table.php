<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Full audit trail of every (re)assignment of a lead to a telecaller.
        Schema::create('lead_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('assigned_to')->constrained('users')->cascadeOnDelete();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('strategy', 30)->default('manual'); // manual|round_robin|least_loaded
            $table->text('reason')->nullable();
            $table->timestamp('assigned_at')->useCurrent();
            $table->timestamp('unassigned_at')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'assigned_at']);
            $table->index(['assigned_to', 'assigned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_assignments');
    }
};
