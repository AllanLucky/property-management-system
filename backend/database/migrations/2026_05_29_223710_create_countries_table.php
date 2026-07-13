<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('countries', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('code', 10)->unique(); // KE, US, UG

            /*
            |--------------------------------------------------------------------------
            | EXTRA FIELDS USED IN MODEL
            |--------------------------------------------------------------------------
            */
            $table->string('phone_code')->nullable();   // +254, +1 etc
            $table->string('currency')->nullable();     // KES, USD etc

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_active')->default(true);

            /*
            |--------------------------------------------------------------------------
            | SOFT DELETES (REQUIRED by your model)
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
            $table->index('name');
            $table->index('code');
            $table->index('is_active');
            $table->index('slug');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('countries');
    }
};