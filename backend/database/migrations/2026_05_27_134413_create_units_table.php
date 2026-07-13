<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('units', function (Blueprint $table) {

            $table->id();

            /*
            |------------------------------------------
            | RELATIONSHIPS
            |------------------------------------------
            */
            $table->foreignId('property_id')
                ->nullable()
                ->constrained('properties')
                ->cascadeOnDelete();

            $table->foreignId('apartment_id')
                ->nullable()
                ->constrained('apartments')
                ->nullOnDelete();

            /*
            |------------------------------------------
            | BASIC INFO
            |------------------------------------------
            */
            $table->string('unit_number');
            $table->string('unit_name')->nullable();
            $table->string('slug')->unique();
            $table->longText('description')->nullable();

            /*
            |------------------------------------------
            | STATUS
            |------------------------------------------
            */
            $table->enum('status', [
                'vacant',
                'occupied',
                'maintenance',
                'reserved',
                'inactive',
            ])->default('vacant');

            $table->index('status');

            /*
            |------------------------------------------
            | TYPE
            |------------------------------------------
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

            $table->index('type');

            /*
            |------------------------------------------
            | FEATURES
            |------------------------------------------
            */
            $table->unsignedTinyInteger('bedrooms')->default(0);
            $table->unsignedTinyInteger('bathrooms')->default(0);
            $table->unsignedTinyInteger('toilets')->default(0);
            $table->unsignedTinyInteger('floor')->nullable();

            $table->decimal('size', 12, 2)->nullable();
            $table->string('size_unit')->default('sqm');

            /*
            |------------------------------------------
            | PRICING
            |------------------------------------------
            */
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('deposit', 15, 2)->nullable();
            $table->decimal('service_charge', 15, 2)->nullable();

            // ✅ ONLY ONE INDEX FOR PRICE (safe naming)
            $table->index('price', 'units_price_idx');

            /*
            |------------------------------------------
            | FLAGS
            |------------------------------------------
            */
            $table->boolean('has_balcony')->default(false);
            $table->boolean('has_wifi')->default(false);
            $table->boolean('has_furnished')->default(false);
            $table->boolean('has_air_conditioning')->default(false);

            /*
            |------------------------------------------
            | MEDIA
            |------------------------------------------
            */
            $table->string('thumbnail')->nullable();

            /*
            |------------------------------------------
            | AVAILABILITY
            |------------------------------------------
            */
            $table->date('available_from')->nullable();

            /*
            |------------------------------------------
            | OTHER
            |------------------------------------------
            */
            $table->longText('notes')->nullable();

            /*
            |------------------------------------------
            | SOFT DELETES + TIMESTAMPS
            |------------------------------------------
            */
            $table->softDeletes();
            $table->timestamps();

            /*
            |------------------------------------------
            | COMPOSITE INDEXES
            |------------------------------------------
            */
            $table->index(['property_id', 'apartment_id']);
            $table->index('unit_number');
            $table->index('slug');
            $table->index(['status', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('units');
    }
};