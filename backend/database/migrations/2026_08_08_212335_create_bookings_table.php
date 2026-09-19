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
        Schema::create('bookings', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | BOOKING IDENTIFICATION
            |--------------------------------------------------------------------------
            |
            | booking_number:
            |     Internal human-readable booking identifier.
            |
            | reference:
            |     External/reference identifier.
            |
            | slug:
            |     URL-friendly unique identifier.
            |
            */

            $table->string('booking_number', 50)
                ->unique();

            $table->string('reference', 100)
                ->unique();

            $table->string('slug', 150)
                ->unique();

            /*
            |--------------------------------------------------------------------------
            | USER / CUSTOMER / TENANT RELATIONSHIPS
            |--------------------------------------------------------------------------
            |
            | user_id:
            |     User who created the booking.
            |
            | customer_id:
            |     User/customer associated with the booking.
            |
            | tenant_id:
            |     Existing tenant profile when applicable.
            |
            */

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('tenant_id')
                ->nullable()
                ->constrained('tenants')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            /*
            |--------------------------------------------------------------------------
            | PROPERTY / APARTMENT / UNIT RELATIONSHIPS
            |--------------------------------------------------------------------------
            */

            $table->foreignId('property_id')
                ->nullable()
                ->constrained('properties')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('apartment_id')
                ->nullable()
                ->constrained('apartments')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            $table->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            /*
            |--------------------------------------------------------------------------
            | TENANCY RELATIONSHIP
            |--------------------------------------------------------------------------
            |
            | A confirmed/approved booking may later be converted into a tenancy.
            |
            */

            $table->foreignId('tenancy_id')
                ->nullable()
                ->constrained('tenancies')
                ->nullOnDelete()
                ->cascadeOnUpdate();

            /*
            |--------------------------------------------------------------------------
            | BOOKING TYPE
            |--------------------------------------------------------------------------
            */

            $table->enum('booking_type', [
                'viewing',
                'reservation',
                'rental',
            ])->default('reservation');

            /*
            |--------------------------------------------------------------------------
            | BOOKING STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'pending',
                'confirmed',
                'approved',
                'rejected',
                'cancelled',
                'completed',
                'expired',
            ])->default('pending');

            /*
            |--------------------------------------------------------------------------
            | PAYMENT STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum('payment_status', [
                'pending',
                'partial',
                'paid',
                'failed',
                'refunded',
            ])->default('pending');

            /*
            |--------------------------------------------------------------------------
            | BOOKING SOURCE
            |--------------------------------------------------------------------------
            |
            | Identifies where the booking originated.
            |
            | website:
            |     Booking made through the website/application.
            |
            | walk_in:
            |     Customer physically visited the office/property.
            |
            | agent:
            |     Booking originated through an agent.
            |
            | phone:
            |     Booking made through a phone call.
            |
            | referral:
            |     Booking originated through a referral.
            |
            | other:
            |     Any other source.
            |
            */

            $table->enum('source', [
                'website',
                'walk_in',
                'agent',
                'phone',
                'referral',
                'other',
            ])->default('other');

            /*
            |--------------------------------------------------------------------------
            | BOOKING DATES
            |--------------------------------------------------------------------------
            */

            $table->dateTime('booking_date')
                ->nullable();

            $table->date('start_date')
                ->nullable();

            $table->date('end_date')
                ->nullable();

            $table->date('check_in_date')
                ->nullable();

            $table->date('check_out_date')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->dateTime('confirmed_at')
                ->nullable();

            $table->dateTime('approved_at')
                ->nullable();

            $table->dateTime('rejected_at')
                ->nullable();

            $table->dateTime('cancelled_at')
                ->nullable();

            $table->dateTime('completed_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER SNAPSHOT
            |--------------------------------------------------------------------------
            |
            | These fields preserve the customer's information as it existed
            | when the booking was created.
            |
            */

            $table->string('first_name', 100)
                ->nullable();

            $table->string('last_name', 100)
                ->nullable();

            $table->string('email', 255)
                ->nullable();

            $table->string('phone', 30)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL DETAILS
            |--------------------------------------------------------------------------
            |
            | All monetary values are stored as decimal(15,2).
            |
            | total_amount:
            |     Calculated booking amount.
            |
            | amount_paid:
            |     Amount already received.
            |
            | balance:
            |     Outstanding amount.
            |
            */

            $table->decimal('rent_amount', 15, 2)
                ->default(0);

            $table->decimal('deposit_amount', 15, 2)
                ->default(0);

            $table->decimal('service_charge', 15, 2)
                ->default(0);

            $table->decimal('booking_fee', 15, 2)
                ->default(0);

            $table->decimal('discount_amount', 15, 2)
                ->default(0);

            $table->decimal('total_amount', 15, 2)
                ->default(0);

            $table->decimal('amount_paid', 15, 2)
                ->default(0);

            $table->decimal('balance', 15, 2)
                ->default(0);

            /*
            |--------------------------------------------------------------------------
            | OCCUPANCY / GUEST INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('number_of_adults')
                ->default(1);

            $table->unsignedInteger('number_of_children')
                ->default(0);

            /*
            |--------------------------------------------------------------------------
            | REQUEST / NOTES
            |--------------------------------------------------------------------------
            */

            $table->text('special_requests')
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->text('rejection_reason')
                ->nullable();

            $table->text('cancellation_reason')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | PAYMENT DETAILS
            |--------------------------------------------------------------------------
            */

            $table->string('payment_method', 50)
                ->nullable();

            $table->string('payment_reference', 150)
                ->nullable();

            $table->dateTime('paid_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | SEO / META
            |--------------------------------------------------------------------------
            */

            $table->string('meta_title', 255)
                ->nullable();

            $table->text('meta_description')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | EXTRA METADATA
            |--------------------------------------------------------------------------
            */

            $table->json('metadata')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS / SOFT DELETE
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | BASIC REPORTING INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index('status');

            $table->index('payment_status');

            $table->index('booking_type');

            $table->index('source');

            $table->index('booking_date');

            $table->index('start_date');

            $table->index('end_date');

            $table->index('check_in_date');

            $table->index('check_out_date');

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index('property_id');

            $table->index('apartment_id');

            $table->index('unit_id');

            $table->index('user_id');

            $table->index('customer_id');

            $table->index('tenant_id');

            $table->index('tenancy_id');

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER SEARCH INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index('email');

            $table->index('phone');

            /*
            |--------------------------------------------------------------------------
            | UNIT AVAILABILITY INDEX
            |--------------------------------------------------------------------------
            |
            | Supports queries that check whether a unit has an overlapping
            | booking for a requested period.
            |
            */

            $table->index([
                'unit_id',
                'status',
                'start_date',
                'end_date',
            ]);

            /*
            |--------------------------------------------------------------------------
            | PROPERTY BOOKING INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'property_id',
                'status',
                'start_date',
            ]);

            /*
            |--------------------------------------------------------------------------
            | APARTMENT BOOKING INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'apartment_id',
                'status',
                'start_date',
            ]);

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER BOOKING INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'customer_id',
                'status',
                'booking_date',
            ]);

            /*
            |--------------------------------------------------------------------------
            | TENANT BOOKING INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'tenant_id',
                'status',
            ]);

            /*
            |--------------------------------------------------------------------------
            | SOURCE REPORTING INDEX
            |--------------------------------------------------------------------------
            |
            | Supports booking-source reports such as:
            |
            | website
            | walk_in
            | agent
            | phone
            | referral
            | other
            |
            */

            $table->index([
                'source',
                'status',
            ]);

            /*
            |--------------------------------------------------------------------------
            | PAYMENT REPORTING INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'payment_status',
                'paid_at',
            ]);

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL REPORTING INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'payment_status',
                'amount_paid',
            ]);

            /*
            |--------------------------------------------------------------------------
            | EXPIRY / DATE REPORTING INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'status',
                'end_date',
            ]);

            /*
            |--------------------------------------------------------------------------
            | DATE RANGE REPORTING INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'booking_date',
                'status',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};