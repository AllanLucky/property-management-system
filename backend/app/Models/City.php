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
     * City belongs to County
     */
    public function county(): BelongsTo
    {
        return $this->belongsTo(
            County::class,
            'county_id'
        );
    }

    /**
     * City has many Areas
     */
    public function areas(): HasMany
    {
        return $this->hasMany(
            Area::class,
            'city_id'
        );
    }

    /**
     * City has many Properties
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

    public function scopeActive($query)
    {
        return $query->where(
            'is_active',
            true
        );
    }

    public function scopeInactive($query)
    {
        return $query->where(
            'is_active',
            false
        );
    }

    public function scopeByCounty(
        $query,
        int $countyId
    ) {
        return $query->where(
            'county_id',
            $countyId
        );
    }

    public function scopeSearch(
        $query,
        string $search
    ) {
        return $query->where(function ($q) use ($search) {

            $q->where('name', 'like', "%{$search}%")
              ->orWhere('code', 'like', "%{$search}%");

        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
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

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    public function isInactive(): bool
    {
        return ! $this->is_active;
    }
}