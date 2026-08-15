<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Dashboard extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Table
    |--------------------------------------------------------------------------
    */

    protected $table = 'dashboards';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'description',
        'type',
        'layout',
        'widgets',
        'filters',
        'is_default',
        'is_active',
        'sort_order',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'layout' => 'array',
        'widgets' => 'array',
        'filters' => 'array',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'sort_order' => 'integer',
    ];

    /*
    |--------------------------------------------------------------------------
    | Constants
    |--------------------------------------------------------------------------
    */

    public const TYPE_SYSTEM = 'system';

    public const TYPE_USER = 'user';

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * User who owns the dashboard.
     *
     * System dashboards can have a null user_id.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope active dashboards.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope inactive dashboards.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope system dashboards.
     */
    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_SYSTEM);
    }

    /**
     * Scope user dashboards.
     */
    public function scopeUserDashboards(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_USER);
    }

    /**
     * Scope default dashboards.
     */
    public function scopeDefault(Builder $query): Builder
    {
        return $query->where('is_default', true);
    }

    /**
     * Scope dashboards ordered by sort order.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('sort_order');
    }

    /**
     * Scope dashboards belonging to a user.
     */
    public function scopeForUser(
        Builder $query,
        ?int $userId
    ): Builder {
        return $query->where('user_id', $userId);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether this is a system dashboard.
     */
    public function isSystem(): bool
    {
        return $this->type === self::TYPE_SYSTEM;
    }

    /**
     * Determine whether this is a user dashboard.
     */
    public function isUserDashboard(): bool
    {
        return $this->type === self::TYPE_USER;
    }

    /**
     * Determine whether the dashboard is active.
     */
    public function isActive(): bool
    {
        return (bool) $this->is_active;
    }

    /**
     * Determine whether the dashboard is the default dashboard.
     */
    public function isDefault(): bool
    {
        return (bool) $this->is_default;
    }

    /**
     * Determine whether the dashboard belongs to a specific user.
     */
    public function belongsToUser(?int $userId): bool
    {
        return $this->user_id !== null
            && (int) $this->user_id === (int) $userId;
    }

    /**
     * Determine whether the dashboard is available for use.
     */
    public function isAvailable(): bool
    {
        return $this->is_active === true;
    }
}