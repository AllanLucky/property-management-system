<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_feature_property', function (Blueprint $table) {

            $table->id();

            /*
            |-----------------------------
            | RELATIONSHIPS
            |-----------------------------
            */
            $table->foreignId('property_id')
                ->constrained('properties')
                ->cascadeOnDelete();

            $table->foreignId('property_feature_id')
                ->constrained('property_features')
                ->cascadeOnDelete();

            /*
            |-----------------------------
            | OPTIONAL VALUE OVERRIDES
            | (useful for number/text features)
            |-----------------------------
            */
            $table->string('value')->nullable();

            $table->text('note')->nullable();

            /*
            |-----------------------------
            | META
            |-----------------------------
            */
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            $table->timestamps();

            /*
            |-----------------------------
            | UNIQUE CONSTRAINT
            | prevent duplicate feature per property
            |-----------------------------
            */
            $table->unique(['property_id', 'property_feature_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_feature_property');
    }
};