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
        Schema::create('countries', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | COUNTRY INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('name', 100);

            $table->string('slug', 120)->unique();

            // ISO 3166-1 alpha-2 country code (KE, UG, TZ).
            $table->string('code', 2)->unique();

            /*
            |--------------------------------------------------------------------------
            | CONTACT AND CURRENCY INFORMATION
            |--------------------------------------------------------------------------
            */

            // International dialing code (+254, +256, +255).
            $table->string('phone_code', 10)->nullable();

            // ISO 4217 currency code (KES, UGX, TZS).
            $table->string('currency', 3)->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_active')->default(true);

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
                'name',
                'countries_name_index'
            );

            $table->index(
                'is_active',
                'countries_is_active_index'
            );

            $table->index(
                ['is_active', 'name'],
                'countries_active_name_index'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};
