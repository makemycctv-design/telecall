<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lead_tags', function (Blueprint $table) {
            $table->id();
            $table->string('name', 60);
            $table->string('slug', 60)->unique();
            $table->string('color', 20)->default('slate'); // Tailwind colour token
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_tags');
    }
};
