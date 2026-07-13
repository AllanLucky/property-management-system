<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_requests', function (Blueprint $table) {
            $table->id();

            /*
            |------------------------------------------------------------------
            | RELATIONSHIPS
            |------------------------------------------------------------------
            */
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('reviewed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |------------------------------------------------------------------
            | CORE DATA
            |------------------------------------------------------------------
            */
            $table->string('requested_role');

            $table->string('status')
                ->default('pending')
                ->index();

            $table->timestamp('reviewed_at')->nullable();

            $table->text('reason')->nullable();
            $table->text('admin_notes')->nullable();

            /*
            |------------------------------------------------------------------
            | 🔥 TIMELINE (IMPROVED STRUCTURE)
            |------------------------------------------------------------------
            | JSONB-style events array
            | Each event:
            | {
            |   id: uuid,
            |   title: string,
            |   type: created|system|approved|rejected|note,
            |   user_id: int|null,
            |   created_at: timestamp
            | }
            */
            $table->json('timeline')->nullable();

            $table->timestamps();

            /*
            |------------------------------------------------------------------
            | INDEXES (OPTIMIZED)
            |------------------------------------------------------------------
            */
            $table->index(['user_id', 'status']);
            $table->index('requested_role');

            // Optional but useful for admin filtering
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_requests');
    }
};