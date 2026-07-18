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

            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | VISITOR IDENTIFICATION
            |--------------------------------------------------------------------------
            */

            $table->uuid('visit_uuid')->unique();

            $table->string('session_id')->nullable()->index();

            $table->ipAddress('ip_address')->nullable()->index();

            $table->text('user_agent')->nullable();

            /*
            |--------------------------------------------------------------------------
            | DEVICE INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('device')->nullable();          // Desktop, Mobile, Tablet

            $table->string('device_type')->nullable();     // Desktop, Phone, Tablet

            $table->string('browser')->nullable();         // Chrome

            $table->string('browser_version')->nullable();

            $table->string('platform')->nullable();        // Windows

            $table->string('platform_version')->nullable();

            $table->string('operating_system')->nullable();

            $table->boolean('is_mobile')->default(false);

            $table->boolean('is_tablet')->default(false);

            $table->boolean('is_desktop')->default(false);

            $table->boolean('is_robot')->default(false);

            /*
            |--------------------------------------------------------------------------
            | LOCATION
            |--------------------------------------------------------------------------
            */

            $table->string('country')->nullable()->index();

            $table->string('region')->nullable();

            $table->string('county')->nullable();

            $table->string('city')->nullable()->index();

            $table->decimal('latitude', 10, 7)->nullable();

            $table->decimal('longitude', 10, 7)->nullable();

            $table->string('timezone')->nullable();

            /*
            |--------------------------------------------------------------------------
            | REFERRAL INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('referer')->nullable();

            $table->string('source')->nullable();      // Google

            $table->string('medium')->nullable();      // Organic

            $table->string('campaign')->nullable();    // Facebook Ads

            /*
            |--------------------------------------------------------------------------
            | VISIT DETAILS
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_unique')->default(false);

            $table->unsignedInteger('duration')->default(0)
                ->comment('Seconds spent on property');

            $table->unsignedInteger('page_views')->default(1);

            $table->unsignedInteger('scroll_percentage')->default(0);

            $table->boolean('contact_clicked')->default(false);

            $table->boolean('call_clicked')->default(false);

            $table->boolean('whatsapp_clicked')->default(false);

            $table->boolean('email_clicked')->default(false);

            $table->boolean('bookmarked')->default(false);

            $table->boolean('shared')->default(false);

            $table->boolean('scheduled_visit')->default(false);

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

            $table->index('visited_at');

            $table->index('is_unique');

            $table->index('browser');

            $table->index('platform');

            $table->index('device');

            $table->index('source');

            $table->index('campaign');

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
                'browser',
            ]);

            $table->index([
                'property_id',
                'platform',
            ]);

            $table->index([
                'property_id',
                'country',
            ]);

            $table->index([
                'property_id',
                'city',
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