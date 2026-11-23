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
        Schema::create('maintenance_assignments', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Maintenance Request Relationship
            |--------------------------------------------------------------------------
            */

            $table->foreignId('maintenance_request_id')
                ->constrained('maintenance_requests')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Technician and Assignment Tracking
            |--------------------------------------------------------------------------
            */

            $table->foreignId('technician_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('assigned_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Assignment Status
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'pending',
                'accepted',
                'rejected',
                'in_progress',
                'on_hold',
                'completed',
                'cancelled',
            ])->default('pending')->index();

            /*
            |--------------------------------------------------------------------------
            | Assignment Dates
            |--------------------------------------------------------------------------
            */

            $table->timestamp('assigned_at')->nullable()->index();

            $table->timestamp('accepted_at')->nullable();

            $table->timestamp('rejected_at')->nullable();

            $table->timestamp('scheduled_at')->nullable()->index();

            $table->timestamp('started_at')->nullable();

            $table->timestamp('completed_at')->nullable()->index();

            $table->timestamp('cancelled_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Rejection and Cancellation Reasons
            |--------------------------------------------------------------------------
            */

            $table->text('rejection_reason')->nullable();

            $table->text('cancellation_reason')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Work Information
            |--------------------------------------------------------------------------
            */

            $table->longText('work_notes')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Time Tracking
            |--------------------------------------------------------------------------
            */

            $table->decimal('estimated_hours', 8, 2)
                ->nullable();

            $table->decimal('actual_hours', 8, 2)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */

            $table->decimal('estimated_cost', 15, 2)
                ->default(0);

            $table->decimal('actual_cost', 15, 2)
                ->default(0);

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index([
                'maintenance_request_id',
                'status',
            ], 'maintenance_assignments_request_status_idx');

            $table->index([
                'technician_id',
                'status',
            ], 'maintenance_assignments_technician_status_idx');

            $table->index([
                'technician_id',
                'scheduled_at',
            ], 'maintenance_assignments_technician_schedule_idx');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_assignments');
    }
};
