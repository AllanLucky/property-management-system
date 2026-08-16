<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * DashboardService returns:
     *
     * [
     *     'dashboard'   => Dashboard|null,
     *     'user'        => [...],
     *     'overview'    => [...],
     *     'properties'  => [...],
     *     'apartments'  => [...],
     *     'units'       => [...],
     *     'occupancy'   => [...],
     *     'tenancies'   => [...],
     *     'bookings'    => [...],
     *     'financials'  => [...],
     *     'maintenance' => [...],
     *     'activity'    => [...],
     *     'meta'        => [...],
     * ]
     */
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | SOURCE
        |--------------------------------------------------------------------------
        */

        $data = $this->resource;

        if ($data instanceof \Illuminate\Contracts\Support\Arrayable) {
            $data = $data->toArray();
        }

        if (! is_array($data)) {
            $data = [];
        }

        /*
        |--------------------------------------------------------------------------
        | MAIN SECTIONS
        |--------------------------------------------------------------------------
        */

        $dashboard = data_get($data, 'dashboard');

        $user = data_get($data, 'user', []);

        $overview = data_get($data, 'overview', []);

        $properties = data_get($data, 'properties', []);

        $apartments = data_get($data, 'apartments', []);

        $units = data_get($data, 'units', []);

        $occupancy = data_get($data, 'occupancy', []);

        $tenancies = data_get($data, 'tenancies', []);

        $bookings = data_get($data, 'bookings', []);

        $financials = data_get($data, 'financials', []);

        $maintenance = data_get($data, 'maintenance', []);

        $activity = data_get($data, 'activity', []);

        $serviceMeta = data_get($data, 'meta', []);

        /*
        |--------------------------------------------------------------------------
        | DASHBOARD CONFIGURATION
        |--------------------------------------------------------------------------
        */

        $layout = $this->normalizeLayout(
            data_get($dashboard, 'layout', [])
        );

        $widgets = $this->normalizeWidgets(
            data_get($dashboard, 'widgets', [])
        );

        $filters = $this->normalizeFilters(
            data_get($dashboard, 'filters', [])
        );

        /*
        |--------------------------------------------------------------------------
        | USER
        |--------------------------------------------------------------------------
        */

        $roles = $this->normalizeRoles(
            data_get($user, 'roles', [])
        );

        $primaryRole = data_get(
            $user,
            'primary_role'
        );

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        |
        | Do not blindly use roles.0.
        |
        | DashboardService may already provide primary_role.
        |
        */

        if (
            $primaryRole === null
            && ! empty($roles)
        ) {
            $primaryRole = $roles[0];
        }

        /*
        |--------------------------------------------------------------------------
        | UNIT TOTALS
        |--------------------------------------------------------------------------
        */

        $unitTotal = $this->integer(
            data_get(
                $units,
                'total',
                data_get(
                    $overview,
                    'units',
                    0
                )
            )
        );

        $unitOccupied = $this->integer(
            data_get(
                $units,
                'occupied',
                data_get(
                    $overview,
                    'occupied_units',
                    0
                )
            )
        );

        $unitVacant = $this->integer(
            data_get(
                $units,
                'vacant',
                data_get(
                    $overview,
                    'vacant_units',
                    0
                )
            )
        );

        $unitMaintenance = $this->integer(
            data_get(
                $units,
                'maintenance',
                0
            )
        );

        $unitReserved = $this->integer(
            data_get(
                $units,
                'reserved',
                0
            )
        );

        /*
        |--------------------------------------------------------------------------
        | OCCUPANCY RATE
        |--------------------------------------------------------------------------
        |
        | Prefer the value from DashboardService.
        | Only calculate it when it does not exist.
        |
        */

        $occupancyRate = data_get(
            $occupancy,
            'rate'
        );

        if ($occupancyRate === null) {
            $occupancyRate = data_get(
                $overview,
                'occupancy_rate'
            );
        }

        if ($occupancyRate === null) {
            $occupancyRate = $this->percentage(
                $unitOccupied,
                $unitTotal
            );
        }

        $occupancyRate = $this->decimal(
            $occupancyRate
        );

        /*
        |--------------------------------------------------------------------------
        | BOOKING TOTALS
        |--------------------------------------------------------------------------
        */

        $bookingTotal = $this->integer(
            data_get(
                $bookings,
                'total',
                data_get(
                    $overview,
                    'bookings',
                    0
                )
            )
        );

        $bookingPending = $this->integer(
            data_get(
                $bookings,
                'pending',
                0
            )
        );

        $bookingConfirmed = $this->integer(
            data_get(
                $bookings,
                'confirmed',
                0
            )
        );

        $bookingCompleted = $this->integer(
            data_get(
                $bookings,
                'completed',
                0
            )
        );

        $bookingCancelled = $this->integer(
            data_get(
                $bookings,
                'cancelled',
                0
            )
        );

        /*
        |--------------------------------------------------------------------------
        | PROPERTIES
        |--------------------------------------------------------------------------
        */

        $propertyTotal = $this->integer(
            data_get(
                $properties,
                'total',
                0
            )
        );

        $propertyActive = $this->integer(
            data_get(
                $properties,
                'active',
                0
            )
        );

        $propertyFeatured = $this->integer(
            data_get(
                $properties,
                'featured',
                0
            )
        );

        $propertyVerified = $this->integer(
            data_get(
                $properties,
                'verified',
                0
            )
        );

        $propertyInactive = $this->integer(
            data_get(
                $properties,
                'inactive',
            )
        );

        if (! array_key_exists(
            'inactive',
            is_array($properties) ? $properties : []
        )) {
            $propertyInactive = max(
                0,
                $propertyTotal - $propertyActive
            );
        }

        $propertyVerificationRate = data_get(
            $properties,
            'verification_rate'
        );

        if ($propertyVerificationRate === null) {
            $propertyVerificationRate = $this->percentage(
                $propertyVerified,
                $propertyTotal
            );
        }

        /*
        |--------------------------------------------------------------------------
        | APARTMENTS
        |--------------------------------------------------------------------------
        */

        $apartmentTotal = $this->integer(
            data_get(
                $apartments,
                'total',
                0
            )
        );

        $apartmentActive = $this->integer(
            data_get(
                $apartments,
                'active',
                0
            )
        );

        $apartmentInactive = data_get(
            $apartments,
            'inactive'
        );

        if ($apartmentInactive === null) {
            $apartmentInactive = max(
                0,
                $apartmentTotal - $apartmentActive
            );
        }

        $apartmentActiveRate = data_get(
            $apartments,
            'active_rate'
        );

        if ($apartmentActiveRate === null) {
            $apartmentActiveRate = $this->percentage(
                $apartmentActive,
                $apartmentTotal
            );
        }

        /*
        |--------------------------------------------------------------------------
        | TENANCIES
        |--------------------------------------------------------------------------
        */

        $tenancyTotal = $this->integer(
            data_get(
                $tenancies,
                'total',
                0
            )
        );

        $tenancyActive = $this->integer(
            data_get(
                $tenancies,
                'active',
                0
            )
        );

        $tenancyPending = $this->integer(
            data_get(
                $tenancies,
                'pending',
                0
            )
        );

        $tenancyExpired = $this->integer(
            data_get(
                $tenancies,
                'expired',
                0
            )
        );

        $tenancyTerminated = $this->integer(
            data_get(
                $tenancies,
                'terminated',
                0
            )
        );

        $tenancyActiveRate = data_get(
            $tenancies,
            'active_rate'
        );

        if ($tenancyActiveRate === null) {
            $tenancyActiveRate = $this->percentage(
                $tenancyActive,
                $tenancyTotal
            );
        }

        /*
        |--------------------------------------------------------------------------
        | FINANCIALS
        |--------------------------------------------------------------------------
        */

        $rentDue = $this->money(
            data_get(
                $financials,
                'rent_due',
                data_get(
                    $overview,
                    'outstanding_rent',
                    0
                )
            )
        );

        $rentCollected = $this->money(
            data_get(
                $financials,
                'rent_collected',
                data_get(
                    $overview,
                    'rent_collected',
                    0
                )
            )
        );

        $outstanding = $this->money(
            data_get(
                $financials,
                'outstanding',
                data_get(
                    $overview,
                    'outstanding_rent',
                    0
                )
            )
        );

        $expenses = $this->money(
            data_get(
                $financials,
                'expenses',
                data_get(
                    $overview,
                    'expenses',
                    0
                )
            )
        );

        $netIncome = $this->money(
            data_get(
                $financials,
                'net_income',
                data_get(
                    $overview,
                    'net_income',
                    0
                )
            )
        );

        /*
        |--------------------------------------------------------------------------
        | FINANCIAL RATES
        |--------------------------------------------------------------------------
        */

        $collectionRate = data_get(
            $financials,
            'collection_rate'
        );

        if ($collectionRate === null) {
            $collectionRate = $this->percentage(
                $rentCollected,
                $rentDue
            );
        }

        $expenseRate = data_get(
            $financials,
            'expense_rate'
        );

        if ($expenseRate === null) {
            $expenseRate = $this->percentage(
                $expenses,
                $rentCollected
            );
        }

        $netMargin = data_get(
            $financials,
            'net_margin'
        );

        if ($netMargin === null) {
            $netMargin = $this->percentage(
                $netIncome,
                $rentCollected
            );
        }

        /*
        |--------------------------------------------------------------------------
        | MAINTENANCE
        |--------------------------------------------------------------------------
        */

        $maintenanceTotal = $this->integer(
            data_get(
                $maintenance,
                'total',
                0
            )
        );

        $maintenancePending = $this->integer(
            data_get(
                $maintenance,
                'pending',
                0
            )
        );

        $maintenanceInProgress = $this->integer(
            data_get(
                $maintenance,
                'in_progress',
                0
            )
        );

        $maintenanceCompleted = $this->integer(
            data_get(
                $maintenance,
                'completed',
                0
            )
        );

        $maintenanceCancelled = $this->integer(
            data_get(
                $maintenance,
                'cancelled',
                0
            )
        );

        $maintenanceOpen = data_get(
            $maintenance,
            'open'
        );

        if ($maintenanceOpen === null) {
            $maintenanceOpen =
                $maintenancePending
                +
                $maintenanceInProgress;
        }

        $maintenanceCompletionRate = data_get(
            $maintenance,
            'completion_rate'
        );

        if ($maintenanceCompletionRate === null) {
            $maintenanceCompletionRate = $this->percentage(
                $maintenanceCompleted,
                $maintenanceTotal
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UNIT RATES
        |--------------------------------------------------------------------------
        */

        $occupiedRate = data_get(
            $units,
            'occupied_rate'
        );

        if ($occupiedRate === null) {
            $occupiedRate = $this->percentage(
                $unitOccupied,
                $unitTotal
            );
        }

        $vacantRate = data_get(
            $units,
            'vacant_rate'
        );

        if ($vacantRate === null) {
            $vacantRate = $this->percentage(
                $unitVacant,
                $unitTotal
            );
        }

        $maintenanceRate = data_get(
            $units,
            'maintenance_rate'
        );

        if ($maintenanceRate === null) {
            $maintenanceRate = $this->percentage(
                $unitMaintenance,
                $unitTotal
            );
        }

        $reservedRate = data_get(
            $units,
            'reserved_rate'
        );

        if ($reservedRate === null) {
            $reservedRate = $this->percentage(
                $unitReserved,
                $unitTotal
            );
        }

        /*
        |--------------------------------------------------------------------------
        | AVAILABLE UNITS
        |--------------------------------------------------------------------------
        |
        | Prefer DashboardService value.
        |
        */

        $availableUnits = data_get(
            $units,
            'available'
        );

        if ($availableUnits === null) {
            $availableUnits = $unitVacant;
        }

        /*
        |--------------------------------------------------------------------------
        | AVAILABLE RATE
        |--------------------------------------------------------------------------
        */

        $availableRate = data_get(
            $occupancy,
            'available_rate'
        );

        if ($availableRate === null) {
            $availableRate = $this->percentage(
                $availableUnits,
                $unitTotal
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS BREAKDOWNS
        |--------------------------------------------------------------------------
        */

        $unitStatusBreakdown = $this->normalizeUnitStatusBreakdown(
            data_get(
                $units,
                'status_breakdown'
            ),
            $unitTotal,
            $unitOccupied,
            $unitVacant,
            $unitMaintenance,
            $unitReserved
        );

        $occupancyStatusBreakdown = $this->normalizeUnitStatusBreakdown(
            data_get(
                $occupancy,
                'status_breakdown'
            ),
            $unitTotal,
            $unitOccupied,
            $unitVacant,
            $unitMaintenance,
            $unitReserved
        );

        /*
        |--------------------------------------------------------------------------
        | BOOKING BREAKDOWN
        |--------------------------------------------------------------------------
        */

        $bookingStatusBreakdown = $this->normalizeBookingStatusBreakdown(
            data_get(
                $bookings,
                'status_breakdown'
            ),
            $bookingTotal,
            $bookingPending,
            $bookingConfirmed,
            $bookingCompleted,
            $bookingCancelled
        );

        /*
        |--------------------------------------------------------------------------
        | TENANCY BREAKDOWN
        |--------------------------------------------------------------------------
        */

        $tenancyStatusBreakdown = $this->normalizeTenancyStatusBreakdown(
            data_get(
                $tenancies,
                'status_breakdown'
            ),
            $tenancyActive,
            $tenancyPending,
            $tenancyExpired,
            $tenancyTerminated
        );

        /*
        |--------------------------------------------------------------------------
        | MAINTENANCE BREAKDOWN
        |--------------------------------------------------------------------------
        */

        $maintenanceStatusBreakdown = $this->normalizeMaintenanceStatusBreakdown(
            data_get(
                $maintenance,
                'status_breakdown'
            ),
            $maintenancePending,
            $maintenanceInProgress,
            $maintenanceCompleted,
            $maintenanceCancelled
        );

        /*
        |--------------------------------------------------------------------------
        | META
        |--------------------------------------------------------------------------
        */

        $generatedAt = data_get(
            $serviceMeta,
            'generated_at'
        );

        if ($generatedAt === null) {
            $generatedAt = now()->toISOString();
        }

        $currency = data_get(
            $serviceMeta,
            'currency',
            config('app.currency', 'KES')
        );

        $timezone = data_get(
            $serviceMeta,
            'timezone',
            config('app.timezone', 'Africa/Nairobi')
        );

        /*
        |--------------------------------------------------------------------------
        | RETURN
        |--------------------------------------------------------------------------
        */

        return [

            /*
            |--------------------------------------------------------------------------
            | DASHBOARD
            |--------------------------------------------------------------------------
            */

            'dashboard' => $dashboard
                ? [
                    'id' => $this->integer(
                        data_get($dashboard, 'id')
                    ),

                    'name' => data_get(
                        $dashboard,
                        'name'
                    ),

                    'slug' => data_get(
                        $dashboard,
                        'slug'
                    ),

                    'description' => data_get(
                        $dashboard,
                        'description'
                    ),

                    'type' => data_get(
                        $dashboard,
                        'type',
                        'system'
                    ),

                    'layout' => $layout,

                    'widgets' => $widgets,

                    'filters' => $filters,

                    'is_default' => (bool) data_get(
                        $dashboard,
                        'is_default',
                        false
                    ),

                    'is_active' => (bool) data_get(
                        $dashboard,
                        'is_active',
                        true
                    ),

                    'sort_order' => $this->integer(
                        data_get(
                            $dashboard,
                            'sort_order',
                            0
                        )
                    ),

                    'meta' => [
                        'is_system' =>
                            data_get(
                                $dashboard,
                                'type'
                            ) === 'system',

                        'is_user_dashboard' =>
                            data_get(
                                $dashboard,
                                'type'
                            ) === 'user',

                        'widget_count' => count(
                            $widgets
                        ),

                        'filter_count' => count(
                            $filters
                        ),
                    ],
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | USER
            |--------------------------------------------------------------------------
            */

            'user' => [
                'id' => $this->integer(
                    data_get($user, 'id')
                ),

                'name' => data_get(
                    $user,
                    'name'
                ),

                'first_name' => data_get(
                    $user,
                    'first_name'
                ),

                'last_name' => data_get(
                    $user,
                    'last_name'
                ),

                'email' => data_get(
                    $user,
                    'email'
                ),

                'roles' => $roles,

                'primary_role' => $primaryRole,
            ],

            /*
            |--------------------------------------------------------------------------
            | OVERVIEW
            |--------------------------------------------------------------------------
            */

            'overview' => [

                'properties' => $this->integer(
                    data_get(
                        $overview,
                        'properties',
                        $propertyTotal
                    )
                ),

                'apartments' => $this->integer(
                    data_get(
                        $overview,
                        'apartments',
                        $apartmentTotal
                    )
                ),

                'units' => $unitTotal,

                'occupied_units' => $unitOccupied,

                'vacant_units' => $unitVacant,

                'occupancy_rate' => $occupancyRate,

                'active_tenancies' => $this->integer(
                    data_get(
                        $overview,
                        'active_tenancies',
                        $tenancyActive
                    )
                ),

                'bookings' => $bookingTotal,

                'rent_collected' => $this->money(
                    data_get(
                        $overview,
                        'rent_collected',
                        $rentCollected
                    )
                ),

                'outstanding_rent' => $this->money(
                    data_get(
                        $overview,
                        'outstanding_rent',
                        $outstanding
                    )
                ),

                'expenses' => $this->money(
                    data_get(
                        $overview,
                        'expenses',
                        $expenses
                    )
                ),

                'net_income' => $this->money(
                    data_get(
                        $overview,
                        'net_income',
                        $netIncome
                    )
                ),

                'maintenance_requests' => $this->integer(
                    data_get(
                        $overview,
                        'maintenance_requests',
                        $maintenanceTotal
                    )
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | PROPERTIES
            |--------------------------------------------------------------------------
            */

            'properties' => [
                'total' => $propertyTotal,

                'active' => $propertyActive,

                'inactive' => $propertyInactive,

                'featured' => $propertyFeatured,

                'verified' => $propertyVerified,

                'verification_rate' => $this->decimal(
                    $propertyVerificationRate
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | APARTMENTS
            |--------------------------------------------------------------------------
            */

            'apartments' => [
                'total' => $apartmentTotal,

                'active' => $apartmentActive,

                'inactive' => $apartmentInactive,

                'active_rate' => $this->decimal(
                    $apartmentActiveRate
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | UNITS
            |--------------------------------------------------------------------------
            */

            'units' => [
                'total' => $unitTotal,

                'vacant' => $unitVacant,

                'occupied' => $unitOccupied,

                'maintenance' => $unitMaintenance,

                'reserved' => $unitReserved,

                'available' => $this->integer(
                    $availableUnits
                ),

                'occupied_rate' => $this->decimal(
                    $occupiedRate
                ),

                'vacant_rate' => $this->decimal(
                    $vacantRate
                ),

                'maintenance_rate' => $this->decimal(
                    $maintenanceRate
                ),

                'reserved_rate' => $this->decimal(
                    $reservedRate
                ),

                'status_breakdown' => $unitStatusBreakdown,
            ],

            /*
            |--------------------------------------------------------------------------
            | OCCUPANCY
            |--------------------------------------------------------------------------
            */

            'occupancy' => [
                'total_units' => $this->integer(
                    data_get(
                        $occupancy,
                        'total_units',
                        $unitTotal
                    )
                ),

                'occupied' => $this->integer(
                    data_get(
                        $occupancy,
                        'occupied',
                        $unitOccupied
                    )
                ),

                'vacant' => $this->integer(
                    data_get(
                        $occupancy,
                        'vacant',
                        $unitVacant
                    )
                ),

                'maintenance' => $this->integer(
                    data_get(
                        $occupancy,
                        'maintenance',
                        $unitMaintenance
                    )
                ),

                'reserved' => $this->integer(
                    data_get(
                        $occupancy,
                        'reserved',
                        $unitReserved
                    )
                ),

                'rate' => $occupancyRate,

                'available_rate' => $this->decimal(
                    $availableRate
                ),

                'status_breakdown' =>
                    $occupancyStatusBreakdown,
            ],

            /*
            |--------------------------------------------------------------------------
            | TENANCIES
            |--------------------------------------------------------------------------
            */

            'tenancies' => [
                'total' => $tenancyTotal,

                'active' => $tenancyActive,

                'pending' => $tenancyPending,

                'expired' => $tenancyExpired,

                'terminated' => $tenancyTerminated,

                'active_rate' => $this->decimal(
                    $tenancyActiveRate
                ),

                'status_breakdown' =>
                    $tenancyStatusBreakdown,
            ],

            /*
            |--------------------------------------------------------------------------
            | BOOKINGS
            |--------------------------------------------------------------------------
            */

            'bookings' => [
                'total' => $bookingTotal,

                'pending' => $bookingPending,

                'confirmed' => $bookingConfirmed,

                'completed' => $bookingCompleted,

                'cancelled' => $bookingCancelled,

                'pending_rate' => $this->decimal(
                    $this->rateFromSource(
                        $bookings,
                        'pending_rate',
                        $bookingPending,
                        $bookingTotal
                    )
                ),

                'confirmed_rate' => $this->decimal(
                    $this->rateFromSource(
                        $bookings,
                        'confirmed_rate',
                        $bookingConfirmed,
                        $bookingTotal
                    )
                ),

                'completed_rate' => $this->decimal(
                    $this->rateFromSource(
                        $bookings,
                        'completed_rate',
                        $bookingCompleted,
                        $bookingTotal
                    )
                ),

                'cancelled_rate' => $this->decimal(
                    $this->rateFromSource(
                        $bookings,
                        'cancelled_rate',
                        $bookingCancelled,
                        $bookingTotal
                    )
                ),

                'status_breakdown' =>
                    $bookingStatusBreakdown,
            ],

            /*
            |--------------------------------------------------------------------------
            | FINANCIALS
            |--------------------------------------------------------------------------
            */

            'financials' => [
                'rent_due' => $rentDue,

                'rent_collected' => $rentCollected,

                'outstanding' => $outstanding,

                'expenses' => $expenses,

                'net_income' => $netIncome,

                'collection_rate' => $this->decimal(
                    $collectionRate
                ),

                'expense_rate' => $this->decimal(
                    $expenseRate
                ),

                'net_margin' => $this->decimal(
                    $netMargin
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE
            |--------------------------------------------------------------------------
            */

            'maintenance' => [
                'total' => $maintenanceTotal,

                'pending' => $maintenancePending,

                'in_progress' => $maintenanceInProgress,

                'completed' => $maintenanceCompleted,

                'cancelled' => $maintenanceCancelled,

                'open' => $this->integer(
                    $maintenanceOpen
                ),

                'completion_rate' => $this->decimal(
                    $maintenanceCompletionRate
                ),

                'status_breakdown' =>
                    $maintenanceStatusBreakdown,
            ],

            /*
            |--------------------------------------------------------------------------
            | ACTIVITY
            |--------------------------------------------------------------------------
            */

            'activity' => $this->normalizeActivity(
                $activity
            ),

            /*
            |--------------------------------------------------------------------------
            | META
            |--------------------------------------------------------------------------
            */

            'meta' => [
                'generated_at' => $generatedAt,

                'currency' => $currency,

                'timezone' => $timezone,

                'has_properties' =>
                    $this->hasDashboardData(
                        $properties,
                        $propertyTotal
                    ),

                'has_apartments' =>
                    $this->hasDashboardData(
                        $apartments,
                        $apartmentTotal
                    ),

                'has_units' =>
                    $this->hasDashboardData(
                        $units,
                        $unitTotal
                    ),

                'has_occupancy' =>
                    $this->hasDashboardData(
                        $occupancy,
                        $unitTotal
                    ),

                'has_tenancies' =>
                    $this->hasDashboardData(
                        $tenancies,
                        $tenancyTotal
                    ),

                'has_bookings' =>
                    $this->hasDashboardData(
                        $bookings,
                        $bookingTotal
                    ),

                'has_financials' =>
                    $this->hasDashboardData(
                        $financials,
                        $rentDue
                    ),

                'has_maintenance' =>
                    $this->hasDashboardData(
                        $maintenance,
                        $maintenanceTotal
                    ),

                'has_activity' =>
                    is_countable($activity)
                    && count($activity) > 0,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE LAYOUT
    |--------------------------------------------------------------------------
    */

    protected function normalizeLayout(mixed $layout): array
    {
        if ($layout instanceof \Illuminate\Contracts\Support\Arrayable) {
            $layout = $layout->toArray();
        }

        if (! is_array($layout)) {
            $layout = [];
        }

        return [
            'columns' => $this->integer(
                data_get($layout, 'columns', 12)
            ),

            'responsive' => (bool) data_get(
                $layout,
                'responsive',
                true
            ),

            'cards' => [
                'small' => $this->integer(
                    data_get(
                        $layout,
                        'cards.small',
                        3
                    )
                ),

                'medium' => $this->integer(
                    data_get(
                        $layout,
                        'cards.medium',
                        4
                    )
                ),

                'large' => $this->integer(
                    data_get(
                        $layout,
                        'cards.large',
                        6
                    )
                ),

                'full' => $this->integer(
                    data_get(
                        $layout,
                        'cards.full',
                        12
                    )
                ),
            ],

            'breakpoints' => [
                'mobile' => $this->integer(
                    data_get(
                        $layout,
                        'breakpoints.mobile',
                        1
                    )
                ),

                'tablet' => $this->integer(
                    data_get(
                        $layout,
                        'breakpoints.tablet',
                        6
                    )
                ),

                'desktop' => $this->integer(
                    data_get(
                        $layout,
                        'breakpoints.desktop',
                        12
                    )
                ),
            ],

            'role' => data_get(
                $layout,
                'role'
            ),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE WIDGETS
    |--------------------------------------------------------------------------
    */

    protected function normalizeWidgets(mixed $widgets): array
    {
        if ($widgets instanceof \Illuminate\Contracts\Support\Arrayable) {
            $widgets = $widgets->toArray();
        }

        if (! is_array($widgets)) {
            return [];
        }

        return collect($widgets)
            ->values()
            ->map(function ($widget, $index) {

                /*
                |--------------------------------------------------------------------------
                | STRING WIDGET
                |--------------------------------------------------------------------------
                */

                if (is_string($widget)) {
                    return [
                        'key' => $widget,

                        'type' => 'stat',

                        'title' => $this->widgetTitle(
                            $widget
                        ),

                        'enabled' => true,

                        'order' => $index + 1,
                    ];
                }

                /*
                |--------------------------------------------------------------------------
                | ARRAY WIDGET
                |--------------------------------------------------------------------------
                */

                if (is_array($widget)) {

                    $key = data_get(
                        $widget,
                        'key',
                        'widget-' . ($index + 1)
                    );

                    return [
                        'key' => $key,

                        'type' => data_get(
                            $widget,
                            'type',
                            'stat'
                        ),

                        'title' => data_get(
                            $widget,
                            'title',
                            $this->widgetTitle($key)
                        ),

                        'description' => data_get(
                            $widget,
                            'description'
                        ),

                        'enabled' => (bool) data_get(
                            $widget,
                            'enabled',
                            true
                        ),

                        'order' => $this->integer(
                            data_get(
                                $widget,
                                'order',
                                $index + 1
                            )
                        ),

                        'size' => data_get(
                            $widget,
                            'size',
                            'medium'
                        ),

                        'position' => data_get(
                            $widget,
                            'position'
                        ),

                        'permissions' => array_values(
                            (array) data_get(
                                $widget,
                                'permissions',
                                []
                            )
                        ),

                        'config' => is_array(
                            data_get(
                                $widget,
                                'config'
                            )
                        )
                            ? data_get(
                                $widget,
                                'config'
                            )
                            : [],
                    ];
                }

                return null;
            })
            ->filter()
            ->sortBy('order')
            ->values()
            ->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | WIDGET TITLE
    |--------------------------------------------------------------------------
    */

    protected function widgetTitle(string $key): string
    {
        return match ($key) {

            'properties' => 'Properties',

            'apartments' => 'Apartments',

            'units' => 'Units',

            'occupancy' => 'Occupancy',

            'tenancies' => 'Tenancies',

            'bookings' => 'Bookings',

            'financials' => 'Financial Overview',

            'payments' => 'Payments',

            'rent_collection' => 'Rent Collection',

            'outstanding_balances' =>
                'Outstanding Balances',

            'expenses' => 'Expenses',

            'maintenance' => 'Maintenance',

            'activity' => 'Recent Activity',

            'available_units' => 'Available Units',

            'leads' => 'Leads',

            'leases' => 'Leases',

            'renewals' => 'Lease Renewals',

            'expirations' => 'Lease Expirations',

            'assigned_jobs' => 'Assigned Jobs',

            'pending_jobs' => 'Pending Jobs',

            'in_progress_jobs' => 'In Progress Jobs',

            'completed_jobs' => 'Completed Jobs',

            'rent' => 'Rent',

            'inquiries' => 'Inquiries',

            'customers' => 'Customers',

            'tenants' => 'Tenants',

            'support_activity' => 'Support Activity',

            'audit_logs' => 'Audit Logs',

            'reports' => 'Reports',

            'tenancy' => 'My Tenancy',

            default => ucwords(
                str_replace(
                    ['_', '-'],
                    ' ',
                    $key
                )
            ),
        };
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE FILTERS
    |--------------------------------------------------------------------------
    */

    protected function normalizeFilters(mixed $filters): array
    {
        if ($filters instanceof \Illuminate\Contracts\Support\Arrayable) {
            $filters = $filters->toArray();
        }

        if (! is_array($filters)) {
            return [];
        }

        if ($this->isAssociative($filters)) {
            return [
                'property_id' => data_get(
                    $filters,
                    'property_id'
                ),

                'apartment_id' => data_get(
                    $filters,
                    'apartment_id'
                ),

                'unit_id' => data_get(
                    $filters,
                    'unit_id'
                ),

                'status' => data_get(
                    $filters,
                    'status'
                ),

                'date_range' => data_get(
                    $filters,
                    'date_range'
                ),
            ];
        }

        return collect($filters)
            ->filter(
                fn ($filter) => is_array($filter)
            )
            ->values()
            ->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE ROLES
    |--------------------------------------------------------------------------
    */

    protected function normalizeRoles(mixed $roles): array
    {
        if ($roles instanceof \Illuminate\Contracts\Support\Arrayable) {
            $roles = $roles->toArray();
        }

        if (! is_array($roles)) {
            return [];
        }

        return collect($roles)
            ->map(function ($role) {

                if (is_string($role)) {
                    return $role;
                }

                if (is_array($role)) {
                    return data_get(
                        $role,
                        'name',
                        data_get(
                            $role,
                            'slug'
                        )
                    );
                }

                if (is_object($role)) {
                    return data_get(
                        $role,
                        'name',
                        data_get(
                            $role,
                            'slug'
                        )
                    );
                }

                return null;
            })
            ->filter()
            ->values()
            ->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE UNIT STATUS BREAKDOWN
    |--------------------------------------------------------------------------
    */

    protected function normalizeUnitStatusBreakdown(
        mixed $breakdown,
        int $total,
        int $occupied,
        int $vacant,
        int $maintenance,
        int $reserved
    ): array {
        if (
            $breakdown instanceof
            \Illuminate\Contracts\Support\Arrayable
        ) {
            $breakdown = $breakdown->toArray();
        }

        if (
            is_array($breakdown)
            && count($breakdown) > 0
        ) {
            return collect($breakdown)
                ->filter(
                    fn ($item) => is_array($item)
                )
                ->map(function ($item) use ($total) {

                    $count = $this->integer(
                        data_get(
                            $item,
                            'count',
                            0
                        )
                    );

                    $percentage = data_get(
                        $item,
                        'percentage'
                    );

                    if ($percentage === null) {
                        $percentage = $this->percentage(
                            $count,
                            $total
                        );
                    }

                    return [
                        'status' => data_get(
                            $item,
                            'status'
                        ),

                        'label' => data_get(
                            $item,
                            'label',
                            ucfirst(
                                str_replace(
                                    '_',
                                    ' ',
                                    (string) data_get(
                                        $item,
                                        'status'
                                    )
                                )
                            )
                        ),

                        'count' => $count,

                        'percentage' => $this->decimal(
                            $percentage
                        ),
                    ];
                })
                ->values()
                ->toArray();
        }

        return [
            [
                'status' => 'occupied',
                'label' => 'Occupied',
                'count' => $occupied,
                'percentage' => $this->percentage(
                    $occupied,
                    $total
                ),
            ],

            [
                'status' => 'vacant',
                'label' => 'Vacant',
                'count' => $vacant,
                'percentage' => $this->percentage(
                    $vacant,
                    $total
                ),
            ],

            [
                'status' => 'maintenance',
                'label' => 'Maintenance',
                'count' => $maintenance,
                'percentage' => $this->percentage(
                    $maintenance,
                    $total
                ),
            ],

            [
                'status' => 'reserved',
                'label' => 'Reserved',
                'count' => $reserved,
                'percentage' => $this->percentage(
                    $reserved,
                    $total
                ),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE TENANCY BREAKDOWN
    |--------------------------------------------------------------------------
    */

    protected function normalizeTenancyStatusBreakdown(
        mixed $breakdown,
        int $active,
        int $pending,
        int $expired,
        int $terminated
    ): array {
        if (
            $breakdown instanceof
            \Illuminate\Contracts\Support\Arrayable
        ) {
            $breakdown = $breakdown->toArray();
        }

        if (
            is_array($breakdown)
            && count($breakdown) > 0
        ) {
            return collect($breakdown)
                ->filter(
                    fn ($item) => is_array($item)
                )
                ->values()
                ->toArray();
        }

        return [
            [
                'status' => 'active',
                'label' => 'Active',
                'count' => $active,
            ],

            [
                'status' => 'pending',
                'label' => 'Pending',
                'count' => $pending,
            ],

            [
                'status' => 'expired',
                'label' => 'Expired',
                'count' => $expired,
            ],

            [
                'status' => 'terminated',
                'label' => 'Terminated',
                'count' => $terminated,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE BOOKING BREAKDOWN
    |--------------------------------------------------------------------------
    */

    protected function normalizeBookingStatusBreakdown(
        mixed $breakdown,
        int $total,
        int $pending,
        int $confirmed,
        int $completed,
        int $cancelled
    ): array {
        if (
            $breakdown instanceof
            \Illuminate\Contracts\Support\Arrayable
        ) {
            $breakdown = $breakdown->toArray();
        }

        if (
            is_array($breakdown)
            && count($breakdown) > 0
        ) {
            return collect($breakdown)
                ->filter(
                    fn ($item) => is_array($item)
                )
                ->map(function ($item) use ($total) {

                    $count = $this->integer(
                        data_get(
                            $item,
                            'count',
                            0
                        )
                    );

                    $percentage = data_get(
                        $item,
                        'percentage'
                    );

                    if ($percentage === null) {
                        $percentage = $this->percentage(
                            $count,
                            $total
                        );
                    }

                    return [
                        'status' => data_get(
                            $item,
                            'status'
                        ),

                        'label' => data_get(
                            $item,
                            'label'
                        ),

                        'count' => $count,

                        'percentage' => $this->decimal(
                            $percentage
                        ),
                    ];
                })
                ->values()
                ->toArray();
        }

        return [
            [
                'status' => 'pending',
                'label' => 'Pending',
                'count' => $pending,
                'percentage' => $this->percentage(
                    $pending,
                    $total
                ),
            ],

            [
                'status' => 'confirmed',
                'label' => 'Confirmed',
                'count' => $confirmed,
                'percentage' => $this->percentage(
                    $confirmed,
                    $total
                ),
            ],

            [
                'status' => 'completed',
                'label' => 'Completed',
                'count' => $completed,
                'percentage' => $this->percentage(
                    $completed,
                    $total
                ),
            ],

            [
                'status' => 'cancelled',
                'label' => 'Cancelled',
                'count' => $cancelled,
                'percentage' => $this->percentage(
                    $cancelled,
                    $total
                ),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE MAINTENANCE BREAKDOWN
    |--------------------------------------------------------------------------
    */

    protected function normalizeMaintenanceStatusBreakdown(
        mixed $breakdown,
        int $pending,
        int $inProgress,
        int $completed,
        int $cancelled
    ): array {
        if (
            $breakdown instanceof
            \Illuminate\Contracts\Support\Arrayable
        ) {
            $breakdown = $breakdown->toArray();
        }

        if (
            is_array($breakdown)
            && count($breakdown) > 0
        ) {
            return collect($breakdown)
                ->filter(
                    fn ($item) => is_array($item)
                )
                ->values()
                ->toArray();
        }

        return [
            [
                'status' => 'pending',
                'label' => 'Pending',
                'count' => $pending,
            ],

            [
                'status' => 'in_progress',
                'label' => 'In Progress',
                'count' => $inProgress,
            ],

            [
                'status' => 'completed',
                'label' => 'Completed',
                'count' => $completed,
            ],

            [
                'status' => 'cancelled',
                'label' => 'Cancelled',
                'count' => $cancelled,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE ACTIVITY
    |--------------------------------------------------------------------------
    */

    protected function normalizeActivity(mixed $activity): array
    {
        if ($activity instanceof \Illuminate\Contracts\Support\Arrayable) {
            $activity = $activity->toArray();
        }

        if (! is_array($activity)) {
            return [];
        }

        return collect($activity)
            ->filter(
                fn ($item) => is_array($item)
            )
            ->map(function (array $item) {

                return [
                    'id' => data_get(
                        $item,
                        'id'
                    ),

                    'type' => data_get(
                        $item,
                        'type',
                        'activity'
                    ),

                    'title' => data_get(
                        $item,
                        'title',
                        data_get(
                            $item,
                            'message'
                        )
                    ),

                    'description' => data_get(
                        $item,
                        'description'
                    ),

                    'message' => data_get(
                        $item,
                        'message'
                    ),

                    'user' => data_get(
                        $item,
                        'user'
                    ),

                    'created_at' => data_get(
                        $item,
                        'created_at'
                    ),

                    'updated_at' => data_get(
                        $item,
                        'updated_at'
                    ),

                    'url' => data_get(
                        $item,
                        'url'
                    ),
                ];
            })
            ->values()
            ->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | RATE FROM SOURCE
    |--------------------------------------------------------------------------
    */

    protected function rateFromSource(
        mixed $source,
        string $key,
        mixed $value,
        mixed $total
    ): float {
        $rate = data_get(
            $source,
            $key
        );

        if ($rate !== null) {
            return (float) $rate;
        }

        return $this->percentage(
            $value,
            $total
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD DATA CHECK
    |--------------------------------------------------------------------------
    */

    protected function hasDashboardData(
        mixed $section,
        mixed $total = null
    ): bool {
        if (
            $section instanceof
            \Illuminate\Contracts\Support\Arrayable
        ) {
            $section = $section->toArray();
        }

        if (
            $section === null
            || $section === []
        ) {
            return false;
        }

        if ($total !== null) {
            return ((float) $total) > 0;
        }

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | INTEGER
    |--------------------------------------------------------------------------
    */

    protected function integer(mixed $value): int
    {
        return (int) ($value ?? 0);
    }

    /*
    |--------------------------------------------------------------------------
    | DECIMAL
    |--------------------------------------------------------------------------
    */

    protected function decimal(mixed $value): float
    {
        return round(
            (float) ($value ?? 0),
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MONEY
    |--------------------------------------------------------------------------
    */

    protected function money(mixed $value): float
    {
        return round(
            (float) ($value ?? 0),
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PERCENTAGE
    |--------------------------------------------------------------------------
    */

    protected function percentage(
        mixed $value,
        mixed $total
    ): float {
        $value = (float) ($value ?? 0);

        $total = (float) ($total ?? 0);

        if ($total <= 0) {
            return 0.0;
        }

        return round(
            ($value / $total) * 100,
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ASSOCIATIVE ARRAY CHECK
    |--------------------------------------------------------------------------
    */

    protected function isAssociative(array $array): bool
    {
        if ($array === []) {
            return false;
        }

        return array_keys($array) !== range(
            0,
            count($array) - 1
        );
    }
}