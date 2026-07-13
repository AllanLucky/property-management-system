<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('areas', function (Blueprint $table) {
            $table->id();

            // RELATIONSHIPS
            $table->foreignId('country_id')
                ->constrained('countries')
                ->cascadeOnDelete();

            $table->foreignId('region_id')
                ->constrained('regions')
                ->cascadeOnDelete();

            $table->foreignId('county_id')
                ->constrained('counties')
                ->cascadeOnDelete();

            $table->foreignId('city_id')
                ->constrained('cities')
                ->cascadeOnDelete();

            // CORE DATA
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('code')->nullable();

            // GEO DATA
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            // STATUS
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // INDEXES
            $table->index(['country_id', 'region_id', 'county_id', 'city_id']);
            $table->index(['city_id', 'name']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('areas');
    }
};