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
            | Personal Information
            |--------------------------------------------------------------------------
            */
            $table->string('tenant_number')->unique();

            $table->string('first_name');
            $table->string('last_name');
            $table->string('other_names')->nullable();

            $table->string('email')->nullable()->unique();
            $table->string('phone')->unique();

            $table->date('date_of_birth')->nullable();

            $table->enum('gender', [
                'male',
                'female',
                'other'
            ])->nullable();

            /*
            |--------------------------------------------------------------------------
            | National Identification
            |--------------------------------------------------------------------------
            */
            $table->string('id_number')->nullable()->unique();
            $table->string('passport_number')->nullable()->unique();

            /*
            |--------------------------------------------------------------------------
            | Emergency Contact
            |--------------------------------------------------------------------------
            */
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relationship')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Address
            |--------------------------------------------------------------------------
            */
            $table->string('country')->default('Kenya');
            $table->string('county')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code')->nullable();

            $table->text('address')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Employment
            |--------------------------------------------------------------------------
            */
            $table->string('occupation')->nullable();
            $table->string('employer')->nullable();
            $table->decimal('monthly_income', 12, 2)->nullable();

            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */
            $table->string('photo')->nullable();
            $table->string('photo_public_id')->nullable();

            $table->string('id_front')->nullable();
            $table->string('id_front_public_id')->nullable();

            $table->string('id_back')->nullable();
            $table->string('id_back_public_id')->nullable();

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
            ])->default('active');

            $table->boolean('is_active')->default(true);

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */
            $table->text('notes')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('status');
            $table->index('phone');
            $table->index('email');
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