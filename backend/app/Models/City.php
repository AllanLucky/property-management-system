<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class City extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'cities';

    /*
    |--------------------------------------------------------------------------
    | AUTO LOAD COUNTS
    |--------------------------------------------------------------------------
    */

    protected $withCount = [
        'areas',
        'properties',
    ];

    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'country_id',
        'region_id',
        'county_id',
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
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'country_id' => 'integer',
        'region_id' => 'integer',
        'county_id' => 'integer',
        'is_active' => 'boolean',
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
        'status_label',
        'full_location',
    ];

    /*
    |--------------------------------------------------------------------------
    | BOOT
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        static::saving(function (City $city) {

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE DATA
            |--------------------------------------------------------------------------
            */

            if (! empty($city->name)) {
                $city->name = trim($city->name);
            }

            if (! empty($city->code)) {
                $city->code = strtoupper(trim($city->code));
            }

            /*
            |--------------------------------------------------------------------------
            | AUTOMATIC SLUG GENERATION
            |--------------------------------------------------------------------------
            */

            if (
                empty($city->slug) ||
                $city->isDirty('name')
            ) {
                $baseSlug = Str::slug($city->name ?? '');

                if (empty($baseSlug)) {
                    $baseSlug = 'city';
                }

                $slug = $baseSlug;
                $count = 1;

                /*
                |--------------------------------------------------------------------------
                | ENSURE SLUG UNIQUENESS
                |--------------------------------------------------------------------------
                |
                | Include soft-deleted cities when checking uniqueness.
                | Exclude the current city during updates.
                |
                */

                while (
                    static::withTrashed()
                        ->where('slug', $slug)
                        ->when(
                            $city->exists,
                            fn (Builder $query) => $query->where(
                                $city->getKeyName(),
                                '!=',
                                $city->getKey()
                            )
                        )
                        ->exists()
                ) {
                    $slug = $baseSlug . '-' . $count++;
                }

                $city->slug = $slug;
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

    public function country(): BelongsTo
    {
        return $this->belongsTo(
            Country::class,
            'country_id'
        );
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(
            Region::class,
            'region_id'
        );
    }

    public function county(): BelongsTo
    {
        return $this->belongsTo(
            County::class,
            'county_id'
        );
    }

    public function areas(): HasMany
    {
        return $this->hasMany(
            Area::class,
            'city_id'
        );
    }

    public function properties(): HasMany
    {
        return $this->hasMany(
            Property::class,
            'city_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    public function scopeByCountry(
        Builder $query,
        int $countryId
    ): Builder {
        return $query->where('country_id', $countryId);
    }

    public function scopeByRegion(
        Builder $query,
        int $regionId
    ): Builder {
        return $query->where('region_id', $regionId);
    }

    public function scopeByCounty(
        Builder $query,
        int $countyId
    ): Builder {
        return $query->where('county_id', $countyId);
    }

    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        $search = trim($search);

        return $query->where(function (Builder $query) use ($search) {

            $query->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%");

        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Get city status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return $this->is_active
            ? 'Active'
            : 'Inactive';
    }

    /**
     * Get complete location name.
     *
     * Example:
     * Nairobi, Nairobi County, Nairobi Region, Kenya
     *
     * Uses only already-loaded relationships to prevent N+1 queries.
     */
    public function getFullLocationAttribute(): string
    {
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
            $county?->name,
            $region?->name,
            $country?->name,
        ])
            ->filter()
            ->implode(', ');
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function isInactive(): bool
    {
        return ! $this->isActive();
    }

    public function hasAreas(): bool
    {
        return $this->areas()->exists();
    }

    public function hasProperties(): bool
    {
        return $this->properties()->exists();
    }

    public function hasDependencies(): bool
    {
        return $this->hasAreas() || $this->hasProperties();
    }
}
