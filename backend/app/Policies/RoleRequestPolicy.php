<?php

namespace App\Policies;

use App\Models\User;
use App\Models\RoleRequest;

class RoleRequestPolicy
{
    /**
     * Any authenticated user can create a role request
     */
    public function create(User $user): bool
    {
        return $user !== null;
    }

    /**
     * Admins can view all role requests
     * Users can view their own via view()
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super-admin']);
    }

    /**
     * User can view their own request
     * Admin & super-admin can view all
     */
    public function view(User $user, RoleRequest $roleRequest): bool
    {
        return $user->id === $roleRequest->user_id
            || $user->hasAnyRole(['admin', 'super-admin']);
    }

    /**
     * Only admin & super-admin can process updates (approve/reject)
     */
    public function update(User $user, RoleRequest $roleRequest): bool
    {
        return $user->hasAnyRole(['admin', 'super-admin']);
    }

    /**
     * Only super-admin can delete role requests
     */
    public function delete(User $user, RoleRequest $roleRequest): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Explicit action: approve
     */
    public function approve(User $user, RoleRequest $roleRequest): bool
    {
        return $user->hasAnyRole(['admin', 'super-admin']);
    }

    /**
     * Explicit action: reject
     */
    public function reject(User $user, RoleRequest $roleRequest): bool
    {
        return $user->hasAnyRole(['admin', 'super-admin']);
    }
}