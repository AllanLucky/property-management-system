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
            | User / Tenant Relationship
            |--------------------------------------------------------------------------
            |
            | A tenant may optionally be connected to a user account.
            |
            | This allows:
            |
            | - Tenants without user accounts
            | - Creating a tenant before assigning a user
            | - Removing a user without deleting the tenant
            |
            */

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->cascadeOnUpdate()
                ->nullOnDelete();


            /*
            |--------------------------------------------------------------------------
            | Tenant Identification
            |--------------------------------------------------------------------------
            */

            $table->string('tenant_number', 50)
                ->unique();


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
                ->unique();

            $table->date('date_of_birth')
                ->nullable();

            $table->string('gender', 30)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | Identification Documents
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
            |     └── Region
            |           └── County
            |                 └── City
            |                       └── Area
            |                             └── Postal Code
            |                                   └── Address
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
            | `status` describes the tenant's business/lifecycle state.
            |
            | Supported values:
            |
            | - pending
            | - active
            | - inactive
            | - blacklisted
            |
            | Example:
            |
            |     status = active
            |     status = inactive
            |
            */

            $table->string('status', 30)
                ->default('pending')
                ->index();


            /*
            |--------------------------------------------------------------------------
            | Tenant Active State
            |--------------------------------------------------------------------------
            |
            | `is_active` provides a boolean representation of whether the
            | tenant record is currently active.
            |
            | Expected synchronization:
            |
            |     active      => true
            |     inactive    => false
            |     pending     => false
            |     blacklisted => false
            |
            | The Tenant model/service layer should keep this value synchronized
            | with the tenant status.
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
            | Search / Filtering Indexes
            |--------------------------------------------------------------------------
            |
            | These indexes support tenant searching, filtering and reporting.
            |
            */

            $table->index('first_name');

            $table->index('last_name');

            $table->index('email');

            $table->index('country');

            $table->index('region');

            $table->index('county');

            $table->index('city');

            $table->index('area');


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


            /*
            |--------------------------------------------------------------------------
            | Status + Active State Index
            |--------------------------------------------------------------------------
            |
            | Useful for queries such as:
            |
            | Tenant::where('status', 'active')
            |     ->where('is_active', true)
            |     ->get();
            |
            */

            $table->index(
                [
                    'status',
                    'is_active',
                ],
                'tenants_status_active_index'
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

