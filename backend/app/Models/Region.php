<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Region extends Model
{
    use HasFactory;

    /*
    |------------------------------------------
    | TABLE
    |------------------------------------------
    */
    protected $table = 'regions';

    /*
    |------------------------------------------
    | STATUS CONSTANTS
    |------------------------------------------
    */
    public const STATUS_ACTIVE = true;
    public const STATUS_INACTIVE = false;

    /*
    |------------------------------------------
    | FILLABLE
    |------------------------------------------
    */
    protected $fillable = [
        'country_id',
        'name',
        'slug',
        'code',
        'is_active',
    ];

    /*
    |------------------------------------------
    | CASTS
    |------------------------------------------
    */
    protected $casts = [
        'country_id' => 'integer',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |------------------------------------------
    | APPENDS
    |------------------------------------------
    */
    protected $appends = [
        'is_active_label',
    ];

    /*
    |------------------------------------------
    | BOOT
    |------------------------------------------
    */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($region) {

            if (empty($region->slug)) {
                $region->slug = static::generateUniqueSlug($region->name);
            }
        });

        static::updating(function ($region) {

            if ($region->isDirty('name')) {
                $region->slug = static::generateUniqueSlug($region->name, $region->id);
            }
        });
    }

    /*
    |------------------------------------------
    | ROUTE MODEL BINDING
    |------------------------------------------
    */
    public function getRouteKeyName()
    {
        return 'slug';
    }

    /*
    |------------------------------------------
    | RELATIONSHIPS
    |------------------------------------------
    */

    public function country()
    {
        return $this->belongsTo(Country::class);
    }

    public function counties()
    {
        return $this->hasMany(County::class);
    }

    public function cities()
    {
        return $this->hasMany(City::class);
    }

    public function areas()
    {
        return $this->hasMany(Area::class);
    }

    /*
    |------------------------------------------
    | SCOPES
    |------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeByCountry($query, int $countryId)
    {
        return $query->where('country_id', $countryId);
    }

    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('name', 'LIKE', "%{$search}%")
              ->orWhere('code', 'LIKE', "%{$search}%");
        });
    }

    /*
    |------------------------------------------
    | ACCESSORS
    |------------------------------------------
    */

    public function getIsActiveLabelAttribute(): string
    {
        return $this->is_active ? 'Active' : 'Inactive';
    }

    /*
    |------------------------------------------
    | HELPERS
    |------------------------------------------
    */

    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /*
    |------------------------------------------
    | SLUG GENERATOR (SAFE)
    |------------------------------------------
    */
    protected static function generateUniqueSlug(string $name, $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $count = 1;

        while (
            static::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $base . '-' . $count++;
        }

        return $slug;
    }
}