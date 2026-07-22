<?php

namespace App\Models;

use App\Models\Property;
use App\Models\Unit;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Apartment extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'apartments';

    /*
    |--------------------------------------------------------------------------
    | EAGER LOADING
    |--------------------------------------------------------------------------
    */
    protected $with = ['property'];
    protected $withCount = ['units'];

    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'property_id',
        'name',
        'slug',
        'description',
        'block',
        'floor',
        'total_floors',
        'total_units',
        'status',
        'has_elevator',
        'has_backup_generator',
        'has_security',
        'has_parking',
        'thumbnail',
        'thumbnail_public_id',
        'meta_title',
        'meta_description',
        'meta_keywords',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'property_id'          => 'integer',
        'floor'                => 'integer',
        'total_floors'         => 'integer',
        'total_units'          => 'integer',
        'has_elevator'         => 'boolean',
        'has_backup_generator' => 'boolean',
        'has_security'         => 'boolean',
        'has_parking'          => 'boolean',
        'created_at'           => 'datetime',
        'updated_at'           => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | APPENDS
    |--------------------------------------------------------------------------
    */
    protected $appends = [
        'thumbnail_url',
        'status_label',
        'property_title',
        'full_name',
        'occupied_units_count',
        'vacant_units_count',
        'maintenance_units_count',
        'occupancy_rate',
    ];

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */
    public const STATUS_ACTIVE     = 'active';
    public const STATUS_INACTIVE   = 'inactive';
    public const STATUS_MAINTENANCE = 'maintenance';

    /*
    |--------------------------------------------------------------------------
    | BOOT
    |--------------------------------------------------------------------------
    */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($apartment) {
            if (empty($apartment->slug)) {
                $apartment->slug = static::generateUniqueSlug($apartment->name);
            }
            if (empty($apartment->status)) {
                $apartment->status = self::STATUS_ACTIVE;
            }
        });

        static::updating(function ($apartment) {
            if ($apartment->isDirty('name')) {
                $apartment->slug = static::generateUniqueSlug($apartment->name, $apartment->id);
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ROUTE BINDING
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
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function units(): HasMany
    {
        return $this->hasMany(Unit::class, 'apartment_id');
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */
    public function getThumbnailUrlAttribute(): string
    {
        if (!$this->thumbnail) {
            return asset('images/default-apartment.jpg');
        }

        if (str_starts_with($this->thumbnail, 'http://') || str_starts_with($this->thumbnail, 'https://')) {
            return $this->thumbnail;
        }

        return Storage::url($this->thumbnail);
    }

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_ACTIVE     => 'Active',
            self::STATUS_INACTIVE   => 'Inactive',
            self::STATUS_MAINTENANCE => 'Maintenance',
            default                 => 'Unknown',
        };
    }

    public function getPropertyTitleAttribute(): ?string
    {
        return $this->property?->title;
    }

    public function getFullNameAttribute(): string
    {
        return collect([$this->block, $this->name])->filter()->implode(' - ');
    }

    public function getOccupiedUnitsCountAttribute(): int
    {
        return $this->units()->where('status', 'occupied')->count();
    }

    public function getVacantUnitsCountAttribute(): int
    {
        return $this->units()->where('status', 'vacant')->count();
    }

    public function getMaintenanceUnitsCountAttribute(): int
    {
        return $this->units()->where('status', 'maintenance')->count();
    }

    public function getOccupancyRateAttribute(): float
    {
        $total = $this->units()->count();
        return $total === 0 ? 0 : round(($this->occupied_units_count / $total) * 100, 2);
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

    public function isInactive(): bool
    {
        return $this->status === self::STATUS_INACTIVE;
    }

    public function isUnderMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    /*
    |--------------------------------------------------------------------------
    | SLUG GENERATOR
    |--------------------------------------------------------------------------
    */
    protected static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug     = $baseSlug;
        $count    = 1;

        while (
            static::where('slug', $slug)
                ->when($ignoreId, fn($query) => $query->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = $baseSlug . '-' . $count++;
        }

        return $slug;
    }
}
