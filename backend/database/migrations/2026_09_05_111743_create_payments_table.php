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
        Schema::create('payments', function (Blueprint $table) {
            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Payment Identification
            |--------------------------------------------------------------------------
            |
            | Human-readable internal payment identifier.
            |
            | Example:
            |
            | PAY-20260905-482731
            |
            | Generated automatically by the Payment model.
            |
            */

            $table->string('payment_number', 50)
                ->unique();

            /*
            |--------------------------------------------------------------------------
            | Payment Relationships
            |--------------------------------------------------------------------------
            |
            | A payment can optionally be associated with:
            |
            | - A user account
            | - A tenant
            | - A tenancy
            | - A property
            | - An apartment
            | - A unit
            |
            | Foreign keys are nullable because financial records should remain
            | valid even when related operational records are removed.
            |
            */

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('tenant_id')
                ->nullable()
                ->constrained('tenants')
                ->nullOnDelete();

            $table->foreignId('tenancy_id')
                ->nullable()
                ->constrained('tenancies')
                ->nullOnDelete();

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
            | Financial Information
            |--------------------------------------------------------------------------
            */

            $table->decimal('amount', 15, 2);

            /*
            | ISO 4217 currency code.
            |
            | Example:
            | KES
            |
            */

            $table->char('currency', 3)
                ->default('KES');

            /*
            |--------------------------------------------------------------------------
            | Payment Classification
            |--------------------------------------------------------------------------
            |
            | Supported payment types:
            |
            | - rent
            | - deposit
            | - service_charge
            | - utility
            | - penalty
            | - other
            |
            */

            $table->string('payment_type', 50)
                ->default('rent');

            /*
            |--------------------------------------------------------------------------
            | Payment Method
            |--------------------------------------------------------------------------
            |
            | Supported methods:
            |
            | - mpesa
            | - bank_transfer
            | - cash
            | - card
            | - cheque
            | - online
            | - other
            |
            | Provider-specific information such as M-Pesa checkout requests,
            | receipts and callbacks belongs in mpesa_transactions.
            |
            */

            $table->string('payment_method', 50)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Payment Status
            |--------------------------------------------------------------------------
            |
            | Supported statuses:
            |
            | - pending
            | - completed
            | - failed
            | - cancelled
            | - refunded
            |
            */

            $table->string('status', 30)
                ->default('pending');

            /*
            |--------------------------------------------------------------------------
            | Payment Dates
            |--------------------------------------------------------------------------
            |
            | payment_date:
            | Accounting/reporting date.
            |
            | paid_at:
            | Exact date and time when the payment was successfully completed.
            |
            */

            $table->date('payment_date')
                ->nullable();

            $table->timestamp('paid_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | External Transaction Reference
            |--------------------------------------------------------------------------
            |
            | Stores an external payment reference supplied by the payment
            | provider or financial institution.
            |
            | Examples:
            |
            | - M-Pesa receipt
            | - Bank transaction reference
            | - Card transaction reference
            | - Cheque reference
            |
            | M-Pesa-specific technical identifiers are stored separately in
            | mpesa_transactions.
            |
            */

            $table->string('transaction_reference', 150)
                ->nullable()
                ->unique();

            /*
            |--------------------------------------------------------------------------
            | Receipt Information
            |--------------------------------------------------------------------------
            |
            | Internal receipt number generated by the Payment model.
            |
            | Example:
            |
            | RCP-20260905-731942
            |
            */

            $table->string('receipt_number', 100)
                ->nullable()
                ->unique();

            /*
            |--------------------------------------------------------------------------
            | Additional Information
            |--------------------------------------------------------------------------
            */

            $table->text('description')
                ->nullable();

            $table->text('notes')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Audit Information
            |--------------------------------------------------------------------------
            |
            | created_by:
            | User who created or recorded the payment.
            |
            | updated_by:
            | User who last modified the payment.
            |
            | Both remain nullable to support system-generated payments.
            |
            */

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('updated_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

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
                'user_id',
                'payments_user_id_index'
            );

            $table->index(
                'tenant_id',
                'payments_tenant_id_index'
            );

            $table->index(
                'tenancy_id',
                'payments_tenancy_id_index'
            );

            $table->index(
                'property_id',
                'payments_property_id_index'
            );

            $table->index(
                'apartment_id',
                'payments_apartment_id_index'
            );

            $table->index(
                'unit_id',
                'payments_unit_id_index'
            );

            /*
            |--------------------------------------------------------------------------
            | Reporting Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['user_id', 'payment_date'],
                'payments_user_date_index'
            );

            $table->index(
                ['tenant_id', 'payment_date'],
                'payments_tenant_date_index'
            );

            $table->index(
                ['tenancy_id', 'payment_date'],
                'payments_tenancy_date_index'
            );

            $table->index(
                ['property_id', 'payment_date'],
                'payments_property_date_index'
            );

            $table->index(
                ['apartment_id', 'payment_date'],
                'payments_apartment_date_index'
            );

            $table->index(
                ['unit_id', 'payment_date'],
                'payments_unit_date_index'
            );

            /*
            |--------------------------------------------------------------------------
            | Classification Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['payment_type', 'status'],
                'payments_type_status_index'
            );

            $table->index(
                ['payment_method', 'status'],
                'payments_method_status_index'
            );

            $table->index(
                ['status', 'payment_date'],
                'payments_status_date_index'
            );

            $table->index(
                ['payment_type', 'payment_date'],
                'payments_type_date_index'
            );

            $table->index(
                ['payment_method', 'payment_date'],
                'payments_method_date_index'
            );

            /*
            |--------------------------------------------------------------------------
            | Completion / Financial Reporting Index
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['paid_at', 'status'],
                'payments_paid_at_status_index'
            );

            /*
            |--------------------------------------------------------------------------
            | Currency Index
            |--------------------------------------------------------------------------
            |
            | Useful if the system later supports multiple currencies.
            |
            */

            $table->index(
                'currency',
                'payments_currency_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};