<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | RUN MIGRATIONS
    |--------------------------------------------------------------------------
    */

    public function up(): void
    {
        Schema::create('counties', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */

            $table->foreignId('country_id')
                ->constrained('countries')
                ->restrictOnDelete();

            $table->foreignId('region_id')
                ->constrained('regions')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | CORE DATA
            |--------------------------------------------------------------------------
            */

            $table->string('name', 150);

            $table->string('slug', 180)->unique();

            $table->string('code', 20)->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_active')
                ->default(true);

            /*
            |--------------------------------------------------------------------------
            | SOFT DELETES
            |--------------------------------------------------------------------------
            */

            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['country_id', 'region_id'],
                'counties_country_region_index'
            );

            $table->index(
                ['country_id', 'name'],
                'counties_country_name_index'
            );

            $table->index(
                ['region_id', 'name'],
                'counties_region_name_index'
            );

            $table->index(
                'is_active',
                'counties_is_active_index'
            );

            $table->index(
                'deleted_at',
                'counties_deleted_at_index'
            );

        });
    }

    /*
    |--------------------------------------------------------------------------
    | ROLLBACK MIGRATIONS
    |--------------------------------------------------------------------------
    */

    public function down(): void
    {
        Schema::dropIfExists('counties');
    }
};
