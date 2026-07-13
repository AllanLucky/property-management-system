<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_amenities', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */
            $table->foreignId('property_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('amenity_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | PIVOT STATUS
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_included')->default(true);
            $table->boolean('is_available')->default(true);

            /*
            |--------------------------------------------------------------------------
            | EXTRA DETAILS
            |--------------------------------------------------------------------------
            */
            $table->decimal('distance', 8, 2)->nullable();
            $table->unsignedInteger('walking_minutes')->nullable();
            $table->text('note')->nullable();

            /*
            |--------------------------------------------------------------------------
            | PERFORMANCE INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index('property_id');
            $table->index('amenity_id');
            $table->index(['property_id', 'amenity_id']);

            /*
            |--------------------------------------------------------------------------
            | IMPORTANT FIX
            |--------------------------------------------------------------------------
            */
            $table->softDeletes(); // 👈 THIS FIXES YOUR ERROR

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | UNIQUE CONSTRAINT
            |--------------------------------------------------------------------------
            */
            $table->unique(['property_id', 'amenity_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_amenities');
    }
};