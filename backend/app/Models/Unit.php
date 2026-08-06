<?php

namespace App\Models;

use App\Models\Property;
use App\Models\Apartment;
use App\Models\Tenancy;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;


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
    */
    protected $with = [
        'property',
        'apartment',
    ];


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

        'available_from' => 'date',

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
    ];


    /*
    |--------------------------------------------------------------------------
    | MODEL EVENTS
    |--------------------------------------------------------------------------
    */
    protected static function boot()
    {
        parent::boot();


        static::creating(function (Unit $unit) {

            if (blank($unit->slug)) {
                $unit->slug = static::generateUniqueSlug(
                    $unit->unit_name ?: 'unit-' . $unit->unit_number
                );
            }


            if (blank($unit->status)) {
                $unit->status = self::STATUS_VACANT;
            }

        });


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
        return $this->belongsTo(Property::class);
    }


    /**
     * Apartment that owns this unit.
     */
    public function apartment(): BelongsTo
    {
        return $this->belongsTo(Apartment::class);
    }


    /**
     * Unit tenancy history.
     */
    public function tenancies(): HasMany
    {
        return $this->hasMany(Tenancy::class);
    }



    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeVacant(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_VACANT);
    }


    public function scopeOccupied(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_OCCUPIED);
    }


    public function scopeMaintenance(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_MAINTENANCE);
    }


    public function scopeReserved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_RESERVED);
    }


    public function scopeActive(Builder $query): Builder
    {
        return $query->whereIn('status', [
            self::STATUS_VACANT,
            self::STATUS_OCCUPIED,
            self::STATUS_RESERVED,
        ]);
    }


    public function scopeProperty(
        Builder $query,
        int $propertyId
    ): Builder {
        return $query->where('property_id', $propertyId);
    }


    public function scopeApartment(
        Builder $query,
        int $apartmentId
    ): Builder {
        return $query->where('apartment_id', $apartmentId);
    }


    public function scopeFloor(
        Builder $query,
        int $floor
    ): Builder {
        return $query->where('floor', $floor);
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
            self::STATUS_VACANT => 'success',
            self::STATUS_OCCUPIED => 'primary',
            self::STATUS_RESERVED => 'info',
            self::STATUS_MAINTENANCE => 'warning',
            default => 'secondary',
        };
    }


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
    | HELPERS
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
        return in_array($this->status, [
            self::STATUS_VACANT,
            self::STATUS_RESERVED,
        ], true);
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