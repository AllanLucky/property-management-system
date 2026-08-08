<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Country extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'countries';

    /*
    |--------------------------------------------------------------------------
    | PRIMARY KEY
    |--------------------------------------------------------------------------
    */

    protected $primaryKey = 'id';

    /*
    |--------------------------------------------------------------------------
    | AUTO LOAD COUNTS
    |--------------------------------------------------------------------------
    */

    protected $withCount = [
        'regions',
        'counties',
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
        'name',
        'slug',
        'code',
        'phone_code',
        'currency',
        'is_active',
    ];

    /*
    |--------------------------------------------------------------------------
    | HIDDEN
    |--------------------------------------------------------------------------
    */

    protected $hidden = [
        'deleted_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */

    protected $casts = [
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
    | BOOT
    |--------------------------------------------------------------------------
    */

    protected static function boot()
    {
        parent::boot();

        /*
        |--------------------------------------------------------------------------
        | GENERATE SLUG
        |--------------------------------------------------------------------------
        */

        static::saving(function (Country $country) {

            if (
                empty($country->slug) ||
                $country->isDirty('name')
            ) {
                $baseSlug = Str::slug($country->name);

                $slug = $baseSlug;
                $count = 1;

                while (
                    static::where('slug', $slug)
                        ->whereKeyNot($country->getKey())
                        ->exists()
                ) {
                    $slug = $baseSlug . '-' . $count++;
                }

                $country->slug = $slug;
            }

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE CODE
            |--------------------------------------------------------------------------
            */

            if (!empty($country->code)) {
                $country->code = strtoupper(
                    trim($country->code)
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
     * Country has many regions.
     */
    public function regions(): HasMany
    {
        return $this->hasMany(
            Region::class,
            'country_id',
            'id'
        );
    }

    /**
     * Country has many counties.
     */
    public function counties(): HasMany
    {
        return $this->hasMany(
            County::class,
            'country_id',
            'id'
        );
    }

    /**
     * Country has many cities.
     */
    public function cities(): HasMany
    {
        return $this->hasMany(
            City::class,
            'country_id',
            'id'
        );
    }

    /**
     * Country has many areas.
     */
    public function areas(): HasMany
    {
        return $this->hasMany(
            Area::class,
            'country_id',
            'id'
        );
    }

    /**
     * Country has many properties.
     */
    public function properties(): HasMany
    {
        return $this->hasMany(
            Property::class,
            'country_id',
            'id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Only active countries.
     */
    public function scopeActive($query)
    {
        return $query->where(
            'is_active',
            true
        );
    }

    /**
     * Only inactive countries.
     */
    public function scopeInactive($query)
    {
        return $query->where(
            'is_active',
            false
        );
    }

    /**
     * Search countries.
     */
    public function scopeSearch(
        $query,
        string $search
    ) {
        $search = trim($search);

        if ($search === '') {
            return $query;
        }

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
            )

            ->orWhere(
                'currency',
                'like',
                "%{$search}%"
            )

            ->orWhere(
                'phone_code',
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
     * Return human-readable status.
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
     * Determine whether country is active.
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Determine whether country is inactive.
     */
    public function isInactive(): bool
    {
        return ! $this->is_active;
    }

    /**
     * Return country display name.
     */
    public function getDisplayNameAttribute(): string
    {
        if (!empty($this->code)) {
            return "{$this->name} ({$this->code})";
        }

        return $this->name;
    }

    /**
     * Return country name and code.
     */
    public function getNameWithCodeAttribute(): string
    {
        return $this->display_name;
    }
}

