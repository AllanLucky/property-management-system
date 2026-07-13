<?php

namespace App\Policies;

use App\Models\User;
use App\Models\PropertyType;

class PropertyTypePolicy
{
    /**
     * SUPER ADMIN OVERRIDE (optional but recommended)
     */
    protected function isSuperAdmin(User $user): bool
    {
        return $user->role === 'superadmin';
    }

    /**
     * VIEW ANY PROPERTY TYPES
     */
    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('property_type.view');
    }

    /**
     * VIEW SINGLE PROPERTY TYPE
     */
    public function view(User $user, PropertyType $propertyType): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('property_type.view');
    }

    /**
     * CREATE PROPERTY TYPE
     */
    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('property_type.create');
    }

    /**
     * UPDATE PROPERTY TYPE
     */
    public function update(User $user, PropertyType $propertyType): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('property_type.update');
    }

    /**
     * DELETE PROPERTY TYPE
     */
    public function delete(User $user, PropertyType $propertyType): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('property_type.delete');
    }

    /**
     * RESTORE (SOFT DELETE)
     */
    public function restore(User $user, PropertyType $propertyType): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('property_type.restore');
    }

    /**
     * FORCE DELETE (HARD DELETE)
     */
    public function forceDelete(User $user, PropertyType $propertyType): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('property_type.force_delete');
    }
}