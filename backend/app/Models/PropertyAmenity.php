<?php

namespace App\Models;

use App\Models\Property;
use App\Models\Amenity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PropertyAmenity extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'property_amenities';

    protected $fillable = [
        'property_id',
        'amenity_id',
        'is_included',
        'is_available',
        'distance',
        'walking_minutes',
        'note',
    ];

    protected $casts = [
        'property_id' => 'integer',
        'amenity_id' => 'integer',

        'is_included' => 'boolean',
        'is_available' => 'boolean',

        'distance' => 'decimal:2',
        'walking_minutes' => 'integer',

        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $appends = [
        'distance_label',
        'walking_time_label',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function amenity(): BelongsTo
    {
        return $this->belongsTo(Amenity::class);
    }

    public function getDistanceLabelAttribute(): ?string
    {
        return $this->distance !== null
            ? $this->distance . ' km'
            : null;
    }

    public function getWalkingTimeLabelAttribute(): ?string
    {
        return $this->walking_minutes !== null
            ? $this->walking_minutes . ' min walk'
            : null;
    }

    public function scopeNearby($query, float $maxDistance = 5)
    {
        return $query
            ->whereNotNull('distance')
            ->where('distance', '<=', $maxDistance);
    }

    public function scopeAvailable($query)
    {
        return $query->where('is_available', true);
    }

    public function scopeUnavailable($query)
    {
        return $query->where('is_available', false);
    }

    public function isAvailable(): bool
    {
        return (bool) $this->is_available;
    }

    public function isIncluded(): bool
    {
        return (bool) $this->is_included;
    }
}