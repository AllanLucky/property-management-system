<?php

namespace App\Policies;

use App\Models\User;
use App\Models\MaintenanceRequest;

class MaintenanceRequestPolicy
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
    | VIEW ANY MAINTENANCE REQUESTS
    |--------------------------------------------------------------------------
    */

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW MAINTENANCE REQUEST
    |--------------------------------------------------------------------------
    */

    public function view(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.view');
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE MAINTENANCE REQUEST
    |--------------------------------------------------------------------------
    */

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.create');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE MAINTENANCE REQUEST
    |--------------------------------------------------------------------------
    */

    public function update(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.update');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE MAINTENANCE REQUEST
    |--------------------------------------------------------------------------
    */

    public function delete(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        if (!$user->can('maintenance-requests.delete')) {
            return false;
        }

        // Prevent deletion of requests that are already being handled.
        return !in_array($maintenanceRequest->status, [
            'assigned',
            'in_progress',
            'on_hold',
        ], true);
    }

    /*
    |--------------------------------------------------------------------------
    | APPROVE MAINTENANCE REQUEST
    |--------------------------------------------------------------------------
    */

    public function approve(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.approve');
    }

    /*
    |--------------------------------------------------------------------------
    | REJECT MAINTENANCE REQUEST
    |--------------------------------------------------------------------------
    */

    public function reject(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.reject');
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN MAINTENANCE REQUEST
    |--------------------------------------------------------------------------
    */

    public function assign(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.assign');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE MAINTENANCE REQUEST STATUS
    |--------------------------------------------------------------------------
    */

    public function updateStatus(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.update-status');
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL MAINTENANCE REQUEST
    |--------------------------------------------------------------------------
    */

    public function cancel(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.cancel');
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE MAINTENANCE REQUEST
    |--------------------------------------------------------------------------
    */

    public function complete(User $user, MaintenanceRequest $maintenanceRequest): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.complete');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW MAINTENANCE REQUEST STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW MAINTENANCE REQUEST REPORTS
    |--------------------------------------------------------------------------
    */

    public function reports(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('maintenance-requests.reports');
    }
}
