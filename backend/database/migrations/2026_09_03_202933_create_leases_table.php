<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * ==========================================================================
     * LEASE TABLE
     * ==========================================================================
     *
     * A lease represents the legal/contractual agreement attached to a tenancy.
     *
     * Relationship:
     *
     * Tenant
     *    └── Tenancy
     *          └── Lease
     *
     * Tenant, property, apartment and unit information is intentionally not
     * duplicated here. Those details are resolved through the tenancy.
     */
    public function up(): void
    {
        Schema::create('leases', function (Blueprint $table) {
            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Lease Identification
            |--------------------------------------------------------------------------
            |
            | Example:
            | LSE-000001
            |
            */
            $table->string('lease_number', 50)
                ->unique();

            /*
            |--------------------------------------------------------------------------
            | Tenancy Relationship
            |--------------------------------------------------------------------------
            |
            | Every lease belongs to an existing tenancy.
            |
            | If a tenancy is deleted, its leases are removed as well because
            | a lease cannot exist without its parent tenancy.
            |
            */
            $table->foreignId('tenancy_id')
                ->constrained('tenancies')
                ->cascadeOnUpdate()
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Lease Type
            |--------------------------------------------------------------------------
            |
            | Supported application values:
            |
            | - fixed_term
            | - month_to_month
            | - renewal
            | - short_term
            |
            */
            $table->string('lease_type', 30)
                ->default('fixed_term')
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Lease Period
            |--------------------------------------------------------------------------
            */
            $table->date('start_date')
                ->index();

            $table->date('end_date')
                ->nullable()
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Financial Terms
            |--------------------------------------------------------------------------
            |
            | These values represent the financial terms specifically agreed
            | upon in the lease.
            |
            */
            $table->decimal('rent_amount', 15, 2)
                ->default(0);

            $table->decimal('deposit_amount', 15, 2)
                ->default(0);

            $table->decimal('service_charge', 15, 2)
                ->default(0);

            $table->decimal('late_fee', 15, 2)
                ->default(0);

            /*
            |--------------------------------------------------------------------------
            | Payment Terms
            |--------------------------------------------------------------------------
            |
            | Examples:
            | - monthly
            | - quarterly
            | - annually
            |
            */
            $table->string('payment_frequency', 30)
                ->default('monthly')
                ->index();

            $table->unsignedTinyInteger('due_day')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Notice / Termination Terms
            |--------------------------------------------------------------------------
            */
            $table->unsignedSmallInteger('notice_period_days')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Lease Status
            |--------------------------------------------------------------------------
            |
            | Supported application values:
            |
            | - draft
            | - pending
            | - active
            | - expired
            | - terminated
            | - cancelled
            |
            */
            $table->string('status', 30)
                ->default('draft')
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Signature Information
            |--------------------------------------------------------------------------
            */
            $table->dateTime('signed_at')
                ->nullable()
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Termination Information
            |--------------------------------------------------------------------------
            */
            $table->dateTime('terminated_at')
                ->nullable()
                ->index();

            $table->text('termination_reason')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Lease Document
            |--------------------------------------------------------------------------
            |
            | Stores the path/reference to the signed lease document.
            |
            */
            $table->string('document_path', 500)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Additional Notes
            |--------------------------------------------------------------------------
            */
            $table->text('notes')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Timestamps & Soft Deletes
            |--------------------------------------------------------------------------
            */
            $table->timestamps();
            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | Composite Indexes
            |--------------------------------------------------------------------------
            |
            | These support common lease-management queries.
            |
            */
            $table->index(
                ['tenancy_id', 'status'],
                'leases_tenancy_status_index'
            );

            $table->index(
                ['status', 'start_date'],
                'leases_status_start_date_index'
            );

            $table->index(
                ['status', 'end_date'],
                'leases_status_end_date_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leases');
    }
};