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
        'available_units_count',
        'total_units_count',

        'maintenance_requests_count',
        'active_maintenance_requests_count',

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
    */

    public const UNIT_STATUS_OCCUPIED = 'occupied';
    public const UNIT_STATUS_VACANT = 'vacant';
    public const UNIT_STATUS_MAINTENANCE = 'maintenance';
    public const UNIT_STATUS_RESERVED = 'reserved';

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

        static::creating(function (Apartment $apartment): void {

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

        static::updating(function (Apartment $apartment): void {

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

    /**
     * All maintenance requests associated with this apartment.
     */
    public function maintenanceRequests(): HasMany
    {
        return $this->hasMany(
            MaintenanceRequest::class,
            'apartment_id'
        );
    }

    /**
     * Active maintenance requests.
     */
    public function activeMaintenanceRequests(): HasMany
    {
        return $this->maintenanceRequests()
            ->whereIn('status', [
                MaintenanceRequest::STATUS_PENDING,
                MaintenanceRequest::STATUS_APPROVED,
                MaintenanceRequest::STATUS_ASSIGNED,
                MaintenanceRequest::STATUS_IN_PROGRESS,
                MaintenanceRequest::STATUS_ON_HOLD,
            ]);
    }

    /**
     * Emergency maintenance requests.
     */
    public function emergencyMaintenanceRequests(): HasMany
    {
        return $this->maintenanceRequests()
            ->where('is_emergency', true);
    }

    /**
     * Completed maintenance requests.
     */
    public function completedMaintenanceRequests(): HasMany
    {
        return $this->maintenanceRequests()
            ->where(
                'status',
                MaintenanceRequest::STATUS_COMPLETED
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

    /**
     * Apartments with active maintenance requests.
     */
    public function scopeWithActiveMaintenance(
        Builder $query
    ): Builder {
        return $query->whereHas(
            'activeMaintenanceRequests'
        );
    }

    /**
     * Apartments without active maintenance requests.
     */
    public function scopeWithoutActiveMaintenance(
        Builder $query
    ): Builder {
        return $query->whereDoesntHave(
            'activeMaintenanceRequests'
        );
    }

    /**
     * Apartments with vacant units.
     */
    public function scopeWithVacantUnits(
        Builder $query
    ): Builder {
        return $query->whereHas(
            'units',
            fn (Builder $unitQuery) =>
                $unitQuery->where(
                    'status',
                    self::UNIT_STATUS_VACANT
                )
        );
    }

    /**
     * Apartments with occupied units.
     */
    public function scopeWithOccupiedUnits(
        Builder $query
    ): Builder {
        return $query->whereHas(
            'units',
            fn (Builder $unitQuery) =>
                $unitQuery->where(
                    'status',
                    self::UNIT_STATUS_OCCUPIED
                )
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
            str_starts_with($this->thumbnail, 'http://') ||
            str_starts_with($this->thumbnail, 'https://')
        ) {
            return $this->thumbnail;
        }

        return Storage::url($this->thumbnail);
    }

    /**
     * Human-readable apartment status.
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
     * Number of available units.
     */
    public function getAvailableUnitsCountAttribute(): int
    {
        return $this->vacant_units_count;
    }

    /**
     * Total number of units.
     */
    public function getTotalUnitsCountAttribute(): int
    {
        return $this->units_count
            ?? $this->units()->count();
    }

    /**
     * Occupancy percentage.
     */
    public function getOccupancyRateAttribute(): float
    {
        $totalUnits = $this->getTotalUnitsCountAttribute();

        if ($totalUnits === 0) {
            return 0.0;
        }

        return round(
            ($this->occupied_units_count / $totalUnits) * 100,
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE COUNTS
    |--------------------------------------------------------------------------
    */

    /**
     * Total maintenance requests.
     */
    public function getMaintenanceRequestsCountAttribute(): int
    {
        return $this->maintenanceRequests()->count();
    }

    /**
     * Active maintenance requests count.
     */
    public function getActiveMaintenanceRequestsCountAttribute(): int
    {
        return $this->activeMaintenanceRequests()->count();
    }

    /**
     * Emergency maintenance requests count.
     */
    public function getEmergencyMaintenanceRequestsCountAttribute(): int
    {
        return $this->emergencyMaintenanceRequests()->count();
    }

    /**
     * Completed maintenance requests count.
     */
    public function getCompletedMaintenanceRequestsCountAttribute(): int
    {
        return $this->completedMaintenanceRequests()->count();
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    public function isUnderMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    public function isArchived(): bool
    {
        return $this->status === self::STATUS_ARCHIVED;
    }

    public function hasVacantUnits(): bool
    {
        return $this->vacant_units_count > 0;
    }

    public function hasOccupiedUnits(): bool
    {
        return $this->occupied_units_count > 0;
    }

    public function hasMaintenanceUnits(): bool
    {
        return $this->maintenance_units_count > 0;
    }

    public function hasUnits(): bool
    {
        return $this->getTotalUnitsCountAttribute() > 0;
    }

    public function isFull(): bool
    {
        return $this->hasUnits()
            && $this->vacant_units_count === 0;
    }

    public function hasActiveMaintenanceRequests(): bool
    {
        return $this->activeMaintenanceRequests()->exists();
    }

    public function hasEmergencyMaintenanceRequests(): bool
    {
        return $this->emergencyMaintenanceRequests()->exists();
    }

    public function hasMaintenanceRequests(): bool
    {
        return $this->maintenanceRequests()->exists();
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

        if (blank($baseSlug)) {
            $baseSlug = 'apartment';
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
