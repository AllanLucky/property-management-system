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
        Schema::create('maintenances', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | PROPERTY / LOCATION RELATIONSHIPS
            |--------------------------------------------------------------------------
            |
            | Property, apartment and unit are nullable because maintenance can
            | be reported against a property/common area, apartment, or specific
            | unit.
            |
            */

            $table->foreignId('property_id')
                ->nullable()
                ->constrained('properties')
                ->nullOnDelete();

            $table->foreignId('apartment_id')
                ->nullable()
                ->constrained('apartments')
                ->nullOnDelete();

            $table->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | TENANT / USER RELATIONSHIPS
            |--------------------------------------------------------------------------
            */

            $table->foreignId('tenant_id')
                ->nullable()
                ->constrained('tenants')
                ->nullOnDelete();

            /*
            | User who reported the maintenance request.
            */

            $table->foreignId('reported_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            | Technician / staff member assigned to the maintenance.
            */

            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('title');

            $table->string('slug')
                ->unique();

            $table->text('description');

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE CLASSIFICATION
            |--------------------------------------------------------------------------
            */

            $table->enum('type', [
                'general',
                'electrical',
                'plumbing',
                'hvac',
                'structural',
                'appliance',
                'security',
                'cleaning',
                'painting',
                'other',
            ])->default('general');

            /*
            |--------------------------------------------------------------------------
            | PRIORITY
            |--------------------------------------------------------------------------
            */

            $table->enum('priority', [
                'low',
                'medium',
                'high',
                'urgent',
                'critical',
            ])->default('medium');

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            |
            | Workflow:
            |
            | pending
            |    ↓
            | scheduled
            |    ↓
            | assigned
            |    ↓
            | in_progress
            |    ↓
            | completed
            |
            | Alternative states:
            | on_hold / cancelled / rejected
            |
            */

            $table->enum('status', [
                'pending',
                'scheduled',
                'assigned',
                'in_progress',
                'on_hold',
                'completed',
                'cancelled',
                'rejected',
            ])->default('pending');

            /*
            |--------------------------------------------------------------------------
            | LOCATION
            |--------------------------------------------------------------------------
            */

            $table->string('location')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | ATTACHMENTS
            |--------------------------------------------------------------------------
            |
            | Stores maintenance images as JSON.
            |
            */

            $table->json('images')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE DATES
            |--------------------------------------------------------------------------
            */

            $table->timestamp('reported_at')
                ->nullable();

            $table->timestamp('scheduled_at')
                ->nullable();

            $table->timestamp('started_at')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | COSTS
            |--------------------------------------------------------------------------
            */

            $table->decimal('estimated_cost', 15, 2)
                ->nullable();

            $table->decimal('actual_cost', 15, 2)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | RESOLUTION / NOTES
            |--------------------------------------------------------------------------
            */

            $table->text('resolution')
                ->nullable();

            $table->text('technician_notes')
                ->nullable();

            $table->text('internal_notes')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | PARTS
            |--------------------------------------------------------------------------
            */

            $table->boolean('requires_parts')
                ->default(false);

            $table->text('parts_description')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_emergency')
                ->default(false);

            $table->boolean('is_tenant_responsibility')
                ->default(false);

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index('property_id');
            $table->index('apartment_id');
            $table->index('unit_id');
            $table->index('tenant_id');

            $table->index('reported_by');
            $table->index('assigned_to');

            $table->index('type');
            $table->index('priority');
            $table->index('status');

            $table->index('reported_at');
            $table->index('scheduled_at');
            $table->index('started_at');
            $table->index('completed_at');

            $table->index('is_emergency');
            $table->index('requires_parts');
            $table->index('is_tenant_responsibility');

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS / SOFT DELETES
            |--------------------------------------------------------------------------
            */

            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenances');
    }
};