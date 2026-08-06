<?php

namespace App\Models;

use App\Models\Property;
use App\Models\Unit;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
    | EAGER LOADING
    |--------------------------------------------------------------------------
    */
    protected $with = [
        'property',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP COUNTS
    |--------------------------------------------------------------------------
    */
    protected $withCount = [
        'units',
    ];

    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    |
    | NOTE:
    | Removed "floor".
    | Each Unit belongs to a floor, not the Apartment.
    |
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
    | APPENDS
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

    /**
     * Available statuses.
     */
    public const STATUSES = [
        self::STATUS_ACTIVE,
        self::STATUS_INACTIVE,
        self::STATUS_MAINTENANCE,
        self::STATUS_ARCHIVED,
    ];

    /*
    |--------------------------------------------------------------------------
    | MODEL EVENTS
    |--------------------------------------------------------------------------
    */
    protected static function boot()
    {
        parent::boot();

        static::creating(function (Apartment $apartment) {

            if (blank($apartment->slug) && filled($apartment->name)) {
                $apartment->slug = static::generateUniqueSlug(
                    $apartment->name
                );
            }

            if (blank($apartment->status)) {
                $apartment->status = self::STATUS_ACTIVE;
            }
        });

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
     * Property that owns this apartment.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Units within this apartment.
     */
    public function units(): HasMany
    {
        return $this->hasMany(Unit::class);
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Active apartments.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    /**
     * Inactive apartments.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_INACTIVE);
    }

    /**
     * Apartments under maintenance.
     */
    public function scopeMaintenance(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_MAINTENANCE);
    }

    /**
     * Archived apartments.
     */
    public function scopeArchived(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ARCHIVED);
    }

    /**
     * Filter by property.
     */
    public function scopeProperty(
        Builder $query,
        int $propertyId
    ): Builder {
        return $query->where('property_id', $propertyId);
    }

    /**
     * Filter by block.
     */
    public function scopeBlock(
        Builder $query,
        string $block
    ): Builder {
        return $query->where('block', $block);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

        /**
     * Get apartment thumbnail URL.
     */
    public function getThumbnailUrlAttribute(): string
    {
        if (blank($this->thumbnail)) {
            return asset('images/default-apartment.jpg');
        }

        if (
            str_starts_with($this->thumbnail, 'http://') ||
            str_starts_with($this->thumbnail, 'https://')
        ) {
            return $this->thumbnail;
        }

        return Storage::url($this->thumbnail);
    }

    /**
     * Get human-readable status.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE => 'Active',
            self::STATUS_INACTIVE => 'Inactive',
            self::STATUS_MAINTENANCE => 'Maintenance',
            self::STATUS_ARCHIVED => 'Archived',
            default => 'Unknown',
        };
    }

    /**
     * Get property title.
     */
    public function getPropertyTitleAttribute(): ?string
    {
        return $this->property?->title
            ?? $this->property?->name;
    }

    /**
     * Get apartment display name.
     */
    public function getFullNameAttribute(): string
    {
        return collect([
            $this->block,
            $this->name,
        ])->filter()->implode(' - ');
    }

    /**
     * Get occupied units count.
     */
    public function getOccupiedUnitsCountAttribute(): int
    {
        return $this->units()
            ->occupied()
            ->count();
    }

    /**
     * Get vacant units count.
     */
    public function getVacantUnitsCountAttribute(): int
    {
        return $this->units()
            ->vacant()
            ->count();
    }

    /**
     * Get maintenance units count.
     */
    public function getMaintenanceUnitsCountAttribute(): int
    {
        return $this->units()
            ->maintenance()
            ->count();
    }

    /**
     * Get apartment occupancy rate.
     */
    public function getOccupancyRateAttribute(): float
    {
        $totalUnits = $this->units()->count();

        if ($totalUnits === 0) {
            return 0;
        }

        return round(
            ($this->occupied_units_count / $totalUnits) * 100,
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Check if apartment is active.
     */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    /**
     * Check if apartment is inactive.
     */
    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    /**
     * Check if apartment is under maintenance.
     */
    public function isUnderMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    /**
     * Check if apartment is archived.
     */
    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    /**
     * Check if apartment has vacant units.
     */
    public function hasVacantUnits(): bool
    {
        return $this->vacant_units_count > 0;
    }

    /**
     * Check if apartment has occupied units.
     */
    public function hasOccupiedUnits(): bool
    {
        return $this->occupied_units_count > 0;
    }

    /**
     * Check if apartment is fully occupied.
     */
    public function isFull(): bool
    {
        return $this->units_count > 0
            && $this->vacant_units_count === 0;
    }

    /*
    |--------------------------------------------------------------------------
    | SLUG GENERATOR
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique slug.
     */
    protected static function generateUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (
            static::where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn (Builder $query) => $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}