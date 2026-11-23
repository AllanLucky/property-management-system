<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceChecklist extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Completion Statuses
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_SKIPPED = 'skipped';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable Attributes
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'maintenance_request_id',
        'title',
        'description',
        'is_completed',
        'completed_by',
        'completed_at',
        'completion_notes',
        'sort_order',
        'is_required',
    ];

    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'is_completed' => 'boolean',
            'is_required' => 'boolean',
            'completed_at' => 'datetime',
            'sort_order' => 'integer',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Maintenance request associated with this checklist item.
     */
    public function maintenanceRequest(): BelongsTo
    {
        return $this->belongsTo(
            MaintenanceRequest::class,
            'maintenance_request_id'
        );
    }

    /**
     * User who completed the checklist item.
     */
    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('is_completed', true);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('is_completed', false);
    }

    public function scopeRequired(Builder $query): Builder
    {
        return $query->where('is_required', true);
    }

    public function scopeOptional(Builder $query): Builder
    {
        return $query->where('is_required', false);
    }

    public function scopeForRequest(
        Builder $query,
        int $maintenanceRequestId
    ): Builder {
        return $query->where(
            'maintenance_request_id',
            $maintenanceRequestId
        );
    }

    public function scopeOrdered(Builder $query): Builder
    {
        return $query
            ->orderBy('sort_order')
            ->orderBy('id');
    }

    /*
    |--------------------------------------------------------------------------
    | Completion Helpers
    |--------------------------------------------------------------------------
    */

    public function isCompleted(): bool
    {
        return (bool) $this->is_completed;
    }

    public function isPending(): bool
    {
        return ! $this->is_completed;
    }

    public function isRequired(): bool
    {
        return (bool) $this->is_required;
    }

    /**
     * Mark the checklist item as completed.
     */
    public function markAsCompleted(
        ?int $userId = null,
        ?string $notes = null
    ): bool {
        return $this->update([
            'is_completed' => true,
            'completed_by' => $userId,
            'completed_at' => now(),
            'completion_notes' => $notes,
        ]);
    }

    /**
     * Reset the checklist item to pending.
     */
    public function markAsPending(): bool
    {
        return $this->update([
            'is_completed' => false,
            'completed_by' => null,
            'completed_at' => null,
            'completion_notes' => null,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Display Helpers
    |--------------------------------------------------------------------------
    */

    public function getStatusAttribute(): string
    {
        return $this->is_completed ? 'completed' : 'pending';
    }

    public function getStatusLabelAttribute(): string
    {
        return $this->is_completed ? 'Completed' : 'Pending';
    }

    /*
    |--------------------------------------------------------------------------
    | Available Statuses
    |--------------------------------------------------------------------------
    */

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_COMPLETED,
            self::STATUS_SKIPPED,
        ];
    }
}
