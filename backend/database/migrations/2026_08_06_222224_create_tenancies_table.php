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
        Schema::create('tenancies', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */

            /**
             * Property associated with the tenancy.
             */
            $table->foreignId('property_id')
                ->constrained('properties')
                ->restrictOnDelete();

            /**
             * Apartment associated with the tenancy.
             *
             * Nullable because some systems may assign
             * tenants directly to a unit.
             */
            $table->foreignId('apartment_id')
                ->nullable()
                ->constrained('apartments')
                ->nullOnDelete();

            /**
             * Unit assigned to the tenant.
             *
             * This is the main relationship used for:
             *
             * Tenant → Tenancy → Unit
             */
            $table->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            /**
             * Tenant assigned to this tenancy.
             */
            $table->foreignId('tenant_id')
                ->constrained('tenants')
                ->restrictOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Tenancy Identification
            |--------------------------------------------------------------------------
            */

            $table->string('tenancy_number')
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | Tenancy Dates
            |--------------------------------------------------------------------------
            */

            $table->date('start_date')
                ->nullable();

            $table->date('end_date')
                ->nullable();

            $table->date('move_in_date')
                ->nullable();

            $table->date('move_out_date')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */

            $table->decimal('rent_amount', 12, 2)
                ->default(0);

            $table->decimal('deposit_amount', 12, 2)
                ->default(0);

            $table->decimal('service_charge', 12, 2)
                ->default(0);

            $table->decimal('late_fee', 12, 2)
                ->default(0);


            /*
            |--------------------------------------------------------------------------
            | Payment Information
            |--------------------------------------------------------------------------
            */

            $table->string('payment_frequency')
                ->default('monthly');

            $table->unsignedTinyInteger('due_day')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Tenancy Status
            |--------------------------------------------------------------------------
            */

            $table->string('status')
                ->default('pending');

            /*
             * Controls whether the tenancy is currently enabled.
             */
            $table->boolean('is_active')
                ->default(true)
                ->index();


            /*
            |--------------------------------------------------------------------------
            | Agreement / Documents
            |--------------------------------------------------------------------------
            */

            $table->string('agreement_file')
                ->nullable();

            $table->string('agreement_public_id')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

            $table->text('notes')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Timestamps / Soft Deletes
            |--------------------------------------------------------------------------
            */

            $table->timestamps();
            $table->softDeletes();


            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index('status');

            $table->index('tenant_id');

            $table->index('property_id');

            $table->index('apartment_id');

            $table->index('unit_id');

            $table->index([
                'tenant_id',
                'status',
            ]);

            $table->index([
                'unit_id',
                'status',
            ]);

            $table->index([
                'unit_id',
                'is_active',
            ]);

            $table->index([
                'tenant_id',
                'is_active',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenancies');
    }
};

