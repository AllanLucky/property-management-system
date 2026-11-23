<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceAttachment extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Attachment Types
    |--------------------------------------------------------------------------
    */

    public const TYPE_IMAGE = 'image';
    public const TYPE_DOCUMENT = 'document';
    public const TYPE_INVOICE = 'invoice';
    public const TYPE_RECEIPT = 'receipt';
    public const TYPE_BEFORE_PHOTO = 'before_photo';
    public const TYPE_AFTER_PHOTO = 'after_photo';
    public const TYPE_COMPLETION_PROOF = 'completion_proof';
    public const TYPE_OTHER = 'other';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable Attributes
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'maintenance_request_id',
        'uploaded_by',
        'file_name',
        'original_name',
        'file_path',
        'disk',
        'file_type',
        'mime_type',
        'file_extension',
        'file_size',
        'attachment_type',
        'description',
        'is_public',
    ];

    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
            'is_public' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Maintenance request associated with this attachment.
     */
    public function maintenanceRequest(): BelongsTo
    {
        return $this->belongsTo(
            MaintenanceRequest::class,
            'maintenance_request_id'
        );
    }

    /**
     * User who uploaded the attachment.
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeForRequest(
        $query,
        int $requestId
    ) {
        return $query->where('maintenance_request_id', $requestId);
    }

    public function scopeForUser(
        $query,
        int $userId
    ) {
        return $query->where('uploaded_by', $userId);
    }

    public function scopeImages($query)
    {
        return $query->where('file_type', 'image');
    }

    public function scopeDocuments($query)
    {
        return $query->where('file_type', 'document');
    }

    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    public function scopePrivate($query)
    {
        return $query->where('is_public', false);
    }

    public function scopeOfType($query, string $type)
    {
        return $query->where('attachment_type', $type);
    }

    /*
    |--------------------------------------------------------------------------
    | Attachment Helpers
    |--------------------------------------------------------------------------
    */

    public function isImage(): bool
    {
        return $this->file_type === 'image';
    }

    public function isDocument(): bool
    {
        return $this->file_type === 'document';
    }

    public function isPublic(): bool
    {
        return (bool) $this->is_public;
    }

    public function isPrivate(): bool
    {
        return ! $this->is_public;
    }

    /**
     * Get a human-readable file size.
     */
    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = (int) $this->file_size;

        if ($bytes >= 1073741824) {
            return number_format($bytes / 1073741824, 2) . ' GB';
        }

        if ($bytes >= 1048576) {
            return number_format($bytes / 1048576, 2) . ' MB';
        }

        if ($bytes >= 1024) {
            return number_format($bytes / 1024, 2) . ' KB';
        }

        return $bytes . ' Bytes';
    }

    /**
     * Available attachment types.
     */
    public static function attachmentTypes(): array
    {
        return [
            self::TYPE_IMAGE,
            self::TYPE_DOCUMENT,
            self::TYPE_INVOICE,
            self::TYPE_RECEIPT,
            self::TYPE_BEFORE_PHOTO,
            self::TYPE_AFTER_PHOTO,
            self::TYPE_COMPLETION_PROOF,
            self::TYPE_OTHER,
        ];
    }
}
