<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PropertyAnalytics extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */
    protected $table = 'property_analytics';

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNMENT
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'property_id',
        'views_count',
        'favorites_count',
        'reviews_count',
        'visits_count',
        'unique_visits_count',
        'average_rating',
        'rating_breakdown',
        'five_star_percentage',
        'recommendation_percentage',
        'vacant_units_count',
        'occupied_units_count',
        'snapshot_date',
    ];

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CASTS
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'average_rating' => 'decimal:1',
        'rating_breakdown' => 'array',
        'five_star_percentage' => 'decimal:2',
        'recommendation_percentage' => 'decimal:2',
        'snapshot_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
    |--------------------------------------------------------------------------
    */
    public function scopeLatestSnapshot($query)
    {
        return $query->orderByDesc('snapshot_date');
    }

    public function scopeTrending($query)
    {
        return $query->where('views_count', '>', 1000)
                     ->orWhere('favorites_count', '>', 100);
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */
    public function getIsHighEngagementAttribute(): bool
    {
        return $this->views_count > 500 && $this->favorites_count > 50;
    }

    public function getOccupancyRateAttribute(): float
    {
        $totalUnits = $this->vacant_units_count + $this->occupied_units_count;
        if ($totalUnits === 0) {
            return 0;
        }

        return round(($this->occupied_units_count / $totalUnits) * 100, 2);
    }
}
