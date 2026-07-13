<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Property;

class PropertyPolicy
{
    /**
     * Check if user is super admin
     */
    private function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * View all properties (listing page)
     */
    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('properties.view')
            || $user->hasPermissionTo('properties.manage')
            || $user->hasRole(['admin', 'agent', 'landlord']);
    }

    /**
     * View single property
     */
    public function view(User $user, Property $property): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('properties.view')
            || $user->hasPermissionTo('properties.manage')
            || $this->isOwner($user, $property);
    }

    /**
     * Create property
     */
    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('properties.create')
            || $user->hasPermissionTo('properties.manage')
            || $user->hasRole(['admin', 'agent', 'landlord']);
    }

    /**
     * Update property
     */
    public function update(User $user, Property $property): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('properties.edit')
            || $user->hasPermissionTo('properties.manage')
            || $this->isOwner($user, $property);
    }

    /**
     * Delete property
     */
    public function delete(User $user, Property $property): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('properties.delete')
            || $user->hasPermissionTo('properties.manage')
            || $this->isOwner($user, $property);
    }

    /**
     * Assign property to user (admin only)
     */
    public function assign(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->hasPermissionTo('properties.manage')
            || $user->hasPermissionTo('users.manage');
    }

    /**
     * OWNER CHECK (IMPORTANT FIX)
     * Uses user_id instead of owner_id
     */
    private function isOwner(User $user, Property $property): bool
    {
        return isset($property->user_id) && $property->user_id === $user->id;
    }
}