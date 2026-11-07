<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Country extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE CONFIGURATION
    |--------------------------------------------------------------------------
    */

    protected $table = 'countries';

    protected $primaryKey = 'id';

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNMENT
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
    | HIDDEN ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    protected $hidden = [
        'deleted_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CASTING
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | APPENDED ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'status_label',
        'display_name',
        'name_with_code',
    ];

    /*
    |--------------------------------------------------------------------------
    | MODEL BOOT
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        static::saving(function (Country $country): void {

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE COUNTRY NAME
            |--------------------------------------------------------------------------
            */

            if ($country->name !== null) {
                $country->name = trim($country->name);
            }

            /*
            |--------------------------------------------------------------------------
            | GENERATE UNIQUE SLUG
            |--------------------------------------------------------------------------
            */

            if (
                empty($country->slug) ||
                $country->isDirty('name')
            ) {
                $baseSlug = Str::slug($country->name);

                $slug = $baseSlug;
                $counter = 1;

                while (
                    static::withTrashed()
                        ->where('slug', $slug)
                        ->where('id', '!=', $country->id ?? 0)
                        ->exists()
                ) {
                    $slug = $baseSlug . '-' . $counter++;
                }

                $country->slug = $slug;
            }

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE COUNTRY CODE
            |--------------------------------------------------------------------------
            */

            if ($country->code !== null) {
                $country->code = strtoupper(
                    trim($country->code)
                );
            }

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE PHONE CODE
            |--------------------------------------------------------------------------
            */

            if ($country->phone_code !== null) {
                $country->phone_code = trim(
                    $country->phone_code
                );
            }

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE CURRENCY
            |--------------------------------------------------------------------------
            */

            if ($country->currency !== null) {
                $country->currency = strtoupper(
                    trim($country->currency)
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
        return $this->hasMany(Region::class, 'country_id');
    }

    /**
     * Country has many counties.
     */
    public function counties(): HasMany
    {
        return $this->hasMany(County::class, 'country_id');
    }

    /**
     * Country has many cities.
     */
    public function cities(): HasMany
    {
        return $this->hasMany(City::class, 'country_id');
    }

    /**
     * Country has many areas.
     */
    public function areas(): HasMany
    {
        return $this->hasMany(Area::class, 'country_id');
    }

    /**
     * Country has many properties.
     */
    public function properties(): HasMany
    {
        return $this->hasMany(Property::class, 'country_id');
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve active countries.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Retrieve inactive countries.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Search countries.
     */
    public function scopeSearch(
        Builder $query,
        ?string $search
    ): Builder {

        $search = trim($search ?? '');

        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $q) use ($search) {

            $q->where('name', 'like', "%{$search}%")
                ->orWhere('slug', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")
                ->orWhere('currency', 'like', "%{$search}%")
                ->orWhere('phone_code', 'like', "%{$search}%");
        });
    }

    /**
     * Filter by ISO country code.
     */
    public function scopeByCode(
        Builder $query,
        string $code
    ): Builder {
        return $query->where(
            'code',
            strtoupper(trim($code))
        );
    }

    /**
     * Filter by currency.
     */
    public function scopeByCurrency(
        Builder $query,
        string $currency
    ): Builder {
        return $query->where(
            'currency',
            strtoupper(trim($currency))
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Human-readable status.
     */
    public function getStatusLabelAttribute(): string
    {
        return $this->is_active ? 'Active' : 'Inactive';
    }

    /**
     * Country name with ISO code.
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->code
            ? "{$this->name} ({$this->code})"
            : $this->name;
    }

    /**
     * Country name with code.
     */
    public function getNameWithCodeAttribute(): string
    {
        return $this->display_name;
    }

    /*
    |--------------------------------------------------------------------------
    | MODEL HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether country is active.
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Check whether country is inactive.
     */
    public function isInactive(): bool
    {
        return ! $this->is_active;
    }
}
