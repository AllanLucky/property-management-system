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
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | TENANT IDENTIFICATION
            |--------------------------------------------------------------------------
            |
            | Each tenant receives a unique system-generated tenant number.
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
            | LINKED USER ACCOUNT
            |--------------------------------------------------------------------------
            |
            | A tenant profile belongs to an existing User account.
            |
            | IMPORTANT:
            |
            | The tenant module does NOT create another user account.
            |
            | user_id points to the existing user account that already
            | represents the tenant and may have the Spatie `tenant` role.
            |
            | One user can only be linked to one tenant profile.
            |
            | nullOnDelete() ensures deleting a user does not automatically
            | delete the tenant profile.
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
            | PERSONAL INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('first_name', 100);

            $table->string('last_name', 100);

            $table->string('other_names', 150)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | CONTACT INFORMATION
            |--------------------------------------------------------------------------
            |
            | These fields can be synchronized from the linked User account
            | by the TenantService.
            |
            */

            $table->string('email', 150)
                ->nullable();

            $table->string('phone', 30)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | PERSONAL DETAILS
            |--------------------------------------------------------------------------
            */

            $table->date('date_of_birth')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | GENDER
            |--------------------------------------------------------------------------
            |
            | Stored as a string rather than an enum so the application can
            | support additional values without requiring a database migration.
            |
            */

            $table->string('gender', 30)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | NATIONALITY
            |--------------------------------------------------------------------------
            |
            | Nationality represents the tenant's citizenship or national
            | identity.
            |
            | This is intentionally separate from `country`, which represents
            | the tenant's current residential/location country.
            |
            | Examples:
            |
            | nationality = Kenyan
            | country     = Kenya
            |
            */

            $table->string('nationality', 100)
                ->nullable()
                ->index();

            /*
            |--------------------------------------------------------------------------
            | IDENTIFICATION
            |--------------------------------------------------------------------------
            |
            | Both identification fields are nullable because tenants may
            | use different identification documents.
            |
            | Application-level validation should determine whether a specific
            | tenant must provide an ID number, passport number, or both.
            |
            */

            $table->string('id_number', 100)
                ->nullable();

            $table->string('passport_number', 100)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | RESIDENTIAL / LOCATION INFORMATION
            |--------------------------------------------------------------------------
            |
            | country represents the tenant's current residential/location
            | country. It is intentionally separate from nationality.
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
            | EMPLOYMENT / FINANCIAL INFORMATION
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
            | EMERGENCY CONTACT
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
            | TENANT DOCUMENTS
            |--------------------------------------------------------------------------
            |
            | File paths or URLs are stored in the database.
            |
            | The *_public_id fields support cloud storage providers such as
            | Cloudinary or similar services.
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
            | VERIFICATION
            |--------------------------------------------------------------------------
            |
            | is_verified describes whether the tenant profile has been
            | verified.
            |
            | This is separate from the tenant's operational status.
            |
            */

            $table->boolean('is_verified')
                ->default(false)
                ->index();

            $table->timestamp('verified_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | TENANT STATUS
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
            | IMPORTANT:
            |
            | There is intentionally NO `is_active` column.
            |
            | The application can expose is_active as a computed attribute:
            |
            | status === active
            |
            */

            $table->string('status', 30)
                ->default('pending')
                ->index();

            /*
            |--------------------------------------------------------------------------
            | ADMINISTRATIVE NOTES
            |--------------------------------------------------------------------------
            */

            $table->text('notes')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | SOFT DELETES
            |--------------------------------------------------------------------------
            |
            | Tenant profiles are retained for historical and audit purposes
            | and can be restored when necessary.
            |
            */

            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | SEARCH INDEXES
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
            | COMPOSITE INDEXES
            |--------------------------------------------------------------------------
            |
            | These support common filtering, searching and reporting
            | combinations used by the TenantService.
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