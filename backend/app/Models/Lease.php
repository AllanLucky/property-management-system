<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lease extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Lease Statuses
    |--------------------------------------------------------------------------
    */

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PENDING = 'pending';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_EXPIRED = 'expired';

    public const STATUS_TERMINATED = 'terminated';

    public const STATUS_CANCELLED = 'cancelled';

    /**
     * All supported lease statuses.
     *
     * @var array<int, string>
     */
    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_PENDING,
        self::STATUS_ACTIVE,
        self::STATUS_EXPIRED,
        self::STATUS_TERMINATED,
        self::STATUS_CANCELLED,
    ];

    /*
    |--------------------------------------------------------------------------
    | Lease Types
    |--------------------------------------------------------------------------
    */

    public const TYPE_FIXED_TERM = 'fixed_term';

    public const TYPE_MONTH_TO_MONTH = 'month_to_month';

    public const TYPE_RENEWAL = 'renewal';

    public const TYPE_SHORT_TERM = 'short_term';

    /**
     * All supported lease types.
     *
     * @var array<int, string>
     */
    public const LEASE_TYPES = [
        self::TYPE_FIXED_TERM,
        self::TYPE_MONTH_TO_MONTH,
        self::TYPE_RENEWAL,
        self::TYPE_SHORT_TERM,
    ];

    /*
    |--------------------------------------------------------------------------
    | Database Configuration
    |--------------------------------------------------------------------------
    */

    protected $table = 'leases';

    /**
     * Attributes that may be mass assigned.
     *
     * Relationships such as tenancy_id should only be assigned after
     * validating the related tenancy through the service/request layer.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        /*
        |--------------------------------------------------------------------------
        | Identification
        |--------------------------------------------------------------------------
        */
        'lease_number',

        /*
        |--------------------------------------------------------------------------
        | Tenancy Relationship
        |--------------------------------------------------------------------------
        */
        'tenancy_id',

        /*
        |--------------------------------------------------------------------------
        | Lease Terms
        |--------------------------------------------------------------------------
        */
        'lease_type',
        'start_date',
        'end_date',
        'rent_amount',
        'deposit_amount',
        'service_charge',
        'late_fee',
        'payment_frequency',
        'due_day',
        'notice_period_days',

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */
        'status',

        /*
        |--------------------------------------------------------------------------
        | Signing & Termination
        |--------------------------------------------------------------------------
        */
        'signed_at',
        'terminated_at',
        'termination_reason',

        /*
        |--------------------------------------------------------------------------
        | Documents
        |--------------------------------------------------------------------------
        */
        'document_path',

        /*
        |--------------------------------------------------------------------------
        | Notes
        |--------------------------------------------------------------------------
        */
        'notes',
    ];

    /**
     * Attribute casting.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',

        'rent_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'late_fee' => 'decimal:2',

        'due_day' => 'integer',
        'notice_period_days' => 'integer',

        'signed_at' => 'datetime',
        'terminated_at' => 'datetime',
    ];

    /**
     * Computed attributes included in serialized responses.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'status_label',
        'lease_type_label',
        'is_active',
        'is_expired',
        'is_terminated',
    ];

    /*
    |--------------------------------------------------------------------------
    | Model Boot
    |--------------------------------------------------------------------------
    */

    protected static function boot(): void
    {
        parent::boot();

        /*
        |--------------------------------------------------------------------------
        | Creating
        |--------------------------------------------------------------------------
        */

        static::creating(function (Lease $lease): void {
            if (empty($lease->lease_number)) {
                $lease->lease_number = self::generateLeaseNumber();
            }

            if (empty($lease->status)) {
                $lease->status = self::STATUS_DRAFT;
            }

            if (empty($lease->lease_type)) {
                $lease->lease_type = self::TYPE_FIXED_TERM;
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Updating
        |--------------------------------------------------------------------------
        */

        static::updating(function (Lease $lease): void {
            /*
            |--------------------------------------------------------------------------
            | Automatically maintain termination timestamp.
            |--------------------------------------------------------------------------
            */

            if (
                $lease->isDirty('status') &&
                $lease->status === self::STATUS_TERMINATED &&
                empty($lease->terminated_at)
            ) {
                $lease->terminated_at = now();
            }

            /*
            |--------------------------------------------------------------------------
            | Clear termination timestamp when the lease is moved away
            | from the terminated state.
            |--------------------------------------------------------------------------
            */

            if (
                $lease->isDirty('status') &&
                $lease->status !== self::STATUS_TERMINATED
            ) {
                $lease->terminated_at = null;
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the tenancy associated with the lease.
     *
     * Tenant, property, apartment and unit information should be resolved
     * through the tenancy relationship rather than duplicated on leases.
     */
    public function tenancy(): BelongsTo
    {
        return $this->belongsTo(Tenancy::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Relationship Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get the tenant associated with this lease through the tenancy.
     */
    public function getTenantAttribute(): ?Tenant
    {
        return $this->tenancy?->tenant;
    }

    /**
     * Get the property associated with this lease through the tenancy.
     */
    public function getPropertyAttribute(): ?Property
    {
        return $this->tenancy?->property;
    }

    /**
     * Get the apartment associated with this lease through the tenancy.
     */
    public function getApartmentAttribute(): ?Apartment
    {
        return $this->tenancy?->apartment;
    }

    /**
     * Get the unit associated with this lease through the tenancy.
     */
    public function getUnitAttribute(): ?Unit
    {
        return $this->tenancy?->unit;
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get the human-readable lease status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_DRAFT => 'Draft',
            self::STATUS_PENDING => 'Pending',
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_EXPIRED => 'Expired',
            self::STATUS_TERMINATED => 'Terminated',
            self::STATUS_CANCELLED => 'Cancelled',
            default => ucfirst((string) $this->status),
        };
    }

    /**
     * Get the human-readable lease type.
     */
    public function getLeaseTypeLabelAttribute(): string
    {
        return match ($this->lease_type) {
            self::TYPE_FIXED_TERM => 'Fixed Term',
            self::TYPE_MONTH_TO_MONTH => 'Month to Month',
            self::TYPE_RENEWAL => 'Renewal',
            self::TYPE_SHORT_TERM => 'Short Term',
            default => ucfirst(
                str_replace('_', ' ', (string) $this->lease_type)
            ),
        };
    }

    /**
     * Determine whether the lease is active.
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Determine whether the lease has expired.
     *
     * A terminated or cancelled lease is not considered expired simply
     * because its end date is in the past.
     */
    public function getIsExpiredAttribute(): bool
    {
        if ($this->status === self::STATUS_EXPIRED) {
            return true;
        }

        return $this->end_date !== null &&
            $this->end_date->isPast() &&
            !in_array(
                $this->status,
                [
                    self::STATUS_TERMINATED,
                    self::STATUS_CANCELLED,
                ],
                true
            );
    }

    /**
     * Determine whether the lease has been terminated.
     */
    public function getIsTerminatedAttribute(): bool
    {
        return $this->status === self::STATUS_TERMINATED;
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope active leases.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Scope draft leases.
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_DRAFT);
    }

    /**
     * Scope pending leases.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope expired leases.
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_EXPIRED);
    }

    /**
     * Scope terminated leases.
     */
    public function scopeTerminated(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_TERMINATED);
    }

    /**
     * Scope cancelled leases.
     */
    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    /**
     * Scope leases by status.
     */
    public function scopeStatus(
        Builder $query,
        string $status
    ): Builder {
        return $query->where('status', $status);
    }

    /**
     * Scope leases belonging to a specific tenancy.
     */
    public function scopeForTenancy(
        Builder $query,
        int $tenancyId
    ): Builder {
        return $query->where('tenancy_id', $tenancyId);
    }

    /**
     * Scope leases expiring within a specific date range.
     */
    public function scopeExpiringBetween(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query
            ->whereNotNull('end_date')
            ->whereBetween('end_date', [$startDate, $endDate]);
    }

    /**
     * Scope leases that have started.
     */
    public function scopeStarted(Builder $query): Builder
    {
        return $query
            ->whereNotNull('start_date')
            ->whereDate('start_date', '<=', now()->toDateString());
    }

    /**
     * Scope leases that have not yet started.
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query
            ->whereNotNull('start_date')
            ->whereDate('start_date', '>', now()->toDateString());
    }

    /*
    |--------------------------------------------------------------------------
    | Status Helpers
    |--------------------------------------------------------------------------
    */

    public function isDraft(): bool
    {
        return $this->status === self::STATUS_DRAFT;
    }

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isExpired(): bool
    {
        return $this->is_expired;
    }

    public function isTerminated(): bool
    {
        return $this->status === self::STATUS_TERMINATED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Determine whether a status is supported.
     */
    public static function isValidStatus(string $status): bool
    {
        return in_array($status, self::STATUSES, true);
    }

    /**
     * Determine whether a lease type is supported.
     */
    public static function isValidLeaseType(string $type): bool
    {
        return in_array($type, self::LEASE_TYPES, true);
    }

    /*
    |--------------------------------------------------------------------------
    | State Changes
    |--------------------------------------------------------------------------
    */

    /**
     * Activate the lease.
     */
    public function activate(): bool
    {
        return $this->update([
            'status' => self::STATUS_ACTIVE,
            'terminated_at' => null,
        ]);
    }

    /**
     * Move the lease to pending.
     */
    public function setPending(): bool
    {
        return $this->update([
            'status' => self::STATUS_PENDING,
            'terminated_at' => null,
        ]);
    }

    /**
     * Move the lease to draft.
     */
    public function setDraft(): bool
    {
        return $this->update([
            'status' => self::STATUS_DRAFT,
            'terminated_at' => null,
        ]);
    }

    /**
     * Mark the lease as expired.
     */
    public function expire(): bool
    {
        return $this->update([
            'status' => self::STATUS_EXPIRED,
            'terminated_at' => null,
        ]);
    }

    /**
     * Terminate the lease.
     */
    public function terminate(?string $reason = null): bool
    {
        return $this->update([
            'status' => self::STATUS_TERMINATED,
            'terminated_at' => now(),
            'termination_reason' => $reason,
        ]);
    }

    /**
     * Cancel the lease.
     */
    public function cancel(): bool
    {
        return $this->update([
            'status' => self::STATUS_CANCELLED,
            'terminated_at' => null,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Business Rules
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the lease can be activated.
     */
    public function canActivate(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_DRAFT,
                self::STATUS_PENDING,
            ],
            true
        );
    }

    /**
     * Determine whether the lease can be terminated.
     */
    public function canTerminate(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Determine whether the lease can be cancelled.
     */
    public function canCancel(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_DRAFT,
                self::STATUS_PENDING,
            ],
            true
        );
    }

    /**
     * Determine whether the lease has ended based on its end date.
     */
    public function hasEnded(): bool
    {
        return $this->end_date !== null &&
            $this->end_date->isPast();
    }

    /**
     * Determine whether the lease is currently valid.
     */
    public function isCurrentlyValid(): bool
    {
        if ($this->status !== self::STATUS_ACTIVE) {
            return false;
        }

        if (
            $this->start_date !== null &&
            $this->start_date->isFuture()
        ) {
            return false;
        }

        if (
            $this->end_date !== null &&
            $this->end_date->isPast()
        ) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the lease is currently within its contractual
     * date range, regardless of its database status.
     */
    public function isWithinDateRange(): bool
    {
        if ($this->start_date !== null && $this->start_date->isFuture()) {
            return false;
        }

        if ($this->end_date !== null && $this->end_date->isPast()) {
            return false;
        }

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | Lease Number
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique lease number.
     *
     * Format:
     * LSE-000001
     */
    public static function generateLeaseNumber(): string
    {
        $nextId = ((int) self::withTrashed()->max('id')) + 1;

        do {
            $leaseNumber = 'LSE-' . str_pad(
                (string) $nextId,
                6,
                '0',
                STR_PAD_LEFT
            );

            $exists = self::withTrashed()
                ->where('lease_number', $leaseNumber)
                ->exists();

            if ($exists) {
                $nextId++;
            }
        } while ($exists);

        return $leaseNumber;
    }
}