<?php


namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
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

    protected static function boot(): void
    {
        parent::boot();

        static::saving(function ($city) {

            if (
                empty($city->slug) ||
                $city->isDirty('name')
            ) {
                $baseSlug = Str::slug($city->name);
                $slug = $baseSlug;
                $count = 1;

                while (
                    static::where('slug', $slug)
                        ->where('id', '!=', $city->id)
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

    /**
     * City belongs to Country.
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(
            Country::class,
            'country_id'
        );
    }

    /**
     * City belongs to Region.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(
            Region::class,
            'region_id'
        );
    }

    /**
     * City belongs to County.
     */
    public function county(): BelongsTo
    {
        return $this->belongsTo(
            County::class,
            'county_id'
        );
    }

    /**
     * City has many Areas.
     */
    public function areas(): HasMany
    {
        return $this->hasMany(
            Area::class,
            'city_id'
        );
    }

    /**
     * City has many Properties.
     */
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

    /**
     * Scope active cities.
     */
    public function scopeActive($query)
    {
        return $query->where(
            'is_active',
            true
        );
    }

    /**
     * Scope inactive cities.
     */
    public function scopeInactive($query)
    {
        return $query->where(
            'is_active',
            false
        );
    }

    /**
     * Scope cities by country.
     */
    public function scopeByCountry(
        $query,
        int $countryId
    ) {
        return $query->where(
            'country_id',
            $countryId
        );
    }

    /**
     * Scope cities by region.
     */
    public function scopeByRegion(
        $query,
        int $regionId
    ) {
        return $query->where(
            'region_id',
            $regionId
        );
    }

    /**
     * Scope cities by county.
     */
    public function scopeByCounty(
        $query,
        int $countyId
    ) {
        return $query->where(
            'county_id',
            $countyId
        );
    }

    /**
     * Search cities.
     */
    public function scopeSearch(
        $query,
        string $search
    ) {
        return $query->where(function ($q) use ($search) {

            $q->where(
                'name',
                'like',
                "%{$search}%"
            )
            ->orWhere(
                'code',
                'like',
                "%{$search}%"
            );

        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Get status label.
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
     */
    public function getFullLocationAttribute(): string
    {
        return collect([
            $this->name,
            $this->county?->name,
            $this->region?->name,
            $this->country?->name,
        ])
            ->filter()
            ->implode(', ');
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether city is active.
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Determine whether city is inactive.
     */
    public function isInactive(): bool
    {
        return ! $this->is_active;
    }
}

