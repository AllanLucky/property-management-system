<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Unit;

class UnitPolicy
{
    /**
     * Super admin bypass
     */
    private function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW ANY UNITS
    |--------------------------------------------------------------------------
    */
    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('units.view')
            || $user->hasRole(['admin', 'agent', 'landlord']);
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW SINGLE UNIT
    |--------------------------------------------------------------------------
    */
    public function view(User $user, Unit $unit): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('units.view')
            || $unit->property?->owner_id === $user->id;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIT
    |--------------------------------------------------------------------------
    */
    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('units.create')
            || $user->hasRole(['admin', 'agent', 'landlord']);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE UNIT
    |--------------------------------------------------------------------------
    */
    public function update(User $user, Unit $unit): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('units.edit')
            || $unit->property?->owner_id === $user->id;
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */
    public function delete(User $user, Unit $unit): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('units.delete')
            || $unit->property?->owner_id === $user->id;
    }

    /*
    |--------------------------------------------------------------------------
    | MANAGE UNIT (ADMIN LEVEL CONTROL)
    |--------------------------------------------------------------------------
    */
    public function manage(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('units.manage')
            || $user->hasRole(['admin']);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN UNIT (ADMIN / PROPERTY OWNER)
    |--------------------------------------------------------------------------
    */
    public function assign(User $user, Unit $unit): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('units.assign')
            || $unit->property?->owner_id === $user->id;
    }

    /*
    |--------------------------------------------------------------------------
    | CHANGE STATUS (VACANT / OCCUPIED / MAINTENANCE)
    |--------------------------------------------------------------------------
    */
    public function changeStatus(User $user, Unit $unit): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('units.manage')
            || $unit->property?->owner_id === $user->id;
    }
}