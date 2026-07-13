<?php

namespace App\Models;

use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
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
    | AUTO LOAD COUNTS
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
        'region_id',
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

        static::saving(function ($county) {

            if (
                empty($county->slug) ||
                $county->isDirty('name')
            ) {

                $baseSlug = Str::slug($county->name);
                $slug = $baseSlug;
                $count = 1;

                while (
                    static::where('slug', $slug)
                        ->where('id', '!=', $county->id)
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
     * County belongs to Region
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(
            Region::class,
            'region_id'
        );
    }

    /**
     * County has many Cities
     */
    public function cities(): HasMany
    {
        return $this->hasMany(
            City::class,
            'county_id'
        );
    }

    /**
     * County has many Areas
     */
    public function areas(): HasMany
    {
        return $this->hasMany(
            Area::class,
            'county_id'
        );
    }

    /**
     * County has many Properties
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

    public function scopeByRegion(
        $query,
        int $regionId
    ) {
        return $query->where(
            'region_id',
            $regionId
        );
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