<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceUpdate extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Update Types
    |--------------------------------------------------------------------------
    */

    public const TYPE_NOTE = 'note';
    public const TYPE_PROGRESS = 'progress';
    public const TYPE_STATUS_CHANGE = 'status_change';
    public const TYPE_ASSIGNMENT = 'assignment';
    public const TYPE_INSPECTION = 'inspection';
    public const TYPE_COMPLETION = 'completion';
    public const TYPE_OTHER = 'other';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable Attributes
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'maintenance_request_id',
        'maintenance_assignment_id',
        'user_id',
        'type',
        'title',
        'description',
        'previous_status',
        'new_status',
        'progress_percentage',
        'is_internal',
        'is_visible_to_tenant',
        'metadata',
    ];

    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'progress_percentage' => 'integer',
            'is_internal' => 'boolean',
            'is_visible_to_tenant' => 'boolean',
            'metadata' => 'array',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Maintenance request associated with this update.
     */
    public function maintenanceRequest(): BelongsTo
    {
        return $this->belongsTo(
            MaintenanceRequest::class,
            'maintenance_request_id'
        );
    }

    /**
     * Maintenance assignment associated with this update.
     */
    public function maintenanceAssignment(): BelongsTo
    {
        return $this->belongsTo(
            MaintenanceAssignment::class,
            'maintenance_assignment_id'
        );
    }

    /**
     * User who created this update.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeForRequest(
        Builder $query,
        int $maintenanceRequestId
    ): Builder {
        return $query->where(
            'maintenance_request_id',
            $maintenanceRequestId
        );
    }

    public function scopeForAssignment(
        Builder $query,
        int $assignmentId
    ): Builder {
        return $query->where(
            'maintenance_assignment_id',
            $assignmentId
        );
    }

    public function scopeOfType(
        Builder $query,
        string $type
    ): Builder {
        return $query->where('type', $type);
    }

    public function scopeInternal(Builder $query): Builder
    {
        return $query->where('is_internal', true);
    }

    public function scopeTenantVisible(Builder $query): Builder
    {
        return $query
            ->where('is_visible_to_tenant', true)
            ->where('is_internal', false);
    }

    public function scopeProgress(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_PROGRESS);
    }

    public function scopeStatusChanges(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_STATUS_CHANGE);
    }

    public function scopeLatestFirst(Builder $query): Builder
    {
        return $query->latest();
    }

    /*
    |--------------------------------------------------------------------------
    | Update Helpers
    |--------------------------------------------------------------------------
    */

    public function isInternal(): bool
    {
        return (bool) $this->is_internal;
    }

    public function isTenantVisible(): bool
    {
        return (bool) $this->is_visible_to_tenant
            && ! $this->is_internal;
    }

    public function isProgressUpdate(): bool
    {
        return $this->type === self::TYPE_PROGRESS;
    }

    public function isStatusChange(): bool
    {
        return $this->type === self::TYPE_STATUS_CHANGE;
    }

    public function isCompletionUpdate(): bool
    {
        return $this->type === self::TYPE_COMPLETION;
    }

    /*
    |--------------------------------------------------------------------------
    | Display Helpers
    |--------------------------------------------------------------------------
    */

    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            self::TYPE_NOTE => 'Note',
            self::TYPE_PROGRESS => 'Progress Update',
            self::TYPE_STATUS_CHANGE => 'Status Change',
            self::TYPE_ASSIGNMENT => 'Assignment',
            self::TYPE_INSPECTION => 'Inspection',
            self::TYPE_COMPLETION => 'Completion',
            self::TYPE_OTHER => 'Other',
            default => ucfirst(str_replace('_', ' ', (string) $this->type)),
        };
    }

    public function getProgressLabelAttribute(): ?string
    {
        if ($this->progress_percentage === null) {
            return null;
        }

        return $this->progress_percentage . '% Complete';
    }

    /*
    |--------------------------------------------------------------------------
    | Available Options
    |--------------------------------------------------------------------------
    */

    public static function types(): array
    {
        return [
            self::TYPE_NOTE,
            self::TYPE_PROGRESS,
            self::TYPE_STATUS_CHANGE,
            self::TYPE_ASSIGNMENT,
            self::TYPE_INSPECTION,
            self::TYPE_COMPLETION,
            self::TYPE_OTHER,
        ];
    }
}
