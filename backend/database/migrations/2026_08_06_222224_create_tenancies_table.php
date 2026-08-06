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
            $table->foreignId('property_id')
                ->constrained('properties')
                ->cascadeOnDelete();

            $table->foreignId('apartment_id')
                ->nullable()
                ->constrained('apartments')
                ->nullOnDelete();

            $table->foreignId('unit_id')
                ->nullable()
                ->constrained('units')
                ->nullOnDelete();

            $table->foreignId('tenant_id')
                ->constrained('tenants')
                ->cascadeOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Tenancy Information
            |--------------------------------------------------------------------------
            */
            $table->string('tenancy_number')->unique();

            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();

            $table->date('move_in_date')->nullable();
            $table->date('move_out_date')->nullable();


            /*
            |--------------------------------------------------------------------------
            | Financial
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
            | Payment
            |--------------------------------------------------------------------------
            */
            $table->string('payment_frequency')
                ->default('monthly');

            $table->unsignedTinyInteger('due_day')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            $table->string('status')
                ->default('active');


            /*
            |--------------------------------------------------------------------------
            | Documents
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
            | Flags
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_active')
                ->default(true);


            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('tenant_id');
            $table->index('property_id');
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