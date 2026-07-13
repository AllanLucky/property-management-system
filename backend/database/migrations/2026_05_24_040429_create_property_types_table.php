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
        Schema::create('property_types', function (Blueprint $table) {

            $table->id();

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
            | DISPLAY & MEDIA
            |--------------------------------------------------------------------------
            */
            $table->string('icon')->nullable()
                ->comment('Frontend icon name e.g. building, home, crown');

            $table->string('color', 20)->nullable()
                ->comment('UI badge or card color e.g. #3B82F6');

            $table->string('image')->nullable()
                ->comment('Property type banner or thumbnail');


            /*
            |--------------------------------------------------------------------------
            | STATUS & VISIBILITY
            |--------------------------------------------------------------------------
            */
            $table->enum('status', [
                'active',
                'inactive',
            ])->default('active');

            // Simple boolean status for quick filtering
            $table->boolean('is_active')
                ->default(true);

            // Highlight important property types
            $table->boolean('is_featured')
                ->default(false);


            /*
            |--------------------------------------------------------------------------
            | SORTING
            |--------------------------------------------------------------------------
            */
            $table->unsignedInteger('sort_order')
                ->default(0);


            /*
            |--------------------------------------------------------------------------
            | SEO (Optional but useful)
            |--------------------------------------------------------------------------
            */
            $table->string('meta_title')
                ->nullable();

            $table->text('meta_description')
                ->nullable();

            $table->text('meta_keywords')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | SOFT DELETES & TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            $table->softDeletes();

            $table->timestamps();


            /*
            |--------------------------------------------------------------------------
            | INDEXES FOR PERFORMANCE
            |--------------------------------------------------------------------------
            */
            $table->index('name');
            $table->index('slug');
            $table->index('status');
            $table->index('is_active');
            $table->index('is_featured');
            $table->index('sort_order');
            $table->index('deleted_at');
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_types');
    }
};