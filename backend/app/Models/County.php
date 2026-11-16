<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class County extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'counties';

    /*
    |--------------------------------------------------------------------------
    | AUTO LOAD RELATIONSHIP COUNTS
    |--------------------------------------------------------------------------
    */

    protected $withCount = [
        'cities',
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
    ];

    /*
    |--------------------------------------------------------------------------
    | MODEL BOOTED
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        static::saving(function (County $county) {

            if (
                empty($county->slug) ||
                $county->isDirty('name')
            ) {
                $baseSlug = Str::slug($county->name);
                $slug = $baseSlug;
                $count = 1;

                while (
                    static::withTrashed()
                        ->where('slug', $slug)
                        ->when(
                            $county->exists,
                            fn (Builder $query) =>
                                $query->where(
                                    $county->getKeyName(),
                                    '!=',
                                    $county->getKey()
                                )
                        )
                        ->exists()
                ) {
                    $slug = $baseSlug . '-' . $count++;
                }

                $county->slug = $slug;
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
     * County belongs to Country.
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(
            Country::class,
            'country_id'
        );
    }

    /**
     * County belongs to Region.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(
            Region::class,
            'region_id'
        );
    }

    /**
     * County has many Cities.
     */
    public function cities(): HasMany
    {
        return $this->hasMany(
            City::class,
            'county_id'
        );
    }

    /**
     * County has many Areas.
     */
    public function areas(): HasMany
    {
        return $this->hasMany(
            Area::class,
            'county_id'
        );
    }

    /**
     * County has many Properties.
     */
    public function properties(): HasMany
    {
        return $this->hasMany(
            Property::class,
            'county_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Get active counties.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Get inactive counties.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Filter counties by country.
     */
    public function scopeByCountry(
        Builder $query,
        int $countryId
    ): Builder {
        return $query->where(
            'country_id',
            $countryId
        );
    }

    /**
     * Filter counties by region.
     */
    public function scopeByRegion(
        Builder $query,
        int $regionId
    ): Builder {
        return $query->where(
            'region_id',
            $regionId
        );
    }

    /**
     * Search counties by name, slug or code.
     */
    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        return $query->where(function (Builder $builder) use ($search) {
            $builder->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%");
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Get human-readable status.
     */
    public function getStatusLabelAttribute(): string
    {
        return $this->is_active
            ? 'Active'
            : 'Inactive';
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether county is active.
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Check whether county is inactive.
     */
    public function isInactive(): bool
    {
        return ! $this->is_active;
    }

    /**
     * Check whether county has cities.
     */
    public function hasCities(): bool
    {
        return $this->cities()->exists();
    }

    /**
     * Check whether county has areas.
     */
    public function hasAreas(): bool
    {
        return $this->areas()->exists();
    }

    /**
     * Check whether county has properties.
     */
    public function hasProperties(): bool
    {
        return $this->properties()->exists();
    }

    /**
     * Check whether county has dependent records.
     */
    public function hasDependencies(): bool
    {
        return $this->hasCities()
            || $this->hasAreas()
            || $this->hasProperties();
    }
}
