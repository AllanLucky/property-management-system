<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Unit extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'units';

    /*
    |--------------------------------------------------------------------------
    | DEFAULT RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    protected $with = [];

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const STATUS_VACANT = 'vacant';
    public const STATUS_OCCUPIED = 'occupied';
    public const STATUS_MAINTENANCE = 'maintenance';
    public const STATUS_RESERVED = 'reserved';

    public const STATUSES = [
        self::STATUS_VACANT,
        self::STATUS_OCCUPIED,
        self::STATUS_MAINTENANCE,
        self::STATUS_RESERVED,
    ];

    /*
    |--------------------------------------------------------------------------
    | UNIT TYPE CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const TYPE_STUDIO = 'studio';
    public const TYPE_BEDSITTER = 'bedsitter';
    public const TYPE_ONE_BEDROOM = 'one_bedroom';
    public const TYPE_TWO_BEDROOM = 'two_bedroom';
    public const TYPE_THREE_BEDROOM = 'three_bedroom';
    public const TYPE_FOUR_BEDROOM = 'four_bedroom';
    public const TYPE_PENTHOUSE = 'penthouse';
    public const TYPE_OFFICE = 'office';

    public const UNIT_TYPES = [
        self::TYPE_STUDIO,
        self::TYPE_BEDSITTER,
        self::TYPE_ONE_BEDROOM,
        self::TYPE_TWO_BEDROOM,
        self::TYPE_THREE_BEDROOM,
        self::TYPE_FOUR_BEDROOM,
        self::TYPE_PENTHOUSE,
        self::TYPE_OFFICE,
    ];

    /*
    |--------------------------------------------------------------------------
    | ACTIVE MAINTENANCE STATUSES
    |--------------------------------------------------------------------------
    */

    public const ACTIVE_MAINTENANCE_STATUSES = [
        'pending',
        'approved',
        'assigned',
        'in_progress',
        'on_hold',
    ];

    /*
    |--------------------------------------------------------------------------
    | ACTIVE BOOKING STATUSES
    |--------------------------------------------------------------------------
    */

    public const ACTIVE_BOOKING_STATUSES = [
        'pending',
        'confirmed',
        'active',
    ];

    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'property_id',
        'apartment_id',

        'unit_number',
        'unit_name',
        'slug',
        'description',

        'status',
        'type',

        'bedrooms',
        'bathrooms',
        'toilets',
        'floor',

        'size',
        'size_unit',

        'price',
        'deposit',
        'service_charge',

        'has_balcony',
        'has_wifi',
        'has_furnished',
        'has_air_conditioning',

        'thumbnail',

        'available_from',
        'is_active',

        'notes',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'property_id' => 'integer',
        'apartment_id' => 'integer',

        'price' => 'decimal:2',
        'deposit' => 'decimal:2',
        'service_charge' => 'decimal:2',

        'size' => 'decimal:2',

        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'toilets' => 'integer',
        'floor' => 'integer',

        'has_balcony' => 'boolean',
        'has_wifi' => 'boolean',
        'has_furnished' => 'boolean',
        'has_air_conditioning' => 'boolean',

        'is_active' => 'boolean',

        'available_from' => 'date',

        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | APPENDED ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'formatted_price',

        'status_badge',
        'status_label',

        'full_unit_name',
        'type_label',

        'thumbnail_url',

        'is_available',
        'can_be_booked',

        'has_active_tenancy',
        'has_active_booking',
        'has_active_maintenance',

        'current_tenancy',
        'current_tenant',
    ];

    /*
    |--------------------------------------------------------------------------
    | BOOT
    |--------------------------------------------------------------------------
    */

    protected static function boot(): void
    {
        parent::boot();

        /*
        |--------------------------------------------------------------------------
        | CREATING
        |--------------------------------------------------------------------------
        */

        static::creating(function (Unit $unit): void {

            if (blank($unit->slug)) {
                $unit->slug = static::generateUniqueSlug(
                    $unit->unit_name
                        ?: 'unit-' . $unit->unit_number
                );
            }

            if (blank($unit->status)) {
                $unit->status = self::STATUS_VACANT;
            }

            if ($unit->is_active === null) {
                $unit->is_active = true;
            }
        });

        /*
        |--------------------------------------------------------------------------
        | UPDATING
        |--------------------------------------------------------------------------
        */

        static::updating(function (Unit $unit): void {

            if (
                $unit->isDirty('unit_name') ||
                $unit->isDirty('unit_number')
            ) {
                $unit->slug = static::generateUniqueSlug(
                    $unit->unit_name
                        ?: 'unit-' . $unit->unit_number,
                    $unit->id
                );
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ROUTE KEY
    |--------------------------------------------------------------------------
    */

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Unit belongs to a property.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(
            Property::class,
            'property_id'
        );
    }

    /**
     * Unit belongs to an apartment.
     */
    public function apartment(): BelongsTo
    {
        return $this->belongsTo(
            Apartment::class,
            'apartment_id'
        );
    }

    /**
     * All tenancies for this unit.
     */
    public function tenancies(): HasMany
    {
        return $this->hasMany(
            Tenancy::class,
            'unit_id'
        );
    }

    /**
     * Current active tenancy.
     */
    public function activeTenancy(): HasOne
    {
        return $this->hasOne(
            Tenancy::class,
            'unit_id'
        )
            ->where('status', Tenancy::STATUS_ACTIVE)
            ->where('is_active', true)
            ->where(function (Builder $query) {
                $query
                    ->whereNull('start_date')
                    ->orWhereDate('start_date', '<=', now());
            })
            ->where(function (Builder $query) {
                $query
                    ->whereNull('end_date')
                    ->orWhereDate('end_date', '>=', now());
            });
    }

    /**
     * All bookings for this unit.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(
            Booking::class,
            'unit_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZED MAINTENANCE RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * All normalized maintenance requests for this unit.
     *
     * Uses the maintenance_requests table through
     * App\Models\MaintenanceRequest.
     */
    public function maintenanceRequests(): HasMany
    {
        return $this->hasMany(
            MaintenanceRequest::class,
            'unit_id'
        );
    }

    /**
     * Backward-compatible relationship.
     *
     * Older controllers, services and resources may still call
     * maintenances(). This now points to MaintenanceRequest.
     *
     * It does NOT use the deleted Maintenance model.
     *
     * @deprecated Use maintenanceRequests() instead.
     */
    public function maintenances(): HasMany
    {
        return $this->maintenanceRequests();
    }

    /**
     * Active maintenance requests.
     */
    public function activeMaintenanceRequests(): HasMany
    {
        return $this->maintenanceRequests()
            ->whereIn(
                'status',
                self::ACTIVE_MAINTENANCE_STATUSES
            );
    }

    /**
     * Completed maintenance requests.
     */
    public function completedMaintenanceRequests(): HasMany
    {
        return $this->maintenanceRequests()
            ->where('status', 'completed');
    }

    /**
     * Emergency maintenance requests.
     */
    public function emergencyMaintenanceRequests(): HasMany
    {
        return $this->maintenanceRequests()
            ->where('is_emergency', true);
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Vacant units.
     */
    public function scopeVacant(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_VACANT
        );
    }

    /**
     * Occupied units.
     */
    public function scopeOccupied(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_OCCUPIED
        );
    }

    /**
     * Units under maintenance.
     */
    public function scopeMaintenance(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_MAINTENANCE
        );
    }

    /**
     * Reserved units.
     */
    public function scopeReserved(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_RESERVED
        );
    }

    /**
     * Units belonging to a property.
     */
    public function scopeProperty(
        Builder $query,
        int $propertyId
    ): Builder {
        return $query->where(
            'property_id',
            $propertyId
        );
    }

    /**
     * Units belonging to an apartment.
     */
    public function scopeApartment(
        Builder $query,
        int $apartmentId
    ): Builder {
        return $query->where(
            'apartment_id',
            $apartmentId
        );
    }

    /**
     * Units of a specific type.
     */
    public function scopeType(
        Builder $query,
        string $type
    ): Builder {
        return $query->where(
            'type',
            $type
        );
    }

    /**
     * Units with active tenancies.
     */
    public function scopeWithActiveTenancy(
        Builder $query
    ): Builder {
        return $query->whereHas(
            'activeTenancy'
        );
    }

    /**
     * Units without active tenancies.
     */
    public function scopeWithoutActiveTenancy(
        Builder $query
    ): Builder {
        return $query->whereDoesntHave(
            'activeTenancy'
        );
    }

    /**
     * Units with active maintenance requests.
     */
    public function scopeWithActiveMaintenance(
        Builder $query
    ): Builder {
        return $query->whereHas(
            'maintenanceRequests',
            function (Builder $maintenanceQuery) {
                $maintenanceQuery->whereIn(
                    'status',
                    self::ACTIVE_MAINTENANCE_STATUSES
                );
            }
        );
    }

    /**
     * Units without active maintenance requests.
     */
    public function scopeWithoutActiveMaintenance(
        Builder $query
    ): Builder {
        return $query->whereDoesntHave(
            'maintenanceRequests',
            function (Builder $maintenanceQuery) {
                $maintenanceQuery->whereIn(
                    'status',
                    self::ACTIVE_MAINTENANCE_STATUSES
                );
            }
        );
    }

    /**
     * Units with active bookings.
     */
    public function scopeWithActiveBooking(
        Builder $query
    ): Builder {
        return $query->whereHas(
            'bookings',
            function (Builder $bookingQuery) {
                $bookingQuery->whereIn(
                    'status',
                    self::ACTIVE_BOOKING_STATUSES
                );
            }
        );
    }

    /**
     * Units without active bookings.
     */
    public function scopeWithoutActiveBooking(
        Builder $query
    ): Builder {
        return $query->whereDoesntHave(
            'bookings',
            function (Builder $bookingQuery) {
                $bookingQuery->whereIn(
                    'status',
                    self::ACTIVE_BOOKING_STATUSES
                );
            }
        );
    }

    /**
     * Units with vacant status.
     */
    public function scopeAvailable(
        Builder $query
    ): Builder {
        return $query
            ->where('status', self::STATUS_VACANT)
            ->where('is_active', true)
            ->whereDoesntHave('activeTenancy')
            ->whereDoesntHave(
                'maintenanceRequests',
                function (Builder $maintenanceQuery) {
                    $maintenanceQuery->whereIn(
                        'status',
                        self::ACTIVE_MAINTENANCE_STATUSES
                    );
                }
            )
            ->whereDoesntHave(
                'bookings',
                function (Builder $bookingQuery) {
                    $bookingQuery->whereIn(
                        'status',
                        self::ACTIVE_BOOKING_STATUSES
                    );
                }
            );
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Formatted rental price.
     */
    public function getFormattedPriceAttribute(): string
    {
        return 'KES ' . number_format(
            (float) ($this->price ?? 0),
            2
        );
    }

    /**
     * Status badge.
     */
    public function getStatusBadgeAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_VACANT => 'success',
            self::STATUS_OCCUPIED => 'primary',
            self::STATUS_RESERVED => 'info',
            self::STATUS_MAINTENANCE => 'warning',
            default => 'secondary',
        };
    }

    /**
     * Human-readable status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_VACANT => 'Vacant',
            self::STATUS_OCCUPIED => 'Occupied',
            self::STATUS_RESERVED => 'Reserved',
            self::STATUS_MAINTENANCE => 'Maintenance',
            default => 'Unknown',
        };
    }

    /**
     * Human-readable unit type.
     */
    public function getTypeLabelAttribute(): ?string
    {
        if (blank($this->type)) {
            return null;
        }

        return match ($this->type) {
            self::TYPE_STUDIO => 'Studio',
            self::TYPE_BEDSITTER => 'Bedsitter',
            self::TYPE_ONE_BEDROOM => 'One Bedroom',
            self::TYPE_TWO_BEDROOM => 'Two Bedroom',
            self::TYPE_THREE_BEDROOM => 'Three Bedroom',
            self::TYPE_FOUR_BEDROOM => 'Four Bedroom',
            self::TYPE_PENTHOUSE => 'Penthouse',
            self::TYPE_OFFICE => 'Office',

            default => ucwords(
                str_replace(
                    ['_', '-'],
                    ' ',
                    (string) $this->type
                )
            ),
        };
    }

    /**
     * Full unit name.
     */
    public function getFullUnitNameAttribute(): string
    {
        if (filled($this->unit_name)) {
            return $this->unit_name;
        }

        return 'Unit ' . $this->unit_number;
    }

    /**
     * Thumbnail URL.
     */
    public function getThumbnailUrlAttribute(): string
    {
        if (blank($this->thumbnail)) {
            return asset('images/default-unit.jpg');
        }

        if (
            str_starts_with($this->thumbnail, 'http://') ||
            str_starts_with($this->thumbnail, 'https://')
        ) {
            return $this->thumbnail;
        }

        return Storage::url($this->thumbnail);
    }

    /*
    |--------------------------------------------------------------------------
    | TENANCY ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether unit has an active tenancy.
     */
    public function getHasActiveTenancyAttribute(): bool
    {
        if ($this->relationLoaded('activeTenancy')) {
            return $this->getRelation('activeTenancy') !== null;
        }

        return $this->activeTenancy()->exists();
    }

    /**
     * Get current tenancy.
     */
    public function getCurrentTenancyAttribute(): ?Tenancy
    {
        if ($this->relationLoaded('activeTenancy')) {
            return $this->getRelation('activeTenancy');
        }

        return $this->activeTenancy()->first();
    }

    /**
     * Get current tenant.
     */
    public function getCurrentTenantAttribute(): ?Tenant
    {
        $tenancy = $this->current_tenancy;

        if (!$tenancy) {
            return null;
        }

        if ($tenancy->relationLoaded('tenant')) {
            return $tenancy->getRelation('tenant');
        }

        return $tenancy->tenant()->first();
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether unit has an active booking.
     */
    public function getHasActiveBookingAttribute(): bool
    {
        if ($this->relationLoaded('bookings')) {
            return $this->getRelation('bookings')->contains(
                function ($booking) {
                    return in_array(
                        $booking->status,
                        self::ACTIVE_BOOKING_STATUSES,
                        true
                    );
                }
            );
        }

        return $this->bookings()
            ->whereIn(
                'status',
                self::ACTIVE_BOOKING_STATUSES
            )
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether unit has active maintenance.
     */
    public function getHasActiveMaintenanceAttribute(): bool
    {
        if ($this->relationLoaded('maintenanceRequests')) {
            return $this->getRelation('maintenanceRequests')
                ->contains(
                    function ($maintenanceRequest) {
                        return in_array(
                            $maintenanceRequest->status,
                            self::ACTIVE_MAINTENANCE_STATUSES,
                            true
                        );
                    }
                );
        }

        if ($this->relationLoaded('maintenances')) {
            return $this->getRelation('maintenances')
                ->contains(
                    function ($maintenanceRequest) {
                        return in_array(
                            $maintenanceRequest->status,
                            self::ACTIVE_MAINTENANCE_STATUSES,
                            true
                        );
                    }
                );
        }

        return $this->maintenanceRequests()
            ->whereIn(
                'status',
                self::ACTIVE_MAINTENANCE_STATUSES
            )
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getIsAvailableAttribute(): bool
    {
        return $this->isAvailable();
    }

    public function getCanBeBookedAttribute(): bool
    {
        return $this->canBeBooked();
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY LOGIC
    |--------------------------------------------------------------------------
    */

    public function isVacant(): bool
    {
        return $this->status === self::STATUS_VACANT;
    }

    public function isOccupied(): bool
    {
        return $this->status === self::STATUS_OCCUPIED;
    }

    public function isReserved(): bool
    {
        return $this->status === self::STATUS_RESERVED;
    }

    public function isUnderMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    /**
     * Determine whether unit is currently available.
     */
    public function isAvailable(): bool
    {
        if (!$this->isVacant()) {
            return false;
        }

        if (!$this->is_active) {
            return false;
        }

        if ($this->has_active_tenancy) {
            return false;
        }

        if ($this->has_active_booking) {
            return false;
        }

        if ($this->has_active_maintenance) {
            return false;
        }

        return true;
    }

    /**
     * Determine whether unit can be booked.
     */
    public function canBeBooked(): bool
    {
        return $this->isAvailable();
    }

    /*
    |--------------------------------------------------------------------------
    | TENANCY HELPERS
    |--------------------------------------------------------------------------
    */

    public function canAssignTenant(): bool
    {
        return $this->isAvailable();
    }

    public function hasTenant(): bool
    {
        return $this->has_active_tenancy;
    }

    public function currentTenantId(): ?int
    {
        return $this->current_tenant?->id;
    }

    public function currentTenantUserId(): ?int
    {
        return $this->current_tenant?->user_id;
    }

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE HELPERS
    |--------------------------------------------------------------------------
    */

    public function hasMaintenanceRequests(): bool
    {
        return $this->maintenanceRequests()->exists();
    }

    public function hasActiveMaintenanceRequests(): bool
    {
        return $this->activeMaintenanceRequests()->exists();
    }

    public function hasEmergencyMaintenanceRequests(): bool
    {
        return $this->emergencyMaintenanceRequests()->exists();
    }

    public function getMaintenanceRequestsCount(): int
    {
        return $this->maintenanceRequests()->count();
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS HELPERS
    |--------------------------------------------------------------------------
    */

    public function markAsVacant(): bool
    {
        return $this->update([
            'status' => self::STATUS_VACANT,
        ]);
    }

    public function markAsOccupied(): bool
    {
        return $this->update([
            'status' => self::STATUS_OCCUPIED,
        ]);
    }

    public function markAsReserved(): bool
    {
        return $this->update([
            'status' => self::STATUS_RESERVED,
        ]);
    }

    public function markAsMaintenance(): bool
    {
        return $this->update([
            'status' => self::STATUS_MAINTENANCE,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SLUG GENERATOR
    |--------------------------------------------------------------------------
    */

    protected static function generateUniqueSlug(
        string $text,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug($text);

        if (blank($baseSlug)) {
            $baseSlug = 'unit';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (
            static::where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn (Builder $query) =>
                        $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
