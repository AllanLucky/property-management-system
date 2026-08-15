<?php

namespace App\Policies;

use App\Models\Dashboard;
use App\Models\User;

class DashboardPolicy
{
    /*
    |--------------------------------------------------------------------------
    | View Any
    |--------------------------------------------------------------------------
    |
    | Determine whether the user can access the dashboard area.
    |
    */

    public function viewAny(User $user): bool
    {
        return $user->can('dashboard.view');
    }

    /*
    |--------------------------------------------------------------------------
    | View
    |--------------------------------------------------------------------------
    |
    | Determine whether the user can view a specific dashboard.
    |
    */

    public function view(User $user, Dashboard $dashboard): bool
    {
        /*
         * User must have general dashboard permission.
         */
        if (! $user->can('dashboard.view')) {
            return false;
        }

        /*
         * System dashboards can be viewed by users
         * who have dashboard.view permission.
         */
        if ($dashboard->isSystem()) {
            return true;
        }

        /*
         * User dashboards can only be viewed by their owner.
         */
        return $dashboard->belongsToUser($user->id);
    }

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    public function create(User $user): bool
    {
        return $user->can('dashboard.create');
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    public function update(User $user, Dashboard $dashboard): bool
    {
        /*
         * User must have dashboard management permission.
         */
        if (! $user->can('dashboard.update')) {
            return false;
        }

        /*
         * System dashboards require management permission.
         */
        if ($dashboard->isSystem()) {
            return true;
        }

        /*
         * User dashboards can be updated by their owner.
         */
        return $dashboard->belongsToUser($user->id);
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    public function delete(User $user, Dashboard $dashboard): bool
    {
        /*
         * System dashboards should normally not be deleted
         * through normal user operations.
         */
        if ($dashboard->isSystem()) {
            return $user->can('dashboard.delete-system');
        }

        /*
         * User dashboards require delete permission
         * and ownership.
         */
        return $user->can('dashboard.delete')
            && $dashboard->belongsToUser($user->id);
    }

    /*
    |--------------------------------------------------------------------------
    | Restore
    |--------------------------------------------------------------------------
    */

    public function restore(User $user, Dashboard $dashboard): bool
    {
        return $user->can('dashboard.restore');
    }

    /*
    |--------------------------------------------------------------------------
    | Force Delete
    |--------------------------------------------------------------------------
    */

    public function forceDelete(User $user, Dashboard $dashboard): bool
    {
        return $user->can('dashboard.force-delete');
    }

    /*
    |--------------------------------------------------------------------------
    | Manage
    |--------------------------------------------------------------------------
    |
    | General dashboard configuration permission.
    |
    */

    public function manage(User $user): bool
    {
        return $user->can('dashboard.manage');
    }

    /*
    |--------------------------------------------------------------------------
    | View Properties
    |--------------------------------------------------------------------------
    */

    public function viewProperties(User $user): bool
    {
        return $user->can('dashboard.properties');
    }

    /*
    |--------------------------------------------------------------------------
    | View Apartments
    |--------------------------------------------------------------------------
    */

    public function viewApartments(User $user): bool
    {
        return $user->can('dashboard.apartments');
    }

    /*
    |--------------------------------------------------------------------------
    | View Units
    |--------------------------------------------------------------------------
    */

    public function viewUnits(User $user): bool
    {
        return $user->can('dashboard.units');
    }

    /*
    |--------------------------------------------------------------------------
    | View Occupancy
    |--------------------------------------------------------------------------
    */

    public function viewOccupancy(User $user): bool
    {
        return $user->can('dashboard.occupancy');
    }

    /*
    |--------------------------------------------------------------------------
    | View Tenancies
    |--------------------------------------------------------------------------
    */

    public function viewTenancies(User $user): bool
    {
        return $user->can('dashboard.tenancies');
    }

    /*
    |--------------------------------------------------------------------------
    | View Bookings
    |--------------------------------------------------------------------------
    */

    public function viewBookings(User $user): bool
    {
        return $user->can('dashboard.bookings');
    }

    /*
    |--------------------------------------------------------------------------
    | View Financials
    |--------------------------------------------------------------------------
    */

    public function viewFinancials(User $user): bool
    {
        return $user->can('dashboard.financials');
    }

    /*
    |--------------------------------------------------------------------------
    | View Maintenance
    |--------------------------------------------------------------------------
    */

    public function viewMaintenance(User $user): bool
    {
        return $user->can('dashboard.maintenance');
    }

    /*
    |--------------------------------------------------------------------------
    | View Reports
    |--------------------------------------------------------------------------
    */

    public function viewReports(User $user): bool
    {
        return $user->can('dashboard.reports');
    }

    /*
    |--------------------------------------------------------------------------
    | View Activity
    |--------------------------------------------------------------------------
    */

    public function viewActivity(User $user): bool
    {
        return $user->can('dashboard.activity');
    }
}