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
            | Unique identifier assigned to every tenant profile.
            |
            | Examples:
            | TNT-000001
            | TNT-000002
            |
            */

            $table->string('tenant_number', 50)
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | Linked User Account
            |--------------------------------------------------------------------------
            |
            | A Tenant is a profile belonging to an existing User account.
            |
            | One User can have only one Tenant profile.
            |
            | The User account is created and managed separately.
            | The Tenant model only references the existing User.
            |
            | nullOnDelete() ensures that deleting a User does not delete
            | the Tenant profile.
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

            $table->string('email', 150)
                ->nullable();

            $table->string('phone', 30)
                ->nullable();

            $table->date('date_of_birth')
                ->nullable();

            $table->string('gender', 30)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            |
            | At least one identification method can be enforced by
            | CreateTenantRequest / UpdateTenantRequest.
            |
            | These are intentionally nullable because not every tenant
            | profile must necessarily have both documents.
            |
            */

            $table->string('id_number', 100)
                ->nullable();

            $table->string('passport_number', 100)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Location Information
            |--------------------------------------------------------------------------
            */

            $table->string('country', 100)
                ->default('Kenya');

            $table->string('region', 150)
                ->nullable();

            $table->string('county', 150)
                ->nullable();

            $table->string('city', 150)
                ->nullable();

            $table->string('area', 150)
                ->nullable();

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
            | File paths / URLs are stored here.
            |
            | The *_public_id fields support cloud storage providers such
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
            | is_verified and verified_at represent tenant profile
            | verification.
            |
            | There is intentionally NO is_active column.
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
            | Status is the SINGLE source of truth for tenant activity.
            |
            | Supported statuses:
            |
            | pending
            | active
            | inactive
            | blacklisted
            |
            | Do NOT add an is_active column here.
            |
            */

            $table->string('status', 30)
                ->default('pending')
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
            | Timestamps
            |--------------------------------------------------------------------------
            */

            $table->timestamps();


            /*
            |--------------------------------------------------------------------------
            | Soft Deletes
            |--------------------------------------------------------------------------
            |
            | Tenant profiles are retained for historical/audit purposes.
            |
            */

            $table->softDeletes();


            /*
            |--------------------------------------------------------------------------
            | Search Indexes
            |--------------------------------------------------------------------------
            |
            | These support common TenantService filtering and searching.
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
            | Location Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(
                'country',
                'tenants_country_index'
            );

            $table->index(
                'region',
                'tenants_region_index'
            );

            $table->index(
                'county',
                'tenants_county_index'
            );

            $table->index(
                'city',
                'tenants_city_index'
            );

            $table->index(
                'area',
                'tenants_area_index'
            );


            /*
            |--------------------------------------------------------------------------
            | Composite Indexes
            |--------------------------------------------------------------------------
            |
            | These support common filtering combinations.
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