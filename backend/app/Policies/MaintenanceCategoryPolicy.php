<?php

namespace App\Policies;

use App\Models\User;
use App\Models\MaintenanceCategory;

class MaintenanceCategoryPolicy
{
    /*
    |--------------------------------------------------------------------------
    | SUPER ADMIN BYPASS
    |--------------------------------------------------------------------------
    */

    protected function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('super-admin');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW ANY MAINTENANCE CATEGORIES
    |--------------------------------------------------------------------------
    */

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-categories.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW MAINTENANCE CATEGORY
    |--------------------------------------------------------------------------
    */

    public function view(
        User $user,
        MaintenanceCategory $maintenanceCategory
    ): bool {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-categories.view');
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE MAINTENANCE CATEGORY
    |--------------------------------------------------------------------------
    */

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-categories.create');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE MAINTENANCE CATEGORY
    |--------------------------------------------------------------------------
    */

    public function update(
        User $user,
        MaintenanceCategory $maintenanceCategory
    ): bool {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-categories.update');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE MAINTENANCE CATEGORY
    |--------------------------------------------------------------------------
    */

    public function delete(
        User $user,
        MaintenanceCategory $maintenanceCategory
    ): bool {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        if (!$user->can('maintenance-categories.delete')) {
            return false;
        }

        // Prevent deletion of categories that have maintenance requests.
        return !$maintenanceCategory->maintenanceRequests()->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE / DEACTIVATE MAINTENANCE CATEGORY
    |--------------------------------------------------------------------------
    */

    public function updateStatus(
        User $user,
        MaintenanceCategory $maintenanceCategory
    ): bool {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-categories.update');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW MAINTENANCE CATEGORY STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-categories.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW MAINTENANCE CATEGORY REPORTS
    |--------------------------------------------------------------------------
    */

    public function reports(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-categories.reports');
    }
}
