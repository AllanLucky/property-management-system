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
        Schema::create('property_features', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | CORE FEATURE INFORMATION
            |--------------------------------------------------------------------------
            */
            $table->string('name');
            $table->string('slug')->unique();

            // UI representation
            $table->string('icon')->nullable();
            $table->text('description')->nullable();


            /*
            |--------------------------------------------------------------------------
            | FEATURE VALUE TYPE
            |--------------------------------------------------------------------------
            |
            | Defines how the value will be stored in the
            | property_feature_property table.
            |
            | Examples:
            |
            | boolean     -> Swimming Pool (Yes/No)
            | number      -> Bedrooms (3)
            | text        -> Flooring ("Hardwood")
            | select      -> Property Condition (New/Old)
            | measurement -> Floor Area (120 sqm)
            |
            */
            $table->enum('type', [
                'boolean',
                'number',
                'text',
                'select',
                'measurement',
            ])->default('boolean');


            /*
            |--------------------------------------------------------------------------
            | DISPLAY SETTINGS
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_active')
                ->default(true);

            $table->boolean('is_highlighted')
                ->default(false);


            /*
            |--------------------------------------------------------------------------
            | SORT ORDER
            |--------------------------------------------------------------------------
            */
            $table->unsignedInteger('sort_order')
                ->default(0);


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS & SOFT DELETES
            |--------------------------------------------------------------------------
            */
            $table->timestamps();
            $table->softDeletes();


            /*
            |--------------------------------------------------------------------------
            | DATABASE INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index('slug');
            $table->index('type');
            $table->index('is_active');
            $table->index('is_highlighted');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('property_features');
    }
};