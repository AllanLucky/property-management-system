<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Region;

class RegionPolicy
{
    /*
    |--------------------------------------------------------------------------
    | SUPER ADMIN BYPASS
    |--------------------------------------------------------------------------
    */

    protected function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW ANY REGIONS
    |--------------------------------------------------------------------------
    */

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW REGION
    |--------------------------------------------------------------------------
    */

    public function view(User $user, Region $region): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.view');
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE REGION
    |--------------------------------------------------------------------------
    */

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.create');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE REGION
    |--------------------------------------------------------------------------
    */

    public function update(User $user, Region $region): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.update');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE REGION
    |--------------------------------------------------------------------------
    */

    public function delete(User $user, Region $region): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        if (!$user->can('regions.delete')) {
            return false;
        }

        // Prevent deletion when region has dependent records.
        return !$region->hasDependencies();
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE REGION
    |--------------------------------------------------------------------------
    */

    public function activate(User $user, Region $region): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.activate');
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE REGION
    |--------------------------------------------------------------------------
    */

    public function deactivate(User $user, Region $region): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.deactivate');
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE REGION STATUS
    |--------------------------------------------------------------------------
    */

    public function toggleStatus(User $user, Region $region): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.update');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW REGION STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW REGION REPORTS
    |--------------------------------------------------------------------------
    */

    public function reports(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.reports');
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE REGION
    |--------------------------------------------------------------------------
    */

    public function restore(User $user, Region $region): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('regions.restore');
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE REGION
    |--------------------------------------------------------------------------
    */

    public function forceDelete(User $user, Region $region): bool
    {
        // Permanent deletion is restricted to super-admin.
        return $this->isSuperAdmin($user);
    }
}
