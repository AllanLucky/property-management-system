<?php

namespace App\Models;

use App\Models\Apartment;
use App\Models\Booking;
use App\Models\Maintenance;
use App\Models\Property;
use App\Models\Tenancy;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
    | EAGER LOADING
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Do NOT globally eager-load heavy relationships here.
    |
    | The previous implementation loaded:
    |
    | - property
    | - apartment
    | - complete tenancy history + tenants
    | - all maintenance records
    |
    | for EVERY Unit query.
    |
    | This becomes extremely expensive when the system contains thousands
    | of units.
    |
    | Relationships should instead be loaded explicitly by the repository
    | depending on the endpoint being called.
    |
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
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [

        /*
        |--------------------------------------------------------------------------
        | Relationships
        |--------------------------------------------------------------------------
        */

        'property_id',
        'apartment_id',

        /*
        |--------------------------------------------------------------------------
        | Basic information
        |--------------------------------------------------------------------------
        */

        'unit_number',
        'unit_name',
        'slug',
        'description',

        /*
        |--------------------------------------------------------------------------
        | Classification
        |--------------------------------------------------------------------------
        */

        'status',
        'type',

        /*
        |--------------------------------------------------------------------------
        | Rooms
        |--------------------------------------------------------------------------
        */

        'bedrooms',
        'bathrooms',
        'toilets',
        'floor',

        /*
        |--------------------------------------------------------------------------
        | Size
        |--------------------------------------------------------------------------
        */

        'size',
        'size_unit',

        /*
        |--------------------------------------------------------------------------
        | Pricing
        |--------------------------------------------------------------------------
        */

        'price',
        'deposit',
        'service_charge',

        /*
        |--------------------------------------------------------------------------
        | Features
        |--------------------------------------------------------------------------
        */

        'has_balcony',
        'has_wifi',
        'has_furnished',
        'has_air_conditioning',

        /*
        |--------------------------------------------------------------------------
        | Media
        |--------------------------------------------------------------------------
        */

        'thumbnail',

        /*
        |--------------------------------------------------------------------------
        | Availability
        |--------------------------------------------------------------------------
        */

        'available_from',

        /*
        |--------------------------------------------------------------------------
        | Notes
        |--------------------------------------------------------------------------
        */

        'notes',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected $casts = [

        /*
        |--------------------------------------------------------------------------
        | Relationships
        |--------------------------------------------------------------------------
        */

        'property_id' => 'integer',
        'apartment_id' => 'integer',

        /*
        |--------------------------------------------------------------------------
        | Pricing
        |--------------------------------------------------------------------------
        */

        'price' => 'decimal:2',
        'deposit' => 'decimal:2',
        'service_charge' => 'decimal:2',

        /*
        |--------------------------------------------------------------------------
        | Size
        |--------------------------------------------------------------------------
        */

        'size' => 'decimal:2',

        /*
        |--------------------------------------------------------------------------
        | Rooms
        |--------------------------------------------------------------------------
        */

        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'toilets' => 'integer',
        'floor' => 'integer',

        /*
        |--------------------------------------------------------------------------
        | Features
        |--------------------------------------------------------------------------
        */

        'has_balcony' => 'boolean',
        'has_wifi' => 'boolean',
        'has_furnished' => 'boolean',
        'has_air_conditioning' => 'boolean',

        /*
        |--------------------------------------------------------------------------
        | Availability
        |--------------------------------------------------------------------------
        */

        'available_from' => 'date',

        /*
        |--------------------------------------------------------------------------
        | Timestamps
        |--------------------------------------------------------------------------
        */

        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | APPENDS
    |--------------------------------------------------------------------------
    |
    | IMPORTANT PERFORMANCE NOTE:
    |
    | Do not append relationship-dependent attributes that execute
    | database queries automatically.
    |
    | The previous implementation appended:
    |
    | - has_bookings
    | - has_active_booking
    | - has_maintenance
    | - has_active_maintenance
    | - has_active_tenancy
    |
    | These accessors could execute EXISTS queries for every unit.
    |
    | For large lists, these values should be supplied by the repository
    | using withExists().
    |
    */

    protected $appends = [
        'formatted_price',
        'status_badge',
        'status_label',
        'full_unit_name',
        'thumbnail_url',
        'is_available',
        'can_be_booked',
    ];

    /*
    |--------------------------------------------------------------------------
    | MODEL EVENTS
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

            /*
            |--------------------------------------------------------------------------
            | Generate unique slug
            |--------------------------------------------------------------------------
            */

            if (blank($unit->slug)) {
                $unit->slug = static::generateUniqueSlug(
                    $unit->unit_name ?: 'unit-' . $unit->unit_number
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Default status
            |--------------------------------------------------------------------------
            */

            if (blank($unit->status)) {
                $unit->status = self::STATUS_VACANT;
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
                    $unit->unit_name ?: 'unit-' . $unit->unit_number,
                    $unit->id
                );
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ROUTE MODEL BINDING
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
     * Property that owns this unit.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(
            Property::class,
            'property_id'
        );
    }

    /**
     * Apartment that owns this unit.
     */
    public function apartment(): BelongsTo
    {
        return $this->belongsTo(
            Apartment::class,
            'apartment_id'
        );
    }

    /**
     * Unit tenancy history.
     */
    public function tenancies(): HasMany
    {
        return $this->hasMany(
            Tenancy::class,
            'unit_id'
        );
    }

    /**
     * Bookings made for this unit.
     */
    public function bookings(): HasMany
    {
        return $this->hasMany(
            Booking::class,
            'unit_id'
        );
    }

    /**
     * Maintenance requests associated with this unit.
     */
    public function maintenances(): HasMany
    {
        return $this->hasMany(
            Maintenance::class,
            'unit_id'
        );
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
     * Active units.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [
            self::STATUS_VACANT,
            self::STATUS_OCCUPIED,
            self::STATUS_RESERVED,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Units with at least one booking.
     */
    public function scopeWithBookings(Builder $query): Builder
    {
        return $query->has('bookings');
    }

    /**
     * Units without bookings.
     */
    public function scopeWithoutBookings(Builder $query): Builder
    {
        return $query->doesntHave('bookings');
    }

    /**
     * Units with active bookings.
     */
    public function scopeWithActiveBookings(Builder $query): Builder
    {
        return $query->whereHas(
            'bookings',
            function (Builder $bookingQuery): void {
                $bookingQuery->whereIn('status', [
                    Booking::STATUS_PENDING,
                    Booking::STATUS_CONFIRMED,
                    Booking::STATUS_APPROVED,
                ]);
            }
        );
    }

    /**
     * Units without active bookings.
     */
    public function scopeWithoutActiveBookings(Builder $query): Builder
    {
        return $query->whereDoesntHave(
            'bookings',
            function (Builder $bookingQuery): void {
                $bookingQuery->whereIn('status', [
                    Booking::STATUS_PENDING,
                    Booking::STATUS_CONFIRMED,
                    Booking::STATUS_APPROVED,
                ]);
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TENANCY SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Units with tenancy history.
     */
    public function scopeWithTenancies(Builder $query): Builder
    {
        return $query->has('tenancies');
    }

    /**
     * Units without tenancy history.
     */
    public function scopeWithoutTenancies(Builder $query): Builder
    {
        return $query->doesntHave('tenancies');
    }

    /**
     * Units with an active tenancy.
     */
    public function scopeWithActiveTenancy(Builder $query): Builder
    {
        return $query->whereHas(
            'tenancies',
            function (Builder $tenancyQuery): void {
                $tenancyQuery->where(
                    'status',
                    Tenancy::STATUS_ACTIVE
                );
            }
        );
    }

    /**
     * Units without an active tenancy.
     */
    public function scopeWithoutActiveTenancy(Builder $query): Builder
    {
        return $query->whereDoesntHave(
            'tenancies',
            function (Builder $tenancyQuery): void {
                $tenancyQuery->where(
                    'status',
                    Tenancy::STATUS_ACTIVE
                );
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Units with maintenance history.
     */
    public function scopeWithMaintenance(Builder $query): Builder
    {
        return $query->has('maintenances');
    }

    /**
     * Units without maintenance history.
     */
    public function scopeWithoutMaintenance(Builder $query): Builder
    {
        return $query->doesntHave('maintenances');
    }

    /**
     * Units currently under maintenance.
     */
    public function scopeUnderMaintenance(Builder $query): Builder
    {
        return $query->whereHas(
            'maintenances',
            function (Builder $maintenanceQuery): void {
                $maintenanceQuery->whereIn('status', [
                    Maintenance::STATUS_PENDING,
                    Maintenance::STATUS_ASSIGNED,
                    Maintenance::STATUS_IN_PROGRESS,
                    Maintenance::STATUS_ON_HOLD,
                ]);
            }
        );
    }

    /**
     * Units with emergency maintenance.
     */
    public function scopeWithEmergencyMaintenance(Builder $query): Builder
    {
        return $query->whereHas(
            'maintenances',
            function (Builder $maintenanceQuery): void {
                $maintenanceQuery
                    ->where('is_emergency', true)
                    ->whereNotIn('status', [
                        Maintenance::STATUS_COMPLETED,
                        Maintenance::STATUS_CANCELLED,
                        Maintenance::STATUS_REJECTED,
                    ]);
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Filter by property.
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
     * Filter by apartment.
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
     * Filter by floor.
     */
    public function scopeFloor(
        Builder $query,
        int $floor
    ): Builder {
        return $query->where(
            'floor',
            $floor
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
     * Full unit name.
     */
    public function getFullUnitNameAttribute(): string
    {
        return filled($this->unit_name)
            ? $this->unit_name
            : 'Unit ' . $this->unit_number;
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
    | RELATIONSHIP-AWARE ACCESSORS
    |--------------------------------------------------------------------------
    |
    | These accessors are intentionally NOT included in $appends.
    |
    | If the relationship has already been loaded, they use the collection
    | without triggering another database query.
    |
    | If the relationship has not been loaded, they return false rather
    | than silently executing a query for every Unit.
    |
    | For list endpoints, use withExists() in the repository.
    |
    */

    /**
     * Determine whether this unit has bookings.
     */
    public function getHasBookingsAttribute(): bool
    {
        if (!$this->relationLoaded('bookings')) {
            return false;
        }

        return $this->bookings->isNotEmpty();
    }

    /**
     * Determine whether this unit has an active booking.
     */
    public function getHasActiveBookingAttribute(): bool
    {
        $activeStatuses = [
            Booking::STATUS_PENDING,
            Booking::STATUS_CONFIRMED,
            Booking::STATUS_APPROVED,
        ];

        if (!$this->relationLoaded('bookings')) {
            return false;
        }

        return $this->bookings
            ->whereIn('status', $activeStatuses)
            ->isNotEmpty();
    }

    /**
     * Determine whether this unit has maintenance.
     */
    public function getHasMaintenanceAttribute(): bool
    {
        if (!$this->relationLoaded('maintenances')) {
            return false;
        }

        return $this->maintenances->isNotEmpty();
    }

    /**
     * Determine whether this unit has active maintenance.
     */
    public function getHasActiveMaintenanceAttribute(): bool
    {
        $activeStatuses = [
            Maintenance::STATUS_PENDING,
            Maintenance::STATUS_ASSIGNED,
            Maintenance::STATUS_IN_PROGRESS,
            Maintenance::STATUS_ON_HOLD,
        ];

        if (!$this->relationLoaded('maintenances')) {
            return false;
        }

        return $this->maintenances
            ->whereIn('status', $activeStatuses)
            ->isNotEmpty();
    }

    /**
     * Determine whether this unit has an active tenancy.
     */
    public function getHasActiveTenancyAttribute(): bool
    {
        if (!$this->relationLoaded('tenancies')) {
            return false;
        }

        return $this->tenancies
            ->where(
                'status',
                Tenancy::STATUS_ACTIVE
            )
            ->isNotEmpty();
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the unit is vacant.
     */
    public function isVacant(): bool
    {
        return $this->status === self::STATUS_VACANT;
    }

    /**
     * Determine whether the unit is occupied.
     */
    public function isOccupied(): bool
    {
        return $this->status === self::STATUS_OCCUPIED;
    }

    /**
     * Determine whether the unit is reserved.
     */
    public function isReserved(): bool
    {
        return $this->status === self::STATUS_RESERVED;
    }

    /**
     * Determine whether the unit is under maintenance.
     */
    public function isUnderMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    /**
     * Determine whether the unit is available.
     */
    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_VACANT;
    }

    /**
     * Determine whether the unit can be booked.
     *
     * NOTE:
     *
     * For complete booking validation, the service layer should perform
     * a fresh database check for active bookings, maintenance and tenancy.
     *
     * This model helper only uses values already loaded onto the model.
     */
    public function canBeBooked(): bool
    {
        if (!$this->isVacant()) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | If these relationship flags were loaded by withExists(), use them.
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists('has_active_booking', $this->attributes) &&
            (bool) $this->attributes['has_active_booking']
        ) {
            return false;
        }

        if (
            array_key_exists('has_active_maintenance', $this->attributes) &&
            (bool) $this->attributes['has_active_maintenance']
        ) {
            return false;
        }

        if (
            array_key_exists('has_active_tenancy', $this->attributes) &&
            (bool) $this->attributes['has_active_tenancy']
        ) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | If relationships are explicitly loaded, verify them.
        |--------------------------------------------------------------------------
        */

        if (
            $this->relationLoaded('bookings') &&
            $this->has_active_booking
        ) {
            return false;
        }

        if (
            $this->relationLoaded('maintenances') &&
            $this->has_active_maintenance
        ) {
            return false;
        }

        if (
            $this->relationLoaded('tenancies') &&
            $this->has_active_tenancy
        ) {
            return false;
        }

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | SLUG GENERATOR
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique unit slug.
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

