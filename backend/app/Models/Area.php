<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class Area extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'areas';

    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'country_id',
        'region_id',
        'county_id',
        'city_id',

        'name',
        'slug',
        'code',

        'latitude',
        'longitude',

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
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'country_id' => 'integer',
            'region_id' => 'integer',
            'county_id' => 'integer',
            'city_id' => 'integer',

            'latitude' => 'float',
            'longitude' => 'float',

            'is_active' => 'boolean',

            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | APPENDS
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'full_location',
        'status_label',
    ];

    /*
    |--------------------------------------------------------------------------
    | BOOT
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        /*
        |--------------------------------------------------------------------------
        | GENERATE SLUG WHEN CREATING
        |--------------------------------------------------------------------------
        */

        static::creating(function (Area $area) {
            if (empty($area->slug) && !empty($area->name)) {
                $area->slug = static::generateUniqueSlug(
                    $area->name
                );
            }
        });

        /*
        |--------------------------------------------------------------------------
        | UPDATE SLUG WHEN NAME CHANGES
        |--------------------------------------------------------------------------
        */

        static::updating(function (Area $area) {
            if ($area->isDirty('name') && !empty($area->name)) {
                $area->slug = static::generateUniqueSlug(
                    $area->name,
                    $area->id
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
     * Area belongs to a country.
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Area belongs to a region.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    /**
     * Area belongs to a county.
     */
    public function county(): BelongsTo
    {
        return $this->belongsTo(County::class);
    }

    /**
     * Area belongs to a city.
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Area has many properties.
     */
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class);
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve active areas.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Retrieve inactive areas.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Filter areas by country.
     */
    public function scopeByCountry(
        Builder $query,
        int $countryId
    ): Builder {
        return $query->where('country_id', $countryId);
    }

    /**
     * Filter areas by region.
     */
    public function scopeByRegion(
        Builder $query,
        int $regionId
    ): Builder {
        return $query->where('region_id', $regionId);
    }

    /**
     * Filter areas by county.
     */
    public function scopeByCounty(
        Builder $query,
        int $countyId
    ): Builder {
        return $query->where('county_id', $countyId);
    }

    /**
     * Filter areas by city.
     */
    public function scopeByCity(
        Builder $query,
        int $cityId
    ): Builder {
        return $query->where('city_id', $cityId);
    }

    /**
     * Search areas by name or code.
     */
    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        return $query->where(function (Builder $q) use ($search) {
            $q->where('name', 'LIKE', "%{$search}%")
                ->orWhere('code', 'LIKE', "%{$search}%");
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Get the complete geographical location.
     *
     * Only uses relationships that have already been loaded.
     * This prevents unexpected database queries during serialization.
     */
    public function getFullLocationAttribute(): string
    {
        $city = $this->relationLoaded('city')
            ? $this->getRelation('city')
            : null;

        $county = $this->relationLoaded('county')
            ? $this->getRelation('county')
            : null;

        $region = $this->relationLoaded('region')
            ? $this->getRelation('region')
            : null;

        $country = $this->relationLoaded('country')
            ? $this->getRelation('country')
            : null;

        return collect([
            $this->name,
            $city?->name,
            $county?->name,
            $region?->name,
            $country?->name,
        ])
            ->filter()
            ->implode(', ');
    }

    /**
     * Get the human-readable area status.
     */
    public function getStatusLabelAttribute(): string
    {
        return $this->is_active
            ? 'Active'
            : 'Inactive';
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the area is active.
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Determine whether the area is inactive.
     */
    public function isInactive(): bool
    {
        return !$this->isActive();
    }

    /*
    |--------------------------------------------------------------------------
    | SLUG GENERATOR
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique slug for an area.
     */
    protected static function generateUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {
        $base = Str::slug($name);

        $slug = $base;
        $count = 1;

        while (
            static::query()
                ->where('slug', $slug)
                ->when(
                    $ignoreId !== null,
                    fn (Builder $query) => $query->where(
                        'id',
                        '!=',
                        $ignoreId
                    )
                )
                ->exists()
        ) {
            $slug = $base . '-' . $count++;
        }

        return $slug;
    }
}
