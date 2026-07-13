<?php

namespace App\Policies;

use App\Models\User;
use App\Models\PropertyCategory;

class PropertyCategoryPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, PropertyCategory $propertyCategory): bool
    {
        return $user->hasPermissionTo('view property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(
        User $user,
        PropertyCategory $propertyCategory
    ): bool {
        return $user->hasPermissionTo('edit property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(
        User $user,
        PropertyCategory $propertyCategory
    ): bool {
        return $user->hasPermissionTo('delete property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(
        User $user,
        PropertyCategory $propertyCategory
    ): bool {
        return $user->hasPermissionTo('restore property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(
        User $user,
        PropertyCategory $propertyCategory
    ): bool {
        return $user->hasPermissionTo('force delete property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can view trashed models.
     */
    public function viewTrash(User $user): bool
    {
        return $user->hasPermissionTo('view trashed property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can bulk delete.
     */
    public function bulkDelete(User $user): bool
    {
        return $user->hasPermissionTo('bulk delete property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can toggle featured status.
     */
    public function feature(
        User $user,
        PropertyCategory $propertyCategory
    ): bool {
        return $user->hasPermissionTo('feature property categories')
            || $user->hasRole('SuperAdmin');
    }

    /**
     * Determine whether the user can change status.
     */
    public function changeStatus(
        User $user,
        PropertyCategory $propertyCategory
    ): bool {
        return $user->hasPermissionTo('change property category status')
            || $user->hasRole('SuperAdmin');
    }
}