<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ActivityLog;

class UserActivityPolicy
{
    /**
     * View any activity logs (admin dashboard)
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'super-admin']);
    }

    /**
     * View a specific activity log
     * - Admins can view all
     * - Users can only view their own logs
     */
    public function view(User $user, ActivityLog $activityLog): bool
    {
        return $user->hasAnyRole(['admin', 'super-admin'])
            || $activityLog->user_id === $user->id;
    }

    /**
     * Create activity logs (system/internal only)
     * Usually NOT used via controller — only services/system
     */
    public function create(User $user): bool
    {
        return $user !== null;
    }

    /**
     * Delete activity logs
     * Only super-admin can delete logs (audit safety rule)
     */
    public function delete(User $user, ActivityLog $activityLog): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Restore (if using soft deletes later)
     */
    public function restore(User $user, ActivityLog $activityLog): bool
    {
        return $user->hasRole('super-admin');
    }

    /**
     * Force delete (permanent removal)
     * Strictly super-admin only
     */
    public function forceDelete(User $user, ActivityLog $activityLog): bool
    {
        return $user->hasRole('super-admin');
    }
}