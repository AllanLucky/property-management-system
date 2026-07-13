<?php

namespace App\Models;

use App\Models\Property;
use App\Models\Apartment;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Unit extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |------------------------------------------
    | TABLE
    |------------------------------------------
    */
    protected $table = 'units';

    /*
    |------------------------------------------
    | STATUS CONSTANTS
    |------------------------------------------
    */
    public const STATUS_VACANT = 'vacant';
    public const STATUS_OCCUPIED = 'occupied';
    public const STATUS_MAINTENANCE = 'maintenance';
    public const STATUS_RESERVED = 'reserved';

    /*
    |------------------------------------------
    | FILLABLE
    |------------------------------------------
    */
    protected $fillable = [
        'property_id',
        'apartment_id',

        'unit_number',
        'unit_name',
        'slug',
        'description',

        'status',
        'type',

        'bedrooms',
        'bathrooms',
        'toilets',
        'floor',

        'size',
        'size_unit',

        'price',
        'deposit',
        'service_charge',

        'has_balcony',
        'has_wifi',
        'has_furnished',
        'has_air_conditioning',

        'thumbnail',

        'available_from',
        'notes',
    ];

    /*
    |------------------------------------------
    | CASTS
    |------------------------------------------
    */
    protected $casts = [
        'price' => 'decimal:2',
        'deposit' => 'decimal:2',
        'service_charge' => 'decimal:2',
        'size' => 'decimal:2',

        'bedrooms' => 'integer',
        'bathrooms' => 'integer',
        'toilets' => 'integer',
        'floor' => 'integer',

        'has_balcony' => 'boolean',
        'has_wifi' => 'boolean',
        'has_furnished' => 'boolean',
        'has_air_conditioning' => 'boolean',

        'available_from' => 'date',

        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |------------------------------------------
    | APPENDS
    |------------------------------------------
    */
    protected $appends = [
        'formatted_price',
        'status_badge',
        'full_unit_name',
        'thumbnail_url',
    ];

    /*
    |------------------------------------------
    | BOOT
    |------------------------------------------
    */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($unit) {

            if (empty($unit->slug)) {
                $unit->slug = static::generateUniqueSlug(
                    $unit->unit_name ?? 'unit-' . $unit->unit_number
                );
            }
        });

        static::updating(function ($unit) {

            if ($unit->isDirty('unit_name') || $unit->isDirty('unit_number')) {
                $unit->slug = static::generateUniqueSlug(
                    $unit->unit_name ?? 'unit-' . $unit->unit_number,
                    $unit->id
                );
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
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function apartment()
    {
        return $this->belongsTo(Apartment::class);
    }

    /*
    |------------------------------------------
    | SCOPES
    |------------------------------------------
    */
    public function scopeVacant($query)
    {
        return $query->where('status', self::STATUS_VACANT);
    }

    public function scopeOccupied($query)
    {
        return $query->where('status', self::STATUS_OCCUPIED);
    }

    public function scopeMaintenance($query)
    {
        return $query->where('status', self::STATUS_MAINTENANCE);
    }

    public function scopeReserved($query)
    {
        return $query->where('status', self::STATUS_RESERVED);
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', [
            self::STATUS_VACANT,
            self::STATUS_OCCUPIED,
            self::STATUS_RESERVED,
        ]);
    }

    /*
    |------------------------------------------
    | ACCESSORS
    |------------------------------------------
    */
    public function getFormattedPriceAttribute(): string
    {
        return 'KES ' . number_format($this->price ?? 0, 2);
    }

    public function getStatusBadgeAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_VACANT => 'success',
            self::STATUS_OCCUPIED => 'primary',
            self::STATUS_MAINTENANCE => 'warning',
            self::STATUS_RESERVED => 'info',
            default => 'secondary',
        };
    }

    public function getFullUnitNameAttribute(): string
    {
        return $this->unit_name ?: 'Unit ' . $this->unit_number;
    }

    public function getThumbnailUrlAttribute(): string
    {
        if (!$this->thumbnail) {
            return asset('images/default-unit.jpg');
        }

        if (str_starts_with($this->thumbnail, 'http')) {
            return $this->thumbnail;
        }

        return Storage::url($this->thumbnail);
    }

    /*
    |------------------------------------------
    | HELPERS
    |------------------------------------------
    */
    public function isVacant(): bool
    {
        return $this->status === self::STATUS_VACANT;
    }

    public function isOccupied(): bool
    {
        return $this->status === self::STATUS_OCCUPIED;
    }

    public function isUnderMaintenance(): bool
    {
        return $this->status === self::STATUS_MAINTENANCE;
    }

    public function isReserved(): bool
    {
        return $this->status === self::STATUS_RESERVED;
    }

    /*
    |------------------------------------------
    | SLUG GENERATOR
    |------------------------------------------
    */
    protected static function generateUniqueSlug(string $text, $ignoreId = null): string
    {
        $base = Str::slug($text);
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