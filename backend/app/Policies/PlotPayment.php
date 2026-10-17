<?php

namespace App\Policies;

use App\Models\PlotPayment;
use App\Models\User;

class PlotPaymentPolicy
{
    /*
    |--------------------------------------------------------------------------
    | View Payments
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the user can view any plot payments.
     */
    public function viewAny(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.view');
    }

    /**
     * Determine whether the user can view a specific plot payment.
     */
    public function view(User $user, PlotPayment $plotPayment): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.view');
    }

    /*
    |--------------------------------------------------------------------------
    | Create Payments
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the user can create plot payments.
     */
    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.create');
    }

    /*
    |--------------------------------------------------------------------------
    | Update Payments
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the user can update a plot payment.
     */
    public function update(User $user, PlotPayment $plotPayment): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.update');
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Payments
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the user can delete a plot payment.
     */
    public function delete(User $user, PlotPayment $plotPayment): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.delete');
    }

    /**
     * Determine whether the user can restore a deleted plot payment.
     */
    public function restore(User $user, PlotPayment $plotPayment): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.restore');
    }

    /**
     * Determine whether the user can permanently delete a plot payment.
     */
    public function forceDelete(User $user, PlotPayment $plotPayment): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.force-delete');
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Status and Financial Operations
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the user can change a payment's status.
     */
    public function updateStatus(
        User $user,
        PlotPayment $plotPayment
    ): bool {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.update-status');
    }

    /**
     * Determine whether the user can process payment refunds.
     */
    public function refund(User $user, PlotPayment $plotPayment): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.refund');
    }

    /**
     * Determine whether the user can view payment reports.
     */
    public function viewReports(User $user): bool
    {
        return $this->isSuperAdmin($user)
            || $user->can('plot-payments.reports');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the user is a super administrator.
     */
    protected function isSuperAdmin(User $user): bool
    {
        return method_exists($user, 'hasRole')
            && $user->hasRole('super-admin');
    }
}
