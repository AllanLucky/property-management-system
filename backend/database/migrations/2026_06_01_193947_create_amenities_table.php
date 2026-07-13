<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('amenities', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            $table->string('name');
            $table->string('slug')->unique();

            /*
            |--------------------------------------------------------------------------
            | UI / DISPLAY
            |--------------------------------------------------------------------------
            */
            $table->string('icon')->nullable();
            $table->string('color')->nullable(); // for UI badges / styling
            $table->text('description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS & CONTROL
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_active')->default(true);
            $table->unsignedInteger('sort_order')->default(0);

            /*
            |--------------------------------------------------------------------------
            | AUDIT & SOFT DELETES
            |--------------------------------------------------------------------------
            */
            $table->softDeletes();
            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index('name');
            $table->index('slug');
            $table->index('is_active');
            $table->index('sort_order');
            $table->index('deleted_at');
            $table->index('created_at');
            $table->index('updated_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('amenities');
    }
};
