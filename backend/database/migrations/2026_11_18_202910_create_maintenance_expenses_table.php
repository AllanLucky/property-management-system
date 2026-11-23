
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
        Schema::create('maintenance_expenses', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */

            $table->foreignId('maintenance_request_id')
                ->constrained('maintenance_requests')
                ->cascadeOnDelete();

            $table->foreignId('maintenance_assignment_id')
                ->nullable()
                ->constrained('maintenance_assignments')
                ->nullOnDelete();

            $table->foreignId('submitted_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Expense Information
            |--------------------------------------------------------------------------
            */

            $table->string('category', 50)->default('other');

            $table->text('description');

            $table->decimal('quantity', 10, 2)->default(1);

            $table->decimal('unit_cost', 15, 2)->default(0);

            $table->decimal('amount', 15, 2)->default(0);

            $table->char('currency', 3)->default('KES');

            $table->date('expense_date');

            /*
            |--------------------------------------------------------------------------
            | Receipt and Supplier Information
            |--------------------------------------------------------------------------
            */

            $table->string('receipt_number')->nullable();

            $table->string('receipt_path')->nullable();

            $table->string('supplier_name')->nullable();

            $table->string('supplier_contact')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Approval Information
            |--------------------------------------------------------------------------
            */

            $table->string('status', 30)->default('pending');

            $table->timestamp('approved_at')->nullable();

            $table->timestamp('rejected_at')->nullable();

            $table->text('rejection_reason')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Payment Information
            |--------------------------------------------------------------------------
            */

            $table->string('payment_status', 30)->default('unpaid');

            $table->decimal('paid_amount', 15, 2)->default(0);

            $table->timestamp('paid_at')->nullable();

            $table->string('payment_reference')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Additional Information
            |--------------------------------------------------------------------------
            */

            $table->text('notes')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['maintenance_request_id', 'status'],
                'maintenance_expenses_request_status_index'
            );

            $table->index(
                'maintenance_assignment_id',
                'maintenance_expenses_assignment_index'
            );

            $table->index(
                ['category', 'expense_date'],
                'maintenance_expenses_category_date_index'
            );

            $table->index(
                ['payment_status', 'expense_date'],
                'maintenance_expenses_payment_date_index'
            );

            $table->index('submitted_by');
            $table->index('approved_by');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_expenses');
    }
};
