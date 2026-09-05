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
        Schema::create('payment_allocations', function (Blueprint $table) {
            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Payment Relationship
            |--------------------------------------------------------------------------
            |
            | Every allocation belongs to a core payment.
            |
            | Example:
            |
            | Payment: KES 65,000
            |
            | Allocations:
            | - Rent:           KES 60,000
            | - Service Charge: KES  5,000
            |
            | The payment itself remains the main financial record.
            |
            */

            $table->foreignId('payment_id')
                ->constrained('payments')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Tenancy Relationship
            |--------------------------------------------------------------------------
            |
            | Identifies the tenancy to which this allocation belongs.
            |
            | Nullable because some payments may be recorded before a tenancy
            | is assigned or may be property-level payments.
            |
            */

            $table->foreignId('tenancy_id')
                ->nullable()
                ->constrained('tenancies')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Property Relationship
            |--------------------------------------------------------------------------
            |
            | Property associated with the allocation.
            |
            */

            $table->foreignId('property_id')
                ->nullable()
                ->constrained('properties')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Apartment Relationship
            |--------------------------------------------------------------------------
            |
            | Apartment associated with the allocation.
            |
            */

            $table->foreignId('apartment_id')
                ->nullable()
                ->constrained('apartments')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Unit Relationship
            |--------------------------------------------------------------------------
            |
            | Unit associated with the allocation.
            |
            */

            $table->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Allocation Classification
            |--------------------------------------------------------------------------
            |
            | Supported allocation types:
            |
            | - rent
            | - deposit
            | - service_charge
            | - utility
            | - penalty
            | - other
            |
            */

            $table->string('allocation_type', 50);

            /*
            |--------------------------------------------------------------------------
            | Allocated Amount
            |--------------------------------------------------------------------------
            |
            | The portion of the parent payment allocated to this category.
            |
            | Example:
            |
            | Payment amount:     KES 65,000
            |
            | Rent allocation:    KES 60,000
            | Service charge:     KES  5,000
            |
            */

            $table->decimal('amount', 15, 2);

            /*
            |--------------------------------------------------------------------------
            | Internal / External Reference
            |--------------------------------------------------------------------------
            |
            | Can be used for:
            |
            | - Invoice number
            | - Rent charge reference
            | - Utility bill reference
            | - Penalty reference
            | - Internal accounting reference
            |
            */

            $table->string('reference', 150)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Description
            |--------------------------------------------------------------------------
            */

            $table->text('description')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Relationship Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(
                'payment_id',
                'payment_allocations_payment_id_index'
            );

            $table->index(
                'tenancy_id',
                'payment_allocations_tenancy_id_index'
            );

            $table->index(
                'property_id',
                'payment_allocations_property_id_index'
            );

            $table->index(
                'apartment_id',
                'payment_allocations_apartment_id_index'
            );

            $table->index(
                'unit_id',
                'payment_allocations_unit_id_index'
            );

            /*
            |--------------------------------------------------------------------------
            | Reporting Indexes
            |--------------------------------------------------------------------------
            |
            | These indexes support common financial reporting queries.
            |
            */

            $table->index(
                ['allocation_type', 'payment_id'],
                'payment_allocations_type_payment_index'
            );

            $table->index(
                ['allocation_type', 'tenancy_id'],
                'payment_allocations_type_tenancy_index'
            );

            $table->index(
                ['allocation_type', 'property_id'],
                'payment_allocations_type_property_index'
            );

            $table->index(
                ['allocation_type', 'unit_id'],
                'payment_allocations_type_unit_index'
            );

            $table->index(
                ['tenancy_id', 'allocation_type'],
                'payment_allocations_tenancy_type_index'
            );

            $table->index(
                ['property_id', 'allocation_type'],
                'payment_allocations_property_type_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_allocations');
    }
};