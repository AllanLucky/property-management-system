<?php

namespace App\Services;

use App\Models\Dashboard;
use App\Models\User;
use App\Repositories\Interfaces\DashboardRepositoryInterface;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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
    | Main Dashboard
    |--------------------------------------------------------------------------
    */

    /**
     * Build the dashboard for the authenticated user.
     *
     * Dashboard configuration is resolved from the user's
     * Spatie role.
     *
     * The actual dashboard statistics are calculated from
     * the database.
     */
    public function getDashboardForUser(User $user): array
    {
        /*
        |--------------------------------------------------------------------------
        | Resolve Dashboard Configuration
        |--------------------------------------------------------------------------
        */

        $dashboard = $this->resolveDashboard($user);

        /*
        |--------------------------------------------------------------------------
        | Base Response
        |--------------------------------------------------------------------------
        */

        $data = [
            'dashboard' => $dashboard,

            'user' => $this->getUserSummary($user),

            'overview' => [],

            'properties' => null,

            'apartments' => null,

            'units' => null,

            'occupancy' => null,

            'tenancies' => null,

            'bookings' => null,

            'financials' => null,

            'maintenance' => null,

            'activity' => null,
        ];

        /*
        |--------------------------------------------------------------------------
        | General Dashboard Permission
        |--------------------------------------------------------------------------
        */

        if (! $user->can('dashboard.view')) {
            return $data;
        }

        /*
        |--------------------------------------------------------------------------
        | Properties
        |--------------------------------------------------------------------------
        */

        if ($user->can('dashboard.properties')) {
            $data['properties'] = $this->getPropertyStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Apartments
        |--------------------------------------------------------------------------
        */

        if ($user->can('dashboard.apartments')) {
            $data['apartments'] = $this->getApartmentStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Units
        |--------------------------------------------------------------------------
        */

        if ($user->can('dashboard.units')) {
            $data['units'] = $this->getUnitStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Occupancy
        |--------------------------------------------------------------------------
        */

        if ($user->can('dashboard.occupancy')) {
            $data['occupancy'] = $this->getOccupancyStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Tenancies
        |--------------------------------------------------------------------------
        */

        if ($user->can('dashboard.tenancies')) {
            $data['tenancies'] = $this->getTenancyStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Bookings
        |--------------------------------------------------------------------------
        */

        if ($user->can('dashboard.bookings')) {
            $data['bookings'] = $this->getBookingStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Financials
        |--------------------------------------------------------------------------
        */

        if ($user->can('dashboard.financials')) {
            $data['financials'] = $this->getFinancialStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Maintenance
        |--------------------------------------------------------------------------
        */

        if ($user->can('dashboard.maintenance')) {
            $data['maintenance'] = $this->getMaintenanceStatistics($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Activity
        |--------------------------------------------------------------------------
        */

        if ($user->can('dashboard.activity')) {
            $data['activity'] = $this->getRecentActivity($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Overview
        |--------------------------------------------------------------------------
        */

        $data['overview'] = $this->buildOverview($data);

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | Dashboard Resolution
    |--------------------------------------------------------------------------
    */

    /**
     * Resolve the correct system dashboard for the user's role.
     *
     * The dashboard itself is configuration.
     * Statistics are calculated separately from the database.
     */
    protected function resolveDashboard(User $user): ?Dashboard
    {
        /*
        |--------------------------------------------------------------------------
        | Get User Roles
        |--------------------------------------------------------------------------
        */

        $roles = $user->getRoleNames();

        if ($roles->isEmpty()) {
            return $this->getDefaultDashboard($user);
        }

        /*
        |--------------------------------------------------------------------------
        | Find First Matching Role Dashboard
        |--------------------------------------------------------------------------
        */

        foreach ($roles as $role) {
            $slug = $this->dashboardSlugForRole($role);

            if (! $slug) {
                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Find Existing Dashboard
            |--------------------------------------------------------------------------
            */

            $dashboard = Dashboard::query()
                ->where('type', Dashboard::TYPE_SYSTEM)
                ->where('slug', $slug)
                ->where('is_active', true)
                ->first();

            /*
            |--------------------------------------------------------------------------
            | Create Dashboard If Missing
            |--------------------------------------------------------------------------
            */

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

        /*
        |--------------------------------------------------------------------------
        | Fallback
        |--------------------------------------------------------------------------
        */

        return $this->getDefaultDashboard($user);
    }

    /*
    |--------------------------------------------------------------------------
    | Role → Dashboard
    |--------------------------------------------------------------------------
    */

    /**
     * Convert a Spatie role into a dashboard slug.
     */
    protected function dashboardSlugForRole(string $role): ?string
    {
        return match (Str::lower(trim($role))) {

            'super-admin' => 'super-admin-dashboard',

            'admin' => 'admin-dashboard',

            'property-manager' => 'property-manager-dashboard',

            'landlord' => 'landlord-dashboard',

            'accountant' => 'accountant-dashboard',

            'agent' => 'agent-dashboard',

            'lease-manager' => 'lease-manager-dashboard',

            'technician' => 'technician-dashboard',

            'maintenance' => 'maintenance-dashboard',

            'tenant' => 'tenant-dashboard',

            'customer' => 'customer-dashboard',

            'support-staff' => 'support-staff-dashboard',

            'auditor' => 'auditor-dashboard',

            default => null,
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Dashboard Name
    |--------------------------------------------------------------------------
    */

    protected function dashboardNameForRole(string $role): string
    {
        return match (Str::lower(trim($role))) {

            'super-admin' => 'Super Admin Dashboard',

            'admin' => 'Admin Dashboard',

            'property-manager' => 'Property Manager Dashboard',

            'landlord' => 'Landlord Dashboard',

            'accountant' => 'Accountant Dashboard',

            'agent' => 'Agent Dashboard',

            'lease-manager' => 'Lease Manager Dashboard',

            'technician' => 'Technician Dashboard',

            'maintenance' => 'Maintenance Dashboard',

            'tenant' => 'Tenant Dashboard',

            'customer' => 'Customer Dashboard',

            'support-staff' => 'Support Staff Dashboard',

            'auditor' => 'Auditor Dashboard',

            default => 'Dashboard',
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Dashboard Description
    |--------------------------------------------------------------------------
    */

    protected function dashboardDescriptionForRole(string $role): string
    {
        return match (Str::lower(trim($role))) {

            'super-admin' =>
                'Complete property management dashboard with system-wide visibility.',

            'admin' =>
                'Administrative dashboard for properties, units, tenants, bookings, finances and maintenance.',

            'property-manager' =>
                'Dashboard for assigned properties, units, tenants, occupancy and maintenance.',

            'landlord' =>
                'Dashboard for owned properties, occupancy, rent collection, expenses and income.',

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
    | Dashboard Widgets
    |--------------------------------------------------------------------------
    */

    protected function widgetsForRole(string $role): array
    {
        return match (Str::lower(trim($role))) {

            /*
            |--------------------------------------------------------------------------
            | Super Admin
            |--------------------------------------------------------------------------
            */

            'super-admin' => [
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

            /*
            |--------------------------------------------------------------------------
            | Admin
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | Property Manager
            |--------------------------------------------------------------------------
            */

            'property-manager' => [
                'properties',
                'apartments',
                'units',
                'occupancy',
                'tenancies',
                'maintenance',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Landlord
            |--------------------------------------------------------------------------
            */

            'landlord' => [
                'properties',
                'units',
                'occupancy',
                'tenancies',
                'financials',
                'maintenance',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Accountant
            |--------------------------------------------------------------------------
            */

            'accountant' => [
                'financials',
                'payments',
                'rent_collection',
                'outstanding_balances',
                'expenses',
                'financial_reports',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Agent
            |--------------------------------------------------------------------------
            */

            'agent' => [
                'properties',
                'available_units',
                'bookings',
                'leads',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Lease Manager
            |--------------------------------------------------------------------------
            */

            'lease-manager' => [
                'tenancies',
                'leases',
                'renewals',
                'expirations',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Technician
            |--------------------------------------------------------------------------
            */

            'technician' => [
                'maintenance',
                'assigned_jobs',
                'pending_jobs',
                'in_progress_jobs',
                'completed_jobs',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Maintenance
            |--------------------------------------------------------------------------
            */

            'maintenance' => [
                'maintenance',
                'pending_jobs',
                'in_progress_jobs',
                'completed_jobs',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Tenant
            |--------------------------------------------------------------------------
            */

            'tenant' => [
                'tenancy',
                'rent',
                'payments',
                'bookings',
                'maintenance',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Customer
            |--------------------------------------------------------------------------
            */

            'customer' => [
                'bookings',
                'inquiries',
                'payments',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Support Staff
            |--------------------------------------------------------------------------
            */

            'support-staff' => [
                'customers',
                'tenants',
                'bookings',
                'support_activity',
                'activity',
            ],

            /*
            |--------------------------------------------------------------------------
            | Auditor
            |--------------------------------------------------------------------------
            */

            'auditor' => [
                'financials',
                'activity',
                'audit_logs',
                'reports',
            ],

            /*
            |--------------------------------------------------------------------------
            | Default
            |--------------------------------------------------------------------------
            */

            default => [
                'properties',
                'units',
                'occupancy',
                'activity',
            ],
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Dashboard Layout
    |--------------------------------------------------------------------------
    */

    protected function layoutForRole(string $role): array
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

            'role' => Str::lower(trim($role)),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Create System Dashboard
    |--------------------------------------------------------------------------
    */

    protected function createSystemDashboard(
        string $role,
        string $slug
    ): ?Dashboard {
        return Dashboard::query()->firstOrCreate(
            [
                'slug' => $slug,
                'type' => Dashboard::TYPE_SYSTEM,
            ],
            [
                'user_id' => null,

                'name' => $this->dashboardNameForRole(
                    $role
                ),

                'description' => $this->dashboardDescriptionForRole(
                    $role
                ),

                'layout' => $this->layoutForRole(
                    $role
                ),

                'widgets' => $this->widgetsForRole(
                    $role
                ),

                'filters' => [],

                'is_default' => true,

                'is_active' => true,

                'sort_order' => $this->dashboardSortOrder(
                    $role
                ),
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Default Dashboard
    |--------------------------------------------------------------------------
    */

    protected function getDefaultDashboard(User $user): ?Dashboard
    {
        $dashboard = Dashboard::query()
            ->where('type', Dashboard::TYPE_SYSTEM)
            ->where('is_default', true)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->first();

        if ($dashboard) {
            return $dashboard;
        }

        /*
        |--------------------------------------------------------------------------
        | Create Generic Dashboard
        |--------------------------------------------------------------------------
        */

        return Dashboard::query()->firstOrCreate(
            [
                'slug' => 'default-dashboard',
                'type' => Dashboard::TYPE_SYSTEM,
            ],
            [
                'user_id' => null,

                'name' => 'Default Dashboard',

                'description' =>
                    'Default property management dashboard.',

                'layout' => [
                    'columns' => 12,
                    'responsive' => true,
                ],

                'widgets' => [
                    'properties',
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
    }

    /*
    |--------------------------------------------------------------------------
    | Dashboard Sort Order
    |--------------------------------------------------------------------------
    */

    protected function dashboardSortOrder(string $role): int
    {
        return match (Str::lower(trim($role))) {

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
    | User
    |--------------------------------------------------------------------------
    */

    protected function getUserSummary(User $user): array
    {
        return [
            'id' => $user->id,

            'name' => trim(
                ($user->first_name ?? '') . ' ' .
                ($user->last_name ?? '')
            ) ?: ($user->name ?? $user->email),

            'first_name' => $user->first_name,

            'last_name' => $user->last_name,

            'email' => $user->email,

            'roles' => $user
                ->getRoleNames()
                ->values()
                ->toArray(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Properties
    |--------------------------------------------------------------------------
    */

    protected function getPropertyStatistics(User $user): array
    {
        $query = DB::table('properties');

        $this->applyPropertyScope(
            $query,
            $user
        );

        return [
            'total' => (clone $query)->count(),

            'active' => (clone $query)
                ->whereIn('status', [
                    'active',
                    'published',
                ])
                ->count(),

            'featured' => (clone $query)
                ->where('is_featured', true)
                ->count(),

            'verified' => (clone $query)
                ->where('is_verified', true)
                ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Apartments
    |--------------------------------------------------------------------------
    */

    protected function getApartmentStatistics(User $user): array
    {
        $query = DB::table('apartments');

        $this->applyApartmentScope(
            $query,
            $user
        );

        return [
            'total' => (clone $query)->count(),

            'active' => (clone $query)
                ->where('status', 'active')
                ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Units
    |--------------------------------------------------------------------------
    */

    protected function getUnitStatistics(User $user): array
    {
        $query = DB::table('units');

        $this->applyUnitScope(
            $query,
            $user
        );

        return [
            'total' => (clone $query)->count(),

            'vacant' => (clone $query)
                ->where('status', 'vacant')
                ->count(),

            'occupied' => (clone $query)
                ->where('status', 'occupied')
                ->count(),

            'maintenance' => (clone $query)
                ->where('status', 'maintenance')
                ->count(),

            'reserved' => (clone $query)
                ->where('status', 'reserved')
                ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Occupancy
    |--------------------------------------------------------------------------
    */

    protected function getOccupancyStatistics(User $user): array
    {
        $query = DB::table('units');

        $this->applyUnitScope(
            $query,
            $user
        );

        $total = (clone $query)->count();

        $occupied = (clone $query)
            ->where('status', 'occupied')
            ->count();

        $vacant = (clone $query)
            ->where('status', 'vacant')
            ->count();

        $maintenance = (clone $query)
            ->where('status', 'maintenance')
            ->count();

        $reserved = (clone $query)
            ->where('status', 'reserved')
            ->count();

        return [
            'total_units' => $total,

            'occupied' => $occupied,

            'vacant' => $vacant,

            'maintenance' => $maintenance,

            'reserved' => $reserved,

            'rate' => $total > 0
                ? round(
                    ($occupied / $total) * 100,
                    2
                )
                : 0,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Tenancies
    |--------------------------------------------------------------------------
    */

    protected function getTenancyStatistics(User $user): array
    {
        $query = DB::table('tenancies');

        $this->applyTenancyScope(
            $query,
            $user
        );

        return [
            'total' => (clone $query)->count(),

            'active' => (clone $query)
                ->where('status', 'active')
                ->count(),

            'pending' => (clone $query)
                ->where('status', 'pending')
                ->count(),

            'expired' => (clone $query)
                ->where('status', 'expired')
                ->count(),

            'terminated' => (clone $query)
                ->where('status', 'terminated')
                ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Bookings
    |--------------------------------------------------------------------------
    */

    protected function getBookingStatistics(User $user): array
    {
        if (! DB::getSchemaBuilder()->hasTable('bookings')) {
            return [
                'total' => 0,
                'pending' => 0,
                'confirmed' => 0,
                'completed' => 0,
                'cancelled' => 0,
            ];
        }

        $query = DB::table('bookings');

        $this->applyBookingScope(
            $query,
            $user
        );

        return [
            'total' => (clone $query)->count(),

            'pending' => (clone $query)
                ->where('status', 'pending')
                ->count(),

            'confirmed' => (clone $query)
                ->where('status', 'confirmed')
                ->count(),

            'completed' => (clone $query)
                ->where('status', 'completed')
                ->count(),

            'cancelled' => (clone $query)
                ->where('status', 'cancelled')
                ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Financials
    |--------------------------------------------------------------------------
    */

    protected function getFinancialStatistics(User $user): array
    {
        $data = [
            'rent_due' => 0,

            'rent_collected' => 0,

            'outstanding' => 0,

            'expenses' => 0,

            'net_income' => 0,
        ];

        /*
        |--------------------------------------------------------------------------
        | Payments
        |--------------------------------------------------------------------------
        */

        if (DB::getSchemaBuilder()->hasTable('payments')) {
            $payments = DB::table('payments');

            $this->applyPaymentScope(
                $payments,
                $user
            );

            $data['rent_collected'] = (float) (
                (clone $payments)
                    ->whereIn('status', [
                        'paid',
                        'completed',
                    ])
                    ->sum('amount')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Expenses
        |--------------------------------------------------------------------------
        */

        if (DB::getSchemaBuilder()->hasTable('expenses')) {
            $expenses = DB::table('expenses');

            $this->applyExpenseScope(
                $expenses,
                $user
            );

            $data['expenses'] = (float) (
                (clone $expenses)
                    ->whereIn('status', [
                        'paid',
                        'approved',
                    ])
                    ->sum('amount')
            );
        }

        $data['net_income'] = round(
            $data['rent_collected'] -
            $data['expenses'],
            2
        );

        $data['outstanding'] = round(
            max(
                0,
                $data['rent_due'] -
                $data['rent_collected']
            ),
            2
        );

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | Maintenance
    |--------------------------------------------------------------------------
    */

    protected function getMaintenanceStatistics(User $user): array
    {
        if (! DB::getSchemaBuilder()->hasTable('maintenances')) {
            return [
                'total' => 0,

                'pending' => 0,

                'in_progress' => 0,

                'completed' => 0,

                'cancelled' => 0,
            ];
        }

        $query = DB::table('maintenances');

        $this->applyMaintenanceScope(
            $query,
            $user
        );

        return [
            'total' => (clone $query)->count(),

            'pending' => (clone $query)
                ->where('status', 'pending')
                ->count(),

            'in_progress' => (clone $query)
                ->where('status', 'in_progress')
                ->count(),

            'completed' => (clone $query)
                ->where('status', 'completed')
                ->count(),

            'cancelled' => (clone $query)
                ->where('status', 'cancelled')
                ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Activity
    |--------------------------------------------------------------------------
    */

    protected function getRecentActivity(User $user): array
    {
        /*
        |--------------------------------------------------------------------------
        | This can later be connected to Spatie Activity Log.
        |--------------------------------------------------------------------------
        */

        return [];
    }

    /*
    |--------------------------------------------------------------------------
    | Overview
    |--------------------------------------------------------------------------
    */

    protected function buildOverview(array $data): array
    {
        return [
            'properties' =>
                $data['properties']['total'] ?? 0,

            'apartments' =>
                $data['apartments']['total'] ?? 0,

            'units' =>
                $data['units']['total'] ?? 0,

            'occupied_units' =>
                $data['units']['occupied'] ?? 0,

            'vacant_units' =>
                $data['units']['vacant'] ?? 0,

            'occupancy_rate' =>
                $data['occupancy']['rate'] ?? 0,

            'active_tenancies' =>
                $data['tenancies']['active'] ?? 0,

            'bookings' =>
                $data['bookings']['total'] ?? 0,

            'rent_collected' =>
                $data['financials']['rent_collected'] ?? 0,

            'outstanding_rent' =>
                $data['financials']['outstanding'] ?? 0,

            'expenses' =>
                $data['financials']['expenses'] ?? 0,

            'net_income' =>
                $data['financials']['net_income'] ?? 0,

            'maintenance_requests' =>
                $data['maintenance']['total'] ?? 0,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Property Scope
    |--------------------------------------------------------------------------
    */

    protected function applyPropertyScope(
        Builder $query,
        User $user
    ): void {
        /*
        |--------------------------------------------------------------------------
        | Super Admin
        |--------------------------------------------------------------------------
        */

        if ($user->hasRole('super-admin')) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Admin
        |--------------------------------------------------------------------------
        */

        if ($user->hasRole('admin')) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Other Roles
        |--------------------------------------------------------------------------
        |
        | Add your actual property assignment/ownership
        | relationship here.
        |
        */
    }

    /*
    |--------------------------------------------------------------------------
    | Apartment Scope
    |--------------------------------------------------------------------------
    */

    protected function applyApartmentScope(
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
        | Property Manager / Landlord scope
        |--------------------------------------------------------------------------
        */
    }

    /*
    |--------------------------------------------------------------------------
    | Unit Scope
    |--------------------------------------------------------------------------
    */

    protected function applyUnitScope(
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
        | Property / Apartment scope
        |--------------------------------------------------------------------------
        */
    }

    /*
    |--------------------------------------------------------------------------
    | Tenancy Scope
    |--------------------------------------------------------------------------
    */

    protected function applyTenancyScope(
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
        | Tenant
        |--------------------------------------------------------------------------
        |
        | Example:
        |
        | $query->where('tenant_id', $user->id);
        |
        |--------------------------------------------------------------------------
        */
    }

    /*
    |--------------------------------------------------------------------------
    | Booking Scope
    |--------------------------------------------------------------------------
    */

    protected function applyBookingScope(
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
        | Booking ownership / assignment scope
        |--------------------------------------------------------------------------
        */
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Scope
    |--------------------------------------------------------------------------
    */

    protected function applyPaymentScope(
        Builder $query,
        User $user
    ): void {
        if (
            $user->hasRole('super-admin') ||
            $user->hasRole('admin') ||
            $user->hasRole('accountant')
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Landlord / Tenant financial scope
        |--------------------------------------------------------------------------
        */
    }

    /*
    |--------------------------------------------------------------------------
    | Expense Scope
    |--------------------------------------------------------------------------
    */

    protected function applyExpenseScope(
        Builder $query,
        User $user
    ): void {
        if (
            $user->hasRole('super-admin') ||
            $user->hasRole('admin') ||
            $user->hasRole('accountant')
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Landlord / Property scope
        |--------------------------------------------------------------------------
        */
    }

    /*
    |--------------------------------------------------------------------------
    | Maintenance Scope
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
        | Technician
        |--------------------------------------------------------------------------
        |
        | Example:
        |
        | $query->where('assigned_to', $user->id);
        |
        |--------------------------------------------------------------------------
        */
    }
}