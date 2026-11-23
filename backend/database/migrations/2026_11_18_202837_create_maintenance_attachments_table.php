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
        Schema::create('maintenance_attachments', function (Blueprint $table) {
            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */

            $table->foreignId('maintenance_request_id')
                ->constrained('maintenance_requests')
                ->cascadeOnDelete();

            $table->foreignId('uploaded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | File Information
            |--------------------------------------------------------------------------
            */

            $table->string('file_name');
            $table->string('original_name');

            $table->string('file_path');
            $table->string('disk')->default('private');

            $table->string('file_type')->default('document');
            $table->string('mime_type')->nullable();
            $table->string('file_extension', 20)->nullable();

            $table->unsignedBigInteger('file_size')->default(0);

            /*
            |--------------------------------------------------------------------------
            | Attachment Classification
            |--------------------------------------------------------------------------
            */

            $table->string('attachment_type')
                ->default('other')
                ->comment('image, document, invoice, receipt, before_photo, after_photo, completion_proof, other');

            $table->text('description')->nullable();

            /*
            |--------------------------------------------------------------------------
            | Access Control
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_public')->default(false);

            /*
            |--------------------------------------------------------------------------
            | Indexes
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['maintenance_request_id', 'attachment_type'],
                'maintenance_attachments_request_type_index'
            );

            $table->index(
                ['uploaded_by', 'created_at'],
                'maintenance_attachments_uploader_created_index'
            );

            $table->index(
                ['file_type', 'attachment_type'],
                'maintenance_attachments_file_type_index'
            );

            $table->index('is_public');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('maintenance_attachments');
    }
};
