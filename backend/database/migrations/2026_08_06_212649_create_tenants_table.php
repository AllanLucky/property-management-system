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
<<<<<<< HEAD
            | Each tenant receives a unique system-generated tenant number.
            |
            | Example:
            | TNT-A8F3K9P2
=======
            | Unique identifier assigned to every tenant profile.
            |
            | Examples:
            |
            | TNT-000001
            | TNT-000002
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
            |
            */

            $table->string('tenant_number', 50)
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | Linked User Account
            |--------------------------------------------------------------------------
            |
<<<<<<< HEAD
            | A tenant profile belongs to an existing User account.
            |
            | IMPORTANT:
            |
            | The tenant module does NOT create another user account.
            | `user_id` points to the existing user account that already has
            | the `tenant` Spatie role.
            |
            | One user can only be linked to one tenant profile.
            |
            | nullOnDelete() ensures that deleting a user does not automatically
            | delete the tenant profile.
=======
            | A Tenant is a profile belonging to an existing User account.
            |
            | One User can have only one Tenant profile.
            |
            | The User account is created and managed separately.
            | The Tenant profile only references the existing User.
            |
            | nullOnDelete() ensures that deleting a User does not delete
            | the Tenant profile.
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
            | These fields are synchronized from the linked User account by the
            | TenantService.
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

<<<<<<< HEAD
            $table->enum('gender', [
                'male',
                'female',
                'other',
            ])
                ->nullable();

=======
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c

            /*
            |--------------------------------------------------------------------------
            | Nationality
            |--------------------------------------------------------------------------
            |
<<<<<<< HEAD
            | Nationality represents citizenship/national identity.
            |
            | This is intentionally different from `country`, which represents
            | the tenant's residential/location country.
=======
            | Nationality represents the tenant's citizenship or national
            | identity.
            |
            | This is intentionally separate from the `country` field below,
            | which represents the tenant's residential/location country.
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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

<<<<<<< HEAD
=======

            /*
            |--------------------------------------------------------------------------
            | Gender
            |--------------------------------------------------------------------------
            |
            | Stored as a string to allow the application to support additional
            | gender values without requiring a database migration.
            |
            */

            $table->string('gender', 30)
                ->nullable();

>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c

            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            |
<<<<<<< HEAD
            | Application-level validation should determine whether the tenant
            | must provide an ID number, passport number, or both.
            |
            | Both are nullable because not every tenant will necessarily use
            | the same identification document.
=======
            | At least one identification method can be enforced by
            | CreateTenantRequest / UpdateTenantRequest.
            |
            | These fields are nullable because a tenant does not necessarily
            | need to have both identification documents.
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
            |
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
<<<<<<< HEAD
            | `country` is the tenant's current residential/location country.
=======
            | `country` represents the tenant's residential/location country.
            |
            | It is intentionally separate from `nationality`.
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
<<<<<<< HEAD
            | File paths are stored in the database.
            |
            | The *_public_id columns allow future integration with cloud
            | storage providers such as Cloudinary or similar services.
=======
            | File paths / URLs are stored here.
            |
            | The *_public_id fields support cloud storage providers such
            | as Cloudinary or similar services.
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
<<<<<<< HEAD
            | `is_verified` describes whether the tenant profile has been
            | verified.
            |
            | This is separate from the tenant's operational status.
=======
            | `is_verified` and `verified_at` represent tenant profile
            | verification.
            |
            | There is intentionally NO `is_active` column.
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
<<<<<<< HEAD
            | `status` is the SINGLE source of truth for tenant activity.
            |
            | Supported states:
=======
            | Supported statuses:
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
            |
            | pending
            | active
            | inactive
            | blacklisted
            |
<<<<<<< HEAD
            | There is intentionally NO `is_active` column.
            |
            | The application can expose `is_active` as a computed attribute:
            |
            | status === active
=======
            | Do NOT add an `is_active` column here.
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
            |
            */

            $table->string('status', 30)
                ->default('pending')
                ->index();


            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            |
            | Internal administrative notes related to the tenant.
            |
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
<<<<<<< HEAD
            | Allows a tenant profile to be restored without permanently
            | removing the record from the database.
=======
            | Tenant profiles are retained for historical and audit purposes.
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
            | Composite Indexes
            |--------------------------------------------------------------------------
            |
<<<<<<< HEAD
            | These indexes support common filtering and reporting operations.
=======
            | These support common filtering combinations used by the
            | TenantService.
>>>>>>> 8b7665ecc4b1ce4936247280369b61746ee3ee1c
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
