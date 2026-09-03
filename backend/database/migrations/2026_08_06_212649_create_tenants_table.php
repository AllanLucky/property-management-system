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
            | Unique identifier assigned to every tenant.
            |
            */

            $table->string('tenant_number', 50)
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | User Account Relationship
            |--------------------------------------------------------------------------
            |
            | The User account is the authentication/account source.
            |
            | One user can belong to only one tenant.
            |
            | The relationship uses nullOnDelete() so deleting a user does not
            | automatically delete the tenant profile.
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
                ->nullable()
                ->index();

            $table->string('phone', 30)
                ->unique();

            $table->date('date_of_birth')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Nationality
            |--------------------------------------------------------------------------
            |
            | Nationality represents the tenant's citizenship/national identity.
            |
            | This is intentionally separate from the `country` field below,
            | which represents the tenant's physical/residential location.
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

            $table->enum('gender', [
                'male',
                'female',
                'other',
            ])->nullable();


            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            |
            | At least one of id_number or passport_number is expected at the
            | application validation level.
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
            | Location Information
            |--------------------------------------------------------------------------
            |
            | `country` represents the tenant's residential/location country.
            | It is intentionally separate from `nationality`.
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
            | File paths are stored here.
            |
            | The *_public_id fields are retained in case cloud storage is used
            | later.
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
            | is_verified + verified_at represent tenant profile verification.
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
            | IMPORTANT:
            |
            | status is the SINGLE source of truth for tenant activity.
            |
            | Supported values:
            |
            | pending
            | active
            | inactive
            | blacklisted
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
            */

            $table->softDeletes();


            /*
            |--------------------------------------------------------------------------
            | Composite Indexes
            |--------------------------------------------------------------------------
            |
            | These support common TenantService filtering operations.
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