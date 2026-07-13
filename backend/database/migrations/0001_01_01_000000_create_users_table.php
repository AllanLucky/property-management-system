<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            $table->string('first_name');
            $table->string('last_name');

            $table->string('slug')->unique()->nullable();

            $table->string('email')->unique();
            $table->string('phone')->unique()->nullable();

            /*
            |--------------------------------------------------------------------------
            | AUTH
            |--------------------------------------------------------------------------
            */
            $table->string('password');

            /*
            |--------------------------------------------------------------------------
            | TOKENS
            |--------------------------------------------------------------------------
            */
            $table->string('refresh_token', 255)->nullable()->index();
            $table->timestamp('refresh_token_expires_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | EMAIL VERIFICATION
            |--------------------------------------------------------------------------
            */
            $table->timestamp('email_verified_at')->nullable();
            $table->boolean('is_verified')->default(false);

            /*
            |--------------------------------------------------------------------------
            | OTP
            |--------------------------------------------------------------------------
            */
            $table->string('otp', 6)->nullable();
            $table->timestamp('otp_expires_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | PROFILE
            |--------------------------------------------------------------------------
            */
            $table->string('image')->nullable();
            $table->string('image_public_id')->nullable();

            $table->enum('gender', ['male', 'female', 'other'])->nullable();

            $table->string('nationality')->nullable();
            $table->text('address')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->longText('bio')->nullable();

            /*
            |--------------------------------------------------------------------------
            | ACCOUNT LIFECYCLE (IMPORTANT FIX)
            |--------------------------------------------------------------------------
            */

            // Controls login access
            $table->enum('account_status', [
                'active',
                'inactive',
                'suspended',
                'banned',
            ])->default('inactive'); // 👈 FIXED (important for frontend signup flow)

            // Controls approval workflow
            $table->enum('approval_status', [
                'pending',
                'approved',
                'rejected',
            ])->default('pending');

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */
            $table->boolean('is_banner')->default(false);

            /*
            |--------------------------------------------------------------------------
            | TRACKING
            |--------------------------------------------------------------------------
            */
            $table->timestamp('last_login_at')->nullable();

            /*
            |--------------------------------------------------------------------------
            | SYSTEM
            |--------------------------------------------------------------------------
            */
            $table->rememberToken();
            $table->timestamps();
            $table->softDeletes();

            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */
            $table->index('slug');
            $table->index('email');
            $table->index('phone');

            $table->index('account_status');
            $table->index('approval_status');
            $table->index('is_verified');

            $table->index(['account_status', 'approval_status']);
        });

        /*
        |--------------------------------------------------------------------------
        | PASSWORD RESET TOKENS
        |--------------------------------------------------------------------------
        */
        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();

            $table->index('email');
        });

        /*
        |--------------------------------------------------------------------------
        | SESSIONS
        |--------------------------------------------------------------------------
        */
        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');

            $table->integer('last_activity')->index();
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');
    }
};