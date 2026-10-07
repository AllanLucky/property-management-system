<?php

namespace App\Policies;

use App\Models\Plot;
use App\Models\User;

class PlotPolicy
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
    | VIEW ANY PLOTS
    |--------------------------------------------------------------------------
    */

    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('plots.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW SINGLE PLOT
    |--------------------------------------------------------------------------
    */

    public function view(User $user, Plot $plot): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('plots.view');
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PLOT
    |--------------------------------------------------------------------------
    */

    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('plots.create');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PLOT
    |--------------------------------------------------------------------------
    */

    public function update(User $user, Plot $plot): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        /*
        |--------------------------------------------------------------------------
        | SOLD PLOT SAFETY
        |--------------------------------------------------------------------------
        |
        | A sold plot should not be freely edited unless the user has the
        | dedicated plot edit permission. The permission remains the final
        | authorization rule.
        |
        */

        return $user->can('plots.edit');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE PLOT
    |--------------------------------------------------------------------------
    */

    public function delete(User $user, Plot $plot): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        /*
        |--------------------------------------------------------------------------
        | SAFETY RULE
        |--------------------------------------------------------------------------
        |
        | Sold or reserved plots should not be deleted.
        |
        */

        if (
            $plot->isSold() ||
            $plot->isReserved()
        ) {
            return false;
        }

        return $user->can('plots.delete');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PLOT STATUS
    |--------------------------------------------------------------------------
    */

    public function updateStatus(User $user, Plot $plot): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('plots.status');
    }

    /*
    |--------------------------------------------------------------------------
    | RESERVE PLOT
    |--------------------------------------------------------------------------
    */

    public function reserve(User $user, Plot $plot): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        /*
        |--------------------------------------------------------------------------
        | SAFETY RULE
        |--------------------------------------------------------------------------
        |
        | Only available plots can be reserved.
        |
        */

        if (!$plot->isAvailable()) {
            return false;
        }

        return $user->can('plots.reserve');
    }

    /*
    |--------------------------------------------------------------------------
    | MARK PLOT AS SOLD
    |--------------------------------------------------------------------------
    */

    public function sell(User $user, Plot $plot): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        /*
        |--------------------------------------------------------------------------
        | SAFETY RULE
        |--------------------------------------------------------------------------
        |
        | A plot that is already sold should not be sold again.
        |
        */

        if ($plot->isSold()) {
            return false;
        }

        return $user->can('plots.sell');
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK PLOT AVAILABILITY
    |--------------------------------------------------------------------------
    */

    public function availability(User $user, Plot $plot): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('plots.view');
    }

    /*
    |--------------------------------------------------------------------------
    | PLOT REPORTS
    |--------------------------------------------------------------------------
    */

    public function reports(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('plots.reports');
    }

    /*
    |--------------------------------------------------------------------------
    | PLOT STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('plots.statistics');
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    public function restore(User $user, Plot $plot): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('plots.delete');
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    public function forceDelete(User $user, Plot $plot): bool
    {
        /*
        |--------------------------------------------------------------------------
        | SAFETY RULE
        |--------------------------------------------------------------------------
        |
        | Permanent deletion is restricted to super administrators.
        |
        */

        return $this->isSuperAdmin($user);
    }
}

