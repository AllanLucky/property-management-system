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
        Schema::create('plots', function (Blueprint $table) {
            /*
            |--------------------------------------------------------------------------
            | Primary Key
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Property Relationship
            |--------------------------------------------------------------------------
            |
            | A plot may optionally belong to an existing property/project.
            |
            */

            $table->foreignId('property_id')
                ->nullable()
                ->constrained('properties')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Plot Identification
            |--------------------------------------------------------------------------
            */

            $table->string('code', 50)
                ->unique();

            $table->string('title', 255);

            $table->string('title_number', 100)
                ->nullable()
                ->index();

            $table->string('plot_number', 100)
                ->nullable()
                ->index();

            /*
            |--------------------------------------------------------------------------
            | Plot Size
            |--------------------------------------------------------------------------
            */

            $table->decimal('size', 12, 2)
                ->nullable();

            $table->string('size_unit', 20)
                ->default('sqm');

            /*
            |--------------------------------------------------------------------------
            | Description
            |--------------------------------------------------------------------------
            */

            $table->text('description')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            */

            $table->foreignId('country_id')
                ->nullable()
                ->constrained('countries')
                ->nullOnDelete();

            $table->foreignId('region_id')
                ->nullable()
                ->constrained('regions')
                ->nullOnDelete();

            $table->foreignId('county_id')
                ->nullable()
                ->constrained('counties')
                ->nullOnDelete();

            $table->foreignId('city_id')
                ->nullable()
                ->constrained('cities')
                ->nullOnDelete();

            $table->foreignId('area_id')
                ->nullable()
                ->constrained('areas')
                ->nullOnDelete();

            $table->string('address', 500)
                ->nullable();

            $table->decimal('latitude', 10, 8)
                ->nullable();

            $table->decimal('longitude', 11, 8)
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | Pricing
            |--------------------------------------------------------------------------
            */

            $table->decimal('asking_price', 15, 2)
                ->default(0);

            $table->string('currency', 3)
                ->default('KES');

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            |
            | available  = available for sale
            | reserved   = temporarily reserved
            | sold       = sale completed
            | withdrawn  = removed from sale
            |
            */

            $table->enum('status', [
                'available',
                'reserved',
                'sold',
                'withdrawn',
            ])->default('available')->index();

            /*
            |--------------------------------------------------------------------------
            | Active Flag
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_active')
                ->default(true)
                ->index();

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
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index([
                'property_id',
                'status',
            ]);

            $table->index([
                'county_id',
                'city_id',
                'area_id',
            ]);

            $table->index([
                'status',
                'is_active',
            ]);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plots');
    }
};
