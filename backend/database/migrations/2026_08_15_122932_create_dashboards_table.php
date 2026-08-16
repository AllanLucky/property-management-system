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
        Schema::create('dashboards', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Dashboard Owner
            |--------------------------------------------------------------------------
            |
            | System dashboard:
            |     user_id = NULL
            |
            | User dashboard:
            |     user_id = authenticated user's ID
            |
            | If a user is deleted, the dashboard remains but ownership
            | is removed.
            |
            */

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Dashboard Identity
            |--------------------------------------------------------------------------
            */

            $table->string('name', 150);

            $table->string('slug', 180)
                ->unique();

            $table->text('description')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Dashboard Type
            |--------------------------------------------------------------------------
            |
            | system:
            |     Shared dashboard created by the application.
            |
            | user:
            |     Dashboard customized/owned by a specific user.
            |
            */

            $table->enum('type', [
                'system',
                'user',
            ])
                ->default('system');

            /*
            |--------------------------------------------------------------------------
            | Dashboard Layout
            |--------------------------------------------------------------------------
            |
            | Stores frontend layout configuration.
            |
            | Example:
            |
            | {
            |     "columns": 12,
            |     "responsive": true,
            |     "cards": {
            |         "small": 3,
            |         "medium": 4,
            |         "large": 6,
            |         "full": 12
            |     },
            |     "breakpoints": {
            |         "mobile": 1,
            |         "tablet": 6,
            |         "desktop": 12
            |     },
            |     "role": "super-admin"
            | }
            |
            */

            $table->json('layout')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Dashboard Widgets
            |--------------------------------------------------------------------------
            |
            | Stores the widgets displayed on the dashboard.
            |
            | Example:
            |
            | [
            |     {
            |         "key": "properties",
            |         "type": "stat",
            |         "title": "Properties",
            |         "enabled": true,
            |         "order": 1
            |     },
            |     {
            |         "key": "occupancy",
            |         "type": "chart",
            |         "title": "Occupancy Overview",
            |         "enabled": true,
            |         "order": 4
            |     }
            | ]
            |
            */

            $table->json('widgets')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Dashboard Filters
            |--------------------------------------------------------------------------
            |
            | Stores saved/default dashboard filters.
            |
            | Example:
            |
            | {
            |     "property_id": null,
            |     "apartment_id": null,
            |     "unit_status": null,
            |     "date_range": "this_month"
            | }
            |
            */

            $table->json('filters')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Dashboard Status
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_default')
                ->default(false);

            $table->boolean('is_active')
                ->default(true);

            /*
            |--------------------------------------------------------------------------
            | Dashboard Ordering
            |--------------------------------------------------------------------------
            |
            | Lower values appear first.
            |
            */

            $table->unsignedInteger('sort_order')
                ->default(0);

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            /*
            | Active dashboards.
            */
            $table->index([
                'is_active',
                'sort_order',
            ]);

            /*
            | System/user dashboard lookup.
            */
            $table->index([
                'type',
                'is_active',
            ]);

            /*
            | Default dashboard lookup.
            */
            $table->index([
                'type',
                'is_default',
                'is_active',
            ]);

            /*
            | User dashboard lookup.
            */
            $table->index([
                'user_id',
                'type',
                'is_active',
            ]);

            /*
            | User default dashboard lookup.
            */
            $table->index([
                'user_id',
                'is_default',
                'is_active',
            ]);

            /*
            | User dashboard ordering.
            */
            $table->index([
                'user_id',
                'sort_order',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dashboards');
    }
};