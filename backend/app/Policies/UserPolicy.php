<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine whether the user can view any users (list users).
     */
    public function viewAny(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasPermissionTo('view users');
    }

    /**
     * Determine whether the user can view a specific user.
     */
    public function view(User $user, User $model): bool
    {
        return $user->id === $model->id
            || $user->hasRole('admin')
            || $user->hasPermissionTo('view users');
    }

    /**
     * Determine whether the user can create users.
     */
    public function create(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasPermissionTo('create users');
    }

    /**
     * Determine whether the user can update a user.
     */
    public function update(User $user, User $model): bool
    {
        return $user->id === $model->id
            || $user->hasRole('admin')
            || $user->hasPermissionTo('edit users');
    }

    /**
     * Determine whether the user can delete a user.
     */
    public function delete(User $user, User $model): bool
    {
        return $user->hasRole('admin')
            || $user->hasPermissionTo('delete users');
    }

    /**
     * Prevent users from deleting themselves (optional safety rule)
     */
    public function forceDelete(User $user, User $model): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Determine whether user can assign roles
     */
    public function assignRole(User $user): bool
    {
        return $user->hasRole('admin') || $user->hasPermissionTo('assign roles');
    }
}