<?php

use App\Enums\LeadPriority;
use App\Enums\LeadStatus;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone', 32)->index();
            $table->string('alt_phone', 32)->nullable();
            $table->string('city', 120)->nullable();

            // Status / priority stored as strings, cast to PHP enums on the model.
            // On MySQL these can be promoted to ENUM columns for storage savings.
            $table->string('status', 30)->default(LeadStatus::New->value)->index();
            $table->string('priority', 10)->default(LeadPriority::Medium->value)->index();

            $table->foreignId('lead_source_id')->nullable()->constrained('lead_sources')->nullOnDelete();
            $table->foreignId('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->decimal('deal_value', 12, 2)->nullable();
            $table->text('notes')->nullable();

            $table->timestamp('last_contacted_at')->nullable()->index();
            $table->timestamp('next_follow_up_at')->nullable()->index();
            $table->timestamp('converted_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            // Composite indexes tuned for the most common list filters.
            $table->index(['assigned_to', 'status']);
            $table->index(['status', 'next_follow_up_at']);
            $table->index(['assigned_to', 'next_follow_up_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
