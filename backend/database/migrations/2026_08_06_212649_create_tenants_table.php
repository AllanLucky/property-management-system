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
        Schema::create('tenants', function (Blueprint $table) {
            $table->id();

            // Tenant Identification
            $table->string('tenant_number')->unique();

            // User Relationship
            $table->foreignId('user_id')
                ->nullable()
                ->unique()
                ->constrained('users')
                ->nullOnDelete();

            // Personal Information
            $table->string('first_name');
            $table->string('last_name');
            $table->string('other_names')->nullable();
            $table->string('email')->nullable()->index();
            $table->string('phone')->unique();
            $table->date('date_of_birth')->nullable();
            $table->enum('gender', ['male','female','other'])->nullable();

            // Identification
            $table->string('id_number')->nullable()->index();
            $table->string('passport_number')->nullable()->index();

            // Emergency Contact
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relationship')->nullable();

            // Address Information
            $table->string('country')->default('Kenya');
            $table->string('county')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code')->nullable();
            $table->text('address')->nullable();

            // Employment Information
            $table->string('occupation')->nullable();
            $table->string('employer')->nullable();
            $table->decimal('monthly_income', 12, 2)->nullable();

            // Tenant Documents
            $table->string('photo')->nullable();
            $table->string('photo_public_id')->nullable();
            $table->string('id_front')->nullable();
            $table->string('id_front_public_id')->nullable();
            $table->string('id_back')->nullable();
            $table->string('id_back_public_id')->nullable();

            // Verification
            $table->boolean('is_verified')->default(false);
            $table->timestamp('verified_at')->nullable();

            // Tenant Status
            $table->enum('status', ['active','inactive','blacklisted','pending'])
                ->default('pending')
                ->index();

            // Active flag (NEW FIELD)
            $table->boolean('is_active')->default(false)->index();

            // Notes
            $table->text('notes')->nullable();

            // Timestamps & Soft Deletes
            $table->timestamps();
            $table->softDeletes();

            // Composite Indexes
            $table->index(['first_name','last_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
