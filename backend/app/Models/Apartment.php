<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Apartment extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'apartments';

    /*
    |--------------------------------------------------------------------------
    | DEFAULT RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    protected $with = [
        'property',
    ];

    protected $withCount = [
        'units',
    ];

    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'property_id',

        'name',
        'slug',
        'description',

        'block',

        'total_floors',
        'total_units',

        'status',

        'has_elevator',
        'has_backup_generator',
        'has_security',
        'has_parking',

        'thumbnail',
        'thumbnail_public_id',

        'meta_title',
        'meta_description',
        'meta_keywords',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'property_id' => 'integer',

        'total_floors' => 'integer',
        'total_units' => 'integer',

        'has_elevator' => 'boolean',
        'has_backup_generator' => 'boolean',
        'has_security' => 'boolean',
        'has_parking' => 'boolean',

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
        'thumbnail_url',
        'status_label',
        'property_title',
        'full_name',

        'occupied_units_count',
        'vacant_units_count',
        'maintenance_units_count',

        'occupancy_rate',
    ];

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const STATUS_ACTIVE = 'active';

    public const STATUS_INACTIVE = 'inactive';

    public const STATUS_MAINTENANCE = 'maintenance';

    public const STATUS_ARCHIVED = 'archived';

    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_MAINTENANCE,
        self::STATUS_ARCHIVED,
    ];

    /*
    |--------------------------------------------------------------------------
    | UNIT STATUS CONSTANTS
    |--------------------------------------------------------------------------
    |
    | These values should match the values used by your units.status column.
    |
    */

    public const UNIT_STATUS_OCCUPIED = 'occupied';

    public const UNIT_STATUS_VACANT = 'vacant';

    public const UNIT_STATUS_MAINTENANCE = 'maintenance';

    /*
    |--------------------------------------------------------------------------
    | BOOT
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        /*
        |--------------------------------------------------------------------------
        | Creating
        |--------------------------------------------------------------------------
        */

        static::creating(function (Apartment $apartment) {

            if (
                blank($apartment->slug) &&
                filled($apartment->name)
            ) {
                $apartment->slug = static::generateUniqueSlug(
                    $apartment->name
                );
            }

            if (blank($apartment->status)) {
                $apartment->status = self::STATUS_ACTIVE;
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Updating
        |--------------------------------------------------------------------------
        */

        static::updating(function (Apartment $apartment) {

            if (
                $apartment->isDirty('name') &&
                filled($apartment->name)
            ) {
                $apartment->slug = static::generateUniqueSlug(
                    $apartment->name,
                    $apartment->id
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
     * Apartment belongs to a property.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(
            Property::class,
            'property_id'
        );
    }

    /**
     * Apartment has many units.
     */
    public function units(): HasMany
    {
        return $this->hasMany(
            Unit::class,
            'apartment_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Active apartments.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_ACTIVE
        );
    }

    /**
     * Inactive apartments.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_INACTIVE
        );
    }

    /**
     * Apartments under maintenance.
     */
    public function scopeMaintenance(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_MAINTENANCE
        );
    }

    /**
     * Archived apartments.
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_ARCHIVED
        );
    }

    /**
     * Apartments belonging to a property.
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
     * Apartments belonging to a block.
     */
    public function scopeBlock(
        Builder $query,
        string $block
    ): Builder {
        return $query->where(
            'block',
            $block
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Thumbnail URL.
     */
    public function getThumbnailUrlAttribute(): string
    {
        if (blank($this->thumbnail)) {
            return asset(
                'images/default-apartment.jpg'
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

    /**
     * Human-readable apartment status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {

            self::STATUS_ACTIVE =>
                'Active',

            self::STATUS_INACTIVE =>
                'Inactive',

            self::STATUS_MAINTENANCE =>
                'Maintenance',

            self::STATUS_ARCHIVED =>
                'Archived',

            default =>
                'Unknown',
        };
    }

    /**
     * Property title.
     */
    public function getPropertyTitleAttribute(): ?string
    {
        return $this->property?->title
            ?? $this->property?->name;
    }

    /**
     * Full apartment name.
     */
    public function getFullNameAttribute(): string
    {
        return collect([
            $this->block,
            $this->name,
        ])
            ->filter()
            ->implode(' - ');
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT COUNTS
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    | Do not call:
    |
    | $this->units()->occupied()
    |
    | unless the Unit model actually defines an occupied() scope.
    |
    | These accessors query the status column directly.
    |
    */

    /**
     * Number of occupied units.
     */
    public function getOccupiedUnitsCountAttribute(): int
    {
        return $this->units()
            ->where(
                'status',
                self::UNIT_STATUS_OCCUPIED
            )
            ->count();
    }

    /**
     * Number of vacant units.
     */
    public function getVacantUnitsCountAttribute(): int
    {
        return $this->units()
            ->where(
                'status',
                self::UNIT_STATUS_VACANT
            )
            ->count();
    }

    /**
     * Number of units under maintenance.
     */
    public function getMaintenanceUnitsCountAttribute(): int
    {
        return $this->units()
            ->where(
                'status',
                self::UNIT_STATUS_MAINTENANCE
            )
            ->count();
    }

    /**
     * Occupancy percentage.
     */
    public function getOccupancyRateAttribute(): float
    {
        $totalUnits = $this->units()->count();

        if ($totalUnits === 0) {
            return 0.0;
        }

        return round(
            (
                $this->occupied_units_count /
                $totalUnits
            ) * 100,
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether apartment is active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Determine whether apartment is inactive.
     */
    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    /**
     * Determine whether apartment is under maintenance.
     */
    public function isUnderMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    /**
     * Determine whether apartment is archived.
     */
    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    /**
     * Determine whether apartment has vacant units.
     */
    public function hasVacantUnits(): bool
    {
        return $this->vacant_units_count > 0;
    }

    /**
     * Determine whether apartment has occupied units.
     */
    public function hasOccupiedUnits(): bool
    {
        return $this->occupied_units_count > 0;
    }

    /**
     * Determine whether apartment has units under maintenance.
     */
    public function hasMaintenanceUnits(): bool
    {
        return $this->maintenance_units_count > 0;
    }

    /**
     * Determine whether apartment is full.
     */
    public function isFull(): bool
    {
        return $this->units_count > 0
            && $this->vacant_units_count === 0;
    }

    /**
     * Determine whether apartment has any units.
     */
    public function hasUnits(): bool
    {
        return $this->units_count > 0;
    }

    /**
     * Get available units count.
     */
    public function getAvailableUnitsCountAttribute(): int
    {
        return $this->vacant_units_count;
    }

    /**
     * Get total units count.
     */
    public function getTotalUnitsCountAttribute(): int
    {
        return $this->units_count;
    }

    /*
    |--------------------------------------------------------------------------
    | SLUG GENERATOR
    |--------------------------------------------------------------------------
    */

    protected static function generateUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {

        $baseSlug = Str::slug($name);

        /*
        |----------------------------------------------------------------------
        | Prevent empty slug
        |----------------------------------------------------------------------
        */

        if (blank($baseSlug)) {
            $baseSlug = 'apartment';
        }

        $slug = $baseSlug;

        $counter = 1;

        /*
        |----------------------------------------------------------------------
        | Find unique slug
        |----------------------------------------------------------------------
        */

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