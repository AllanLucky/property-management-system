<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Country;

class CountryPolicy
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
    | VIEW ANY COUNTRIES
    |--------------------------------------------------------------------------
    */
    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('countries.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW SINGLE COUNTRY
    |--------------------------------------------------------------------------
    */
    public function view(User $user, Country $country): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('countries.view');
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTRY
    |--------------------------------------------------------------------------
    */
    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('countries.create');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTRY
    |--------------------------------------------------------------------------
    */
    public function update(User $user, Country $country): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('countries.update');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE COUNTRY
    |--------------------------------------------------------------------------
    */
    public function delete(User $user, Country $country): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        /*
        |--------------------------------------------------------------------------
        | SAFETY RULE
        |--------------------------------------------------------------------------
        | Prevent deletion of countries that still have associated locations
        | or properties. This protects geographical relationships.
        */

        if (
            $country->regions()->exists() ||
            $country->counties()->exists() ||
            $country->cities()->exists() ||
            $country->areas()->exists() ||
            $country->properties()->exists()
        ) {
            return false;
        }

        return $user->can('countries.delete');
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE COUNTRY
    |--------------------------------------------------------------------------
    */
    public function activate(User $user, Country $country): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('countries.activate');
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE COUNTRY
    |--------------------------------------------------------------------------
    */
    public function deactivate(User $user, Country $country): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('countries.deactivate');
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTRY STATISTICS
    |--------------------------------------------------------------------------
    */
    public function statistics(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('countries.view');
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTRY REPORTS
    |--------------------------------------------------------------------------
    */
    public function reports(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('countries.reports');
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE COUNTRY
    |--------------------------------------------------------------------------
    */
    public function restore(User $user, Country $country): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('countries.restore');
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE COUNTRY
    |--------------------------------------------------------------------------
    */
    public function forceDelete(User $user, Country $country): bool
    {
        return $this->isSuperAdmin($user);
    }
}
