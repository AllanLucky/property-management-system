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

            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Linked User Account
            |--------------------------------------------------------------------------
            |
            | A tenant is a profile belonging to an existing User account.
            |
            | user_id is:
            | - nullable at database level for safe migration flexibility
            | - unique because one User can only have one Tenant profile
            | - nullOnDelete so deleting a user does not break the tenant record
            |
            */

            $table->foreignId('user_id')
                ->nullable()
                ->unique()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Tenant Identification
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
                ->nullable();

            $table->date('date_of_birth')
                ->nullable();

            $table->string('gender')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Identification Documents
            |--------------------------------------------------------------------------
            */

            $table->string('id_number')
                ->nullable();

            $table->string('passport_number')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            */

            $table->string('country')
                ->nullable();

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
            | Employment / Financial Information
            |--------------------------------------------------------------------------
            */

            $table->string('occupation')
                ->nullable();

            $table->string('employer')
                ->nullable();

            $table->decimal('monthly_income', 15, 2)
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
            | Tenant Documents
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
                ->default(false)
                ->index();

            $table->timestamp('verified_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Tenant Status
            |--------------------------------------------------------------------------
            |
            | Supported statuses:
            | - active
            | - inactive
            | - pending
            | - blacklisted
            |
            */

            $table->string('status')
                ->default('pending')
                ->index();

            $table->boolean('is_active')
                ->default(true)
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

            $table->text('notes')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Timestamps / Soft Deletes
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | Additional Indexes
            |--------------------------------------------------------------------------
            */

            $table->index('first_name');
            $table->index('last_name');
            $table->index('email');
            $table->index('phone');
            $table->index('id_number');
            $table->index('passport_number');
            $table->index('county');
            $table->index('city');

            /*
            |--------------------------------------------------------------------------
            | Composite Indexes
            |--------------------------------------------------------------------------
            */

            $table->index([
                'status',
                'is_active',
            ]);

            $table->index([
                'is_verified',
                'is_active',
            ]);
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