<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Materialised report payloads (JSON) produced by queued aggregation
        // jobs, so heavy reports can be generated async and exported later.
        Schema::create('report_snapshots', function (Blueprint $table) {
            $table->id();
            $table->string('type', 40)->index();      // ongoing | completed | pending | performance
            $table->string('period', 20)->nullable(); // daily | monthly | custom
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('filters')->nullable();
            $table->json('payload');                   // summary cards + series + rows
            $table->timestamp('generated_at')->useCurrent();
            $table->timestamps();

            $table->index(['type', 'period_start', 'period_end']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_snapshots');
    }
};
