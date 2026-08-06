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

            // RELATIONSHIPS
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('apartment_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();

            // TENANCY INFORMATION
            $table->string('tenancy_number')->unique();
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->date('move_in_date')->nullable();
            $table->date('move_out_date')->nullable();

            // FINANCIAL
            $table->decimal('rent_amount', 12, 2)->default(0);
            $table->decimal('deposit_amount', 12, 2)->default(0);
            $table->decimal('service_charge', 12, 2)->default(0);
            $table->decimal('late_fee', 12, 2)->default(0);

            // PAYMENT
            $table->string('payment_frequency')->default('monthly');
            $table->unsignedTinyInteger('due_day')->nullable();

            // STATUS
            $table->string('status')->default('active');

            // DOCUMENTS
            $table->string('agreement_file')->nullable();
            $table->string('agreement_public_id')->nullable();

            // NOTES
            $table->text('notes')->nullable();

            // FLAGS
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();
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
