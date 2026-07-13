<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP IDS
            |--------------------------------------------------------------------------
            */
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('property_type_id')->nullable();
            $table->unsignedBigInteger('property_category_id')->nullable();

            $table->unsignedBigInteger('country_id')->nullable();
            $table->unsignedBigInteger('region_id')->nullable();
            $table->unsignedBigInteger('county_id')->nullable();
            $table->unsignedBigInteger('city_id')->nullable();
            $table->unsignedBigInteger('area_id')->nullable();

            /*
            |--------------------------------------------------------------------------
            | BASIC DETAILS
            |--------------------------------------------------------------------------
            */
            $table->string('title');
            $table->string('slug')->unique();
            $table->string('property_code')->nullable()->unique();
            $table->longText('description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | PROPERTY STATUS
            |--------------------------------------------------------------------------
            */
            $table->enum('listing_type', ['sale', 'rent', 'lease'])->default('sale');

            $table->enum('status', [
                'draft',
                'pending',
                'published',
                'sold',
                'rented',
                'inactive'
            ])->default('draft');

            /*
            |--------------------------------------------------------------------------
            | LOCATION SNAPSHOT
            |--------------------------------------------------------------------------
            */
            $table->string('country_name')->nullable();
            $table->string('region_name')->nullable();
            $table->string('county_name')->nullable();
            $table->string('city_name')->nullable();
            $table->string('area_name')->nullable();
            $table->string('street_address')->nullable();

            /*
            |--------------------------------------------------------------------------
            | GEO LOCATION
            |--------------------------------------------------------------------------
            */
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();

            /*
            |--------------------------------------------------------------------------
            | PROPERTY FEATURES
            |--------------------------------------------------------------------------
            */
            $table->unsignedInteger('bedrooms')->default(0);
            $table->unsignedInteger('bathrooms')->default(0);
            $table->unsignedInteger('toilets')->default(0);
            $table->unsignedInteger('garages')->default(0);
            $table->unsignedInteger('parking_spaces')->default(0);
            $table->unsignedInteger('floors')->nullable();

            $table->decimal('size', 12, 2)->nullable();
            $table->string('size_unit')->default('sqm');

            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('discount_price', 15, 2)->nullable();
            $table->decimal('monthly_rent', 15, 2)->nullable();
            $table->decimal('service_charge', 15, 2)->nullable();

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_published')->default(false);

            $table->boolean('has_balcony')->default(false);
            $table->boolean('has_swimming_pool')->default(false);
            $table->boolean('has_garden')->default(false);
            $table->boolean('has_wifi')->default(false);
            $table->boolean('has_security')->default(false);

            /*
            |--------------------------------------------------------------------------
            | MEDIA (FIX ADDED HERE)
            |--------------------------------------------------------------------------
            */
            $table->string('image')->nullable(); // ✅ FIX: REQUIRED for seeder
            $table->string('thumbnail')->nullable();
            $table->string('video_url')->nullable();
            $table->string('virtual_tour_url')->nullable();

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();
            $table->text('meta_keywords')->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATISTICS
            |--------------------------------------------------------------------------
            */
            $table->unsignedBigInteger('views_count')->default(0);
            $table->unsignedBigInteger('favorites_count')->default(0);

            /*
            |--------------------------------------------------------------------------
            | PUBLISHING
            |--------------------------------------------------------------------------
            */
            $table->timestamp('published_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | SOFT DELETES + TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            $table->softDeletes();
            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index('title');
            $table->index('slug');
            $table->index('property_code');
            $table->index('status');
            $table->index('listing_type');
            $table->index('price');
            $table->index('city_name');
            $table->index('county_name');
            $table->index('is_featured');
            $table->index('is_published');

            $table->index(['listing_type', 'status']);
            $table->index(['city_name', 'price']);
            $table->index(['latitude', 'longitude']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};