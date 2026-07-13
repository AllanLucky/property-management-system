<?php

namespace App\Policies;

use App\Models\User;
use App\Models\PropertyFeature;

class PropertyFeaurePolicy
{
    /**
     * -------------------------------------------------------------------------
     * BEFORE
     * -------------------------------------------------------------------------
     */

    public function before(
        User $user,
        string $ability
    ): ?bool {

        /*
        |--------------------------------------------------------------------------
        | SUPER ADMIN BYPASS
        |--------------------------------------------------------------------------
        */

        if (
            method_exists($user, 'hasRole') &&
            $user->hasRole('super-admin')
        ) {
            return true;
        }

        return null;
    }

    /**
     * -------------------------------------------------------------------------
     * VIEW ANY
     * -------------------------------------------------------------------------
     */

    public function viewAny(User $user): bool
    {
        return
            $user->can('properties.view') ||
            $user->can('properties.manage');
    }

    /**
     * -------------------------------------------------------------------------
     * VIEW
     * -------------------------------------------------------------------------
     */

    public function view(
        User $user,
        PropertyFeature $propertyFeature
    ): bool {

        return
            $user->can('properties.view') ||
            $user->can('properties.manage');
    }

    /**
     * -------------------------------------------------------------------------
     * CREATE
     * -------------------------------------------------------------------------
     */

    public function create(User $user): bool
    {
        return
            $user->can('properties.create') ||
            $user->can('properties.manage');
    }

    /**
     * -------------------------------------------------------------------------
     * UPDATE
     * -------------------------------------------------------------------------
     */

    public function update(
        User $user,
        PropertyFeature $propertyFeature
    ): bool {

        return
            $user->can('properties.edit') ||
            $user->can('properties.manage');
    }

    /**
     * -------------------------------------------------------------------------
     * DELETE
     * -------------------------------------------------------------------------
     */

    public function delete(
        User $user,
        PropertyFeature $propertyFeature
    ): bool {

        return
            $user->can('properties.delete') ||
            $user->can('properties.manage');
    }

    /**
     * -------------------------------------------------------------------------
     * RESTORE
     * -------------------------------------------------------------------------
     */

    public function restore(
        User $user,
        PropertyFeature $propertyFeature
    ): bool {

        return
            $user->can('properties.edit') ||
            $user->can('properties.manage');
    }

    /**
     * -------------------------------------------------------------------------
     * FORCE DELETE
     * -------------------------------------------------------------------------
     */

    public function forceDelete(
        User $user,
        PropertyFeature $propertyFeature
    ): bool {

        return
            $user->can('properties.delete') ||
            $user->can('properties.manage');
    }

    /**
     * -------------------------------------------------------------------------
     * TOGGLE STATUS
     * -------------------------------------------------------------------------
     */

    public function toggleStatus(
        User $user,
        PropertyFeature $propertyFeature
    ): bool {

        return
            $user->can('properties.edit') ||
            $user->can('properties.manage');
    }

    /**
     * -------------------------------------------------------------------------
     * HIGHLIGHT FEATURE
     * -------------------------------------------------------------------------
     */

    public function highlight(
        User $user,
        PropertyFeature $propertyFeature
    ): bool {

        return
            $user->can('properties.edit') ||
            $user->can('properties.manage');
    }
}