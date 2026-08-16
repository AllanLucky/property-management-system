<?php

namespace App\Services;

use App\Models\Dashboard;
use App\Models\User;
use App\Repositories\Interfaces\DashboardRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Throwable;

class DashboardService
{
    /*
    |--------------------------------------------------------------------------
    | Repository
    |--------------------------------------------------------------------------
    */

    protected DashboardRepositoryInterface $dashboardRepository;

    /*
    |--------------------------------------------------------------------------
    | Constructor
    |--------------------------------------------------------------------------
    */

    public function __construct(
        DashboardRepositoryInterface $dashboardRepository
    ) {
        $this->dashboardRepository = $dashboardRepository;
    }

    /*
    |--------------------------------------------------------------------------
    | MAIN DASHBOARD
    |--------------------------------------------------------------------------
    */

    public function getDashboardForUser(User $user): array
    {
        $dashboard = $this->resolveDashboard($user);

        $data = [
            'dashboard' => $dashboard,

            'user' => $this->getUserSummary($user),

            'overview' => [],

            'properties' => $this->emptyPropertyStatistics(),

            'apartments' => $this->emptyApartmentStatistics(),

            'units' => $this->emptyUnitStatistics(),

            'occupancy' => $this->emptyOccupancyStatistics(),

            'tenancies' => $this->emptyTenancyStatistics(),

            'bookings' => $this->emptyBookingStatistics(),

            'financials' => $this->emptyFinancialStatistics(),

            'maintenance' => $this->emptyMaintenanceStatistics(),

            'activity' => [],

            'trends' => [],

            'revenue' => [
                'labels' => [],
                'values' => [],
                'currency' => 'KES',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Dashboard Permission
        |--------------------------------------------------------------------------
        */

        if (
            $this->permissionExists('dashboard.view') &&
            ! $user->can('dashboard.view')
        ) {
            $data['overview'] = $this->buildOverview($data);

            return $data;
        }

        /*
        |--------------------------------------------------------------------------
        | Properties
        |--------------------------------------------------------------------------
        */

        if ($this->canViewDashboardSection(
            $user,
            'dashboard.properties'
        )) {
            $data['properties'] =
                $this->getPropertyStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Apartments
        |--------------------------------------------------------------------------
        */

        if ($this->canViewDashboardSection(
            $user,
            'dashboard.apartments'
        )) {
            $data['apartments'] =
                $this->getApartmentStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Units
        |--------------------------------------------------------------------------
        */

        if ($this->canViewDashboardSection(
            $user,
            'dashboard.units'
        )) {
            $data['units'] =
                $this->getUnitStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Occupancy
        |--------------------------------------------------------------------------
        */

        if ($this->canViewDashboardSection(
            $user,
            'dashboard.occupancy'
        )) {
            $data['occupancy'] =
                $this->getOccupancyStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Tenancies
        |--------------------------------------------------------------------------
        */

        if ($this->canViewDashboardSection(
            $user,
            'dashboard.tenancies'
        )) {
            $data['tenancies'] =
                $this->getTenancyStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Bookings
        |--------------------------------------------------------------------------
        */

        if ($this->canViewDashboardSection(
            $user,
            'dashboard.bookings'
        )) {
            $data['bookings'] =
                $this->getBookingStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Financials
        |--------------------------------------------------------------------------
        */

        if ($this->canViewDashboardSection(
            $user,
            'dashboard.financials'
        )) {
            $data['financials'] =
                $this->getFinancialStatistics($user);

            $data['revenue'] =
                $this->getRevenueChart($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Maintenance
        |--------------------------------------------------------------------------
        */

        if ($this->canViewDashboardSection(
            $user,
            'dashboard.maintenance'
        )) {
            $data['maintenance'] =
                $this->getMaintenanceStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Activity
        |--------------------------------------------------------------------------
        */

        if ($this->canViewDashboardSection(
            $user,
            'dashboard.activity'
        )) {
            $data['activity'] =
                $this->getRecentActivity($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Trends
        |--------------------------------------------------------------------------
        */

        $data['trends'] =
            $this->getDashboardTrends(
                $user,
                $data
            );

        /*
        |--------------------------------------------------------------------------
        | Overview
        |--------------------------------------------------------------------------
        */

        $data['overview'] =
            $this->buildOverview($data);

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD PERMISSIONS
    |--------------------------------------------------------------------------
    */

    protected function canViewDashboardSection(
        User $user,
        string $permission
    ): bool {
        /*
        |--------------------------------------------------------------------------
        | If permission does not exist, allow section.
        |--------------------------------------------------------------------------
        */

        if (! $this->permissionExists($permission)) {
            return true;
        }

        return $user->can($permission);
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD RESOLUTION
    |--------------------------------------------------------------------------
    */

    protected function resolveDashboard(
        User $user
    ): ?Dashboard {
        $roles = $user
            ->getRoleNames()
            ->values();

        if ($roles->isEmpty()) {
            return $this->getDefaultDashboard($user);
        }

        foreach ($roles as $role) {
            $slug = $this->dashboardSlugForRole($role);

            if (! $slug) {
                continue;
            }

            $dashboard = Dashboard::query()
                ->where('type', Dashboard::TYPE_SYSTEM)
                ->where('slug', $slug)
                ->where('is_active', true)
                ->first();

            if (! $dashboard) {
                $dashboard = $this->createSystemDashboard(
                    role: $role,
                    slug: $slug
                );
            }

            if ($dashboard) {
                return $dashboard;
            }
        }

        return $this->getDefaultDashboard($user);
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE → DASHBOARD SLUG
    |--------------------------------------------------------------------------
    */

    protected function dashboardSlugForRole(
        string $role
    ): ?string {
        return match (
            Str::lower(trim($role))
        ) {
            'super-admin' =>
                'super-admin-dashboard',

            'admin' =>
                'admin-dashboard',

            'property-manager' =>
                'property-manager-dashboard',

            'landlord' =>
                'landlord-dashboard',

            'accountant' =>
                'accountant-dashboard',

            'agent' =>
                'agent-dashboard',

            'lease-manager' =>
                'lease-manager-dashboard',

            'technician' =>
                'technician-dashboard',

            'maintenance' =>
                'maintenance-dashboard',

            'tenant' =>
                'tenant-dashboard',

            'customer' =>
                'customer-dashboard',

            'support-staff' =>
                'support-staff-dashboard',

            'auditor' =>
                'auditor-dashboard',

            default => null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD NAME
    |--------------------------------------------------------------------------
    */

    protected function dashboardNameForRole(
        string $role
    ): string {
        return match (
            Str::lower(trim($role))
        ) {
            'super-admin' =>
                'Super Admin Dashboard',

            'admin' =>
                'Admin Dashboard',

            'property-manager' =>
                'Property Manager Dashboard',

            'landlord' =>
                'Landlord Dashboard',

            'accountant' =>
                'Accountant Dashboard',

            'agent' =>
                'Agent Dashboard',

            'lease-manager' =>
                'Lease Manager Dashboard',

            'technician' =>
                'Technician Dashboard',

            'maintenance' =>
                'Maintenance Dashboard',

            'tenant' =>
                'Tenant Dashboard',

            'customer' =>
                'Customer Dashboard',

            'support-staff' =>
                'Support Staff Dashboard',

            'auditor' =>
                'Auditor Dashboard',

            default =>
                'Dashboard',
        };
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD DESCRIPTION
    |--------------------------------------------------------------------------
    */

    protected function dashboardDescriptionForRole(
        string $role
    ): string {
        return match (
            Str::lower(trim($role))
        ) {
            'super-admin' =>
                'Complete property management dashboard with system-wide visibility.',

            'admin' =>
                'Administrative dashboard for properties, apartments, units, tenants, bookings, finances and maintenance.',

            'property-manager' =>
                'Dashboard for assigned properties, apartments, units, tenants, occupancy and maintenance.',

            'landlord' =>
                'Dashboard for owned properties, apartments, occupancy, rent collection, expenses and income.',

            'accountant' =>
                'Financial dashboard for payments, rent collection, outstanding balances, expenses and reports.',

            'agent' =>
                'Dashboard for properties, available units, bookings and leads.',

            'lease-manager' =>
                'Dashboard for tenancies, leases, renewals and expirations.',

            'technician' =>
                'Dashboard for maintenance requests and jobs assigned to the technician.',

            'maintenance' =>
                'Dashboard for maintenance jobs, pending work, in-progress work and completed jobs.',

            'tenant' =>
                'Tenant dashboard for tenancy, rent, payments, bookings and maintenance.',

            'customer' =>
                'Customer dashboard for bookings, inquiries and payments.',

            'support-staff' =>
                'Support dashboard for customers, tenants, bookings and support activity.',

            'auditor' =>
                'Audit dashboard for financial, system and activity information.',

            default =>
                'Property management dashboard.',
        };
    }

    /*
    |--------------------------------------------------------------------------
    | WIDGETS
    |--------------------------------------------------------------------------
    */

    protected function widgetsForRole(
        string $role
    ): array {
        return match (
            Str::lower(trim($role))
        ) {
            'super-admin',
            'admin' => [
                'properties',
                'apartments',
                'units',
                'occupancy',
                'tenancies',
                'bookings',
                'financials',
                'maintenance',
                'activity',
            ],

            'property-manager' => [
                'properties',
                'apartments',
                'units',
                'occupancy',
                'tenancies',
                'maintenance',
                'activity',
            ],

            'landlord' => [
                'properties',
                'apartments',
                'units',
                'occupancy',
                'tenancies',
                'financials',
                'maintenance',
                'activity',
            ],

            'accountant' => [
                'financials',
                'payments',
                'rent_collection',
                'outstanding_balances',
                'expenses',
                'financial_reports',
                'activity',
            ],

            'agent' => [
                'properties',
                'available_units',
                'bookings',
                'leads',
                'activity',
            ],

            'lease-manager' => [
                'tenancies',
                'leases',
                'renewals',
                'expirations',
                'activity',
            ],

            'technician',
            'maintenance' => [
                'maintenance',
                'pending_jobs',
                'in_progress_jobs',
                'completed_jobs',
                'activity',
            ],

            'tenant' => [
                'tenancy',
                'rent',
                'payments',
                'bookings',
                'maintenance',
                'activity',
            ],

            'customer' => [
                'bookings',
                'inquiries',
                'payments',
                'activity',
            ],

            'support-staff' => [
                'customers',
                'tenants',
                'bookings',
                'support_activity',
                'activity',
            ],

            'auditor' => [
                'financials',
                'activity',
                'audit_logs',
                'reports',
            ],

            default => [
                'properties',
                'apartments',
                'units',
                'occupancy',
                'activity',
            ],
        };
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD LAYOUT
    |--------------------------------------------------------------------------
    */

    protected function layoutForRole(
        string $role
    ): array {
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

            'role' => Str::lower(trim($role)),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE SYSTEM DASHBOARD
    |--------------------------------------------------------------------------
    */

    protected function createSystemDashboard(
        string $role,
        string $slug
    ): ?Dashboard {
        try {
            return Dashboard::query()->firstOrCreate(
                [
                    'slug' => $slug,
                    'type' => Dashboard::TYPE_SYSTEM,
                ],
                [
                    'user_id' => null,

                    'name' =>
                        $this->dashboardNameForRole($role),

                    'description' =>
                        $this->dashboardDescriptionForRole($role),

                    'layout' =>
                        $this->layoutForRole($role),

                    'widgets' =>
                        $this->widgetsForRole($role),

                    'filters' => [],

                    'is_default' => false,

                    'is_active' => true,

                    'sort_order' =>
                        $this->dashboardSortOrder($role),
                ]
            );
        } catch (Throwable) {
            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DEFAULT DASHBOARD
    |--------------------------------------------------------------------------
    */

    protected function getDefaultDashboard(
        User $user
    ): ?Dashboard {
        $dashboard = Dashboard::query()
            ->where(
                'type',
                Dashboard::TYPE_SYSTEM
            )
            ->where(
                'is_default',
                true
            )
            ->where(
                'is_active',
                true
            )
            ->orderBy('sort_order')
            ->first();

        if ($dashboard) {
            return $dashboard;
        }

        try {
            return Dashboard::query()->firstOrCreate(
                [
                    'slug' => 'default-dashboard',
                    'type' => Dashboard::TYPE_SYSTEM,
                ],
                [
                    'user_id' => null,

                    'name' =>
                        'Default Dashboard',

                    'description' =>
                        'Default property management dashboard.',

                    'layout' => [
                        'columns' => 12,
                        'responsive' => true,
                        'cards' => [
                            'small' => 3,
                            'medium' => 4,
                            'large' => 6,
                            'full' => 12,
                        ],
                    ],

                    'widgets' => [
                        'properties',
                        'apartments',
                        'units',
                        'occupancy',
                        'activity',
                    ],

                    'filters' => [],

                    'is_default' => true,

                    'is_active' => true,

                    'sort_order' => 999,
                ]
            );
        } catch (Throwable) {
            return null;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD SORT ORDER
    |--------------------------------------------------------------------------
    */

    protected function dashboardSortOrder(
        string $role
    ): int {
        return match (
            Str::lower(trim($role))
        ) {
            'super-admin' => 1,
            'admin' => 2,
            'property-manager' => 3,
            'landlord' => 4,
            'accountant' => 5,
            'agent' => 6,
            'lease-manager' => 7,
            'technician' => 8,
            'maintenance' => 9,
            'tenant' => 10,
            'customer' => 11,
            'support-staff' => 12,
            'auditor' => 13,

            default => 999,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | USER SUMMARY
    |--------------------------------------------------------------------------
    */

    protected function getUserSummary(
        User $user
    ): array {
        $name = trim(
            ($user->first_name ?? '') .
            ' ' .
            ($user->last_name ?? '')
        );

        $roles = $user
            ->getRoleNames()
            ->values()
            ->toArray();

        return [
            'id' => $user->id,

            'name' => $name !== ''
                ? $name
                : ($user->name ?? $user->email),

            'first_name' =>
                $user->first_name,

            'last_name' =>
                $user->last_name,

            'email' =>
                $user->email,

            'roles' =>
                $roles,

            'primary_role' =>
                $roles[0] ?? null,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY STATISTICS
    |--------------------------------------------------------------------------
    */

    protected function getPropertyStatistics(
        User $user
    ): array {
        $empty =
            $this->emptyPropertyStatistics();

        if (! $this->tableExists('properties')) {
            return $empty;
        }

        $query = DB::table('properties');

        $this->applyPropertyScope(
            $query,
            $user
        );

        $total = (clone $query)->count();

        $active = 0;

        if ($this->columnExists(
            'properties',
            'status'
        )) {
            $active = (clone $query)
                ->whereIn(
                    'status',
                    [
                        'active',
                        'published',
                    ]
                )
                ->count();
        }

        $featured = 0;

        if ($this->columnExists(
            'properties',
            'is_featured'
        )) {
            $featured = (clone $query)
                ->where(
                    'is_featured',
                    true
                )
                ->count();
        }

        $verified = 0;

        if ($this->columnExists(
            'properties',
            'is_verified'
        )) {
            $verified = (clone $query)
                ->where(
                    'is_verified',
                    true
                )
                ->count();
        }

        $published = 0;

        if ($this->columnExists(
            'properties',
            'is_published'
        )) {
            $published = (clone $query)
                ->where(
                    'is_published',
                    true
                )
                ->count();
        }

        return [
            'total' => $total,

            'active' => $active,

            'inactive' =>
                max(0, $total - $active),

            'featured' => $featured,

            'verified' => $verified,

            'published' => $published,

            'verification_rate' =>
                $this->percentage(
                    $verified,
                    $total
                ),

            'publication_rate' =>
                $this->percentage(
                    $published,
                    $total
                ),

            'featured_rate' =>
                $this->percentage(
                    $featured,
                    $total
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | APARTMENT STATISTICS
    |--------------------------------------------------------------------------
    */

    protected function getApartmentStatistics(
        User $user
    ): array {
        $empty =
            $this->emptyApartmentStatistics();

        if (! $this->tableExists('apartments')) {
            return $empty;
        }

        $query = DB::table('apartments');

        $this->applyApartmentScope(
            $query,
            $user
        );

        $total =
            (clone $query)->count();

        $active = 0;

        if ($this->columnExists(
            'apartments',
            'status'
        )) {
            $active =
                (clone $query)
                    ->whereIn(
                        'status',
                        [
                            'active',
                            'published',
                        ]
                    )
                    ->count();
        }

        return [
            'total' => $total,

            'active' => $active,

            'inactive' =>
                max(
                    0,
                    $total - $active
                ),

            'active_rate' =>
                $this->percentage(
                    $active,
                    $total
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT STATISTICS
    |--------------------------------------------------------------------------
    */

    protected function getUnitStatistics(
        User $user
    ): array {
        $empty =
            $this->emptyUnitStatistics();

        if (! $this->tableExists('units')) {
            return $empty;
        }

        $query = DB::table('units');

        $this->applyUnitScope(
            $query,
            $user
        );

        $total =
            (clone $query)->count();

        if (! $this->columnExists(
            'units',
            'status'
        )) {
            $empty['total'] = $total;

            return $empty;
        }

        $occupied =
            (clone $query)
                ->where(
                    'status',
                    'occupied'
                )
                ->count();

        $vacant =
            (clone $query)
                ->where(
                    'status',
                    'vacant'
                )
                ->count();

        $maintenance =
            (clone $query)
                ->where(
                    'status',
                    'maintenance'
                )
                ->count();

        $reserved =
            (clone $query)
                ->where(
                    'status',
                    'reserved'
                )
                ->count();

        return [
            'total' => $total,

            'vacant' => $vacant,

            'occupied' => $occupied,

            'maintenance' => $maintenance,

            'reserved' => $reserved,

            'available' => $vacant,

            'occupied_rate' =>
                $this->percentage(
                    $occupied,
                    $total
                ),

            'vacant_rate' =>
                $this->percentage(
                    $vacant,
                    $total
                ),

            'maintenance_rate' =>
                $this->percentage(
                    $maintenance,
                    $total
                ),

            'reserved_rate' =>
                $this->percentage(
                    $reserved,
                    $total
                ),

            'status_breakdown' =>
                $this->buildStatusBreakdown(
                    [
                        'occupied' => $occupied,
                        'vacant' => $vacant,
                        'maintenance' => $maintenance,
                        'reserved' => $reserved,
                    ],
                    $total
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | OCCUPANCY
    |--------------------------------------------------------------------------
    */

    protected function getOccupancyStatistics(
        User $user
    ): array {
        $empty =
            $this->emptyOccupancyStatistics();

        if (! $this->tableExists('units')) {
            return $empty;
        }

        $query = DB::table('units');

        $this->applyUnitScope(
            $query,
            $user
        );

        $total =
            (clone $query)->count();

        if (! $this->columnExists(
            'units',
            'status'
        )) {
            $empty['total_units'] =
                $total;

            return $empty;
        }

        $occupied =
            (clone $query)
                ->where(
                    'status',
                    'occupied'
                )
                ->count();

        $vacant =
            (clone $query)
                ->where(
                    'status',
                    'vacant'
                )
                ->count();

        $maintenance =
            (clone $query)
                ->where(
                    'status',
                    'maintenance'
                )
                ->count();

        $reserved =
            (clone $query)
                ->where(
                    'status',
                    'reserved'
                )
                ->count();

        return [
            'total_units' => $total,

            'occupied' => $occupied,

            'vacant' => $vacant,

            'maintenance' => $maintenance,

            'reserved' => $reserved,

            'rate' =>
                $this->percentage(
                    $occupied,
                    $total
                ),

            'available_rate' =>
                $this->percentage(
                    $vacant,
                    $total
                ),

            'status_breakdown' =>
                $this->buildStatusBreakdown(
                    [
                        'occupied' => $occupied,
                        'vacant' => $vacant,
                        'maintenance' => $maintenance,
                        'reserved' => $reserved,
                    ],
                    $total
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | TENANCIES
    |--------------------------------------------------------------------------
    */

    protected function getTenancyStatistics(
        User $user
    ): array {
        $empty =
            $this->emptyTenancyStatistics();

        if (! $this->tableExists('tenancies')) {
            return $empty;
        }

        $query =
            DB::table('tenancies');

        $this->applyTenancyScope(
            $query,
            $user
        );

        $total =
            (clone $query)->count();

        $active = 0;
        $pending = 0;
        $expired = 0;
        $terminated = 0;
        $cancelled = 0;

        if ($this->columnExists(
            'tenancies',
            'status'
        )) {
            $active =
                (clone $query)
                    ->where(
                        'status',
                        'active'
                    )
                    ->count();

            $pending =
                (clone $query)
                    ->where(
                        'status',
                        'pending'
                    )
                    ->count();

            $expired =
                (clone $query)
                    ->where(
                        'status',
                        'expired'
                    )
                    ->count();

            $terminated =
                (clone $query)
                    ->where(
                        'status',
                        'terminated'
                    )
                    ->count();

            $cancelled =
                (clone $query)
                    ->where(
                        'status',
                        'cancelled'
                    )
                    ->count();
        }

        $expiringSoon = 0;

        $endDateColumn =
            $this->firstExistingColumn(
                'tenancies',
                [
                    'end_date',
                    'end_at',
                    'expiry_date',
                    'lease_end_date',
                ]
            );

        if (
            $endDateColumn &&
            $this->columnExists(
                'tenancies',
                'status'
            )
        ) {
            $expiringSoon =
                (clone $query)
                    ->where(
                        'status',
                        'active'
                    )
                    ->whereDate(
                        $endDateColumn,
                        '>=',
                        now()->toDateString()
                    )
                    ->whereDate(
                        $endDateColumn,
                        '<=',
                        now()
                            ->addDays(30)
                            ->toDateString()
                    )
                    ->count();
        }

        $new = 0;

        if ($this->columnExists(
            'tenancies',
            'created_at'
        )) {
            $new =
                (clone $query)
                    ->whereBetween(
                        'created_at',
                        [
                            now()->startOfMonth(),
                            now()->endOfMonth(),
                        ]
                    )
                    ->count();
        }

        return [
            'total' => $total,

            'active' => $active,

            'pending' => $pending,

            'expired' => $expired,

            'terminated' => $terminated,

            'cancelled' => $cancelled,

            'expiring_soon' =>
                $expiringSoon,

            'new' => $new,

            'active_rate' =>
                $this->percentage(
                    $active,
                    $total
                ),

            'status_breakdown' =>
                $this->buildStatusBreakdownWithTotal(
                    [
                        'active' => $active,
                        'pending' => $pending,
                        'expired' => $expired,
                        'terminated' => $terminated,
                        'cancelled' => $cancelled,
                    ],
                    $total
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKINGS
    |--------------------------------------------------------------------------
    */

    protected function getBookingStatistics(
        User $user
    ): array {
        $empty =
            $this->emptyBookingStatistics();

        if (! $this->tableExists('bookings')) {
            return $empty;
        }

        $query =
            DB::table('bookings');

        $this->applyBookingScope(
            $query,
            $user
        );

        $total =
            (clone $query)->count();

        $statuses = [
            'pending',
            'confirmed',
            'completed',
            'cancelled',
            'rejected',
            'expired',
        ];

        $counts = [];

        foreach ($statuses as $status) {
            $counts[$status] = 0;

            if ($this->columnExists(
                'bookings',
                'status'
            )) {
                $counts[$status] =
                    (clone $query)
                        ->where(
                            'status',
                            $status
                        )
                        ->count();
            }
        }

        return [
            'total' => $total,

            'pending' =>
                $counts['pending'],

            'confirmed' =>
                $counts['confirmed'],

            'completed' =>
                $counts['completed'],

            'cancelled' =>
                $counts['cancelled'],

            'rejected' =>
                $counts['rejected'],

            'expired' =>
                $counts['expired'],

            'pending_rate' =>
                $this->percentage(
                    $counts['pending'],
                    $total
                ),

            'confirmed_rate' =>
                $this->percentage(
                    $counts['confirmed'],
                    $total
                ),

            'completed_rate' =>
                $this->percentage(
                    $counts['completed'],
                    $total
                ),

            'cancelled_rate' =>
                $this->percentage(
                    $counts['cancelled'],
                    $total
                ),

            'rejected_rate' =>
                $this->percentage(
                    $counts['rejected'],
                    $total
                ),

            'expired_rate' =>
                $this->percentage(
                    $counts['expired'],
                    $total
                ),

            'status_breakdown' =>
                $this->buildStatusBreakdownWithTotal(
                    $counts,
                    $total
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL STATISTICS
    |--------------------------------------------------------------------------
    */

    protected function getFinancialStatistics(
        User $user
    ): array {
        $rentDue = 0.0;

        $rentCollected = 0.0;

        $expenses = 0.0;

        $periodStart =
            now()->startOfMonth();

        $periodEnd =
            now()->endOfMonth();

        /*
        |--------------------------------------------------------------------------
        | RENT DUE
        |--------------------------------------------------------------------------
        */

        if ($this->tableExists('tenancies')) {
            $query =
                DB::table('tenancies');

            $this->applyTenancyScope(
                $query,
                $user
            );

            $rentColumn =
                $this->firstExistingColumn(
                    'tenancies',
                    [
                        'rent_amount',
                        'monthly_rent',
                        'rent',
                        'rent_amount_due',
                        'rent_price',
                    ]
                );

            if ($rentColumn) {
                if ($this->columnExists(
                    'tenancies',
                    'status'
                )) {
                    $query->where(
                        'status',
                        'active'
                    );
                }

                $rentDue =
                    (float) $query->sum(
                        $rentColumn
                    );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | PAYMENTS
        |--------------------------------------------------------------------------
        */

        if ($this->tableExists('payments')) {
            $query =
                DB::table('payments');

            $this->applyPaymentScope(
                $query,
                $user
            );

            $amountColumn =
                $this->firstExistingColumn(
                    'payments',
                    [
                        'amount',
                        'paid_amount',
                        'payment_amount',
                        'total_amount',
                        'amount_paid',
                    ]
                );

            if ($amountColumn) {
                /*
                |--------------------------------------------------------------------------
                | Determine payment date column
                |--------------------------------------------------------------------------
                */

                $paymentDateColumn =
                    $this->firstExistingColumn(
                        'payments',
                        [
                            'payment_date',
                            'paid_at',
                            'transaction_date',
                            'created_at',
                        ]
                    );

                if ($paymentDateColumn) {
                    if ($paymentDateColumn === 'created_at') {
                        $query->whereBetween(
                            $paymentDateColumn,
                            [
                                $periodStart,
                                $periodEnd,
                            ]
                        );
                    } else {
                        $query->whereBetween(
                            $paymentDateColumn,
                            [
                                $periodStart->toDateString(),
                                $periodEnd->toDateString(),
                            ]
                        );
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Successful Payment Statuses
                |--------------------------------------------------------------------------
                */

                if ($this->columnExists(
                    'payments',
                    'status'
                )) {
                    $query->whereIn(
                        'status',
                        [
                            'paid',
                            'completed',
                            'success',
                            'successful',
                            'approved',
                            'received',
                        ]
                    );
                }

                $rentCollected =
                    (float) $query->sum(
                        $amountColumn
                    );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | EXPENSES
        |--------------------------------------------------------------------------
        */

        if ($this->tableExists('expenses')) {
            $query =
                DB::table('expenses');

            $this->applyExpenseScope(
                $query,
                $user
            );

            $amountColumn =
                $this->firstExistingColumn(
                    'expenses',
                    [
                        'amount',
                        'expense_amount',
                        'total_amount',
                        'amount_paid',
                    ]
                );

            if ($amountColumn) {
                $expenseDateColumn =
                    $this->firstExistingColumn(
                        'expenses',
                        [
                            'expense_date',
                            'paid_at',
                            'created_at',
                        ]
                    );

                if ($expenseDateColumn) {
                    if ($expenseDateColumn === 'created_at') {
                        $query->whereBetween(
                            $expenseDateColumn,
                            [
                                $periodStart,
                                $periodEnd,
                            ]
                        );
                    } else {
                        $query->whereBetween(
                            $expenseDateColumn,
                            [
                                $periodStart->toDateString(),
                                $periodEnd->toDateString(),
                            ]
                        );
                    }
                }

                if ($this->columnExists(
                    'expenses',
                    'status'
                )) {
                    $query->whereIn(
                        'status',
                        [
                            'paid',
                            'approved',
                            'completed',
                        ]
                    );
                }

                $expenses =
                    (float) $query->sum(
                        $amountColumn
                    );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | CALCULATIONS
        |--------------------------------------------------------------------------
        */

        $outstanding =
            max(
                0,
                $rentDue - $rentCollected
            );

        $collectionRate =
            $this->percentage(
                $rentCollected,
                $rentDue
            );

        $netIncome =
            $rentCollected - $expenses;

        $netMargin =
            $rentCollected > 0
                ? round(
                    (
                        $netIncome /
                        $rentCollected
                    ) * 100,
                    2
                )
                : 0;

        $expenseRate =
            $rentDue > 0
                ? round(
                    min(
                        100,
                        (
                            $expenses /
                            $rentDue
                        ) * 100
                    ),
                    2
                )
                : 0;

        return [
            'rent_due' =>
                round(
                    $rentDue,
                    2
                ),

            'rent_collected' =>
                round(
                    $rentCollected,
                    2
                ),

            'outstanding' =>
                round(
                    $outstanding,
                    2
                ),

            'expenses' =>
                round(
                    $expenses,
                    2
                ),

            'net_income' =>
                round(
                    $netIncome,
                    2
                ),

            'collection_rate' =>
                $collectionRate,

            'expense_rate' =>
                $expenseRate,

            'net_margin' =>
                $netMargin,

            'currency' => 'KES',

            'period' => [
                'start' =>
                    $periodStart->toDateString(),

                'end' =>
                    $periodEnd->toDateString(),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE
    |--------------------------------------------------------------------------
    */

    protected function getMaintenanceStatistics(
        User $user
    ): array {
        $empty =
            $this->emptyMaintenanceStatistics();

        if (! $this->tableExists(
            'maintenances'
        )) {
            return $empty;
        }

        $query =
            DB::table('maintenances');

        $this->applyMaintenanceScope(
            $query,
            $user
        );

        $total =
            (clone $query)->count();

        $pending = 0;
        $inProgress = 0;
        $completed = 0;
        $cancelled = 0;

        if ($this->columnExists(
            'maintenances',
            'status'
        )) {
            $pending =
                (clone $query)
                    ->where(
                        'status',
                        'pending'
                    )
                    ->count();

            $inProgress =
                (clone $query)
                    ->where(
                        'status',
                        'in_progress'
                    )
                    ->count();

            $completed =
                (clone $query)
                    ->where(
                        'status',
                        'completed'
                    )
                    ->count();

            $cancelled =
                (clone $query)
                    ->where(
                        'status',
                        'cancelled'
                    )
                    ->count();
        }

        $open =
            $pending + $inProgress;

        $urgent = 0;

        if ($this->columnExists(
            'maintenances',
            'priority'
        )) {
            $urgent =
                (clone $query)
                    ->whereIn(
                        'priority',
                        [
                            'urgent',
                            'critical',
                            'high',
                        ]
                    )
                    ->when(
                        $this->columnExists(
                            'maintenances',
                            'status'
                        ),
                        function ($q) {
                            $q->whereNotIn(
                                'status',
                                [
                                    'completed',
                                    'cancelled',
                                ]
                            );
                        }
                    )
                    ->count();
        }

        $overdue = 0;

        $dueDateColumn =
            $this->firstExistingColumn(
                'maintenances',
                [
                    'due_date',
                    'scheduled_date',
                    'maintenance_date',
                    'expected_completion_date',
                ]
            );

        if ($dueDateColumn) {
            $overdue =
                (clone $query)
                    ->whereDate(
                        $dueDateColumn,
                        '<',
                        now()->toDateString()
                    )
                    ->when(
                        $this->columnExists(
                            'maintenances',
                            'status'
                        ),
                        function ($q) {
                            $q->whereNotIn(
                                'status',
                                [
                                    'completed',
                                    'cancelled',
                                ]
                            );
                        }
                    )
                    ->count();
        }

        return [
            'total' => $total,

            'pending' => $pending,

            'in_progress' =>
                $inProgress,

            'completed' =>
                $completed,

            'cancelled' =>
                $cancelled,

            'urgent' =>
                $urgent,

            'overdue' =>
                $overdue,

            'open' =>
                $open,

            'completion_rate' =>
                $this->percentage(
                    $completed,
                    $total
                ),

            'status_breakdown' =>
                $this->buildStatusBreakdownWithTotal(
                    [
                        'pending' => $pending,
                        'in_progress' => $inProgress,
                        'completed' => $completed,
                        'cancelled' => $cancelled,
                    ],
                    $total
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | RECENT ACTIVITY
    |--------------------------------------------------------------------------
    */

    protected function getRecentActivity(
        User $user
    ): array {
        if (! $this->tableExists(
            'activity_log'
        )) {
            return [];
        }

        try {
            $query =
                DB::table('activity_log')
                    ->orderByDesc('created_at')
                    ->limit(10);

            /*
            |--------------------------------------------------------------------------
            | Admins
            |--------------------------------------------------------------------------
            */

            if (
                ! $this->isSystemAdministrator($user)
            ) {
                if ($this->columnExists(
                    'activity_log',
                    'causer_id'
                )) {
                    $query->where(
                        'causer_id',
                        $user->id
                    );
                }
            }

            return $query
                ->get()
                ->map(
                    function ($activity) {
                        return [
                            'id' =>
                                $activity->id ?? null,

                            'type' =>
                                $activity->event
                                ?? 'activity',

                            'title' =>
                                $activity->description
                                ?? 'System Activity',

                            'description' =>
                                $activity->description
                                ?? null,

                            'icon' =>
                                $this->activityIcon(
                                    $activity->event
                                    ?? null
                                ),

                            'status' =>
                                $activity->event
                                ?? null,

                            'user' => [
                                'id' =>
                                    $activity->causer_id
                                    ?? null,
                            ],

                            'entity' => [
                                'type' =>
                                    $activity->subject_type
                                    ?? null,

                                'id' =>
                                    $activity->subject_id
                                    ?? null,
                            ],

                            'created_at' =>
                                $activity->created_at
                                ?? null,

                            'time_ago' =>
                                $activity->created_at
                                    ? $this->timeAgo(
                                        $activity->created_at
                                    )
                                    : null,
                        ];
                    }
                )
                ->values()
                ->toArray();
        } catch (Throwable) {
            return [];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVITY ICON
    |--------------------------------------------------------------------------
    */

    protected function activityIcon(
        ?string $event
    ): string {
        return match (
            Str::lower(
                (string) $event
            )
        ) {
            'created' =>
                'plus',

            'updated' =>
                'edit',

            'deleted' =>
                'trash',

            'restored' =>
                'rotate-ccw',

            'login' =>
                'log-in',

            'logout' =>
                'log-out',

            default =>
                'activity',
        };
    }

    /*
    |--------------------------------------------------------------------------
    | TIME AGO
    |--------------------------------------------------------------------------
    */

    protected function timeAgo(
        string $date
    ): string {
        try {
            return Carbon::parse(
                $date
            )->diffForHumans();
        } catch (Throwable) {
            return $date;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD TRENDS
    |--------------------------------------------------------------------------
    */

    protected function getDashboardTrends(
        User $user,
        array $data
    ): array {
        return [
            'properties' =>
                $this->buildTrend(
                    $data['properties']['total'] ?? 0,
                    $this->getPreviousCount(
                        'properties',
                        $user
                    )
                ),

            'apartments' =>
                $this->buildTrend(
                    $data['apartments']['total'] ?? 0,
                    $this->getPreviousCount(
                        'apartments',
                        $user
                    )
                ),

            'units' =>
                $this->buildTrend(
                    $data['units']['total'] ?? 0,
                    $this->getPreviousCount(
                        'units',
                        $user
                    )
                ),

            'occupied_units' =>
                $this->buildTrend(
                    $data['units']['occupied'] ?? 0,
                    $this->getPreviousCount(
                        'units',
                        $user,
                        'occupied'
                    )
                ),

            'active_tenancies' =>
                $this->buildTrend(
                    $data['tenancies']['active'] ?? 0,
                    $this->getPreviousTenancyCount(
                        $user,
                        'active'
                    )
                ),

            'maintenance' =>
                $this->buildTrend(
                    $data['maintenance']['total'] ?? 0,
                    $this->getPreviousCount(
                        'maintenances',
                        $user
                    )
                ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | BUILD TREND
    |--------------------------------------------------------------------------
    */

    protected function buildTrend(
        float|int $current,
        float|int $previous
    ): array {
        $current =
            (float) $current;

        $previous =
            (float) $previous;

        if ($previous == 0) {
            $change =
                $current > 0
                    ? 100
                    : 0;
        } else {
            $change =
                (
                    ($current - $previous)
                    / $previous
                ) * 100;
        }

        return [
            'value' =>
                $current,

            'change' =>
                round(
                    $change,
                    2
                ),

            'direction' =>
                $change > 0
                    ? 'up'
                    : (
                        $change < 0
                            ? 'down'
                            : 'neutral'
                    ),

            'previous' =>
                $previous,

            'period' =>
                'previous_month',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PREVIOUS COUNT
    |--------------------------------------------------------------------------
    */

    protected function getPreviousCount(
        string $table,
        User $user,
        ?string $status = null
    ): int {
        if (
            ! $this->tableExists($table) ||
            ! $this->columnExists(
                $table,
                'created_at'
            )
        ) {
            return 0;
        }

        $query =
            DB::table($table);

        switch ($table) {
            case 'properties':

                $this->applyPropertyScope(
                    $query,
                    $user
                );

                break;

            case 'apartments':

                $this->applyApartmentScope(
                    $query,
                    $user
                );

                break;

            case 'units':

                $this->applyUnitScope(
                    $query,
                    $user
                );

                break;

            case 'maintenances':

                $this->applyMaintenanceScope(
                    $query,
                    $user
                );

                break;
        }

        $start =
            now()
                ->copy()
                ->subMonth()
                ->startOfMonth();

        $end =
            now()
                ->copy()
                ->subMonth()
                ->endOfMonth();

        $query->whereBetween(
            'created_at',
            [
                $start,
                $end,
            ]
        );

        if (
            $status !== null &&
            $this->columnExists(
                $table,
                'status'
            )
        ) {
            $query->where(
                'status',
                $status
            );
        }

        return $query->count();
    }

    /*
    |--------------------------------------------------------------------------
    | PREVIOUS TENANCY COUNT
    |--------------------------------------------------------------------------
    */

    protected function getPreviousTenancyCount(
        User $user,
        string $status
    ): int {
        if (
            ! $this->tableExists(
                'tenancies'
            ) ||
            ! $this->columnExists(
                'tenancies',
                'created_at'
            ) ||
            ! $this->columnExists(
                'tenancies',
                'status'
            )
        ) {
            return 0;
        }

        $query =
            DB::table('tenancies');

        $this->applyTenancyScope(
            $query,
            $user
        );

        return $query
            ->where(
                'status',
                $status
            )
            ->whereBetween(
                'created_at',
                [
                    now()
                        ->copy()
                        ->subMonth()
                        ->startOfMonth(),

                    now()
                        ->copy()
                        ->subMonth()
                        ->endOfMonth(),
                ]
            )
            ->count();
    }

    /*
    |--------------------------------------------------------------------------
    | REVENUE CHART
    |--------------------------------------------------------------------------
    */

    protected function getRevenueChart(
        User $user
    ): array {
        $labels = [];

        $values = [];

        for (
            $i = 5;
            $i >= 0;
            $i--
        ) {
            $date =
                now()
                    ->copy()
                    ->subMonths($i);

            $labels[] =
                $date->format('M Y');

            $values[] =
                $this->getMonthlyCollectedAmount(
                    $user,
                    $date->year,
                    $date->month
                );
        }

        return [
            'labels' =>
                $labels,

            'values' =>
                array_map(
                    static fn ($value) =>
                        round(
                            (float) $value,
                            2
                        ),
                    $values
                ),

            'currency' =>
                'KES',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MONTHLY REVENUE
    |--------------------------------------------------------------------------
    */

    protected function getMonthlyCollectedAmount(
        User $user,
        int $year,
        int $month
    ): float {
        if (
            ! $this->tableExists(
                'payments'
            )
        ) {
            return 0;
        }

        $amountColumn =
            $this->firstExistingColumn(
                'payments',
                [
                    'amount',
                    'paid_amount',
                    'payment_amount',
                    'total_amount',
                    'amount_paid',
                ]
            );

        if (! $amountColumn) {
            return 0;
        }

        $dateColumn =
            $this->firstExistingColumn(
                'payments',
                [
                    'payment_date',
                    'paid_at',
                    'transaction_date',
                    'created_at',
                ]
            );

        if (! $dateColumn) {
            return 0;
        }

        $query =
            DB::table('payments');

        $this->applyPaymentScope(
            $query,
            $user
        );

        if ($dateColumn === 'created_at') {
            $query
                ->whereYear(
                    $dateColumn,
                    $year
                )
                ->whereMonth(
                    $dateColumn,
                    $month
                );
        } else {
            $query
                ->whereYear(
                    $dateColumn,
                    $year
                )
                ->whereMonth(
                    $dateColumn,
                    $month
                );
        }

        if ($this->columnExists(
            'payments',
            'status'
        )) {
            $query->whereIn(
                'status',
                [
                    'paid',
                    'completed',
                    'success',
                    'successful',
                    'approved',
                    'received',
                ]
            );
        }

        return (float) $query->sum(
            $amountColumn
        );
    }

    /*
    |--------------------------------------------------------------------------
    | OVERVIEW
    |--------------------------------------------------------------------------
    */

    protected function buildOverview(
        array $data
    ): array {
        return [
            'properties' =>
                $data['properties']['total']
                ?? 0,

            'apartments' =>
                $data['apartments']['total']
                ?? 0,

            'units' =>
                $data['units']['total']
                ?? 0,

            'occupied_units' =>
                $data['units']['occupied']
                ?? 0,

            'vacant_units' =>
                $data['units']['vacant']
                ?? 0,

            'occupancy_rate' =>
                $data['occupancy']['rate']
                ?? 0,

            'active_tenancies' =>
                $data['tenancies']['active']
                ?? 0,

            'bookings' =>
                $data['bookings']['total']
                ?? 0,

            'rent_collected' =>
                $data['financials']['rent_collected']
                ?? 0,

            'outstanding_rent' =>
                $data['financials']['outstanding']
                ?? 0,

            'expenses' =>
                $data['financials']['expenses']
                ?? 0,

            'net_income' =>
                $data['financials']['net_income']
                ?? 0,

            'maintenance_requests' =>
                $data['maintenance']['total']
                ?? 0,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY SCOPE
    |--------------------------------------------------------------------------
    */

    protected function applyPropertyScope(
        Builder $query,
        User $user
    ): void {
        if (
            $this->isSystemAdministrator($user)
        ) {
            return;
        }

        if (
            (
                $user->hasRole('landlord') ||
                $user->hasRole('property-manager')
            ) &&
            $this->columnExists(
                'properties',
                'user_id'
            )
        ) {
            $query->where(
                'properties.user_id',
                $user->id
            );

            return;
        }

        if (
            $user->hasRole('agent') &&
            $this->columnExists(
                'properties',
                'user_id'
            )
        ) {
            $query->where(
                'properties.user_id',
                $user->id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | APARTMENT SCOPE
    |--------------------------------------------------------------------------
    */

    protected function applyApartmentScope(
        Builder $query,
        User $user
    ): void {
        if (
            $this->isSystemAdministrator($user)
        ) {
            return;
        }

        if (
            (
                $user->hasRole('landlord') ||
                $user->hasRole('property-manager')
            ) &&
            $this->columnExists(
                'apartments',
                'property_id'
            ) &&
            $this->tableExists(
                'properties'
            ) &&
            $this->columnExists(
                'properties',
                'user_id'
            )
        ) {
            $query->whereExists(
                function ($subQuery) use ($user) {
                    $subQuery
                        ->select(
                            DB::raw(1)
                        )
                        ->from(
                            'properties'
                        )
                        ->whereColumn(
                            'properties.id',
                            'apartments.property_id'
                        )
                        ->where(
                            'properties.user_id',
                            $user->id
                        );
                }
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT SCOPE
    |--------------------------------------------------------------------------
    */

    protected function applyUnitScope(
        Builder $query,
        User $user
    ): void {
        if (
            $this->isSystemAdministrator($user)
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Unit → Property
        |--------------------------------------------------------------------------
        */

        if (
            (
                $user->hasRole('landlord') ||
                $user->hasRole('property-manager')
            ) &&
            $this->columnExists(
                'units',
                'property_id'
            ) &&
            $this->tableExists(
                'properties'
            ) &&
            $this->columnExists(
                'properties',
                'user_id'
            )
        ) {
            $query->whereExists(
                function ($subQuery) use ($user) {
                    $subQuery
                        ->select(
                            DB::raw(1)
                        )
                        ->from(
                            'properties'
                        )
                        ->whereColumn(
                            'properties.id',
                            'units.property_id'
                        )
                        ->where(
                            'properties.user_id',
                            $user->id
                        );
                }
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Unit → Apartment → Property
        |--------------------------------------------------------------------------
        */

        if (
            (
                $user->hasRole('landlord') ||
                $user->hasRole('property-manager')
            ) &&
            $this->columnExists(
                'units',
                'apartment_id'
            ) &&
            $this->tableExists(
                'apartments'
            ) &&
            $this->tableExists(
                'properties'
            ) &&
            $this->columnExists(
                'apartments',
                'property_id'
            ) &&
            $this->columnExists(
                'properties',
                'user_id'
            )
        ) {
            $query->whereExists(
                function ($subQuery) use ($user) {
                    $subQuery
                        ->select(
                            DB::raw(1)
                        )
                        ->from(
                            'apartments'
                        )
                        ->join(
                            'properties',
                            'properties.id',
                            '=',
                            'apartments.property_id'
                        )
                        ->whereColumn(
                            'apartments.id',
                            'units.apartment_id'
                        )
                        ->where(
                            'properties.user_id',
                            $user->id
                        );
                }
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TENANCY SCOPE
    |--------------------------------------------------------------------------
    */

    protected function applyTenancyScope(
        Builder $query,
        User $user
    ): void {
        if (
            $user->hasRole('super-admin') ||
            $user->hasRole('admin') ||
            $user->hasRole('accountant') ||
            $user->hasRole('auditor')
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Tenant
        |--------------------------------------------------------------------------
        */

        if (
            $user->hasRole('tenant') &&
            $this->columnExists(
                'tenancies',
                'tenant_id'
            )
        ) {
            $query->where(
                'tenancies.tenant_id',
                $user->id
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Landlord / Property Manager
        |--------------------------------------------------------------------------
        */

        if (
            $user->hasRole('landlord') ||
            $user->hasRole('property-manager')
        ) {
            if (
                $this->columnExists(
                    'tenancies',
                    'property_id'
                ) &&
                $this->tableExists(
                    'properties'
                ) &&
                $this->columnExists(
                    'properties',
                    'user_id'
                )
            ) {
                $query->whereExists(
                    function ($subQuery) use ($user) {
                        $subQuery
                            ->select(
                                DB::raw(1)
                            )
                            ->from(
                                'properties'
                            )
                            ->whereColumn(
                                'properties.id',
                                'tenancies.property_id'
                            )
                            ->where(
                                'properties.user_id',
                                $user->id
                            );
                    }
                );

                return;
            }

            if (
                $this->columnExists(
                    'tenancies',
                    'user_id'
                )
            ) {
                $query->where(
                    'tenancies.user_id',
                    $user->id
                );
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING SCOPE
    |--------------------------------------------------------------------------
    */

    protected function applyBookingScope(
        Builder $query,
        User $user
    ): void {
        if (
            $user->hasRole('super-admin') ||
            $user->hasRole('admin') ||
            $user->hasRole('agent') ||
            $user->hasRole('support-staff')
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Customer / Tenant
        |--------------------------------------------------------------------------
        */

        if (
            (
                $user->hasRole('customer') ||
                $user->hasRole('tenant')
            ) &&
            $this->columnExists(
                'bookings',
                'user_id'
            )
        ) {
            $query->where(
                'bookings.user_id',
                $user->id
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Landlord / Property Manager
        |--------------------------------------------------------------------------
        */

        if (
            $user->hasRole('landlord') ||
            $user->hasRole('property-manager')
        ) {
            if (
                $this->columnExists(
                    'bookings',
                    'property_id'
                ) &&
                $this->tableExists(
                    'properties'
                ) &&
                $this->columnExists(
                    'properties',
                    'user_id'
                )
            ) {
                $query->whereExists(
                    function ($subQuery) use ($user) {
                        $subQuery
                            ->select(
                                DB::raw(1)
                            )
                            ->from(
                                'properties'
                            )
                            ->whereColumn(
                                'properties.id',
                                'bookings.property_id'
                            )
                            ->where(
                                'properties.user_id',
                                $user->id
                            );
                    }
                );
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT SCOPE
    |--------------------------------------------------------------------------
    */

    protected function applyPaymentScope(
        Builder $query,
        User $user
    ): void {
        if (
            $user->hasRole('super-admin') ||
            $user->hasRole('admin') ||
            $user->hasRole('accountant') ||
            $user->hasRole('auditor')
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Tenant / Customer
        |--------------------------------------------------------------------------
        */

        if (
            (
                $user->hasRole('tenant') ||
                $user->hasRole('customer')
            ) &&
            $this->columnExists(
                'payments',
                'user_id'
            )
        ) {
            $query->where(
                'payments.user_id',
                $user->id
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Landlord / Property Manager
        |--------------------------------------------------------------------------
        */

        if (
            $user->hasRole('landlord') ||
            $user->hasRole('property-manager')
        ) {
            /*
            |--------------------------------------------------------------------------
            | Payment → Property
            |--------------------------------------------------------------------------
            */

            if (
                $this->columnExists(
                    'payments',
                    'property_id'
                ) &&
                $this->tableExists(
                    'properties'
                ) &&
                $this->columnExists(
                    'properties',
                    'user_id'
                )
            ) {
                $query->whereExists(
                    function ($subQuery) use ($user) {
                        $subQuery
                            ->select(
                                DB::raw(1)
                            )
                            ->from(
                                'properties'
                            )
                            ->whereColumn(
                                'properties.id',
                                'payments.property_id'
                            )
                            ->where(
                                'properties.user_id',
                                $user->id
                            );
                    }
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Payment → Tenancy → Property
            |--------------------------------------------------------------------------
            */

            if (
                $this->columnExists(
                    'payments',
                    'tenancy_id'
                ) &&
                $this->tableExists(
                    'tenancies'
                ) &&
                $this->columnExists(
                    'tenancies',
                    'property_id'
                ) &&
                $this->tableExists(
                    'properties'
                ) &&
                $this->columnExists(
                    'properties',
                    'user_id'
                )
            ) {
                $query->whereExists(
                    function ($subQuery) use ($user) {
                        $subQuery
                            ->select(
                                DB::raw(1)
                            )
                            ->from(
                                'tenancies'
                            )
                            ->join(
                                'properties',
                                'properties.id',
                                '=',
                                'tenancies.property_id'
                            )
                            ->whereColumn(
                                'tenancies.id',
                                'payments.tenancy_id'
                            )
                            ->where(
                                'properties.user_id',
                                $user->id
                            );
                    }
                );
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EXPENSE SCOPE
    |--------------------------------------------------------------------------
    */

    protected function applyExpenseScope(
        Builder $query,
        User $user
    ): void {
        if (
            $user->hasRole('super-admin') ||
            $user->hasRole('admin') ||
            $user->hasRole('accountant') ||
            $user->hasRole('auditor')
        ) {
            return;
        }

        if (
            $user->hasRole('landlord') ||
            $user->hasRole('property-manager')
        ) {
            if (
                $this->columnExists(
                    'expenses',
                    'property_id'
                ) &&
                $this->tableExists(
                    'properties'
                ) &&
                $this->columnExists(
                    'properties',
                    'user_id'
                )
            ) {
                $query->whereExists(
                    function ($subQuery) use ($user) {
                        $subQuery
                            ->select(
                                DB::raw(1)
                            )
                            ->from(
                                'properties'
                            )
                            ->whereColumn(
                                'properties.id',
                                'expenses.property_id'
                            )
                            ->where(
                                'properties.user_id',
                                $user->id
                            );
                    }
                );

                return;
            }
        }

        if (
            $this->columnExists(
                'expenses',
                'user_id'
            )
        ) {
            $query->where(
                'expenses.user_id',
                $user->id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE SCOPE
    |--------------------------------------------------------------------------
    */

    protected function applyMaintenanceScope(
        Builder $query,
        User $user
    ): void {
        if (
            $user->hasRole('super-admin') ||
            $user->hasRole('admin')
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Property Manager / Landlord
        |--------------------------------------------------------------------------
        */

        if (
            $user->hasRole('property-manager') ||
            $user->hasRole('landlord')
        ) {
            if (
                $this->columnExists(
                    'maintenances',
                    'property_id'
                ) &&
                $this->tableExists(
                    'properties'
                ) &&
                $this->columnExists(
                    'properties',
                    'user_id'
                )
            ) {
                $query->whereExists(
                    function ($subQuery) use ($user) {
                        $subQuery
                            ->select(
                                DB::raw(1)
                            )
                            ->from(
                                'properties'
                            )
                            ->whereColumn(
                                'properties.id',
                                'maintenances.property_id'
                            )
                            ->where(
                                'properties.user_id',
                                $user->id
                            );
                    }
                );

                return;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Technician
        |--------------------------------------------------------------------------
        */

        if (
            $user->hasRole('technician') &&
            $this->columnExists(
                'maintenances',
                'assigned_to'
            )
        ) {
            $query->where(
                'maintenances.assigned_to',
                $user->id
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Maintenance Staff
        |--------------------------------------------------------------------------
        */

        if (
            $user->hasRole('maintenance') &&
            $this->columnExists(
                'maintenances',
                'assigned_to'
            )
        ) {
            $query->where(
                'maintenances.assigned_to',
                $user->id
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Tenant
        |--------------------------------------------------------------------------
        */

        if (
            $user->hasRole('tenant') &&
            $this->columnExists(
                'maintenances',
                'tenant_id'
            )
        ) {
            $query->where(
                'maintenances.tenant_id',
                $user->id
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SYSTEM ADMINISTRATOR
    |--------------------------------------------------------------------------
    */

    protected function isSystemAdministrator(
        User $user
    ): bool {
        return
            $user->hasRole('super-admin') ||
            $user->hasRole('admin');
    }

    /*
    |--------------------------------------------------------------------------
    | PERCENTAGE
    |--------------------------------------------------------------------------
    */

    protected function percentage(
        float|int $value,
        float|int $total
    ): float {
        if ((float) $total <= 0) {
            return 0;
        }

        return round(
            (
                (float) $value /
                (float) $total
            ) * 100,
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT STATUS BREAKDOWN
    |--------------------------------------------------------------------------
    */

    protected function buildStatusBreakdown(
        array $statuses,
        int|float $total
    ): array {
        $labels = [
            'occupied' =>
                'Occupied',

            'vacant' =>
                'Vacant',

            'maintenance' =>
                'Maintenance',

            'reserved' =>
                'Reserved',
        ];

        $result = [];

        foreach (
            $statuses as $status => $count
        ) {
            $result[] = [
                'status' =>
                    $status,

                'label' =>
                    $labels[$status]
                    ?? Str::headline(
                        $status
                    ),

                'count' =>
                    (int) $count,

                'percentage' =>
                    $this->percentage(
                        $count,
                        $total
                    ),
            ];
        }

        return $result;
    }

    /*
    |--------------------------------------------------------------------------
    | GENERIC STATUS BREAKDOWN
    |--------------------------------------------------------------------------
    */

    protected function buildStatusBreakdownWithTotal(
        array $statuses,
        int|float $total
    ): array {
        $labels = [
            'active' =>
                'Active',

            'pending' =>
                'Pending',

            'expired' =>
                'Expired',

            'terminated' =>
                'Terminated',

            'cancelled' =>
                'Cancelled',

            'confirmed' =>
                'Confirmed',

            'completed' =>
                'Completed',

            'rejected' =>
                'Rejected',

            'in_progress' =>
                'In Progress',
        ];

        return collect($statuses)
            ->map(
                function (
                    $count,
                    $status
                ) use (
                    $labels,
                    $total
                ) {
                    return [
                        'status' =>
                            $status,

                        'label' =>
                            $labels[$status]
                            ?? Str::headline(
                                $status
                            ),

                        'count' =>
                            (int) $count,

                        'percentage' =>
                            $this->percentage(
                                $count,
                                $total
                            ),
                    ];
                }
            )
            ->values()
            ->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY PROPERTY STATISTICS
    |--------------------------------------------------------------------------
    */

    protected function emptyPropertyStatistics(): array
    {
        return [
            'total' => 0,
            'active' => 0,
            'inactive' => 0,
            'featured' => 0,
            'verified' => 0,
            'published' => 0,
            'verification_rate' => 0,
            'publication_rate' => 0,
            'featured_rate' => 0,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY APARTMENT STATISTICS
    |--------------------------------------------------------------------------
    */

    protected function emptyApartmentStatistics(): array
    {
        return [
            'total' => 0,
            'active' => 0,
            'inactive' => 0,
            'active_rate' => 0,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY UNIT STATISTICS
    |--------------------------------------------------------------------------
    */

    protected function emptyUnitStatistics(): array
    {
        return [
            'total' => 0,
            'vacant' => 0,
            'occupied' => 0,
            'maintenance' => 0,
            'reserved' => 0,
            'available' => 0,
            'occupied_rate' => 0,
            'vacant_rate' => 0,
            'maintenance_rate' => 0,
            'reserved_rate' => 0,
            'status_breakdown' => [],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY OCCUPANCY
    |--------------------------------------------------------------------------
    */

    protected function emptyOccupancyStatistics(): array
    {
        return [
            'total_units' => 0,
            'occupied' => 0,
            'vacant' => 0,
            'maintenance' => 0,
            'reserved' => 0,
            'rate' => 0,
            'available_rate' => 0,
            'status_breakdown' => [],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY TENANCIES
    |--------------------------------------------------------------------------
    */

    protected function emptyTenancyStatistics(): array
    {
        return [
            'total' => 0,
            'active' => 0,
            'pending' => 0,
            'expired' => 0,
            'terminated' => 0,
            'cancelled' => 0,
            'expiring_soon' => 0,
            'new' => 0,
            'active_rate' => 0,
            'status_breakdown' => [],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY BOOKINGS
    |--------------------------------------------------------------------------
    */

    protected function emptyBookingStatistics(): array
    {
        return [
            'total' => 0,
            'pending' => 0,
            'confirmed' => 0,
            'completed' => 0,
            'cancelled' => 0,
            'rejected' => 0,
            'expired' => 0,
            'pending_rate' => 0,
            'confirmed_rate' => 0,
            'completed_rate' => 0,
            'cancelled_rate' => 0,
            'rejected_rate' => 0,
            'expired_rate' => 0,
            'status_breakdown' => [],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY FINANCIALS
    |--------------------------------------------------------------------------
    */

    protected function emptyFinancialStatistics(): array
    {
        return [
            'rent_due' => 0,
            'rent_collected' => 0,
            'outstanding' => 0,
            'expenses' => 0,
            'net_income' => 0,
            'collection_rate' => 0,
            'expense_rate' => 0,
            'net_margin' => 0,
            'currency' => 'KES',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | EMPTY MAINTENANCE
    |--------------------------------------------------------------------------
    */

    protected function emptyMaintenanceStatistics(): array
    {
        return [
            'total' => 0,
            'pending' => 0,
            'in_progress' => 0,
            'completed' => 0,
            'cancelled' => 0,
            'urgent' => 0,
            'overdue' => 0,
            'open' => 0,
            'completion_rate' => 0,
            'status_breakdown' => [],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PERMISSION EXISTS
    |--------------------------------------------------------------------------
    */

    protected function permissionExists(
        string $permission
    ): bool {
        try {
            return DB::table(
                'permissions'
            )
                ->where(
                    'name',
                    $permission
                )
                ->exists();
        } catch (Throwable) {
            return false;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TABLE EXISTS
    |--------------------------------------------------------------------------
    */

    protected function tableExists(
        string $table
    ): bool {
        try {
            return Schema::hasTable(
                $table
            );
        } catch (Throwable) {
            return false;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | COLUMN EXISTS
    |--------------------------------------------------------------------------
    */

    protected function columnExists(
        string $table,
        string $column
    ): bool {
        try {
            return Schema::hasColumn(
                $table,
                $column
            );
        } catch (Throwable) {
            return false;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FIRST EXISTING COLUMN
    |--------------------------------------------------------------------------
    */

    protected function firstExistingColumn(
        string $table,
        array $columns
    ): ?string {
        foreach ($columns as $column) {
            if (
                $this->columnExists(
                    $table,
                    $column
                )
            ) {
                return $column;
            }
        }

        return null;
    }
}