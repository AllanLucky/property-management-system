<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Plot extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Table
    |--------------------------------------------------------------------------
    */

    protected $table = 'plots';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'property_id',
        'code',
        'title',
        'title_number',
        'plot_number',
        'size',
        'size_unit',
        'description',

        // Location
        'country_id',
        'region_id',
        'county_id',
        'city_id',
        'area_id',
        'address',
        'latitude',
        'longitude',

        // Pricing
        'asking_price',
        'currency',

        // Status
        'status',
        'is_active',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'size' => 'decimal:2',
        'asking_price' => 'decimal:2',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Appended Attributes
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'formatted_price',
        'formatted_size',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the property associated with the plot.
     */
    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Get the country associated with the plot.
     */
    public function country(): BelongsTo
    {
        return $this->belongsTo(Country::class);
    }

    /**
     * Get the region associated with the plot.
     */
    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    /**
     * Get the county associated with the plot.
     */
    public function county(): BelongsTo
    {
        return $this->belongsTo(County::class);
    }

    /**
     * Get the city associated with the plot.
     */
    public function city(): BelongsTo
    {
        return $this->belongsTo(City::class);
    }

    /**
     * Get the area associated with the plot.
     */
    public function area(): BelongsTo
    {
        return $this->belongsTo(Area::class);
    }

    /**
     * Get all sales associated with the plot.
     */
    public function sales(): HasMany
    {
        return $this->hasMany(PlotSale::class);
    }

    /**
     * Get the latest active reservation or approved sale.
     *
     * Note: Completed sales are intentionally excluded.
     */
    public function activeSale(): HasOne
    {
        return $this->hasOne(PlotSale::class)
            ->where('is_active', true)
            ->whereIn('status', [
                'reserved',
                'approved',
            ])
            ->latestOfMany();
    }

    /**
     * Get the latest completed sale.
     */
    public function completedSale(): HasOne
    {
        return $this->hasOne(PlotSale::class)
            ->where('status', 'completed')
            ->latestOfMany();
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get the formatted asking price.
     */
    public function getFormattedPriceAttribute(): string
    {
        return sprintf(
            '%s %s',
            $this->currency ?: 'KES',
            number_format((float) ($this->asking_price ?? 0), 2)
        );
    }

    /**
     * Get the formatted plot size.
     */
    public function getFormattedSizeAttribute(): string
    {
        if ($this->size === null) {
            return '-';
        }

        return sprintf(
            '%s %s',
            number_format((float) $this->size, 2),
            $this->size_unit ?: 'sqm'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope available plots.
     */
    public function scopeAvailable(Builder $query): Builder
    {
        return $query
            ->where('status', 'available')
            ->where('is_active', true);
    }

    /**
     * Scope sold plots.
     */
    public function scopeSold(Builder $query): Builder
    {
        return $query->where('status', 'sold');
    }

    /**
     * Scope reserved plots.
     */
    public function scopeReserved(Builder $query): Builder
    {
        return $query->where('status', 'reserved');
    }

    /**
     * Scope active plots.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope inactive plots.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope plots by status.
     */
    public function scopeStatus(
        Builder $query,
        string $status
    ): Builder {
        return $query->where('status', $status);
    }

    /**
     * Scope plots by county.
     */
    public function scopeCounty(
        Builder $query,
        int $countyId
    ): Builder {
        return $query->where('county_id', $countyId);
    }

    /**
     * Scope plots by city.
     */
    public function scopeCity(
        Builder $query,
        int $cityId
    ): Builder {
        return $query->where('city_id', $cityId);
    }

    /**
     * Scope plots by area.
     */
    public function scopeArea(
        Builder $query,
        int $areaId
    ): Builder {
        return $query->where('area_id', $areaId);
    }

    /**
     * Search plots by code, title, title number, plot number or address.
     */
    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        $search = trim($search);

        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($search) {
            $builder
                ->where('code', 'like', "%{$search}%")
                ->orWhere('title', 'like', "%{$search}%")
                ->orWhere('title_number', 'like', "%{$search}%")
                ->orWhere('plot_number', 'like', "%{$search}%")
                ->orWhere('address', 'like', "%{$search}%");
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Status Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the plot is available for sale.
     */
    public function isAvailable(): bool
    {
        return $this->status === 'available'
            && $this->is_active
            && ! $this->trashed();
    }

    /**
     * Determine whether the plot has been sold.
     */
    public function isSold(): bool
    {
        return $this->status === 'sold';
    }

    /**
     * Determine whether the plot is reserved.
     */
    public function isReserved(): bool
    {
        return $this->status === 'reserved';
    }

    /**
     * Determine whether the plot is unavailable.
     */
    public function isUnavailable(): bool
    {
        return $this->status === 'unavailable';
    }

    /**
     * Determine whether the plot has a completed sale.
     */
    public function hasCompletedSale(): bool
    {
        return $this->sales()
            ->where('status', 'completed')
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | Status Transitions
    |--------------------------------------------------------------------------
    */

    /**
     * Mark the plot as sold.
     *
     * Call this only after the sale has been confirmed as complete
     * according to the application's payment and completion rules.
     */
    public function markAsSold(): bool
    {
        return $this->update([
            'status' => 'sold',
            'is_active' => true,
        ]);
    }

    /**
     * Mark the plot as available.
     */
    public function markAsAvailable(): bool
    {
        return $this->update([
            'status' => 'available',
            'is_active' => true,
        ]);
    }

    /**
     * Mark the plot as reserved.
     */
    public function markAsReserved(): bool
    {
        return $this->update([
            'status' => 'reserved',
            'is_active' => true,
        ]);
    }

    /**
     * Mark the plot as unavailable.
     */
    public function markAsUnavailable(): bool
    {
        return $this->update([
            'status' => 'unavailable',
        ]);
    }
}