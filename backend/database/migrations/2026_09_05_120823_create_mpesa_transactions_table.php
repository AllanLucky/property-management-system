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
        Schema::create('mpesa_transactions', function (Blueprint $table) {
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
            | Every M-Pesa transaction belongs to a core payment record.
            |
            | The payment record remains the authoritative financial record,
            | while this table stores M-Pesa-specific technical information.
            |
            */

            $table->foreignId('payment_id')
                ->constrained('payments')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Safaricom Request Identifiers
            |--------------------------------------------------------------------------
            |
            | merchant_request_id:
            | Identifier returned by Safaricom for the merchant request.
            |
            | checkout_request_id:
            | Identifier returned for an STK Push request.
            |
            */

            $table->string('merchant_request_id', 100)
                ->nullable()
                ->index();

            $table->string('checkout_request_id', 100)
                ->nullable()
                ->unique();

            /*
            |--------------------------------------------------------------------------
            | M-Pesa Receipt
            |--------------------------------------------------------------------------
            |
            | Official M-Pesa receipt number returned after a successful
            | transaction.
            |
            | Example:
            |
            | QGH7K3P9L2
            |
            */

            $table->string('mpesa_receipt_number', 100)
                ->nullable()
                ->unique();

            /*
            |--------------------------------------------------------------------------
            | Transaction Type
            |--------------------------------------------------------------------------
            |
            | Supported transaction types:
            |
            | - C2B
            | - STK_PUSH
            | - B2C
            | - REVERSAL
            |
            */

            $table->string('transaction_type', 30)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Account / Bill Reference
            |--------------------------------------------------------------------------
            |
            | Used to identify the customer, tenancy, invoice, account or
            | internal payment reference sent to M-Pesa.
            |
            */

            $table->string('account_reference', 100)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Customer Phone Number
            |--------------------------------------------------------------------------
            |
            | Store the phone number used for the M-Pesa transaction.
            |
            | Example:
            |
            | 254712345678
            |
            */

            $table->string('phone_number', 30)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Transaction Amount
            |--------------------------------------------------------------------------
            |
            | Amount reported by M-Pesa.
            |
            | This is intentionally stored separately from payments.amount
            | because the M-Pesa callback represents provider-side data.
            |
            */

            $table->decimal('amount', 15, 2)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | M-Pesa Transaction Date
            |--------------------------------------------------------------------------
            |
            | The actual transaction date/time reported by M-Pesa.
            |
            */

            $table->timestamp('transaction_date')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Safaricom Result Information
            |--------------------------------------------------------------------------
            |
            | result_code:
            | Safaricom result code returned by the API/callback.
            |
            | result_description:
            | Human-readable result description.
            |
            */

            $table->integer('result_code')
                ->nullable();

            $table->text('result_description')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Callback Payload
            |--------------------------------------------------------------------------
            |
            | Stores the original M-Pesa callback response.
            |
            | This is important for:
            |
            | - Auditing
            | - Reconciliation
            | - Debugging
            | - Dispute resolution
            | - Future integration improvements
            |
            */

            $table->json('callback_payload')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Transaction Status
            |--------------------------------------------------------------------------
            |
            | Supported statuses:
            |
            | - pending
            | - completed
            | - failed
            | - cancelled
            | - reversed
            |
            */

            $table->string('status', 30)
                ->default('pending');

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Query / Reporting Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['payment_id', 'status'],
                'mpesa_payment_status_index'
            );

            $table->index(
                ['status', 'transaction_date'],
                'mpesa_status_date_index'
            );

            $table->index(
                ['phone_number', 'status'],
                'mpesa_phone_status_index'
            );

            $table->index(
                ['account_reference', 'status'],
                'mpesa_account_status_index'
            );

            $table->index(
                ['transaction_type', 'status'],
                'mpesa_type_status_index'
            );

            $table->index(
                ['result_code', 'status'],
                'mpesa_result_status_index'
            );

            $table->index(
                ['transaction_date', 'status'],
                'mpesa_date_status_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mpesa_transactions');
    }
};