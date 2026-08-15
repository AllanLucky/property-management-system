<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * DashboardService returns an array:
     *
     * [
     *     'dashboard' => ...,
     *     'user' => ...,
     *     'overview' => ...,
     *     'properties' => ...,
     *     'apartments' => ...,
     *     'units' => ...,
     *     'occupancy' => ...,
     *     'tenancies' => ...,
     *     'bookings' => ...,
     *     'financials' => ...,
     *     'maintenance' => ...,
     *     'activity' => ...,
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

        /*
        |--------------------------------------------------------------------------
        | DASHBOARD
        |--------------------------------------------------------------------------
        */

        $dashboard = data_get($data, 'dashboard');

        /*
        |--------------------------------------------------------------------------
        | USER
        |--------------------------------------------------------------------------
        */

        $user = data_get($data, 'user');

        /*
        |--------------------------------------------------------------------------
        | RETURN
        |--------------------------------------------------------------------------
        */

        return [

            /*
            |--------------------------------------------------------------------------
            | Dashboard
            |--------------------------------------------------------------------------
            */

            'dashboard' => $dashboard
                ? [
                    'id' => data_get($dashboard, 'id'),

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
                        'type'
                    ),

                    'layout' => data_get(
                        $dashboard,
                        'layout',
                        []
                    ),

                    'widgets' => data_get(
                        $dashboard,
                        'widgets',
                        []
                    ),

                    'filters' => data_get(
                        $dashboard,
                        'filters',
                        []
                    ),

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

                    'sort_order' => (int) data_get(
                        $dashboard,
                        'sort_order',
                        0
                    ),
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | Authenticated User
            |--------------------------------------------------------------------------
            */

            'user' => [
                'id' => data_get(
                    $user,
                    'id'
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

                'roles' => data_get(
                    $user,
                    'roles',
                    []
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Overview
            |--------------------------------------------------------------------------
            */

            'overview' => [
                'properties' => (int) data_get(
                    $data,
                    'overview.properties',
                    0
                ),

                'apartments' => (int) data_get(
                    $data,
                    'overview.apartments',
                    0
                ),

                'units' => (int) data_get(
                    $data,
                    'overview.units',
                    0
                ),

                'occupied_units' => (int) data_get(
                    $data,
                    'overview.occupied_units',
                    0
                ),

                'vacant_units' => (int) data_get(
                    $data,
                    'overview.vacant_units',
                    0
                ),

                'occupancy_rate' => (float) data_get(
                    $data,
                    'overview.occupancy_rate',
                    0
                ),

                'active_tenancies' => (int) data_get(
                    $data,
                    'overview.active_tenancies',
                    0
                ),

                'bookings' => (int) data_get(
                    $data,
                    'overview.bookings',
                    0
                ),

                'rent_collected' => (float) data_get(
                    $data,
                    'overview.rent_collected',
                    0
                ),

                'outstanding_rent' => (float) data_get(
                    $data,
                    'overview.outstanding_rent',
                    0
                ),

                'expenses' => (float) data_get(
                    $data,
                    'overview.expenses',
                    0
                ),

                'net_income' => (float) data_get(
                    $data,
                    'overview.net_income',
                    0
                ),

                'maintenance_requests' => (int) data_get(
                    $data,
                    'overview.maintenance_requests',
                    0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Properties
            |--------------------------------------------------------------------------
            */

            'properties' => [
                'total' => (int) data_get(
                    $data,
                    'properties.total',
                    0
                ),

                'active' => (int) data_get(
                    $data,
                    'properties.active',
                    0
                ),

                'featured' => (int) data_get(
                    $data,
                    'properties.featured',
                    0
                ),

                'verified' => (int) data_get(
                    $data,
                    'properties.verified',
                    0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Apartments
            |--------------------------------------------------------------------------
            */

            'apartments' => [
                'total' => (int) data_get(
                    $data,
                    'apartments.total',
                    0
                ),

                'active' => (int) data_get(
                    $data,
                    'apartments.active',
                    0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Units
            |--------------------------------------------------------------------------
            */

            'units' => [
                'total' => (int) data_get(
                    $data,
                    'units.total',
                    0
                ),

                'vacant' => (int) data_get(
                    $data,
                    'units.vacant',
                    0
                ),

                'occupied' => (int) data_get(
                    $data,
                    'units.occupied',
                    0
                ),

                'maintenance' => (int) data_get(
                    $data,
                    'units.maintenance',
                    0
                ),

                'reserved' => (int) data_get(
                    $data,
                    'units.reserved',
                    0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Occupancy
            |--------------------------------------------------------------------------
            */

            'occupancy' => [
                'total_units' => (int) data_get(
                    $data,
                    'occupancy.total_units',
                    0
                ),

                'occupied' => (int) data_get(
                    $data,
                    'occupancy.occupied',
                    0
                ),

                'vacant' => (int) data_get(
                    $data,
                    'occupancy.vacant',
                    0
                ),

                'maintenance' => (int) data_get(
                    $data,
                    'occupancy.maintenance',
                    0
                ),

                'reserved' => (int) data_get(
                    $data,
                    'occupancy.reserved',
                    0
                ),

                'rate' => (float) data_get(
                    $data,
                    'occupancy.rate',
                    0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Tenancies
            |--------------------------------------------------------------------------
            */

            'tenancies' => [
                'total' => (int) data_get(
                    $data,
                    'tenancies.total',
                    0
                ),

                'active' => (int) data_get(
                    $data,
                    'tenancies.active',
                    0
                ),

                'pending' => (int) data_get(
                    $data,
                    'tenancies.pending',
                    0
                ),

                'expired' => (int) data_get(
                    $data,
                    'tenancies.expired',
                    0
                ),

                'terminated' => (int) data_get(
                    $data,
                    'tenancies.terminated',
                    0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Bookings
            |--------------------------------------------------------------------------
            */

            'bookings' => [
                'total' => (int) data_get(
                    $data,
                    'bookings.total',
                    0
                ),

                'pending' => (int) data_get(
                    $data,
                    'bookings.pending',
                    0
                ),

                'confirmed' => (int) data_get(
                    $data,
                    'bookings.confirmed',
                    0
                ),

                'completed' => (int) data_get(
                    $data,
                    'bookings.completed',
                    0
                ),

                'cancelled' => (int) data_get(
                    $data,
                    'bookings.cancelled',
                    0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Financials
            |--------------------------------------------------------------------------
            */

            'financials' => [
                'rent_due' => (float) data_get(
                    $data,
                    'financials.rent_due',
                    0
                ),

                'rent_collected' => (float) data_get(
                    $data,
                    'financials.rent_collected',
                    0
                ),

                'outstanding' => (float) data_get(
                    $data,
                    'financials.outstanding',
                    0
                ),

                'expenses' => (float) data_get(
                    $data,
                    'financials.expenses',
                    0
                ),

                'net_income' => (float) data_get(
                    $data,
                    'financials.net_income',
                    0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Maintenance
            |--------------------------------------------------------------------------
            */

            'maintenance' => [
                'total' => (int) data_get(
                    $data,
                    'maintenance.total',
                    0
                ),

                'pending' => (int) data_get(
                    $data,
                    'maintenance.pending',
                    0
                ),

                'in_progress' => (int) data_get(
                    $data,
                    'maintenance.in_progress',
                    0
                ),

                'completed' => (int) data_get(
                    $data,
                    'maintenance.completed',
                    0
                ),

                'cancelled' => (int) data_get(
                    $data,
                    'maintenance.cancelled',
                    0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Recent Activity
            |--------------------------------------------------------------------------
            */

            'activity' => data_get(
                $data,
                'activity',
                []
            ),
        ];
    }
}