<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cities', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */
            $table->foreignId('country_id')
                ->constrained('countries')
                ->cascadeOnDelete();

            $table->foreignId('region_id')
                ->constrained('regions')
                ->cascadeOnDelete();

            $table->foreignId('county_id')
                ->constrained('counties')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | CORE DATA
            |--------------------------------------------------------------------------
            */
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('code')->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_active')->default(true);

            /*
            |--------------------------------------------------------------------------
            | SOFT DELETES (REQUIRED by your model)
            |--------------------------------------------------------------------------
            */
            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index(['country_id', 'region_id', 'county_id', 'name']);
            $table->index('slug');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cities');
    }
};