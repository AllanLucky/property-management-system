
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
        Schema::create('units', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->id();


            /*
            |--------------------------------------------------------------------------
            | PROPERTY / APARTMENT RELATIONSHIPS
            |--------------------------------------------------------------------------
            */

            $table->foreignId('property_id')
                ->constrained('properties')
                ->cascadeOnDelete();

            $table->foreignId('apartment_id')
                ->nullable()
                ->constrained('apartments')
                ->nullOnDelete();


            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('unit_number');

            $table->string('unit_name')
                ->nullable();

            $table->string('slug')
                ->unique();

            $table->longText('description')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | UNIT STATUS
            |--------------------------------------------------------------------------
            |
            | vacant      - Available for occupation
            | occupied    - Currently occupied by a tenant
            | reserved    - Reserved through a booking
            | maintenance - Temporarily unavailable due to maintenance
            |
            */

            $table->enum('status', [
                'vacant',
                'occupied',
                'reserved',
                'maintenance',
            ])->default('vacant');


            /*
            |--------------------------------------------------------------------------
            | UNIT TYPE
            |--------------------------------------------------------------------------
            */

            $table->enum('type', [
                'bedsitter',
                'studio',
                'single_room',
                'double_room',
                'one_bedroom',
                'two_bedroom',
                'three_bedroom',
                'penthouse',
                'office',
                'shop',
                'warehouse',
                'villa',
                'airbnb',
            ])->nullable();


            /*
            |--------------------------------------------------------------------------
            | UNIT DETAILS
            |--------------------------------------------------------------------------
            */

            $table->unsignedTinyInteger('bedrooms')
                ->default(0);

            $table->unsignedTinyInteger('bathrooms')
                ->default(0);

            $table->unsignedTinyInteger('toilets')
                ->default(0);

            $table->unsignedSmallInteger('floor')
                ->default(1);

            $table->decimal('size', 12, 2)
                ->nullable();

            $table->string('size_unit')
                ->default('sqm');


            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */

            $table->decimal('price', 15, 2)
                ->default(0);

            $table->decimal('deposit', 15, 2)
                ->nullable();

            $table->decimal('service_charge', 15, 2)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */

            $table->boolean('has_balcony')
                ->default(false);

            $table->boolean('has_wifi')
                ->default(false);

            $table->boolean('has_furnished')
                ->default(false);

            $table->boolean('has_air_conditioning')
                ->default(false);


            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */

            $table->string('thumbnail')
                ->nullable();

            $table->string('thumbnail_public_id')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | AVAILABILITY
            |--------------------------------------------------------------------------
            */

            $table->date('available_from')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | ACTIVE STATUS
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_active')
                ->default(true);


            /*
            |--------------------------------------------------------------------------
            | NOTES
            |--------------------------------------------------------------------------
            */

            $table->longText('notes')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS / SOFT DELETES
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            $table->softDeletes();


            /*
            |--------------------------------------------------------------------------
            | SINGLE-COLUMN INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index('status', 'units_status_index');

            $table->index('type', 'units_type_index');

            $table->index('floor', 'units_floor_index');

            $table->index('price', 'units_price_index');

            $table->index('available_from', 'units_available_from_index');

            $table->index('is_active', 'units_is_active_index');

            $table->index('deleted_at', 'units_deleted_at_index');


            /*
            |--------------------------------------------------------------------------
            | PROPERTY / APARTMENT INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['property_id', 'status'],
                'units_property_status_index'
            );

            $table->index(
                ['apartment_id', 'status'],
                'units_apartment_status_index'
            );


            /*
            |--------------------------------------------------------------------------
            | UNIT SEARCH INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['status', 'type'],
                'units_status_type_index'
            );

            $table->index(
                ['is_active', 'status'],
                'units_active_status_index'
            );

            $table->index(
                ['property_id', 'is_active', 'status'],
                'units_property_availability_index'
            );

            $table->index(
                ['apartment_id', 'is_active', 'status'],
                'units_apartment_availability_index'
            );


            /*
            |--------------------------------------------------------------------------
            | UNIT NUMBER UNIQUENESS
            |--------------------------------------------------------------------------
            |
            | A unit number must be unique within an apartment.
            |
            | Note: MySQL allows multiple NULL apartment_id values in a
            | composite unique index. Standalone property-level uniqueness
            | should additionally be enforced in application validation.
            |
            */

            $table->unique(
                ['apartment_id', 'unit_number'],
                'units_apartment_unit_number_unique'
            );

        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};
