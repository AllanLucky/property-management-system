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
            | Tenant Identification
            |--------------------------------------------------------------------------
            |
            | Generated automatically by Tenant::generateTenantNumber().
            |
            | Examples:
            |
            | TNT-000001
            | TNT-000002
            |
            */

            $table->string('tenant_number', 50)
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | Existing User Account
            |--------------------------------------------------------------------------
            |
            | A tenant profile belongs to an existing User account.
            |
            | The Tenant module does NOT create a User account.
            |
            | One User can only have one Tenant profile.
            |
            */

            $table->foreignId('user_id')
                ->nullable()
                ->unique()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            */

            $table->string('first_name', 100);

            $table->string('last_name', 100);

            $table->string('other_names', 150)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Contact Information
            |--------------------------------------------------------------------------
            |
            | These fields may be synchronized from the linked User account
            | by TenantService.
            |
            */

            $table->string('email', 150)
                ->nullable();

            $table->string('phone', 30)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Personal Details
            |--------------------------------------------------------------------------
            */

            $table->date('date_of_birth')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Nationality
            |--------------------------------------------------------------------------
            |
            | Represents citizenship/national identity.
            |
            | This is intentionally different from `country`, which represents
            | the tenant's residential/location country.
            |
            */

            $table->string('nationality', 100)
                ->nullable()
                ->index();


            /*
            |--------------------------------------------------------------------------
            | Gender
            |--------------------------------------------------------------------------
            |
            | Stored as a string rather than an enum so additional values can
            | be supported without requiring a database migration.
            |
            */

            $table->string('gender', 30)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            */

            $table->string('id_number', 100)
                ->nullable();

            $table->string('passport_number', 100)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Residential / Location Information
            |--------------------------------------------------------------------------
            |
            | `country` represents the tenant's residential/location country.
            |
            | `nationality` represents citizenship/nationality.
            |
            */

            $table->string('country', 100)
                ->default('Kenya')
                ->index();

            $table->string('region', 150)
                ->nullable()
                ->index();

            $table->string('county', 150)
                ->nullable()
                ->index();

            $table->string('city', 150)
                ->nullable()
                ->index();

            $table->string('area', 150)
                ->nullable()
                ->index();

            $table->string('postal_code', 30)
                ->nullable();

            $table->text('address')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Employment / Financial Information
            |--------------------------------------------------------------------------
            */

            $table->string('occupation', 150)
                ->nullable();

            $table->string('employer', 200)
                ->nullable();

            $table->decimal('monthly_income', 15, 2)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Emergency Contact
            |--------------------------------------------------------------------------
            */

            $table->string('emergency_contact_name', 150)
                ->nullable();

            $table->string('emergency_contact_phone', 30)
                ->nullable();

            $table->string('emergency_contact_relationship', 100)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Tenant Documents
            |--------------------------------------------------------------------------
            |
            | File paths/URLs are stored here.
            |
            | The *_public_id columns support cloud storage providers such
            | as Cloudinary or similar services.
            |
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
            |
            | Verification is independent from the tenant's operational status.
            |
            | `is_verified` is stored.
            | `verified_at` records when verification occurred.
            |
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
            | This is the persisted source of truth for tenant activity.
            |
            | Supported values are defined by Tenant::STATUSES:
            |
            | pending
            | active
            | inactive
            | blacklisted
            |
            | IMPORTANT:
            |
            | There is intentionally NO `is_active` database column.
            |
            | The model exposes `is_active` as a computed attribute:
            |
            | status === active
            |
            */

            $table->string('status', 30)
                ->default('pending')
                ->index();


            /*
            |--------------------------------------------------------------------------
            | Administrative Notes
            |--------------------------------------------------------------------------
            */

            $table->text('notes')
                ->nullable();


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
            |
            | Required by:
            |
            | use SoftDeletes;
            |
            */

            $table->softDeletes();


            /*
            |--------------------------------------------------------------------------
            | Search Indexes
            |--------------------------------------------------------------------------
            |
            | Supporting common tenant search operations.
            |
            */

            $table->index(
                'first_name',
                'tenants_first_name_index'
            );

            $table->index(
                'last_name',
                'tenants_last_name_index'
            );

            $table->index(
                'email',
                'tenants_email_index'
            );

            $table->index(
                'phone',
                'tenants_phone_index'
            );

            $table->index(
                'id_number',
                'tenants_id_number_index'
            );

            $table->index(
                'passport_number',
                'tenants_passport_number_index'
            );


            /*
            |--------------------------------------------------------------------------
            | Composite Indexes
            |--------------------------------------------------------------------------
            |
            | Supporting status, verification, location and user filtering.
            |
            */

            $table->index(
                [
                    'status',
                    'is_verified',
                ],
                'tenants_status_verification_index'
            );

            $table->index(
                [
                    'county',
                    'city',
                    'area',
                ],
                'tenants_location_index'
            );

            $table->index(
                [
                    'user_id',
                    'status',
                ],
                'tenants_user_status_index'
            );
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