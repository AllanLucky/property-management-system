<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Booking;

class BookingPolicy
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
    | VIEW ANY BOOKINGS
    |--------------------------------------------------------------------------
    */
    public function viewAny(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.view');
    }

    /*
    |--------------------------------------------------------------------------
    | VIEW SINGLE BOOKING
    |--------------------------------------------------------------------------
    */
    public function view(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.view');
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE BOOKING
    |--------------------------------------------------------------------------
    */
    public function create(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.create');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE BOOKING
    |--------------------------------------------------------------------------
    */
    public function update(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        /*
        | Optional ownership rule.
        |
        | Keep the permission check as the final authorization rule.
        */
        if ($booking->user_id === $user->id) {
            return $user->can('bookings.edit');
        }

        return $user->can('bookings.edit');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE BOOKING
    |--------------------------------------------------------------------------
    */
    public function delete(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        /*
        |----------------------------------------------------------------------
        | SAFETY RULE
        |----------------------------------------------------------------------
        | Do not delete bookings that have already entered an operational state.
        */
        if (
            $booking->isConfirmed() ||
            $booking->isApproved() ||
            $booking->isCompleted()
        ) {
            return false;
        }

        return $user->can('bookings.delete');
    }

    /*
    |--------------------------------------------------------------------------
    | CONFIRM BOOKING
    |--------------------------------------------------------------------------
    */
    public function confirm(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.confirm');
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK-IN BOOKING
    |--------------------------------------------------------------------------
    */
    public function checkIn(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.check-in');
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETE BOOKING
    |--------------------------------------------------------------------------
    */
    public function complete(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.complete');
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL BOOKING
    |--------------------------------------------------------------------------
    */
    public function cancel(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.cancel');
    }

    /*
    |--------------------------------------------------------------------------
    | REJECT BOOKING
    |--------------------------------------------------------------------------
    */
    public function reject(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.reject');
    }

    /*
    |--------------------------------------------------------------------------
    | EXPIRE BOOKING
    |--------------------------------------------------------------------------
    */
    public function expire(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.expire');
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING REPORTS
    |--------------------------------------------------------------------------
    */
    public function reports(User $user): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.reports');
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */
    public function restore(User $user, Booking $booking): bool
    {
        if ($this->isSuperAdmin($user)) {
            return true;
        }

        return $user->can('bookings.delete');
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */
    public function forceDelete(User $user, Booking $booking): bool
    {
        return $this->isSuperAdmin($user);
    }
}