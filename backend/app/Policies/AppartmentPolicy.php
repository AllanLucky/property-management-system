<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Apartment;

class ApartmentPolicy
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
    | VIEW ANY APARTMENTS (LIST)
    |--------------------------------------------------------------------------
    */
    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('apartments.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW SINGLE APARTMENT
    |--------------------------------------------------------------------------
    */
    public function view(User $user, Apartment $apartment): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('apartments.view');
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE APARTMENT
    |--------------------------------------------------------------------------
    */
    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('apartments.create');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE APARTMENT
    |--------------------------------------------------------------------------
    */
    public function update(User $user, Apartment $apartment): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        /*
        | Optional ownership rule (if you want strict ownership)
        */
        if ($apartment->property && $apartment->property->owner_id === $user->id) {
            return $user->can('apartments.edit');
        }

        return $user->can('apartments.edit');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE APARTMENT
    |--------------------------------------------------------------------------
    */
    public function delete(User $user, Apartment $apartment): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        /*
        | Prevent deletion if apartment has units (SAFETY RULE)
        */
        if ($apartment->units()->exists()) {
            return false;
        }

        return $user->can('apartments.delete');
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE (SOFT DELETE)
    |--------------------------------------------------------------------------
    */
    public function restore(User $user, Apartment $apartment): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('apartments.delete');
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE (HARD DELETE)
    |--------------------------------------------------------------------------
    */
    public function forceDelete(User $user, Apartment $apartment): bool
    {
        return $this->isSuperAdmin($user);
    }
}