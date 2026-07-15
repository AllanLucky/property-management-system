<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyVisit extends Model
{
    use HasFactory;

    /**
     * --------------------------------------------------------------------------
     * TABLE
     * --------------------------------------------------------------------------
     */
    protected $table = 'property_visits';

    /**
     * --------------------------------------------------------------------------
     * MASS ASSIGNMENT
     * --------------------------------------------------------------------------
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

    /**
     * --------------------------------------------------------------------------
     * CASTS
     * --------------------------------------------------------------------------
     */
    protected $casts = [
        'is_unique' => 'boolean',
        'visited_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * --------------------------------------------------------------------------
     * APPENDS
     * --------------------------------------------------------------------------
     */
    protected $appends = [
        'visitor_type',
        'device_name',
        'location',
        'visited_at_human',
    ];

    /**
     * --------------------------------------------------------------------------
     * RELATIONSHIPS
     * --------------------------------------------------------------------------
     */

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * --------------------------------------------------------------------------
     * QUERY SCOPES
     * --------------------------------------------------------------------------
     */

    public function scopeUnique(Builder $query): Builder
    {
        return $query->where('is_unique', true);
    }

    public function scopeGuests(Builder $query): Builder
    {
        return $query->whereNull('user_id');
    }

    public function scopeAuthenticated(Builder $query): Builder
    {
        return $query->whereNotNull('user_id');
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('visited_at', today());
    }

    public function scopeYesterday(Builder $query): Builder
    {
        return $query->whereDate('visited_at', today()->subDay());
    }

    public function scopeThisWeek(Builder $query): Builder
    {
        return $query->whereBetween('visited_at', [
            now()->startOfWeek(),
            now()->endOfWeek(),
        ]);
    }

    public function scopeThisMonth(Builder $query): Builder
    {
        return $query->whereMonth('visited_at', now()->month)
            ->whereYear('visited_at', now()->year);
    }

    public function scopeThisYear(Builder $query): Builder
    {
        return $query->whereYear('visited_at', now()->year);
    }

    public function scopeBrowser(Builder $query, string $browser): Builder
    {
        return $query->where('browser', $browser);
    }

    public function scopePlatform(Builder $query, string $platform): Builder
    {
        return $query->where('platform', $platform);
    }

    public function scopeDevice(Builder $query, string $device): Builder
    {
        return $query->where('device', $device);
    }

    public function scopeCountry(Builder $query, string $country): Builder
    {
        return $query->where('country', $country);
    }

    public function scopeSession(Builder $query, string $sessionId): Builder
    {
        return $query->where('session_id', $sessionId);
    }

    public function scopeIp(Builder $query, string $ip): Builder
    {
        return $query->where('ip_address', $ip);
    }

    public function scopeLatest(Builder $query): Builder
    {
        return $query->latest('visited_at');
    }

    /**
     * --------------------------------------------------------------------------
     * ACCESSORS
     * --------------------------------------------------------------------------
     */

    public function getVisitorTypeAttribute(): string
    {
        return $this->user_id ? 'Authenticated User' : 'Guest Visitor';
    }

    public function getDeviceNameAttribute(): string
    {
        return $this->device ?: 'Unknown Device';
    }

    public function getLocationAttribute(): ?string
    {
        return collect([
            $this->city,
            $this->country,
        ])->filter()->implode(', ') ?: null;
    }

    public function getVisitedAtHumanAttribute(): ?string
    {
        return $this->visited_at?->diffForHumans();
    }

    /**
     * --------------------------------------------------------------------------
     * HELPERS
     * --------------------------------------------------------------------------
     */

    public function isGuest(): bool
    {
        return is_null($this->user_id);
    }

    public function isAuthenticated(): bool
    {
        return !is_null($this->user_id);
    }

    public function isUniqueVisit(): bool
    {
        return (bool) $this->is_unique;
    }

    public function isToday(): bool
    {
        return $this->visited_at?->isToday() ?? false;
    }

    /**
     * --------------------------------------------------------------------------
     * STATISTICS
     * --------------------------------------------------------------------------
     */

    public static function totalVisits(): int
    {
        return static::count();
    }

    public static function uniqueVisits(): int
    {
        return static::unique()->count();
    }

    public static function guestVisits(): int
    {
        return static::guests()->count();
    }

    public static function authenticatedVisits(): int
    {
        return static::authenticated()->count();
    }

    public static function todayVisits(): int
    {
        return static::today()->count();
    }

    public static function thisWeekVisits(): int
    {
        return static::thisWeek()->count();
    }

    public static function thisMonthVisits(): int
    {
        return static::thisMonth()->count();
    }

    public static function thisYearVisits(): int
    {
        return static::thisYear()->count();
    }
}