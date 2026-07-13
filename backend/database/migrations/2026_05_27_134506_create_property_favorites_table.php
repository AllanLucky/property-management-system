<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_favorites', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */
            $table->foreignId('property_id')
                ->constrained('properties')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | OPTIONAL CONTEXT (KEEP BUT NOT USED IN MODEL YET)
            |--------------------------------------------------------------------------
            | Safe to keep for future expansion
            |--------------------------------------------------------------------------
            */
            $table->foreignId('apartment_id')
                ->nullable()
                ->constrained('apartments')
                ->nullOnDelete();

            $table->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_active')->default(true);

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
            $table->unique(['user_id', 'property_id']); // prevents duplicate favorites
            $table->index(['user_id']);
            $table->index(['property_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_favorites');
    }
};