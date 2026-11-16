<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Region extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'regions';

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */

    public const STATUS_ACTIVE = true;

    public const STATUS_INACTIVE = false;

    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'country_id',
        'name',
        'slug',
        'code',
        'is_active',
    ];

    /*
    |--------------------------------------------------------------------------
    | HIDDEN
    |--------------------------------------------------------------------------
    */

    protected $hidden = [];

    /*
    |--------------------------------------------------------------------------
    | APPENDS
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'is_active_label',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'country_id' => 'integer',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MODEL BOOT
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

        static::creating(function (Region $region) {

            /*
            |------------------------------------------------------------------
            | GENERATE SLUG
            |------------------------------------------------------------------
            */

            if (
                empty($region->slug) &&
                !empty($region->name) &&
                !empty($region->country_id)
            ) {
                $region->slug = static::generateUniqueSlug(
                    $region->name,
                    (int) $region->country_id
                );
            }

            /*
            |------------------------------------------------------------------
            | GENERATE CODE
            |------------------------------------------------------------------
            */

            if (
                empty($region->code) &&
                !empty($region->name) &&
                !empty($region->country_id)
            ) {
                $region->code = static::generateUniqueCode(
                    $region->name,
                    (int) $region->country_id
                );
            }

            /*
            |------------------------------------------------------------------
            | DEFAULT STATUS
            |------------------------------------------------------------------
            */

            if (is_null($region->is_active)) {
                $region->is_active = self::STATUS_ACTIVE;
            }
        });

        /*
        |--------------------------------------------------------------------------
        | UPDATING
        |--------------------------------------------------------------------------
        */

        static::updating(function (Region $region) {

            /*
            |------------------------------------------------------------------
            | REGENERATE SLUG
            |------------------------------------------------------------------
            */

            if (
                (
                    $region->isDirty('name') ||
                    $region->isDirty('country_id')
                ) &&
                !empty($region->name) &&
                !empty($region->country_id)
            ) {
                $region->slug = static::generateUniqueSlug(
                    $region->name,
                    (int) $region->country_id,
                    $region->id
                );
            }

            /*
            |------------------------------------------------------------------
            | REGENERATE CODE WHEN EMPTY
            |------------------------------------------------------------------
            */

            if (
                empty($region->code) &&
                !empty($region->name) &&
                !empty($region->country_id)
            ) {
                $region->code = static::generateUniqueCode(
                    $region->name,
                    (int) $region->country_id,
                    $region->id
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
     * Region belongs to a country.
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Region has many counties.
     */
    public function counties(): HasMany
    {
        return $this->hasMany(County::class);
    }

    /**
     * Region has many cities.
     */
    public function cities(): HasMany
    {
        return $this->hasMany(City::class);
    }

    /**
     * Region has many areas.
     */
    public function areas(): HasMany
    {
        return $this->hasMany(Area::class);
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Get active regions.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where(
            'is_active',
            self::STATUS_ACTIVE
        );
    }

    /**
     * Get inactive regions.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where(
            'is_active',
            self::STATUS_INACTIVE
        );
    }

    /**
     * Filter regions by country.
     */
    public function scopeByCountry(
        Builder $query,
        int $countryId
    ): Builder {
        return $query->where('country_id', $countryId);
    }

    /**
     * Search regions by name, code, or slug.
     */
    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        $search = trim($search);

        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $q) use ($search) {

            $q->where('name', 'LIKE', "%{$search}%")
                ->orWhere('code', 'LIKE', "%{$search}%")
                ->orWhere('slug', 'LIKE', "%{$search}%");

        });
    }

    /**
     * Filter regions by status.
     */
    public function scopeByStatus(
        Builder $query,
        bool $status
    ): Builder {
        return $query->where('is_active', $status);
    }

    /**
     * Order regions alphabetically.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('name', 'asc');
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Get readable active status.
     */
    public function getIsActiveLabelAttribute(): string
    {
        return $this->is_active ? 'Active' : 'Inactive';
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether region is active.
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Check whether region is inactive.
     */
    public function isInactive(): bool
    {
        return !$this->isActive();
    }

    /**
     * Check whether region has counties.
     */
    public function hasCounties(): bool
    {
        return $this->counties()->exists();
    }

    /**
     * Check whether region has cities.
     */
    public function hasCities(): bool
    {
        return $this->cities()->exists();
    }

    /**
     * Check whether region has areas.
     */
    public function hasAreas(): bool
    {
        return $this->areas()->exists();
    }

    /**
     * Get counties count.
     */
    public function getCountiesCount(): int
    {
        return $this->counties()->count();
    }

    /**
     * Get cities count.
     */
    public function getCitiesCount(): int
    {
        return $this->cities()->count();
    }

    /**
     * Get areas count.
     */
    public function getAreasCount(): int
    {
        return $this->areas()->count();
    }

    /**
     * Check whether region has dependencies.
     */
    public function hasDependencies(): bool
    {
        return $this->hasCounties()
            || $this->hasCities()
            || $this->hasAreas();
    }

    /**
     * Check whether region belongs to a country.
     */
    public function belongsToCountry(int $countryId): bool
    {
        return (int) $this->country_id === $countryId;
    }

    /**
     * Get total number of location dependencies.
     */
    public function getDependenciesCount(): int
    {
        return $this->getCountiesCount()
            + $this->getCitiesCount()
            + $this->getAreasCount();
    }

    /*
    |--------------------------------------------------------------------------
    | UNIQUE SLUG GENERATOR
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique region slug within a country.
     */
    protected static function generateUniqueSlug(
        string $name,
        int $countryId,
        ?int $ignoreId = null
    ): string {
        $base = Str::slug($name);

        if ($base === '') {
            $base = 'region';
        }

        $slug = $base;
        $count = 1;

        while (
            static::query()
                ->where('country_id', $countryId)
                ->where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn (Builder $query) =>
                        $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $base . '-' . $count++;
        }

        return $slug;
    }

    /*
    |--------------------------------------------------------------------------
    | UNIQUE CODE GENERATOR
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique region code within a country.
     */
    protected static function generateUniqueCode(
        string $name,
        int $countryId,
        ?int $ignoreId = null
    ): string {
        $base = strtoupper(
            Str::substr(
                Str::slug($name, ''),
                0,
                10
            )
        );

        if ($base === '') {
            $base = 'REGION';
        }

        $code = $base;
        $count = 1;

        while (
            static::query()
                ->where('country_id', $countryId)
                ->where('code', $code)
                ->when(
                    $ignoreId,
                    fn (Builder $query) =>
                        $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $suffix = (string) $count++;

            $code = Str::substr(
                $base,
                0,
                10 - strlen($suffix)
            ) . $suffix;
        }

        return $code;
    }
}
