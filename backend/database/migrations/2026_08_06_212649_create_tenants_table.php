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
            */

            $table->string('tenant_number', 50)
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | User Relationship
            |--------------------------------------------------------------------------
            |
            | Each tenant can optionally be linked to one user account.
            |
            | user_id is nullable to support:
            |
            | - Imported tenants
            | - Tenants created before a user account
            | - Tenants without login accounts
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

            $table->enum('gender', [
                'male',
                'female',
                'other',
            ])->nullable();


            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
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
            | Country
            |   └── Region
            |       └── County
            |           └── City
            |               └── Area
            |                   └── Postal Code
            |                       └── Address
            |
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
            |
            | - pending
            | - active
            | - inactive
            | - blacklisted
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
            | Active Flag
            |--------------------------------------------------------------------------
            |
            | This field provides a simple boolean representation of whether
            | the tenant account is currently active.
            |
            | Recommended synchronization:
            |
            | pending     => false
            | active      => true
            | inactive    => false
            | blacklisted => false
            |
            | The Tenant model/service should keep this synchronized.
            |
            */

            $table->boolean('is_active')
                ->default(false)
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
            | Search Indexes
            |--------------------------------------------------------------------------
            */

            $table->index('first_name');

            $table->index('last_name');

            $table->index('country');

            $table->index('region');

            $table->index('county');

            $table->index('city');

            $table->index('area');


            /*
            |--------------------------------------------------------------------------
            | Composite Status / Active Index
            |--------------------------------------------------------------------------
            */

            $table->index(
                [
                    'status',
                    'is_active',
                ],
                'tenants_status_active_index'
            );


            /*
            |--------------------------------------------------------------------------
            | Composite Verification / Active Index
            |--------------------------------------------------------------------------
            */

            $table->index(
                [
                    'is_verified',
                    'is_active',
                ],
                'tenants_verification_active_index'
            );


            /*
            |--------------------------------------------------------------------------
            | Composite Location Index
            |--------------------------------------------------------------------------
            */

            $table->index(
                [
                    'region',
                    'county',
                    'city',
                    'area',
                ],
                'tenants_location_index'
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