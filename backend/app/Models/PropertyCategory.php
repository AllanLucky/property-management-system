<?php

namespace App\Models;

use App\Models\Property;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PropertyCategory extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'property_categories';

    /*
    |--------------------------------------------------------------------------
    | AUTO PROPERTY COUNTS
    |--------------------------------------------------------------------------
    */
    protected $withCount = [
        'properties',
    ];

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNABLE
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'parent_id',

        'name',
        'slug',
        'description',

        'icon',

        // MEDIA (CLOUDINARY)
        'image_url',
        'image_public_id',

        'banner_url',
        'banner_public_id',

        'status',

        'is_featured',
        'show_in_homepage',
        'is_popular',

        'meta_title',
        'meta_description',
        'meta_keywords',

        'sort_order',
        'color',

        'views_count',

        'published_at',

        'settings',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'is_featured' => 'boolean',
        'show_in_homepage' => 'boolean',
        'is_popular' => 'boolean',

        'settings' => 'array',

        'published_at' => 'datetime',
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
        'image_url',
    ];

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */
    public const STATUS_ACTIVE = 'active';
    public const STATUS_INACTIVE = 'inactive';

    /*
    |--------------------------------------------------------------------------
    | BOOT
    |--------------------------------------------------------------------------
    */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($category) {

            /*
            |--------------------------------------------------------------------------
            | AUTO SLUG GENERATION
            |--------------------------------------------------------------------------
            */
            if (
                empty($category->slug) ||
                $category->isDirty('name')
            ) {
                $baseSlug = Str::slug($category->name);

                $slug = $baseSlug;
                $count = 1;

                while (
                    static::where('slug', $slug)
                        ->where('id', '!=', $category->id)
                        ->exists()
                ) {
                    $slug = $baseSlug . '-' . $count;
                    $count++;
                }

                $category->slug = $slug;
            }

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE BOOLEAN FLAGS (REMOVE JSON DEPENDENCY)
            |--------------------------------------------------------------------------
            */
            $category->is_featured = (bool) $category->is_featured;
            $category->show_in_homepage = (bool) $category->show_in_homepage;
            $category->is_popular = (bool) $category->is_popular;
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
    public function properties()
    {
        return $this->hasMany(
            Property::class,
            'property_category_id'
        );
    }

    public function parent()
    {
        return $this->belongsTo(
            self::class,
            'parent_id'
        );
    }

    public function children()
    {
        return $this->hasMany(
            self::class,
            'parent_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */
    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopePopular($query)
    {
        return $query->where('is_popular', true);
    }

    public function scopeHomepage($query)
    {
        return $query->where('show_in_homepage', true);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {

            $q->where('name', 'LIKE', "%{$search}%")
              ->orWhere('description', 'LIKE', "%{$search}%")
              ->orWhere('meta_keywords', 'LIKE', "%{$search}%");
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */
    public function getImageUrlAttribute(): ?string
    {
        return $this->image_url ?? null;
    }

    public function getHasImageAttribute(): bool
    {
        return !empty($this->image_url);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }

    public function isFeatured(): bool
    {
        return (bool) $this->is_featured;
    }

    public function isPopular(): bool
    {
        return (bool) $this->is_popular;
    }
}