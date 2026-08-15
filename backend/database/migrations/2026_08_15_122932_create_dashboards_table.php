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
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Dashboard Owner
            |--------------------------------------------------------------------------
            |
            | Nullable because a dashboard can be a shared/system dashboard.
            |
            */
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Dashboard Information
            |--------------------------------------------------------------------------
            */

            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Dashboard Type
            |--------------------------------------------------------------------------
            |
            | system = shared dashboard
            | user   = user-specific dashboard
            |
            */
            $table->enum('type', [
                'system',
                'user',
            ])->default('system');

            /*
            |--------------------------------------------------------------------------
            | Dashboard Configuration
            |--------------------------------------------------------------------------
            */

            $table->json('layout')->nullable();

            $table->json('widgets')->nullable();

            $table->json('filters')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_default')
                ->default(false)
                ->index();

            $table->boolean('is_active')
                ->default(true)
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Ordering
            |--------------------------------------------------------------------------
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

            $table->index([
                'type',
                'is_active',
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