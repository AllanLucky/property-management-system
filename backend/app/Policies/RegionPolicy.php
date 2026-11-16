<?php

namespace App\Policies;

use App\Models\City;
use App\Models\User;

class CityPolicy
{
    /**
     * Determine whether the user can perform any action.
     *
     * Super-admin bypasses all policy checks.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->hasRole('super-admin')) {
            return true;
        }

        return null;
    }

    /**
     * Determine whether the user can view any cities.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('cities.view');
    }

    /**
     * Determine whether the user can view a city.
     */
    public function view(User $user, City $city): bool
    {
        return $user->can('cities.view');
    }

    /**
     * Determine whether the user can create cities.
     */
    public function create(User $user): bool
    {
        return $user->can('cities.create');
    }

    /**
     * Determine whether the user can update a city.
     */
    public function update(User $user, City $city): bool
    {
        return $user->can('cities.update');
    }

    /**
     * Determine whether the user can delete a city.
     */
    public function delete(User $user, City $city): bool
    {
        return $user->can('cities.delete');
    }

    /**
     * Determine whether the user can restore a deleted city.
     */
    public function restore(User $user, City $city): bool
    {
        return $user->can('cities.restore');
    }

    /**
     * Determine whether the user can permanently delete a city.
     */
    public function forceDelete(User $user, City $city): bool
    {
        return $user->can('cities.force-delete');
    }

    /**
     * Determine whether the user can activate a city.
     */
    public function activate(User $user, City $city): bool
    {
        return $user->can('cities.activate');
    }

    /**
     * Determine whether the user can deactivate a city.
     */
    public function deactivate(User $user, City $city): bool
    {
        return $user->can('cities.deactivate');
    }

    /**
     * Determine whether the user can toggle city status.
     */
    public function toggleStatus(User $user, City $city): bool
    {
        return $user->can('cities.update');
    }

    /**
     * Determine whether the user can view city statistics.
     */
    public function viewStatistics(User $user): bool
    {
        return $user->can('cities.view');
    }

    /**
     * Determine whether the user can view city reports.
     */
    public function viewReports(User $user): bool
    {
        return $user->can('cities.view');
    }

    /**
     * Determine whether the user can view trashed cities.
     */
    public function viewTrashed(User $user): bool
    {
        return $user->can('cities.restore')
            || $user->can('cities.force-delete');
    }

    /**
     * Determine whether the user can check city records.
     */
    public function checkExists(User $user): bool
    {
        return $user->can('cities.view');
    }
}
