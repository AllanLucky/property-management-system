<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
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
                ->constrained('properties')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | STRUCTURE
            |--------------------------------------------------------------------------
            */
            $table->string('block')->nullable();
            $table->integer('floor')->nullable();

            $table->integer('total_floors')->default(1);
            $table->integer('total_units')->default(0);

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            $table->enum('status', ['active', 'inactive', 'maintenance'])
                ->default('active');

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
            | TIMESTAMPS + SOFT DELETES
            |--------------------------------------------------------------------------
            */
            $table->timestamps();
            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index(['property_id', 'status']);
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('apartments');
    }
};