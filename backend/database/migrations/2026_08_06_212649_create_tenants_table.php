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
            | Each tenant receives a unique system-generated tenant number.
            |
            | Example:
            | TNT-A8F3K9P2
            |
            */

            $table->string('tenant_number', 50)
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | User Account Relationship
            |--------------------------------------------------------------------------
            |
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
                ->nullable()
                ->index();

            $table->string('phone', 30)
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | Personal Details
            |--------------------------------------------------------------------------
            */

            $table->date('date_of_birth')
                ->nullable();

            $table->enum('gender', [
                'male',
                'female',
                'other',
            ])
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Nationality
            |--------------------------------------------------------------------------
            |
            | Nationality represents citizenship/national identity.
            |
            | This is intentionally different from `country`, which represents
            | the tenant's residential/location country.
            |
            | Example:
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
            | Identification
            |--------------------------------------------------------------------------
            |
            | Application-level validation should determine whether the tenant
            | must provide an ID number, passport number, or both.
            |
            | Both are nullable because not every tenant will necessarily use
            | the same identification document.
            |
            */

            $table->string('id_number', 100)
                ->nullable()
                ->unique();

            $table->string('passport_number', 100)
                ->nullable()
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | Residential / Location Information
            |--------------------------------------------------------------------------
            |
            | `country` is the tenant's current residential/location country.
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
            | Employment Information
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
            | File paths are stored in the database.
            |
            | The *_public_id columns allow future integration with cloud
            | storage providers such as Cloudinary or similar services.
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
            | `is_verified` describes whether the tenant profile has been
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
            | Tenant Status
            |--------------------------------------------------------------------------
            |
            | IMPORTANT:
            |
            | `status` is the SINGLE source of truth for tenant activity.
            |
            | Supported states:
            |
            | pending
            | active
            | inactive
            | blacklisted
            |
            | There is intentionally NO `is_active` column.
            |
            | The application can expose `is_active` as a computed attribute:
            |
            | status === active
            |
            */

            $table->enum('status', [
                'pending',
                'active',
                'inactive',
                'blacklisted',
            ])
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
            | Allows a tenant profile to be restored without permanently
            | removing the record from the database.
            |
            */

            $table->softDeletes();


            /*
            |--------------------------------------------------------------------------
            | Composite Indexes
            |--------------------------------------------------------------------------
            |
            | These indexes support common filtering and reporting operations.
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
                    'region',
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
