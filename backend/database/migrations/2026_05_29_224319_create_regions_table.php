<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | RUN MIGRATION
    |--------------------------------------------------------------------------
    */

    public function up(): void
    {
        Schema::create('regions', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | COUNTRY RELATIONSHIP
            |--------------------------------------------------------------------------
            */

            $table->foreignId('country_id')
                ->constrained('countries')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | CORE DATA
            |--------------------------------------------------------------------------
            */

            $table->string('name', 150);

            $table->string('slug', 180);

            $table->string('code', 10);

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_active')
                ->default(true);

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | UNIQUE CONSTRAINTS
            |--------------------------------------------------------------------------
            */

            // A region slug must be unique within its country.
            $table->unique(
                ['country_id', 'slug'],
                'regions_country_slug_unique'
            );

            // A region code must be unique within its country.
            $table->unique(
                ['country_id', 'code'],
                'regions_country_code_unique'
            );

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['country_id', 'name'],
                'regions_country_name_index'
            );

            $table->index(
                ['country_id', 'is_active'],
                'regions_country_status_index'
            );

            $table->index(
                'is_active',
                'regions_is_active_index'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ROLLBACK MIGRATION
    |--------------------------------------------------------------------------
    */

    public function down(): void
    {
        Schema::dropIfExists('regions');
    }
};
