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
    | These relationships are required by UnitResource.
    |
    | tenancies.tenant
    | -----------------
    | Loads the tenancy history together with the tenant attached to
    | each tenancy.
    |
    | maintenances
    | ------------
    | Loads maintenance records used by UnitResource.
    |
    */

    protected $with = [
        'property',
        'apartment',
        'tenancies.tenant',
        'maintenances',
    ];

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const STATUS_VACANT      = 'vacant';
    public const STATUS_OCCUPIED    = 'occupied';
    public const STATUS_MAINTENANCE = 'maintenance';
    public const STATUS_RESERVED    = 'reserved';

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
        | Relationships
        */
        'property_id',
        'apartment_id',

        /*
        | Basic information
        */
        'unit_number',
        'unit_name',
        'slug',
        'description',

        /*
        | Classification
        */
        'status',
        'type',

        /*
        | Rooms
        */
        'bedrooms',
        'bathrooms',
        'toilets',
        'floor',

        /*
        | Size
        */
        'size',
        'size_unit',

        /*
        | Pricing
        */
        'price',
        'deposit',
        'service_charge',

        /*
        | Features
        */
        'has_balcony',
        'has_wifi',
        'has_furnished',
        'has_air_conditioning',

        /*
        | Media
        */
        'thumbnail',

        /*
        | Availability
        */
        'available_from',

        /*
        | Notes
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
        | Relationships
        */
        'property_id'  => 'integer',
        'apartment_id' => 'integer',

        /*
        | Pricing
        */
        'price'          => 'decimal:2',
        'deposit'        => 'decimal:2',
        'service_charge' => 'decimal:2',

        /*
        | Size
        */
        'size' => 'decimal:2',

        /*
        | Rooms
        */
        'bedrooms'  => 'integer',
        'bathrooms' => 'integer',
        'toilets'   => 'integer',
        'floor'     => 'integer',

        /*
        | Features
        */
        'has_balcony'          => 'boolean',
        'has_wifi'             => 'boolean',
        'has_furnished'        => 'boolean',
        'has_air_conditioning' => 'boolean',

        /*
        | Availability
        */
        'available_from' => 'date',

        /*
        | Timestamps
        */
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | APPENDS
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'formatted_price',
        'status_badge',
        'status_label',
        'full_unit_name',
        'thumbnail_url',

        /*
        | Booking
        */
        'has_bookings',
        'has_active_booking',

        /*
        | Maintenance
        */
        'has_maintenance',
        'has_active_maintenance',

        /*
        | Tenancy
        */
        'has_active_tenancy',

        /*
        | Availability
        */
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

        static::creating(function (Unit $unit) {

            /*
            | Generate unique slug.
            */
            if (blank($unit->slug)) {
                $unit->slug = static::generateUniqueSlug(
                    $unit->unit_name ?: 'unit-' . $unit->unit_number
                );
            }

            /*
            | Default status.
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

        static::updating(function (Unit $unit) {

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

    public function scopeVacant(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_VACANT
        );
    }

    public function scopeOccupied(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_OCCUPIED
        );
    }

    public function scopeMaintenance(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_MAINTENANCE
        );
    }

    public function scopeReserved(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_RESERVED
        );
    }

    /**
     * Units that are currently active.
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

    public function scopeWithBookings(Builder $query): Builder
    {
        return $query->has('bookings');
    }

    public function scopeWithoutBookings(Builder $query): Builder
    {
        return $query->doesntHave('bookings');
    }

    public function scopeWithActiveBookings(Builder $query): Builder
    {
        return $query->whereHas(
            'bookings',
            function (Builder $bookingQuery) {
                $bookingQuery->whereIn('status', [
                    Booking::STATUS_PENDING,
                    Booking::STATUS_CONFIRMED,
                    Booking::STATUS_APPROVED,
                ]);
            }
        );
    }

    public function scopeWithoutActiveBookings(Builder $query): Builder
    {
        return $query->whereDoesntHave(
            'bookings',
            function (Builder $bookingQuery) {
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

    public function scopeWithTenancies(Builder $query): Builder
    {
        return $query->has('tenancies');
    }

    public function scopeWithoutTenancies(Builder $query): Builder
    {
        return $query->doesntHave('tenancies');
    }

    public function scopeWithActiveTenancy(Builder $query): Builder
    {
        return $query->whereHas(
            'tenancies',
            function (Builder $tenancyQuery) {
                $tenancyQuery->where(
                    'status',
                    Tenancy::STATUS_ACTIVE
                );
            }
        );
    }

    public function scopeWithoutActiveTenancy(Builder $query): Builder
    {
        return $query->whereDoesntHave(
            'tenancies',
            function (Builder $tenancyQuery) {
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

    public function scopeWithMaintenance(Builder $query): Builder
    {
        return $query->has('maintenances');
    }

    public function scopeWithoutMaintenance(Builder $query): Builder
    {
        return $query->doesntHave('maintenances');
    }

    public function scopeUnderMaintenance(Builder $query): Builder
    {
        return $query->whereHas(
            'maintenances',
            function (Builder $maintenanceQuery) {
                $maintenanceQuery->whereIn('status', [
                    Maintenance::STATUS_PENDING,
                    Maintenance::STATUS_ASSIGNED,
                    Maintenance::STATUS_IN_PROGRESS,
                    Maintenance::STATUS_ON_HOLD,
                ]);
            }
        );
    }

    public function scopeWithEmergencyMaintenance(Builder $query): Builder
    {
        return $query->whereHas(
            'maintenances',
            function (Builder $maintenanceQuery) {
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

    public function scopeProperty(
        Builder $query,
        int $propertyId
    ): Builder {
        return $query->where(
            'property_id',
            $propertyId
        );
    }

    public function scopeApartment(
        Builder $query,
        int $apartmentId
    ): Builder {
        return $query->where(
            'apartment_id',
            $apartmentId
        );
    }

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

    public function getFormattedPriceAttribute(): string
    {
        return 'KES ' . number_format(
            (float) ($this->price ?? 0),
            2
        );
    }

    public function getStatusBadgeAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_VACANT      => 'success',
            self::STATUS_OCCUPIED    => 'primary',
            self::STATUS_RESERVED    => 'info',
            self::STATUS_MAINTENANCE => 'warning',
            default                  => 'secondary',
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_VACANT      => 'Vacant',
            self::STATUS_OCCUPIED    => 'Occupied',
            self::STATUS_RESERVED    => 'Reserved',
            self::STATUS_MAINTENANCE => 'Maintenance',
            default                  => 'Unknown',
        };
    }

    public function getFullUnitNameAttribute(): string
    {
        return filled($this->unit_name)
            ? $this->unit_name
            : 'Unit ' . $this->unit_number;
    }

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
    | BOOKING ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getHasBookingsAttribute(): bool
    {
        if ($this->relationLoaded('bookings')) {
            return $this->bookings->isNotEmpty();
        }

        return $this->bookings()->exists();
    }

    public function getHasActiveBookingAttribute(): bool
    {
        $activeStatuses = [
            Booking::STATUS_PENDING,
            Booking::STATUS_CONFIRMED,
            Booking::STATUS_APPROVED,
        ];

        if ($this->relationLoaded('bookings')) {
            return $this->bookings
                ->whereIn('status', $activeStatuses)
                ->isNotEmpty();
        }

        return $this->bookings()
            ->whereIn('status', $activeStatuses)
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getHasMaintenanceAttribute(): bool
    {
        if ($this->relationLoaded('maintenances')) {
            return $this->maintenances->isNotEmpty();
        }

        return $this->maintenances()->exists();
    }

    public function getHasActiveMaintenanceAttribute(): bool
    {
        $activeStatuses = [
            Maintenance::STATUS_PENDING,
            Maintenance::STATUS_ASSIGNED,
            Maintenance::STATUS_IN_PROGRESS,
            Maintenance::STATUS_ON_HOLD,
        ];

        if ($this->relationLoaded('maintenances')) {
            return $this->maintenances
                ->whereIn('status', $activeStatuses)
                ->isNotEmpty();
        }

        return $this->maintenances()
            ->whereIn('status', $activeStatuses)
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | TENANCY ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getHasActiveTenancyAttribute(): bool
    {
        if ($this->relationLoaded('tenancies')) {
            return $this->tenancies
                ->where(
                    'status',
                    Tenancy::STATUS_ACTIVE
                )
                ->isNotEmpty();
        }

        return $this->tenancies()
            ->where(
                'status',
                Tenancy::STATUS_ACTIVE
            )
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT HELPERS
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

    public function isAvailable(): bool
    {
        return $this->status === self::STATUS_VACANT;
    }

    public function canBeBooked(): bool
    {
        return $this->isVacant()
            && !$this->has_active_booking
            && !$this->has_active_maintenance
            && !$this->has_active_tenancy;
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
