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
        Schema::create('maintenance_requests', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Request Identification
            |--------------------------------------------------------------------------
            */

            $table->string('reference', 50)->unique();

            /*
            |--------------------------------------------------------------------------
            | Property Relationships
            |--------------------------------------------------------------------------
            */

            // Property associated with the maintenance request.
            $table->foreignId('property_id')
                ->constrained('properties')
                ->cascadeOnDelete();

            // Apartment associated with the request.
            // Nullable for property-level or common-area maintenance.
            $table->foreignId('apartment_id')
                ->nullable()
                ->constrained('apartments')
                ->nullOnDelete();

            // Specific unit associated with the request.
            // Nullable for apartment-level or property-level maintenance.
            $table->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            // Tenant reporting or associated with the request.
            $table->foreignId('tenant_id')
                ->nullable()
                ->constrained('tenants')
                ->nullOnDelete();

            // Maintenance category.
            $table->foreignId('category_id')
                ->nullable()
                ->constrained('maintenance_categories')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Request Details
            |--------------------------------------------------------------------------
            */

            $table->string('title', 255);

            $table->text('description');

            $table->enum('priority', [
                'low',
                'medium',
                'high',
                'urgent',
            ])->default('medium');

            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'assigned',
                'in_progress',
                'on_hold',
                'completed',
                'cancelled',
            ])->default('pending')->index();

            $table->boolean('is_emergency')
                ->default(false)
                ->index();

            /*
            |--------------------------------------------------------------------------
            | User Tracking
            |--------------------------------------------------------------------------
            */

            // User who reported the maintenance request.
            $table->foreignId('reported_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // User who approved the maintenance request.
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // User who assigned the maintenance request.
            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Maintenance Schedule
            |--------------------------------------------------------------------------
            */

            $table->timestamp('scheduled_at')
                ->nullable()
                ->index();

            $table->timestamp('started_at')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable()
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Rejection and Cancellation
            |--------------------------------------------------------------------------
            */

            $table->timestamp('rejected_at')->nullable();

            $table->text('rejection_reason')->nullable();

            $table->timestamp('cancelled_at')->nullable();

            $table->text('cancellation_reason')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Completion Information
            |--------------------------------------------------------------------------
            */

            $table->longText('completion_notes')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */

            $table->decimal('estimated_cost', 15, 2)
                ->default(0);

            $table->decimal('total_cost', 15, 2)
                ->default(0);

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(['property_id', 'status']);

            $table->index(['apartment_id', 'status']);

            $table->index(['unit_id', 'status']);

            $table->index(['tenant_id', 'status']);

            $table->index(['category_id', 'status']);

            $table->index(['priority', 'status']);

            $table->index(['created_at', 'status']);

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_requests');
    }
};
