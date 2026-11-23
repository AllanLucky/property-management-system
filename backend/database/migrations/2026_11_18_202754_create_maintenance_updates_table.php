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
        Schema::create('maintenance_updates', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */

            $table->foreignId('maintenance_request_id')
                ->constrained('maintenance_requests')
                ->cascadeOnDelete();

            $table->foreignId('maintenance_assignment_id')
                ->nullable()
                ->constrained('maintenance_assignments')
                ->nullOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Update Information
            |--------------------------------------------------------------------------
            */

            $table->string('type', 50)->default('note');

            $table->string('title');

            $table->text('description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Status Tracking
            |--------------------------------------------------------------------------
            */

            $table->string('previous_status', 30)->nullable();

            $table->string('new_status', 30)->nullable();

            $table->unsignedTinyInteger('progress_percentage')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Visibility
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_internal')->default(false);

            $table->boolean('is_visible_to_tenant')->default(true);

            /*
            |--------------------------------------------------------------------------
            | Additional Metadata
            |--------------------------------------------------------------------------
            */

            $table->json('metadata')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['maintenance_request_id', 'created_at'],
                'maintenance_updates_request_created_index'
            );

            $table->index(
                ['maintenance_request_id', 'type'],
                'maintenance_updates_request_type_index'
            );

            $table->index(
                ['maintenance_assignment_id', 'created_at'],
                'maintenance_updates_assignment_created_index'
            );

            $table->index(
                ['is_internal', 'is_visible_to_tenant'],
                'maintenance_updates_visibility_index'
            );

            $table->index('user_id');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_updates');
    }
};
