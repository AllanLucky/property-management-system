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

            $table->id();


            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
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
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'vacant',
                'occupied',
                'reserved',
                'maintenance',
            ])
            ->default('vacant');



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
            ])
            ->nullable();



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


            $table->unsignedSmallInteger('floor')->default(1);
   


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
            | FLAGS
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
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            $table->softDeletes();



            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index('status');

            $table->index('type');

            $table->index('floor');

            $table->index('price');

            $table->index('available_from');

            $table->index('is_active');


            $table->index([
                'property_id',
                'status'
            ]);


            $table->index([
                'apartment_id',
                'status'
            ]);


            $table->index([
                'status',
                'type'
            ]);


            /*
            |--------------------------------------------------------------------------
            | UNIT NUMBER UNIQUE PER APARTMENT
            |--------------------------------------------------------------------------
            */

            $table->unique(
                [
                    'apartment_id',
                    'unit_number'
                ],
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