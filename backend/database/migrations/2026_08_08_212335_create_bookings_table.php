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
            */

            $table->string('booking_number', 50)->unique();
            $table->string('reference', 100)->unique();
            $table->string('slug', 150)->unique();

            /*
            |--------------------------------------------------------------------------
            | USER / CUSTOMER / TENANT RELATIONSHIPS
            |--------------------------------------------------------------------------
            |
            | user_id     = user who created the booking
            | customer_id = customer making the booking
            | tenant_id   = tenant if already registered
            |
            */

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('tenant_id')
                ->nullable()
                ->constrained('tenants')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | PROPERTY RELATIONSHIPS
            |--------------------------------------------------------------------------
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
            | TENANCY RELATIONSHIP
            |--------------------------------------------------------------------------
            |
            | A booking can later be converted into a tenancy.
            |
            */

            $table->foreignId('tenancy_id')
                ->nullable()
                ->constrained('tenancies')
                ->nullOnDelete();

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
            | BOOKING DATES
            |--------------------------------------------------------------------------
            */

            $table->dateTime('booking_date')->nullable();

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->date('check_in_date')->nullable();
            $table->date('check_out_date')->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->dateTime('confirmed_at')->nullable();
            $table->dateTime('approved_at')->nullable();
            $table->dateTime('rejected_at')->nullable();
            $table->dateTime('cancelled_at')->nullable();
            $table->dateTime('completed_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER DETAILS
            |--------------------------------------------------------------------------
            |
            | These are stored as a snapshot so historical booking information
            | remains available even if the user's profile changes.
            |
            */

            $table->string('first_name')->nullable();
            $table->string('last_name')->nullable();

            $table->string('email')->nullable();
            $table->string('phone', 30)->nullable();

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL DETAILS
            |--------------------------------------------------------------------------
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
            | OCCUPANTS
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

            $table->text('special_requests')->nullable();

            $table->text('notes')->nullable();

            $table->text('rejection_reason')->nullable();

            $table->text('cancellation_reason')->nullable();

            /*
            |--------------------------------------------------------------------------
            | PAYMENT DETAILS
            |--------------------------------------------------------------------------
            */

            $table->string('payment_method')->nullable();

            $table->string('payment_reference')->nullable();

            $table->dateTime('paid_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | SEO / META
            |--------------------------------------------------------------------------
            */

            $table->string('meta_title')->nullable();

            $table->text('meta_description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | EXTRA METADATA
            |--------------------------------------------------------------------------
            */

            $table->json('metadata')->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS / SOFT DELETE
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index('status');
            $table->index('payment_status');
            $table->index('booking_type');

            $table->index('booking_date');

            $table->index('start_date');
            $table->index('end_date');

            $table->index('property_id');
            $table->index('apartment_id');
            $table->index('unit_id');

            $table->index('user_id');
            $table->index('customer_id');
            $table->index('tenant_id');
            $table->index('tenancy_id');

            $table->index('email');
            $table->index('phone');

            $table->index([
                'unit_id',
                'status',
            ]);

            $table->index([
                'property_id',
                'status',
            ]);

            $table->index([
                'customer_id',
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
