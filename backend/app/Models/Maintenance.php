<?php

namespace App\Models;

use App\Models\User;
use App\Models\Unit;
use App\Models\Tenant;
use App\Models\Apartment;
use App\Models\Property;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Maintenance extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'maintenances';

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING     = 'pending';
    public const STATUS_SCHEDULED   = 'scheduled';
    public const STATUS_ASSIGNED    = 'assigned';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_ON_HOLD     = 'on_hold';
    public const STATUS_COMPLETED   = 'completed';
    public const STATUS_CANCELLED   = 'cancelled';
    public const STATUS_REJECTED    = 'rejected';

    /*
    |--------------------------------------------------------------------------
    | PRIORITY CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const PRIORITY_LOW      = 'low';
    public const PRIORITY_MEDIUM   = 'medium';
    public const PRIORITY_HIGH     = 'high';
    public const PRIORITY_URGENT   = 'urgent';
    public const PRIORITY_CRITICAL = 'critical';

    /*
    |--------------------------------------------------------------------------
    | TYPE CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const TYPE_GENERAL    = 'general';
    public const TYPE_ELECTRICAL = 'electrical';
    public const TYPE_PLUMBING   = 'plumbing';
    public const TYPE_HVAC       = 'hvac';
    public const TYPE_STRUCTURAL = 'structural';
    public const TYPE_APPLIANCE  = 'appliance';
    public const TYPE_SECURITY   = 'security';
    public const TYPE_CLEANING   = 'cleaning';
    public const TYPE_PAINTING   = 'painting';
    public const TYPE_OTHER      = 'other';

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'property_id',
        'apartment_id',
        'unit_id',

        'tenant_id',
        'reported_by',
        'assigned_to',

        'title',
        'slug',
        'description',

        'type',
        'priority',
        'status',

        'location',
        'images',

        'reported_at',
        'scheduled_at',
        'started_at',
        'completed_at',

        'estimated_cost',
        'actual_cost',

        'resolution',
        'technician_notes',
        'internal_notes',

        'requires_parts',
        'parts_description',

        'is_emergency',
        'is_tenant_responsibility',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'images' => 'array',

            'reported_at'  => 'datetime',
            'scheduled_at' => 'datetime',
            'started_at'   => 'datetime',
            'completed_at' => 'datetime',

            'estimated_cost' => 'decimal:2',
            'actual_cost'    => 'decimal:2',

            'requires_parts'          => 'boolean',
            'is_emergency'            => 'boolean',
            'is_tenant_responsibility' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MODEL BOOT
    |--------------------------------------------------------------------------
    */

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Maintenance $maintenance) {

            if (empty($maintenance->slug) && !empty($maintenance->title)) {
                $maintenance->slug = Str::slug($maintenance->title);
            }

            if (empty($maintenance->reported_at)) {
                $maintenance->reported_at = now();
            }

            if (empty($maintenance->status)) {
                $maintenance->status = self::STATUS_PENDING;
            }

            if (empty($maintenance->priority)) {
                $maintenance->priority = self::PRIORITY_MEDIUM;
            }

            if (empty($maintenance->type)) {
                $maintenance->type = self::TYPE_GENERAL;
            }
        });

        static::updating(function (Maintenance $maintenance) {

            if (
                $maintenance->isDirty('title') &&
                !empty($maintenance->title)
            ) {
                $maintenance->slug = Str::slug($maintenance->title);
            }

            if (
                $maintenance->isDirty('status') &&
                $maintenance->status === self::STATUS_IN_PROGRESS &&
                empty($maintenance->started_at)
            ) {
                $maintenance->started_at = now();
            }

            if (
                $maintenance->isDirty('status') &&
                $maintenance->status === self::STATUS_COMPLETED &&
                empty($maintenance->completed_at)
            ) {
                $maintenance->completed_at = now();
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function apartment(): BelongsTo
    {
        return $this->belongsTo(Apartment::class, 'apartment_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS HELPERS
    |--------------------------------------------------------------------------
    */

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isScheduled(): bool
    {
        return $this->status === self::STATUS_SCHEDULED;
    }

    public function isAssigned(): bool
    {
        return $this->status === self::STATUS_ASSIGNED;
    }

    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function isOnHold(): bool
    {
        return $this->status === self::STATUS_ON_HOLD;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    public function isOpen(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_PENDING,
                self::STATUS_SCHEDULED,
                self::STATUS_ASSIGNED,
                self::STATUS_IN_PROGRESS,
                self::STATUS_ON_HOLD,
            ],
            true
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PRIORITY HELPERS
    |--------------------------------------------------------------------------
    */

    public function isLowPriority(): bool
    {
        return $this->priority === self::PRIORITY_LOW;
    }

    public function isMediumPriority(): bool
    {
        return $this->priority === self::PRIORITY_MEDIUM;
    }

    public function isHighPriority(): bool
    {
        return $this->priority === self::PRIORITY_HIGH;
    }

    public function isUrgent(): bool
    {
        return in_array(
            $this->priority,
            [
                self::PRIORITY_URGENT,
                self::PRIORITY_CRITICAL,
            ],
            true
        );
    }

    public function isCritical(): bool
    {
        return $this->priority === self::PRIORITY_CRITICAL;
    }

    /*
    |--------------------------------------------------------------------------
    | TYPE HELPERS
    |--------------------------------------------------------------------------
    */

    public function isElectrical(): bool
    {
        return $this->type === self::TYPE_ELECTRICAL;
    }

    public function isPlumbing(): bool
    {
        return $this->type === self::TYPE_PLUMBING;
    }

    public function isHVAC(): bool
    {
        return $this->type === self::TYPE_HVAC;
    }

    public function isStructural(): bool
    {
        return $this->type === self::TYPE_STRUCTURAL;
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONS
    |--------------------------------------------------------------------------
    */

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_SCHEDULED,
            self::STATUS_ASSIGNED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_ON_HOLD,
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
            self::STATUS_REJECTED,
        ];
    }

    public static function priorities(): array
    {
        return [
            self::PRIORITY_LOW,
            self::PRIORITY_MEDIUM,
            self::PRIORITY_HIGH,
            self::PRIORITY_URGENT,
            self::PRIORITY_CRITICAL,
        ];
    }

    public static function types(): array
    {
        return [
            self::TYPE_GENERAL,
            self::TYPE_ELECTRICAL,
            self::TYPE_PLUMBING,
            self::TYPE_HVAC,
            self::TYPE_STRUCTURAL,
            self::TYPE_APPLIANCE,
            self::TYPE_SECURITY,
            self::TYPE_CLEANING,
            self::TYPE_PAINTING,
            self::TYPE_OTHER,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeScheduled(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_SCHEDULED);
    }

    public function scopeAssigned(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ASSIGNED);
    }

    public function scopeInProgress(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_IN_PROGRESS);
    }

    public function scopeOnHold(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ON_HOLD);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn(
            'status',
            [
                self::STATUS_PENDING,
                self::STATUS_SCHEDULED,
                self::STATUS_ASSIGNED,
                self::STATUS_IN_PROGRESS,
                self::STATUS_ON_HOLD,
            ]
        );
    }

    public function scopeUrgent(Builder $query): Builder
    {
        return $query->whereIn(
            'priority',
            [
                self::PRIORITY_URGENT,
                self::PRIORITY_CRITICAL,
            ]
        );
    }

    public function scopeEmergency(Builder $query): Builder
    {
        return $query->where('is_emergency', true);
    }

    public function scopeRequiresParts(Builder $query): Builder
    {
        return $query->where('requires_parts', true);
    }

    public function scopeAssignedTo(
        Builder $query,
        int $userId
    ): Builder {
        return $query->where('assigned_to', $userId);
    }

    public function scopeReportedByTenant(
        Builder $query,
        int $tenantId
    ): Builder {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForProperty(
        Builder $query,
        int $propertyId
    ): Builder {
        return $query->where('property_id', $propertyId);
    }

    public function scopeForApartment(
        Builder $query,
        int $apartmentId
    ): Builder {
        return $query->where('apartment_id', $apartmentId);
    }

    public function scopeForUnit(
        Builder $query,
        int $unitId
    ): Builder {
        return $query->where('unit_id', $unitId);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return $this->status
            ? ucwords(str_replace('_', ' ', $this->status))
            : 'Unknown';
    }

    public function getPriorityLabelAttribute(): string
    {
        return $this->priority
            ? ucfirst($this->priority)
            : 'Unknown';
    }

    public function getTypeLabelAttribute(): string
    {
        return $this->type
            ? ucfirst($this->type)
            : 'Unknown';
    }

    public function getIsAssignedAttribute(): bool
    {
        return !is_null($this->assigned_to);
    }

    public function getHasCostAttribute(): bool
    {
        return !is_null($this->actual_cost);
    }

    public function getCostVarianceAttribute(): ?float
    {
        if (
            is_null($this->estimated_cost) ||
            is_null($this->actual_cost)
        ) {
            return null;
        }

        return (float) $this->actual_cost -
            (float) $this->estimated_cost;
    }

    public function getIsOverdueAttribute(): bool
    {
        if (
            $this->isCompleted() ||
            $this->isCancelled() ||
            $this->isRejected()
        ) {
            return false;
        }

        if (!$this->scheduled_at) {
            return false;
        }

        return $this->scheduled_at->isPast();
    }

    /*
    |--------------------------------------------------------------------------
    | SERIALIZATION
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'status_label',
        'priority_label',
        'type_label',
        'is_assigned',
        'has_cost',
        'cost_variance',
        'is_overdue',
    ];
}