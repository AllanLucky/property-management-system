<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Amenity;

class AmenityPolicy
{
    /**
     * Determine whether the user can view any amenities.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission([
            'amenities.view',
            'amenities.manage',
        ]);
    }

    /**
     * Determine whether the user can view a specific amenity.
     */
    public function view(User $user, Amenity $amenity): bool
    {
        return $user->hasAnyPermission([
            'amenities.view',
            'amenities.manage',
        ]);
    }

    /**
     * Determine whether the user can create amenities.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyPermission([
            'amenities.create',
            'amenities.manage',
        ]);
    }

    /**
     * Determine whether the user can update an amenity.
     */
    public function update(User $user, Amenity $amenity): bool
    {
        return $user->hasAnyPermission([
            'amenities.edit',
            'amenities.manage',
        ]);
    }

    /**
     * Determine whether the user can delete an amenity.
     */
    public function delete(User $user, Amenity $amenity): bool
    {
        return $user->hasAnyPermission([
            'amenities.delete',
            'amenities.manage',
        ]);
    }

    /**
     * Determine whether the user can restore an amenity.
     */
    public function restore(User $user, Amenity $amenity): bool
    {
        return $user->hasPermissionTo('amenities.manage');
    }

    /**
     * Determine whether the user can permanently delete an amenity.
     */
    public function forceDelete(User $user, Amenity $amenity): bool
    {
        return $user->hasPermissionTo('amenities.manage');
    }
}