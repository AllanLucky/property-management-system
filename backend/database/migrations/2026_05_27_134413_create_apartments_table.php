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
        Schema::create('apartments', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP
            |--------------------------------------------------------------------------
            */
            $table->foreignId('property_id')
                ->constrained()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | BUILDING INFORMATION
            |--------------------------------------------------------------------------
            */
            $table->string('block')->nullable();

            // Building statistics
            $table->unsignedInteger('total_floors')->default(1);
            $table->unsignedInteger('total_units')->default(0);

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            $table->enum('status', [
                'active',
                'inactive',
                'maintenance',
                'archived',
            ])->default('active');

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */
            $table->boolean('has_elevator')->default(false);
            $table->boolean('has_backup_generator')->default(false);
            $table->boolean('has_security')->default(false);
            $table->boolean('has_parking')->default(false);

            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */
            $table->string('thumbnail')->nullable();
            $table->string('thumbnail_public_id')->nullable();

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            $table->timestamps();
            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index('property_id');
            $table->index('status');
            $table->index('block');
            $table->index('total_floors');
            $table->index(['property_id', 'status']);
            $table->index(['property_id', 'block']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('apartments');
    }
};