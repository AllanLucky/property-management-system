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
        Schema::create('tenants', function (Blueprint $table) {

            $table->id();


            /*
            |--------------------------------------------------------------------------
            | User Relationship
            |--------------------------------------------------------------------------
            */
            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
            */
            $table->string('tenant_number')
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            */
            $table->string('first_name');

            $table->string('last_name');

            $table->string('other_names')
                ->nullable();


            $table->string('email')
                ->nullable();

            $table->string('phone')
                ->unique();


            $table->date('date_of_birth')
                ->nullable();


            $table->enum('gender', [
                'male',
                'female',
                'other'
            ])
            ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            */
            $table->string('id_number')
                ->nullable();

            $table->string('passport_number')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Emergency Contact
            |--------------------------------------------------------------------------
            */
            $table->string('emergency_contact_name')
                ->nullable();

            $table->string('emergency_contact_phone')
                ->nullable();

            $table->string('emergency_contact_relationship')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Address
            |--------------------------------------------------------------------------
            */
            $table->string('country')
                ->default('Kenya');

            $table->string('county')
                ->nullable();

            $table->string('city')
                ->nullable();

            $table->string('postal_code')
                ->nullable();


            $table->text('address')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Employment Information
            |--------------------------------------------------------------------------
            */
            $table->string('occupation')
                ->nullable();

            $table->string('employer')
                ->nullable();

            $table->decimal('monthly_income', 12, 2)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */
            $table->string('photo')
                ->nullable();

            $table->string('photo_public_id')
                ->nullable();


            $table->string('id_front')
                ->nullable();

            $table->string('id_front_public_id')
                ->nullable();


            $table->string('id_back')
                ->nullable();

            $table->string('id_back_public_id')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Verification
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_verified')
                ->default(false);

            $table->timestamp('verified_at')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            $table->enum('status', [
                'active',
                'inactive',
                'blacklisted',
                'pending'
            ])
            ->default('pending');


            $table->boolean('is_active')
                ->default(true);


            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */
            $table->text('notes')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Tracking
            |--------------------------------------------------------------------------
            */
            $table->timestamps();

            $table->softDeletes();


            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */
            $table->index('tenant_number');

            $table->index('status');

            $table->index('phone');

            $table->index([
                'first_name',
                'last_name'
            ]);

            $table->index('user_id');

        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};