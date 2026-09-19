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
    | Payment Frequencies
    |--------------------------------------------------------------------------
    */

    public const FREQUENCY_DAILY = 'daily';

    public const FREQUENCY_WEEKLY = 'weekly';

    public const FREQUENCY_MONTHLY = 'monthly';

    public const FREQUENCY_QUARTERLY = 'quarterly';

    public const FREQUENCY_SEMI_ANNUALLY = 'semi_annually';

    public const FREQUENCY_ANNUALLY = 'annually';

    public const FREQUENCY_ONE_TIME = 'one_time';

    /**
     * All supported payment frequencies.
     *
     * @var array<int, string>
     */
    public const PAYMENT_FREQUENCIES = [
        self::FREQUENCY_DAILY,
        self::FREQUENCY_WEEKLY,
        self::FREQUENCY_MONTHLY,
        self::FREQUENCY_QUARTERLY,
        self::FREQUENCY_SEMI_ANNUALLY,
        self::FREQUENCY_ANNUALLY,
        self::FREQUENCY_ONE_TIME,
    ];

    /*
    |--------------------------------------------------------------------------
    | Database Configuration
    |--------------------------------------------------------------------------
    */

    protected $table = 'leases';

    /**
     * Mass assignable attributes.
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
        | Tenancy
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
        | Signing / Termination
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
     * Computed attributes included in API serialization.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'status_label',
        'lease_type_label',
        'is_active',
        'is_expired',
        'is_terminated',
        'is_cancelled',
        'days_remaining',
        'expiry_status',
        'has_ended',
        'should_expire',
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
            if (blank($lease->lease_number)) {
                $lease->lease_number = self::generateLeaseNumber();
            }

            if (blank($lease->status)) {
                $lease->status = self::STATUS_DRAFT;
            }

            if (blank($lease->lease_type)) {
                $lease->lease_type = self::TYPE_FIXED_TERM;
            }

            if (blank($lease->payment_frequency)) {
                $lease->payment_frequency = self::FREQUENCY_MONTHLY;
            }

            if ($lease->service_charge === null) {
                $lease->service_charge = 0;
            }

            if ($lease->late_fee === null) {
                $lease->late_fee = 0;
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
                blank($lease->terminated_at)
            ) {
                $lease->terminated_at = now();
            }

            /*
            |--------------------------------------------------------------------------
            | Clear termination timestamp when leaving terminated state.
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
     * Get the tenant associated with this lease through tenancy.
     */
    public function getTenantAttribute(): ?Tenant
    {
        return $this->tenancy?->tenant;
    }

    /**
     * Get the property associated with this lease through tenancy.
     */
    public function getPropertyAttribute(): ?Property
    {
        return $this->tenancy?->property;
    }

    /**
     * Get the apartment associated with this lease through tenancy.
     */
    public function getApartmentAttribute(): ?Apartment
    {
        return $this->tenancy?->apartment;
    }

    /**
     * Get the unit associated with this lease through tenancy.
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
     * Human-readable lease status.
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
            default => ucfirst(
                str_replace('_', ' ', (string) $this->status)
            ),
        };
    }

    /**
     * Human-readable lease type.
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
     * Human-readable payment frequency.
     */
    public function getPaymentFrequencyLabelAttribute(): string
    {
        return match ($this->payment_frequency) {
            self::FREQUENCY_DAILY => 'Daily',
            self::FREQUENCY_WEEKLY => 'Weekly',
            self::FREQUENCY_MONTHLY => 'Monthly',
            self::FREQUENCY_QUARTERLY => 'Quarterly',
            self::FREQUENCY_SEMI_ANNUALLY => 'Semi Annually',
            self::FREQUENCY_ANNUALLY => 'Annually',
            self::FREQUENCY_ONE_TIME => 'One Time',
            default => ucfirst(
                str_replace('_', ' ', (string) $this->payment_frequency)
            ),
        };
    }

    /**
     * Determine whether the lease status is active.
     *
     * This reflects the persisted database status.
     */
    public function getIsActiveAttribute(): bool
    {
        return $this->isActive();
    }

    /**
     * Determine whether the lease has been persisted as expired.
     *
     * Important:
     * This deliberately checks the database status rather than the
     * contractual end date. Date-based expiration detection is exposed
     * separately through hasEnded() and shouldExpire().
     */
    public function getIsExpiredAttribute(): bool
    {
        return $this->isExpired();
    }

    /**
     * Determine whether the lease is terminated.
     */
    public function getIsTerminatedAttribute(): bool
    {
        return $this->isTerminated();
    }

    /**
     * Determine whether the lease is cancelled.
     */
    public function getIsCancelledAttribute(): bool
    {
        return $this->isCancelled();
    }

    /**
     * Number of days remaining until contractual expiry.
     *
     * Positive value:
     * Lease expires in the future.
     *
     * Zero:
     * Lease expires today.
     *
     * Negative value:
     * Contractual end date has passed.
     *
     * Null:
     * Lease has no end date.
     */
    public function getDaysRemainingAttribute(): ?int
    {
        if ($this->end_date === null) {
            return null;
        }

        return today()->diffInDays(
            $this->end_date,
            false
        );
    }

    /**
     * Human-readable expiry state.
     */
    public function getExpiryStatusAttribute(): string
    {
        if ($this->isTerminated()) {
            return 'terminated';
        }

        if ($this->isCancelled()) {
            return 'cancelled';
        }

        if ($this->isExpired()) {
            return 'expired';
        }

        if ($this->end_date === null) {
            return 'no_expiry';
        }

        if ($this->end_date->lt(today())) {
            return 'ended_pending_expiration';
        }

        if ($this->end_date->isToday()) {
            return 'expires_today';
        }

        $days = $this->days_remaining;

        if ($days === null) {
            return 'no_expiry';
        }

        if ($days <= 7) {
            return 'expires_within_7_days';
        }

        if ($days <= 30) {
            return 'expires_within_30_days';
        }

        if ($days <= 60) {
            return 'expires_within_60_days';
        }

        if ($days <= 90) {
            return 'expires_within_90_days';
        }

        return 'future';
    }

    /**
     * Determine whether the contractual end date has passed.
     */
    public function getHasEndedAttribute(): bool
    {
        return $this->hasEnded();
    }

    /**
     * Determine whether the lease should automatically become expired.
     */
    public function getShouldExpireAttribute(): bool
    {
        return $this->shouldExpire();
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
        return $query->where(
            'status',
            self::STATUS_ACTIVE
        );
    }

    /**
     * Scope draft leases.
     */
    public function scopeDraft(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_DRAFT
        );
    }

    /**
     * Scope pending leases.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }

    /**
     * Scope expired leases.
     *
     * Uses persisted status only.
     */
    public function scopeExpired(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_EXPIRED
        );
    }

    /**
     * Scope terminated leases.
     */
    public function scopeTerminated(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_TERMINATED
        );
    }

    /**
     * Scope cancelled leases.
     */
    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_CANCELLED
        );
    }

    /**
     * Scope leases whose contractual end date has passed.
     *
     * This is date-based detection and does not require status=expired.
     */
    public function scopeEnded(Builder $query): Builder
    {
        return $query
            ->whereNotNull('end_date')
            ->whereDate(
                'end_date',
                '<',
                today()
            )
            ->whereNotIn('status', [
                self::STATUS_TERMINATED,
                self::STATUS_CANCELLED,
            ]);
    }

    /**
     * Scope leases that should automatically become expired.
     *
     * Only active leases are eligible for automatic expiration.
     */
    public function scopeShouldExpire(Builder $query): Builder
    {
        return $query
            ->where(
                'status',
                self::STATUS_ACTIVE
            )
            ->whereNotNull('end_date')
            ->whereDate(
                'end_date',
                '<',
                today()
            );
    }

    /**
     * Scope leases expiring within a date range.
     */
    public function scopeExpiringBetween(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query
            ->whereNotNull('end_date')
            ->whereBetween(
                'end_date',
                [
                    $startDate,
                    $endDate,
                ]
            )
            ->whereNotIn('status', [
                self::STATUS_EXPIRED,
                self::STATUS_TERMINATED,
                self::STATUS_CANCELLED,
            ]);
    }

    /**
     * Scope leases that have started.
     */
    public function scopeStarted(Builder $query): Builder
    {
        return $query
            ->whereNotNull('start_date')
            ->whereDate(
                'start_date',
                '<=',
                today()
            );
    }

    /**
     * Scope leases that have not yet started.
     */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query
            ->whereNotNull('start_date')
            ->whereDate(
                'start_date',
                '>',
                today()
            );
    }

    /**
     * Scope currently valid active leases.
     */
    public function scopeCurrentlyValid(Builder $query): Builder
    {
        return $query
            ->where(
                'status',
                self::STATUS_ACTIVE
            )
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('start_date')
                    ->orWhereDate(
                        'start_date',
                        '<=',
                        today()
                    );
            })
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('end_date')
                    ->orWhereDate(
                        'end_date',
                        '>=',
                        today()
                    );
            });
    }

    /**
     * Scope leases for a tenancy.
     */
    public function scopeForTenancy(
        Builder $query,
        int $tenancyId
    ): Builder {
        return $query->where(
            'tenancy_id',
            $tenancyId
        );
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

    /**
     * Determine whether the lease has been persisted as expired.
     */
    public function isExpired(): bool
    {
        return $this->status === self::STATUS_EXPIRED;
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
     * Determine whether the contractual end date has passed.
     */
    public function shouldExpire(): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        return $this->hasEnded();
    }

    /**
     * Synchronize the lease status with its contractual dates.
     *
     * Returns true when the database status was changed.
     */
    public function synchronizeExpiration(): bool
    {
        if (!$this->shouldExpire()) {
            return false;
        }

        return $this->updateQuietly([
            'status' => self::STATUS_EXPIRED,
            'terminated_at' => null,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Validation Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether a status is supported.
     */
    public static function isValidStatus(string $status): bool
    {
        return in_array(
            $status,
            self::STATUSES,
            true
        );
    }

    /**
     * Determine whether a lease type is supported.
     */
    public static function isValidLeaseType(string $type): bool
    {
        return in_array(
            $type,
            self::LEASE_TYPES,
            true
        );
    }

    /**
     * Determine whether a payment frequency is supported.
     */
    public static function isValidPaymentFrequency(
        string $frequency
    ): bool {
        return in_array(
            $frequency,
            self::PAYMENT_FREQUENCIES,
            true
        );
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
        if (!$this->canActivate()) {
            return false;
        }

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
        if ($this->isExpired() || $this->isTerminated() || $this->isCancelled()) {
            return false;
        }

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
        if ($this->isExpired() || $this->isTerminated() || $this->isCancelled()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_DRAFT,
            'terminated_at' => null,
        ]);
    }

    /**
     * Mark the lease as expired.
     *
     * Expiration must only happen after the contractual end date.
     */
    public function expire(): bool
    {
        if (!$this->hasEnded()) {
            return false;
        }

        if ($this->isTerminated() || $this->isCancelled()) {
            return false;
        }

        if ($this->isExpired()) {
            return true;
        }

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
        if (!$this->canTerminate()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_TERMINATED,
            'terminated_at' => now(),
            'termination_reason' => $reason,
        ]);
    }

    /**
     * Cancel the lease.
     */
    public function cancel(?string $reason = null): bool
    {
        if (!$this->canCancel()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_CANCELLED,
            'terminated_at' => null,
            'termination_reason' => $reason,
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
        if (
            !in_array(
                $this->status,
                [
                    self::STATUS_DRAFT,
                    self::STATUS_PENDING,
                ],
                true
            )
        ) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | An ended lease cannot be activated.
        |--------------------------------------------------------------------------
        */

        if ($this->hasEnded()) {
            return false;
        }

        return true;
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
     * Determine whether the contractual end date has passed.
     *
     * End date equal to today is NOT considered ended.
     */
    public function hasEnded(): bool
    {
        if ($this->end_date === null) {
            return false;
        }

        return $this->end_date->startOfDay()->lt(
            today()
        );
    }

    /**
     * Determine whether the lease is currently valid.
     */
    public function isCurrentlyValid(): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        if (
            $this->start_date !== null &&
            $this->start_date->startOfDay()->gt(today())
        ) {
            return false;
        }

        if (
            $this->end_date !== null &&
            $this->end_date->startOfDay()->lt(today())
        ) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether the lease is currently within its
     * contractual date range.
     */
    public function isWithinDateRange(): bool
    {
        if (
            $this->start_date !== null &&
            $this->start_date->startOfDay()->gt(today())
        ) {
            return false;
        }

        if (
            $this->end_date !== null &&
            $this->end_date->startOfDay()->lt(today())
        ) {
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
     *
     * LSE-000001
     */
    public static function generateLeaseNumber(): string
    {
        $nextId = (
            (int) self::withTrashed()->max('id')
        ) + 1;

        do {
            $leaseNumber = 'LSE-' . str_pad(
                (string) $nextId,
                6,
                '0',
                STR_PAD_LEFT
            );

            $exists = self::withTrashed()
                ->where(
                    'lease_number',
                    $leaseNumber
                )
                ->exists();

            if ($exists) {
                $nextId++;
            }
        } while ($exists);

        return $leaseNumber;
    }
}
