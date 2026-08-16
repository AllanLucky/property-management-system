<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

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
    | Defaults
    |--------------------------------------------------------------------------
    */

    protected $attributes = [
        'type' => self::TYPE_USER,
        'is_default' => false,
        'is_active' => true,
        'sort_order' => 0,
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

    /**
     * Dashboard types.
     */
    public const TYPE_SYSTEM = 'system';

    public const TYPE_USER = 'user';

    /**
     * Widget types.
     */
    public const WIDGET_STAT = 'stat';

    public const WIDGET_CHART = 'chart';

    public const WIDGET_TABLE = 'table';

    public const WIDGET_ACTIVITY = 'activity';

    public const WIDGET_FINANCIAL = 'financial';

    public const WIDGET_LIST = 'list';

    /**
     * Dashboard roles.
     */
    public const ROLE_SUPER_ADMIN = 'super-admin';

    public const ROLE_ADMIN = 'admin';

    public const ROLE_PROPERTY_MANAGER = 'property-manager';

    public const ROLE_ACCOUNTANT = 'accountant';

    public const ROLE_AGENT = 'agent';

    public const ROLE_LANDLORD = 'landlord';

    public const ROLE_TENANT = 'tenant';

    /*
    |--------------------------------------------------------------------------
    | Boot
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        /*
         * Automatically generate a slug when one is not supplied.
         */
        static::creating(function (Dashboard $dashboard) {
            if (empty($dashboard->slug)) {
                $dashboard->slug = static::generateUniqueSlug(
                    $dashboard->name
                );
            }

            if ($dashboard->layout === null) {
                $dashboard->layout = static::defaultLayout();
            }

            if ($dashboard->widgets === null) {
                $dashboard->widgets = static::defaultWidgets();
            }

            if ($dashboard->filters === null) {
                $dashboard->filters = [];
            }
        });

        /*
         * Regenerate the slug when the name changes and
         * the dashboard is still using the old/generated slug.
         */
        static::updating(function (Dashboard $dashboard) {
            if (
                $dashboard->isDirty('name') &&
                empty($dashboard->getOriginal('slug'))
            ) {
                $dashboard->slug = static::generateUniqueSlug(
                    $dashboard->name,
                    $dashboard->id
                );
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * User who owns the dashboard.
     *
     * System dashboards may have a null user_id.
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
        return $query
            ->orderBy('sort_order')
            ->orderBy('name');
    }

    /**
     * Scope dashboards belonging to a user.
     */
    public function scopeForUser(
        Builder $query,
        ?int $userId
    ): Builder {
        if ($userId === null) {
            return $query->whereNull('user_id');
        }

        return $query->where('user_id', $userId);
    }

    /**
     * Scope dashboards available to a specific user.
     *
     * Includes:
     * - System dashboards
     * - User-owned dashboards
     */
    public function scopeAvailableForUser(
        Builder $query,
        ?int $userId
    ): Builder {
        return $query
            ->active()
            ->where(function (Builder $builder) use ($userId) {
                $builder
                    ->where('type', self::TYPE_SYSTEM)
                    ->orWhere(function (Builder $userQuery) use ($userId) {
                        $userQuery
                            ->where('type', self::TYPE_USER)
                            ->where('user_id', $userId);
                    });
            })
            ->ordered();
    }

    /**
     * Scope dashboards for a role.
     *
     * Role matching is based on the layout.role value.
     */
    public function scopeForRole(
        Builder $query,
        string $role
    ): Builder {
        return $query
            ->where('layout->role', $role);
    }

    /*
    |--------------------------------------------------------------------------
    | Static Defaults
    |--------------------------------------------------------------------------
    */

    /**
     * Default professional dashboard layout.
     */
    public static function defaultLayout(): array
    {
        return [
            'columns' => 12,
            'responsive' => true,

            'cards' => [
                'small' => 3,
                'medium' => 4,
                'large' => 6,
                'full' => 12,
            ],

            'breakpoints' => [
                'mobile' => 1,
                'tablet' => 6,
                'desktop' => 12,
            ],

            'role' => self::ROLE_SUPER_ADMIN,
        ];
    }

    /**
     * Default Super Admin widgets.
     */
    public static function defaultWidgets(): array
    {
        return [
            [
                'key' => 'properties',
                'type' => self::WIDGET_STAT,
                'title' => 'Properties',
                'enabled' => true,
                'order' => 1,
            ],

            [
                'key' => 'apartments',
                'type' => self::WIDGET_STAT,
                'title' => 'Apartments',
                'enabled' => true,
                'order' => 2,
            ],

            [
                'key' => 'units',
                'type' => self::WIDGET_STAT,
                'title' => 'Units',
                'enabled' => true,
                'order' => 3,
            ],

            [
                'key' => 'occupancy',
                'type' => self::WIDGET_CHART,
                'title' => 'Occupancy Overview',
                'enabled' => true,
                'order' => 4,
            ],

            [
                'key' => 'tenancies',
                'type' => self::WIDGET_CHART,
                'title' => 'Tenancy Overview',
                'enabled' => true,
                'order' => 5,
            ],

            [
                'key' => 'bookings',
                'type' => self::WIDGET_CHART,
                'title' => 'Bookings Overview',
                'enabled' => true,
                'order' => 6,
            ],

            [
                'key' => 'financials',
                'type' => self::WIDGET_FINANCIAL,
                'title' => 'Financial Overview',
                'enabled' => true,
                'order' => 7,
            ],

            [
                'key' => 'maintenance',
                'type' => self::WIDGET_CHART,
                'title' => 'Maintenance Overview',
                'enabled' => true,
                'order' => 8,
            ],

            [
                'key' => 'activity',
                'type' => self::WIDGET_ACTIVITY,
                'title' => 'Recent Activity',
                'enabled' => true,
                'order' => 9,
            ],
        ];
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
     * Determine whether the dashboard is inactive.
     */
    public function isInactive(): bool
    {
        return !$this->isActive();
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
        if ($userId === null || $this->user_id === null) {
            return false;
        }

        return (int) $this->user_id === (int) $userId;
    }

    /**
     * Determine whether the dashboard is available for use.
     */
    public function isAvailable(): bool
    {
        return $this->isActive();
    }

    /**
     * Determine whether this dashboard belongs to a role.
     */
    public function isForRole(string $role): bool
    {
        return $this->getRole() === $role;
    }

    /**
     * Get dashboard role.
     */
    public function getRole(): ?string
    {
        return data_get($this->layout, 'role');
    }

    /**
     * Get dashboard columns.
     */
    public function getColumns(): int
    {
        return (int) data_get(
            $this->layout,
            'columns',
            12
        );
    }

    /**
     * Determine whether the dashboard is responsive.
     */
    public function isResponsive(): bool
    {
        return (bool) data_get(
            $this->layout,
            'responsive',
            true
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Widget Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Get all dashboard widgets.
     */
    public function getWidgets(): array
    {
        $widgets = $this->widgets;

        if (!is_array($widgets)) {
            return [];
        }

        return array_values($widgets);
    }

    /**
     * Get enabled widgets only.
     */
    public function getEnabledWidgets(): array
    {
        return array_values(
            array_filter(
                $this->getWidgets(),
                static function ($widget) {
                    return is_array($widget)
                        ? ($widget['enabled'] ?? true) === true
                        : true;
                }
            )
        );
    }

    /**
     * Get a widget by key.
     */
    public function getWidget(string $key): ?array
    {
        foreach ($this->getWidgets() as $widget) {
            if (
                is_array($widget) &&
                ($widget['key'] ?? null) === $key
            ) {
                return $widget;
            }

            /*
             * Backward compatibility with the old format:
             *
             * [
             *     "properties",
             *     "apartments"
             * ]
             */
            if (is_string($widget) && $widget === $key) {
                return [
                    'key' => $widget,
                    'type' => self::WIDGET_STAT,
                    'title' => Str::headline($widget),
                    'enabled' => true,
                ];
            }
        }

        return null;
    }

    /**
     * Determine whether a widget exists.
     */
    public function hasWidget(string $key): bool
    {
        return $this->getWidget($key) !== null;
    }

    /**
     * Determine whether a widget is enabled.
     */
    public function hasEnabledWidget(string $key): bool
    {
        $widget = $this->getWidget($key);

        if ($widget === null) {
            return false;
        }

        return ($widget['enabled'] ?? true) === true;
    }

    /**
     * Add a widget to the dashboard.
     */
    public function addWidget(
        string $key,
        string $type = self::WIDGET_STAT,
        ?string $title = null,
        bool $enabled = true
    ): self {
        $widgets = $this->getWidgets();

        if ($this->hasWidget($key)) {
            return $this;
        }

        $widgets[] = [
            'key' => $key,
            'type' => $type,
            'title' => $title ?? Str::headline($key),
            'enabled' => $enabled,
            'order' => count($widgets) + 1,
        ];

        $this->widgets = $widgets;

        return $this;
    }

    /**
     * Remove a widget from the dashboard.
     */
    public function removeWidget(string $key): self
    {
        $widgets = array_values(
            array_filter(
                $this->getWidgets(),
                static function ($widget) use ($key) {
                    if (is_string($widget)) {
                        return $widget !== $key;
                    }

                    return ($widget['key'] ?? null) !== $key;
                }
            )
        );

        $this->widgets = $widgets;

        return $this;
    }

    /**
     * Enable a widget.
     */
    public function enableWidget(string $key): self
    {
        return $this->setWidgetEnabled($key, true);
    }

    /**
     * Disable a widget.
     */
    public function disableWidget(string $key): self
    {
        return $this->setWidgetEnabled($key, false);
    }

    /**
     * Set widget enabled state.
     */
    public function setWidgetEnabled(
        string $key,
        bool $enabled
    ): self {
        $widgets = $this->getWidgets();

        foreach ($widgets as &$widget) {
            if (
                is_array($widget) &&
                ($widget['key'] ?? null) === $key
            ) {
                $widget['enabled'] = $enabled;
            }
        }

        unset($widget);

        $this->widgets = $widgets;

        return $this;
    }

    /*
    |--------------------------------------------------------------------------
    | Filter Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Get dashboard filters.
     */
    public function getFilters(): array
    {
        return is_array($this->filters)
            ? $this->filters
            : [];
    }

    /**
     * Determine whether the dashboard has filters.
     */
    public function hasFilters(): bool
    {
        return count($this->getFilters()) > 0;
    }

    /**
     * Add or update a dashboard filter.
     */
    public function setFilter(
        string $key,
        mixed $value
    ): self {
        $filters = $this->getFilters();

        $filters[$key] = $value;

        $this->filters = $filters;

        return $this;
    }

    /**
     * Get a dashboard filter.
     */
    public function getFilter(
        string $key,
        mixed $default = null
    ): mixed {
        return data_get(
            $this->filters,
            $key,
            $default
        );
    }

    /**
     * Remove a dashboard filter.
     */
    public function removeFilter(string $key): self
    {
        $filters = $this->getFilters();

        unset($filters[$key]);

        $this->filters = $filters;

        return $this;
    }

    /*
    |--------------------------------------------------------------------------
    | Layout Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Get dashboard layout.
     */
    public function getLayout(): array
    {
        return is_array($this->layout)
            ? $this->layout
            : static::defaultLayout();
    }

    /**
     * Set dashboard layout.
     */
    public function setLayout(array $layout): self
    {
        $this->layout = array_replace_recursive(
            static::defaultLayout(),
            $layout
        );

        return $this;
    }

    /**
     * Get card size configuration.
     */
    public function getCardSize(string $size): int
    {
        return (int) data_get(
            $this->layout,
            "cards.{$size}",
            4
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Static Lookup Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Find the default system dashboard.
     */
    public static function defaultSystemDashboard(): ?self
    {
        return static::query()
            ->active()
            ->system()
            ->default()
            ->ordered()
            ->first();
    }

    /**
     * Find the default dashboard for a user.
     */
    public static function defaultForUser(
        ?int $userId
    ): ?self {
        if ($userId === null) {
            return static::defaultSystemDashboard();
        }

        return static::query()
            ->availableForUser($userId)
            ->where(function (Builder $query) use ($userId) {
                $query
                    ->where(function (Builder $system) {
                        $system
                            ->where('type', self::TYPE_SYSTEM)
                            ->where('is_default', true);
                    })
                    ->orWhere(function (Builder $user) use ($userId) {
                        $user
                            ->where('type', self::TYPE_USER)
                            ->where('user_id', $userId)
                            ->where('is_default', true);
                    });
            })
            ->ordered()
            ->first();
    }

    /**
     * Generate a unique dashboard slug.
     */
    public static function generateUniqueSlug(
        ?string $name,
        ?int $ignoreId = null
    ): string {
        $baseSlug = Str::slug(
            $name ?: 'dashboard'
        );

        $slug = $baseSlug;
        $counter = 1;

        while (
            static::query()
                ->where('slug', $slug)
                ->when(
                    $ignoreId !== null,
                    fn (Builder $query) =>
                        $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = "{$baseSlug}-{$counter}";
            $counter++;
        }

        return $slug;
    }

    /*
    |--------------------------------------------------------------------------
    | Validation Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the dashboard configuration is valid.
     */
    public function hasValidConfiguration(): bool
    {
        return in_array(
            $this->type,
            [
                self::TYPE_SYSTEM,
                self::TYPE_USER,
            ],
            true
        )
            && is_array($this->layout)
            && is_array($this->widgets)
            && is_array($this->filters);
    }

    /**
     * Get supported dashboard types.
     */
    public static function types(): array
    {
        return [
            self::TYPE_SYSTEM,
            self::TYPE_USER,
        ];
    }

    /**
     * Get supported widget types.
     */
    public static function widgetTypes(): array
    {
        return [
            self::WIDGET_STAT,
            self::WIDGET_CHART,
            self::WIDGET_TABLE,
            self::WIDGET_ACTIVITY,
            self::WIDGET_FINANCIAL,
            self::WIDGET_LIST,
        ];
    }
}