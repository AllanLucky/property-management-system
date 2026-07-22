<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('property_analytics', function (Blueprint $table) {
            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP
            |--------------------------------------------------------------------------
            */
            $table->foreignId('property_id')
                ->constrained('properties')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | ENGAGEMENT METRICS
            |--------------------------------------------------------------------------
            */
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('favorites_count')->default(0);
            $table->unsignedBigInteger('reviews_count')->default(0);
            $table->unsignedBigInteger('visits_count')->default(0);
            $table->unsignedBigInteger('unique_visits_count')->default(0);

            /*
            |--------------------------------------------------------------------------
            | RATINGS
            |--------------------------------------------------------------------------
            */
            $table->decimal('average_rating', 3, 1)->default(0);
            $table->json('rating_breakdown')->nullable();
            $table->decimal('five_star_percentage', 5, 2)->default(0);
            $table->decimal('recommendation_percentage', 5, 2)->default(0);

            /*
            |--------------------------------------------------------------------------
            | UNIT OCCUPANCY
            |--------------------------------------------------------------------------
            */
            $table->unsignedInteger('vacant_units_count')->default(0);
            $table->unsignedInteger('occupied_units_count')->default(0);

            /*
            |--------------------------------------------------------------------------
            | SNAPSHOT DATE
            |--------------------------------------------------------------------------
            */
            $table->date('snapshot_date')->nullable();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index('property_id');
            $table->index('snapshot_date');

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_analytics');
    }
};
