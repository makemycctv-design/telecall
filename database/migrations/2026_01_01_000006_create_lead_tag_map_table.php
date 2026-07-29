<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_tag_map', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->cascadeOnDelete();
            $table->foreignId('lead_tag_id')->constrained('lead_tags')->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['lead_id', 'lead_tag_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_tag_map');
    }
};
