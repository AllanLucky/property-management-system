<?php

namespace App\Policies;

use App\Models\Lease;
use App\Models\User;

class LeasePolicy
{
    /**
     * Determine whether the user can view any leases.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'agent',
            'lease-manager',
            'property-manager',
            'landlord',
            'accountant',
            'auditor',
            'tenant',
        ]);
    }

    /**
     * Determine whether the user can view a lease.
     */
    public function view(User $user, Lease $lease): bool
    {
        /*
         * Management roles can view leases.
         */
        if ($user->hasAnyRole([
            'super-admin',
            'admin',
            'agent',
            'lease-manager',
            'property-manager',
            'accountant',
            'auditor',
        ])) {
            return true;
        }

        /*
         * Tenant and landlord access should be relationship-based.
         *
         * This prevents a tenant or landlord from viewing another
         * tenant's lease.
         */
        if ($user->hasRole('tenant')) {
            return $this->isTenantLeaseOwner($user, $lease);
        }

        if ($user->hasRole('landlord')) {
            return $this->isLandlordLeaseOwner($user, $lease);
        }

        return false;
    }

    /**
     * Determine whether the user can create leases.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
            'property-manager',
        ]);
    }

    /**
     * Determine whether the user can update a lease.
     */
    public function update(User $user, Lease $lease): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
            'property-manager',
        ]);
    }

    /**
     * Determine whether the user can delete a lease.
     */
    public function delete(User $user, Lease $lease): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
        ]);
    }

    /**
     * Determine whether the user can restore a soft-deleted lease.
     */
    public function restore(User $user, Lease $lease): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
        ]);
    }

    /**
     * Determine whether the user can permanently delete a lease.
     */
    public function forceDelete(User $user, Lease $lease): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine whether the user can activate a lease.
     */
    public function activate(User $user, Lease $lease): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
        ]);
    }

    /**
     * Determine whether the user can set a lease to pending.
     */
    public function setPending(User $user, Lease $lease): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
        ]);
    }

    /**
     * Determine whether the user can set a lease to draft.
     */
    public function setDraft(User $user, Lease $lease): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
        ]);
    }

    /**
     * Determine whether the user can expire a lease.
     */
    public function expire(User $user, Lease $lease): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
        ]);
    }

    /**
     * Determine whether the user can terminate a lease.
     */
    public function terminate(User $user, Lease $lease): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
        ]);
    }

    /**
     * Determine whether the user can cancel a lease.
     */
    public function cancel(User $user, Lease $lease): bool
    {
        return $user->hasAnyRole([
            'super-admin',
            'admin',
            'lease-manager',
        ]);
    }

    /**
     * Determine whether the lease belongs to the authenticated tenant.
     */
    protected function isTenantLeaseOwner(User $user, Lease $lease): bool
    {
        return $lease->tenancy?->tenant?->user_id === $user->id;
    }

    /**
     * Determine whether the lease belongs to one of the landlord's properties.
     *
     * This method should be connected to your actual landlord/property
     * relationship once the landlord architecture is finalized.
     */
    protected function isLandlordLeaseOwner(User $user, Lease $lease): bool
    {
        return false;
    }
}