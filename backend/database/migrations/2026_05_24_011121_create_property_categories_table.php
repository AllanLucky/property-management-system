<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * RUN MIGRATIONS
     */
    public function up(): void
    {
        Schema::create('property_categories', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | HIERARCHY
            |--------------------------------------------------------------------------
            */
            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('property_categories')
                ->nullOnDelete();

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
            | MEDIA (CLOUDINARY)
            |--------------------------------------------------------------------------
            */
            $table->string('icon')->nullable();

            // MAIN IMAGE
            $table->text('image_url')->nullable();
            $table->string('image_public_id')->nullable();

            // BANNER IMAGE
            $table->text('banner_url')->nullable();
            $table->string('banner_public_id')->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            $table->enum('status', ['active', 'inactive'])
                ->default('active');

            /*
            |--------------------------------------------------------------------------
            | VISIBILITY FLAGS (KEEP ONLY ONE SOURCE OF TRUTH)
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_featured')->default(false);
            $table->boolean('show_in_homepage')->default(false);
            $table->boolean('is_popular')->default(false);

            /*
            |--------------------------------------------------------------------------
            | SEO (KEEP FLAT - REMOVE DUPLICATION WITH JSON)
            |--------------------------------------------------------------------------
            */
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();

            /*
            |--------------------------------------------------------------------------
            | DISPLAY
            |--------------------------------------------------------------------------
            */
            $table->unsignedInteger('sort_order')->default(0);
            $table->string('color')->nullable();

            /*
            |--------------------------------------------------------------------------
            | ANALYTICS
            |--------------------------------------------------------------------------
            */
            $table->unsignedBigInteger('views_count')->default(0);

            /*
            |--------------------------------------------------------------------------
            | SETTINGS (OPTIONAL FLEXIBLE CONFIG)
            |--------------------------------------------------------------------------
            */
            $table->json('settings')->nullable();

            /*
            |--------------------------------------------------------------------------
            | PUBLISHING
            |--------------------------------------------------------------------------
            */
            $table->timestamp('published_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index('name');
            $table->index('slug');
            $table->index('status');
            $table->index('parent_id');
            $table->index('is_featured');
            $table->index('show_in_homepage');
            $table->index('is_popular');
            $table->index('sort_order');

            /*
            |--------------------------------------------------------------------------
            | LARAVEL DEFAULTS
            |--------------------------------------------------------------------------
            */
            $table->softDeletes();
            $table->timestamps();
        });
    }

    /**
     * REVERSE MIGRATIONS
     */
    public function down(): void
    {
        Schema::dropIfExists('property_categories');
    }
};