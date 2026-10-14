<?php

namespace App\Policies;

use App\Models\PlotSale;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class PlotSalesPolicy
{
    use HandlesAuthorization;

    /**
     * Allow super-admins to bypass all policy checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('super-admin', 'web')) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view any plot sales.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('plot_sales.view');
    }

    /**
     * Determine whether the user can view a specific plot sale.
     */
    public function view(User $user, PlotSale $plotSale): bool
    {
        return $user->can('plot_sales.view');
    }

    /**
     * Determine whether the user can create plot sales.
     */
    public function create(User $user): bool
    {
        return $user->can('plot_sales.create');
    }

    /**
     * Determine whether the user can update a plot sale.
     */
    public function update(User $user, PlotSale $plotSale): bool
    {
        return $user->can('plot_sales.update');
    }

    /**
     * Determine whether the user can delete a plot sale.
     */
    public function delete(User $user, PlotSale $plotSale): bool
    {
        return $user->can('plot_sales.delete');
    }

    /**
     * Determine whether the user can restore a soft-deleted plot sale.
     */
    public function restore(User $user, PlotSale $plotSale): bool
    {
        return $user->can('plot_sales.restore');
    }

    /**
     * Determine whether the user can permanently delete a plot sale.
     */
    public function forceDelete(User $user, PlotSale $plotSale): bool
    {
        return $user->can('plot_sales.force_delete');
    }

    /**
     * Determine whether the user can approve a plot sale.
     */
    public function approve(User $user, PlotSale $plotSale): bool
    {
        return $user->can('plot_sales.approve');
    }

    /**
     * Determine whether the user can cancel a plot sale.
     */
    public function cancel(User $user, PlotSale $plotSale): bool
    {
        return $user->can('plot_sales.cancel');
    }

    /**
     * Determine whether the user can complete a plot sale.
     */
    public function complete(User $user, PlotSale $plotSale): bool
    {
        return $user->can('plot_sales.complete');
    }

    /**
     * Determine whether the user can manage plot sale payments.
     */
    public function managePayments(User $user, PlotSale $plotSale): bool
    {
        return $user->can('plot_sales.manage_payments');
    }

    /**
     * Determine whether the user can view plot sales reports.
     */
    public function viewReports(User $user): bool
    {
        return $user->can('plot_sales.reports.view');
    }

    /**
     * Determine whether the user can export plot sales reports.
     */
    public function exportReports(User $user): bool
    {
        return $user->can('plot_sales.reports.export');
    }
}