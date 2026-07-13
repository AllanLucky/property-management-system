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
        Schema::create('property_visits', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */

            $table->foreignId('property_id')
                ->constrained()
                ->cascadeOnDelete();

            // Nullable for guest visitors
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | VISITOR IDENTIFICATION
            |--------------------------------------------------------------------------
            */

            $table->string('session_id')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();

            /*
            |--------------------------------------------------------------------------
            | DEVICE INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('device')->nullable();     // Mobile, Desktop, Tablet
            $table->string('browser')->nullable();    // Chrome, Firefox, Safari
            $table->string('platform')->nullable();   // Windows, Android, iOS

            /*
            |--------------------------------------------------------------------------
            | REFERRAL INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('referer')->nullable();

            /*
            |--------------------------------------------------------------------------
            | GEO LOCATION (OPTIONAL)
            |--------------------------------------------------------------------------
            */

            $table->string('country')->nullable();
            $table->string('city')->nullable();

            /*
            |--------------------------------------------------------------------------
            | VISIT DETAILS
            |--------------------------------------------------------------------------
            */

            // Indicates whether this is the visitor's first visit
            $table->boolean('is_unique')->default(false);

            // When the visit occurred
            $table->timestamp('visited_at')->useCurrent();

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

            $table->index('property_id');
            $table->index('user_id');
            $table->index('session_id');
            $table->index('ip_address');
            $table->index('visited_at');
            $table->index('is_unique');
            $table->index('country');
            $table->index('city');

            $table->index([
                'property_id',
                'visited_at',
            ]);

            $table->index([
                'property_id',
                'user_id',
            ]);

            $table->index([
                'property_id',
                'session_id',
            ]);

            $table->index([
                'property_id',
                'is_unique',
            ]);

            $table->index([
                'property_id',
                'created_at',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_visits');
    }
};