<?php

namespace App\Policies;

use App\Models\User;
use App\Models\County;

class CountyPolicy
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
    | VIEW ANY COUNTIES
    |--------------------------------------------------------------------------
    */

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW COUNTY
    |--------------------------------------------------------------------------
    */

    public function view(User $user, County $county): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.view');
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.create');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function update(User $user, County $county): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.update');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE COUNTY
    |--------------------------------------------------------------------------
    */

    public function delete(User $user, County $county): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        if (!$user->can('counties.delete')) {
            return false;
        }

        // Prevent deletion when county has dependent records.
        return !$county->hasDependencies();
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function activate(User $user, County $county): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.activate');
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function deactivate(User $user, County $county): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.deactivate');
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE COUNTY STATUS
    |--------------------------------------------------------------------------
    */

    public function toggleStatus(User $user, County $county): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.update');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW COUNTY STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW COUNTY REPORTS
    |--------------------------------------------------------------------------
    */

    public function reports(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.reports');
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE COUNTY
    |--------------------------------------------------------------------------
    */

    public function restore(User $user, County $county): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('counties.restore');
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE COUNTY
    |--------------------------------------------------------------------------
    */

    public function forceDelete(User $user, County $county): bool
    {
        // Permanent deletion is restricted to super-admin.
        return $this->isSuperAdmin($user);
    }
}
