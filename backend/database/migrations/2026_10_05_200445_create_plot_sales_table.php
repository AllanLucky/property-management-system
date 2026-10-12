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
        Schema::create('plot_sales', function (Blueprint $table) {
            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Plot Relationship
            |--------------------------------------------------------------------------
            |
            | Each sale belongs to one plot.
            | Restrict deletion to preserve sale history.
            |
            */

            $table->foreignId('plot_id')
                ->constrained('plots')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Buyer Relationship
            |--------------------------------------------------------------------------
            |
            | The buyer is an existing user in EstateKenya.
            |
            */

            $table->foreignId('buyer_id')
                ->constrained('users')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Agent Relationship
            |--------------------------------------------------------------------------
            |
            | Optional agent responsible for facilitating the sale.
            | If the agent is deleted, preserve the sale record.
            |
            */

            $table->foreignId('agent_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Sale Identification
            |--------------------------------------------------------------------------
            */

            $table->string('sale_number', 50)
                ->unique();

            $table->date('sale_date')
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Sale Agreement
            |--------------------------------------------------------------------------
            */

            $table->string('agreement_number', 100)
                ->nullable()
                ->unique();

            $table->date('agreement_date')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            |
            | Net sale price = sale price - discount.
            | Balance should be recalculated by the service/model layer.
            | Deposit amount represents the agreed deposit; actual receipts
            | should be tracked in the plot_payments table.
            |
            */

            $table->decimal('sale_price', 15, 2)
                ->default(0);

            $table->decimal('deposit_amount', 15, 2)
                ->default(0);

            $table->decimal('discount_amount', 15, 2)
                ->default(0);

            $table->decimal('amount_paid', 15, 2)
                ->default(0);

            $table->decimal('balance', 15, 2)
                ->default(0);

            $table->string('currency', 3)
                ->default('KES');

            /*
            |--------------------------------------------------------------------------
            | Payment Terms
            |--------------------------------------------------------------------------
            */

            $table->enum('payment_frequency', [
                'once',
                'daily',
                'weekly',
                'monthly',
                'quarterly',
                'yearly',
            ])->default('once');

            $table->date('due_date')
                ->nullable()
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Completion
            |--------------------------------------------------------------------------
            */

            $table->date('completion_date')
                ->nullable()
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Sale Notes
            |--------------------------------------------------------------------------
            */

            $table->text('notes')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Cancellation Information
            |--------------------------------------------------------------------------
            */

            $table->text('cancellation_reason')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Sale Status
            |--------------------------------------------------------------------------
            |
            | pending   = sale has been initiated
            | reserved  = plot has been reserved for the buyer
            | approved  = sale has been approved
            | completed = sale has been completed
            | cancelled = sale has been cancelled
            |
            */

            $table->enum('status', [
                'pending',
                'reserved',
                'approved',
                'completed',
                'cancelled',
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
            | Composite Indexes
            |--------------------------------------------------------------------------
            */

            $table->index([
                'plot_id',
                'status',
            ], 'plot_sales_plot_status_index');

            $table->index([
                'buyer_id',
                'status',
            ], 'plot_sales_buyer_status_index');

            $table->index([
                'agent_id',
                'status',
            ], 'plot_sales_agent_status_index');

            $table->index([
                'status',
                'is_active',
            ], 'plot_sales_status_active_index');

            $table->index([
                'due_date',
                'status',
            ], 'plot_sales_due_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plot_sales');
    }
};