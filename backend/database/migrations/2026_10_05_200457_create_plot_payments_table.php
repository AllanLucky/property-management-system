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
        Schema::create('plot_payments', function (Blueprint $table) {
            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Plot Sale Relationship
            |--------------------------------------------------------------------------
            |
            | Every plot payment belongs to a specific plot sale.
            |
            */

            $table->foreignId('plot_sale_id')
                ->constrained('plot_sales')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Payment Identification
            |--------------------------------------------------------------------------
            */

            $table->string('payment_number', 50)
                ->unique();

            $table->string('receipt_number', 50)
                ->nullable()
                ->unique();

            $table->string('transaction_reference', 150)
                ->nullable()
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Payment Amount
            |--------------------------------------------------------------------------
            */

            $table->decimal('amount', 15, 2)
                ->default(0);

            $table->string('currency', 3)
                ->default('KES');

            /*
            |--------------------------------------------------------------------------
            | Payment Type
            |--------------------------------------------------------------------------
            |
            | deposit       = initial deposit
            | installment   = scheduled installment
            | balance       = final balance payment
            | other         = other payment
            |
            */

            $table->enum('payment_type', [
                'deposit',
                'installment',
                'balance',
                'other',
            ])->default('installment')->index();

            /*
            |--------------------------------------------------------------------------
            | Payment Method
            |--------------------------------------------------------------------------
            |
            | Supports the EstateKenya financial payment methods.
            |
            */

            $table->enum('payment_method', [
                'mpesa',
                'bank_transfer',
                'cash',
                'card',
                'cheque',
                'online',
                'other',
            ])->default('mpesa')->index();

            /*
            |--------------------------------------------------------------------------
            | Payment Date
            |--------------------------------------------------------------------------
            */

            $table->dateTime('payment_date')
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Payer Information
            |--------------------------------------------------------------------------
            |
            | Snapshot information is retained so historical payment
            | records remain useful even if user profile details change.
            |
            */

            $table->string('payer_name', 255)
                ->nullable();

            $table->string('payer_phone', 50)
                ->nullable()
                ->index();

            $table->string('payer_email', 255)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Additional Details
            |--------------------------------------------------------------------------
            */

            $table->text('notes')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Payment Status
            |--------------------------------------------------------------------------
            |
            | pending   = payment initiated but not confirmed
            | completed = payment successfully received
            | failed    = payment failed
            | refunded  = completed payment was refunded
            |
            */

            $table->enum('status', [
                'pending',
                'completed',
                'failed',
                'refunded',
            ])->default('pending')->index();

            /*
            |--------------------------------------------------------------------------
            | Active Flag
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_active')
                ->default(true)
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | Soft Deletes
            |--------------------------------------------------------------------------
            */

            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index([
                'plot_sale_id',
                'status',
            ]);

            $table->index([
                'payment_date',
                'status',
            ]);

            $table->index([
                'payment_method',
                'status',
            ]);

            $table->index([
                'payment_type',
                'status',
            ]);

            $table->index([
                'status',
                'is_active',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plot_payments');
    }
};
