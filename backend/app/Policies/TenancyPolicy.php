<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Tenancy;

class TenancyPolicy
{
    /**
     * Determine if the user can view any tenancies.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view tenancies');
    }

    /**
     * Determine if the user can view a specific tenancy.
     */
    public function view(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('view tenancies')
            || $user->id === $tenancy->tenant?->user_id;
    }

    /**
     * Determine if the user can create tenancies.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create tenancies');
    }

    /**
     * Determine if the user can update a tenancy.
     */
    public function update(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('update tenancies')
            || $user->id === $tenancy->tenant?->user_id;
    }

    /**
     * Determine if the user can delete a tenancy.
     */
    public function delete(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('delete tenancies');
    }

    /**
     * Determine if the user can restore a tenancy.
     */
    public function restore(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('restore tenancies');
    }

    /**
     * Determine if the user can permanently delete a tenancy.
     */
    public function forceDelete(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('force delete tenancies');
    }

    /**
     * Determine if the user can activate a tenancy.
     */
    public function activate(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('activate tenancies');
    }

    /**
     * Determine if the user can deactivate a tenancy.
     */
    public function deactivate(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('deactivate tenancies');
    }

    /**
     * Determine if the user can terminate a tenancy.
     */
    public function terminate(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('terminate tenancies');
    }

    /**
     * Determine if the user can cancel a tenancy.
     */
    public function cancel(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('cancel tenancies');
    }

    /**
     * Determine if the user can renew a tenancy.
     */
    public function renew(User $user, Tenancy $tenancy): bool
    {
        return $user->hasPermissionTo('renew tenancies');
    }

    /**
     * Determine if the user can assign a unit to a tenant.
     */
    public function assignUnit(User $user): bool
    {
        return $user->hasPermissionTo('assign units');
    }
}
