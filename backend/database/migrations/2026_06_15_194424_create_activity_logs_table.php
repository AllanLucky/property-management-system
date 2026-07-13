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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | USER
            |--------------------------------------------------------------------------
            */
            $table->foreignId('user_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete()
                ->index();

            /*
            |--------------------------------------------------------------------------
            | ACTION INFO
            |--------------------------------------------------------------------------
            */
            $table->string('action')->index();
            $table->text('description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | POLYMORPHIC SUBJECT (what triggered the action)
            |--------------------------------------------------------------------------
            */
            $table->string('subject_type')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();

            /*
            |--------------------------------------------------------------------------
            | EXTRA DATA
            |--------------------------------------------------------------------------
            */
            $table->json('meta')->nullable();

            /*
            |--------------------------------------------------------------------------
            | REQUEST INFO (AUDIT PURPOSE)
            |--------------------------------------------------------------------------
            */
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | INDEXES (IMPORTANT FOR PERFORMANCE)
            |--------------------------------------------------------------------------
            */
            $table->index(['user_id', 'action']);
            $table->index(['subject_type', 'subject_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};