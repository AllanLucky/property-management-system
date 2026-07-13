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
        Schema::create('property_reviews', function (Blueprint $table) {

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
            | REVIEW CONTENT
            |--------------------------------------------------------------------------
            */

            // Rating: 1 - 5 stars
            $table->unsignedTinyInteger('rating');

            $table->string('title', 255)->nullable();

            $table->text('comment')->nullable();

            // Would the reviewer recommend this property?
            $table->boolean('would_recommend')->default(true);

            /*
            |--------------------------------------------------------------------------
            | REVIEW STATUS
            |--------------------------------------------------------------------------
            */

            // Verified purchaser / tenant / owner
            $table->boolean('is_verified')->default(false);

            // Visible to the public
            $table->boolean('is_published')->default(true);

            /*
            |--------------------------------------------------------------------------
            | ENGAGEMENT
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('likes_count')->default(0);

            /*
            |--------------------------------------------------------------------------
            | AUDIT
            |--------------------------------------------------------------------------
            */

            $table->timestamp('published_at')->nullable();

            $table->timestamp('edited_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | CONSTRAINTS
            |--------------------------------------------------------------------------
            */

            // One review per user per property
            $table->unique(['property_id', 'user_id']);

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index('property_id');
            $table->index('user_id');
            $table->index('rating');
            $table->index('is_published');
            $table->index('is_verified');
            $table->index('would_recommend');
            $table->index('created_at');

            $table->index([
                'property_id',
                'is_published'
            ]);

            $table->index([
                'property_id',
                'rating'
            ]);

            $table->index([
                'property_id',
                'created_at'
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_reviews');
    }
};