<?php

namespace App\Models;

use App\Models\Apartment;
use App\Models\Booking;
use App\Models\Maintenance;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Tenancy;
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
    |
    | These values must match the values stored in the `type` column.
    |
    */

    public const TYPE_STUDIO = 'studio';

    public const TYPE_BEDSITTER = 'bedsitter';

    public const TYPE_ONE_BEDROOM = 'one_bedroom';

    public const TYPE_TWO_BEDROOM = 'two_bedroom';

    public const TYPE_THREE_BEDROOM = 'three_bedroom';

    public const TYPE_FOUR_BEDROOM = 'four_bedroom';

    public const TYPE_PENTHOUSE = 'penthouse';

    public const TYPE_OFFICE = 'office';

    /*
    |--------------------------------------------------------------------------
    | ALL SUPPORTED UNIT TYPES
    |--------------------------------------------------------------------------
    */

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
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [

        /*
        | Property hierarchy
        */
        'property_id',

        'apartment_id',

        /*
        | Unit identification
        */
        'unit_number',

        'unit_name',

        'slug',

        'description',

        /*
        | Status
        */
        'status',

        /*
        | Unit type
        */
        'type',

        /*
        | Unit specifications
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
        | Financial
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

        'is_active',

        /*
        | Additional information
        */
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

        /*
        | Pricing
        */
        'formatted_price',

        /*
        | Status
        */
        'status_badge',

        'status_label',

        /*
        | Unit identification
        */
        'full_unit_name',

        'type_label',

        /*
        | Media
        */
        'thumbnail_url',

        /*
        | Availability
        */
        'is_available',

        'can_be_booked',

        /*
        | Tenancy
        */
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
        | Creating
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
        | Updating
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
     * Unit belongs to property.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(
            Property::class,
            'property_id'
        );
    }

    /**
     * Unit belongs to apartment.
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
     *
     * This is the tenancy responsible for occupying
     * the unit right now.
     */
    public function activeTenancy(): HasOne
    {
        return $this->hasOne(
            Tenancy::class,
            'unit_id'
        )
            ->where(
                'status',
                Tenancy::STATUS_ACTIVE
            )
            ->where(
                'is_active',
                true
            )
            ->where(function (Builder $query) {
                $query
                    ->whereNull('start_date')
                    ->orWhereDate(
                        'start_date',
                        '<=',
                        now()
                    );
            })
            ->where(function (Builder $query) {
                $query
                    ->whereNull('end_date')
                    ->orWhereDate(
                        'end_date',
                        '>=',
                        now()
                    );
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

    /**
     * All maintenance records for this unit.
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
    public function scopeVacant(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_VACANT
        );
    }

    /**
     * Occupied units.
     */
    public function scopeOccupied(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_OCCUPIED
        );
    }

    /**
     * Units under maintenance.
     */
    public function scopeMaintenance(
        Builder $query
    ): Builder {
        return $query->where(
            'status',
            self::STATUS_MAINTENANCE
        );
    }

    /**
     * Reserved units.
     */
    public function scopeReserved(
        Builder $query
    ): Builder {
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
     * Available units.
     */
    public function scopeAvailable(
        Builder $query
    ): Builder {
        return $query
            ->where(
                'status',
                self::STATUS_VACANT
            )
            ->where(
                'is_active',
                true
            )
            ->whereDoesntHave(
                'activeTenancy'
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

            self::STATUS_VACANT =>
                'success',

            self::STATUS_OCCUPIED =>
                'primary',

            self::STATUS_RESERVED =>
                'info',

            self::STATUS_MAINTENANCE =>
                'warning',

            default =>
                'secondary',
        };
    }

    /**
     * Human-readable status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {

            self::STATUS_VACANT =>
                'Vacant',

            self::STATUS_OCCUPIED =>
                'Occupied',

            self::STATUS_RESERVED =>
                'Reserved',

            self::STATUS_MAINTENANCE =>
                'Maintenance',

            default =>
                'Unknown',
        };
    }

    /**
     * Human-readable unit type.
     *
     * Examples:
     *
     * studio       -> Studio
     * bedsitter    -> Bedsitter
     * one_bedroom  -> One Bedroom
     * two_bedroom  -> Two Bedroom
     * penthouse    -> Penthouse
     * office       -> Office
     */
    public function getTypeLabelAttribute(): ?string
    {
        if (blank($this->type)) {
            return null;
        }

        return match ($this->type) {

            self::TYPE_STUDIO =>
                'Studio',

            self::TYPE_BEDSITTER =>
                'Bedsitter',

            self::TYPE_ONE_BEDROOM =>
                'One Bedroom',

            self::TYPE_TWO_BEDROOM =>
                'Two Bedroom',

            self::TYPE_THREE_BEDROOM =>
                'Three Bedroom',

            self::TYPE_FOUR_BEDROOM =>
                'Four Bedroom',

            self::TYPE_PENTHOUSE =>
                'Penthouse',

            self::TYPE_OFFICE =>
                'Office',

            default =>
                ucwords(
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
            return asset(
                'images/default-unit.jpg'
            );
        }

        if (
            str_starts_with(
                $this->thumbnail,
                'http://'
            ) ||
            str_starts_with(
                $this->thumbnail,
                'https://'
            )
        ) {
            return $this->thumbnail;
        }

        return Storage::url(
            $this->thumbnail
        );
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
            return $this->activeTenancy !== null;
        }

        return $this->activeTenancy()->exists();
    }

    /**
     * Get current tenancy.
     */
    public function getCurrentTenancyAttribute(): ?Tenancy
    {
        if ($this->relationLoaded('activeTenancy')) {
            return $this->activeTenancy;
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
            return $tenancy->tenant;
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
            return $this->bookings->contains(
                function ($booking) {
                    return in_array(
                        $booking->status,
                        [
                            'pending',
                            'confirmed',
                            'active',
                        ],
                        true
                    );
                }
            );
        }

        return $this->bookings()
            ->whereIn(
                'status',
                [
                    'pending',
                    'confirmed',
                    'active',
                ]
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
        if ($this->relationLoaded('maintenances')) {
            return $this->maintenances->contains(
                function ($maintenance) {
                    return in_array(
                        $maintenance->status,
                        [
                            'pending',
                            'scheduled',
                            'in_progress',
                            'active',
                        ],
                        true
                    );
                }
            );
        }

        return $this->maintenances()
            ->whereIn(
                'status',
                [
                    'pending',
                    'scheduled',
                    'in_progress',
                    'active',
                ]
            )
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether unit is available.
     */
    public function getIsAvailableAttribute(): bool
    {
        return $this->isAvailable();
    }

    /**
     * Determine whether unit can be booked.
     */
    public function getCanBeBookedAttribute(): bool
    {
        return $this->canBeBooked();
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY LOGIC
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether unit is vacant.
     */
    public function isVacant(): bool
    {
        return $this->status === self::STATUS_VACANT;
    }

    /**
     * Determine whether unit is occupied.
     */
    public function isOccupied(): bool
    {
        return $this->status === self::STATUS_OCCUPIED;
    }

    /**
     * Determine whether unit is reserved.
     */
    public function isReserved(): bool
    {
        return $this->status === self::STATUS_RESERVED;
    }

    /**
     * Determine whether unit is under maintenance.
     */
    public function isUnderMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    /**
     * Determine whether unit is currently available.
     *
     * A unit is only available when:
     *
     * - Status is vacant
     * - Unit is active
     * - It has no active tenancy
     * - It has no active booking
     * - It has no active maintenance
     */
    public function isAvailable(): bool
    {
        if (!$this->isVacant()) {
            return false;
        }

        if ($this->is_active === false) {
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

    /**
     * Determine whether unit can receive a tenant.
     */
    public function canAssignTenant(): bool
    {
        return $this->isAvailable();
    }

    /**
     * Determine whether unit already has a tenant.
     */
    public function hasTenant(): bool
    {
        return $this->has_active_tenancy;
    }

    /**
     * Get the current tenant ID.
     */
    public function currentTenantId(): ?int
    {
        return $this->current_tenant?->id;
    }

    /**
     * Get the current tenant user ID.
     */
    public function currentTenantUserId(): ?int
    {
        return $this->current_tenant?->user_id;
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Mark unit as vacant.
     */
    public function markAsVacant(): bool
    {
        return $this->update([
            'status' => self::STATUS_VACANT,
        ]);
    }

    /**
     * Mark unit as occupied.
     */
    public function markAsOccupied(): bool
    {
        return $this->update([
            'status' => self::STATUS_OCCUPIED,
        ]);
    }

    /**
     * Mark unit as reserved.
     */
    public function markAsReserved(): bool
    {
        return $this->update([
            'status' => self::STATUS_RESERVED,
        ]);
    }

    /**
     * Mark unit as under maintenance.
     */
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
            static::where(
                'slug',
                $slug
            )
                ->when(
                    $ignoreId,
                    fn (Builder $query) =>
                    $query->where(
                        'id',
                        '!=',
                        $ignoreId
                    )
                )
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";

            $counter++;
        }

        return $slug;
    }
}