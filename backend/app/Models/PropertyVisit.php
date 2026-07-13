<?php

namespace App\Models;

use App\Models\User;
use App\Models\Property;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PropertyVisit extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */

    protected $table = 'property_visits';

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'property_id',
        'user_id',
        'session_id',
        'ip_address',
        'user_agent',
        'device',
        'browser',
        'platform',
        'referer',
        'country',
        'city',
        'is_unique',
        'visited_at',
    ];

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CASTS
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'is_unique' => 'boolean',
        'visited_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | DEFAULT EAGER LOADING
    |--------------------------------------------------------------------------
    */

    protected $with = [];

    /*
    |--------------------------------------------------------------------------
    | APPENDED ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'visitor_type',
        'device_name',
        'location',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Property.
     */
    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    /**
     * Visitor (authenticated user).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | QUERY SCOPES
    |--------------------------------------------------------------------------
    */

    /**
     * Unique visits.
     */
    public function scopeUnique(Builder $query): Builder
    {
        return $query->where('is_unique', true);
    }

    /**
     * Guest visits.
     */
    public function scopeGuests(Builder $query): Builder
    {
        return $query->whereNull('user_id');
    }

    /**
     * Authenticated user visits.
     */
    public function scopeAuthenticated(Builder $query): Builder
    {
        return $query->whereNotNull('user_id');
    }

    /**
     * Today's visits.
     */
    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('visited_at', today());
    }

    /**
     * This week's visits.
     */
    public function scopeThisWeek(Builder $query): Builder
    {
        return $query->whereBetween('visited_at', [
            now()->startOfWeek(),
            now()->endOfWeek(),
        ]);
    }

    /**
     * This month's visits.
     */
    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->whereYear('visited_at', now()->year)
                     ->whereMonth('visited_at', now()->month);
    }

    /**
     * Latest visits.
     */
    public function scopeLatest(Builder $query): Builder
    {
        return $query->orderByDesc('visited_at');
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */

    /**
     * Visitor type.
     */
    public function getVisitorTypeAttribute(): string
    {
        return $this->user_id ? 'authenticated' : 'guest';
    }

    /**
     * Device name.
     */
    public function getDeviceNameAttribute(): string
    {
        return $this->device ?: 'Unknown Device';
    }

    /**
     * Visitor location.
     */
    public function getLocationAttribute(): ?string
    {
        if (!$this->country && !$this->city) {
            return null;
        }

        return collect([
            $this->city,
            $this->country,
        ])->filter()->implode(', ');
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Determine if the visit is from a guest.
     */
    public function isGuest(): bool
    {
        return is_null($this->user_id);
    }

    /**
     * Determine if the visit is from an authenticated user.
     */
    public function isAuthenticated(): bool
    {
        return !is_null($this->user_id);
    }

    /**
     * Determine if the visit is unique.
     */
    public function isUniqueVisit(): bool
    {
        return $this->is_unique;
    }
}