<?php

namespace App\Models;

use App\Models\Property;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PropertyType extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */
    protected $table = 'property_types';


    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';


    /*
    |--------------------------------------------------------------------------
    | AUTO COUNTS
    |--------------------------------------------------------------------------
    */
    protected $withCount = [
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
        'description',

        // media
        'icon',
        'image',

        // status
        'status',
        'is_active',
        'is_featured',

        // display
        'sort_order',
    ];


    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'is_active'   => 'boolean',
        'is_featured' => 'boolean',
        'sort_order'  => 'integer',

        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
        'deleted_at'  => 'datetime',
    ];


    /*
    |--------------------------------------------------------------------------
    | APPENDS
    |--------------------------------------------------------------------------
    */
    protected $appends = [
        'display_name',
        'status_label',
        'featured_label',
        'active_properties_count',
    ];


    /*
    |--------------------------------------------------------------------------
    | MODEL EVENTS
    |--------------------------------------------------------------------------
    */
    protected static function boot()
    {
        parent::boot();

        static::saving(function (PropertyType $type) {

            // Generate unique slug
            if (empty($type->slug) || $type->isDirty('name')) {
                $type->slug = static::generateUniqueSlug(
                    $type->name,
                    $type->id
                );
            }

            // Default values
            if (empty($type->status)) {
                $type->status = self::STATUS_ACTIVE;
            }

            if ($type->sort_order === null) {
                $type->sort_order = 0;
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
     * Properties belonging to this type.
     */
    public function properties(): HasMany
    {
        return $this->hasMany(
            Property::class,
            'property_type_id'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeActive($query)
    {
        return $query
            ->where('status', self::STATUS_ACTIVE)
            ->where('is_active', true);
    }


    public function scopeInactive($query)
    {
        return $query
            ->where('status', self::STATUS_INACTIVE);
    }


    public function scopeFeatured($query)
    {
        return $query->where(
            'is_featured',
            true
        );
    }


    public function scopeOrdered($query)
    {
        return $query
            ->orderBy('sort_order')
            ->orderBy('name');
    }


    public function scopeSearch($query, string $search)
    {
        return $query->where(function ($q) use ($search) {

            $q->where('name', 'LIKE', "%{$search}%")
              ->orWhere(
                  'description',
                  'LIKE',
                  "%{$search}%"
              );
        });
    }


    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    public function getDisplayNameAttribute(): string
    {
        return $this->name;
    }


    public function getStatusLabelAttribute(): string
    {
        return $this->is_active
            ? 'Active'
            : 'Inactive';
    }


    public function getFeaturedLabelAttribute(): string
    {
        return $this->is_featured
            ? 'Featured'
            : 'Standard';
    }


    public function getActivePropertiesCountAttribute(): int
    {
        return $this->properties()
            ->where('is_published', true)
            ->count();
    }


    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    public function isActive(): bool
    {
        return $this->is_active
            && $this->status === self::STATUS_ACTIVE;
    }


    public function isFeatured(): bool
    {
        return $this->is_featured;
    }


    /*
    |--------------------------------------------------------------------------
    | SLUG GENERATOR
    |--------------------------------------------------------------------------
    */

    public static function generateUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {

        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $counter = 1;

        while (
            static::where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn ($query) =>
                        $query->where(
                            'id',
                            '!=',
                            $ignoreId
                        )
                )
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $counter++;
        }

        return $slug;
    }
}