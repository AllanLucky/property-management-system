<?php

namespace App\Services\User;

use App\Models\User;

class UserStatusMessageService
{
    /**
     * APPROVAL STATUS MESSAGE
     */
    public function approvalMessage(User $user): string
    {
        return match ($user->approval_status) {

            User::APPROVAL_PENDING =>
                'Your account is pending approval. Please wait for an administrator to review your account.',

            User::APPROVAL_REJECTED =>
                'Your account request was rejected. Please contact support for more information.',

            User::APPROVAL_APPROVED =>
                'Your account has been approved.',

            default =>
                'Unknown approval status.',
        };
    }

    /**
     * ACCOUNT STATUS MESSAGE
     */
    public function accountMessage(User $user): string
    {
        return match ($user->account_status) {

            User::STATUS_ACTIVE =>
                'Your account is active.',

            User::STATUS_INACTIVE =>
                'Your account is inactive. Please contact your administrator.',

            User::STATUS_SUSPENDED =>
                'Your account has been suspended. Please contact support.',

            User::STATUS_BANNED =>
                'Your account has been permanently restricted. Please contact the system administrator.',

            default =>
                'Unknown account status.',
        };
    }

    /**
     * LOGIN BLOCK MESSAGE (HIGH LEVEL DECISION MESSAGE)
     */
    public function loginMessage(User $user): string
    {
        if (!$user->canLogin()) {
            return match (true) {

                $user->approval_status === User::APPROVAL_PENDING =>
                    'Your account is pending approval. Please wait for administrator verification.',

                $user->approval_status === User::APPROVAL_REJECTED =>
                    'Your account request was rejected. Please contact support.',

                $user->account_status === User::STATUS_SUSPENDED =>
                    'Your account is suspended. Contact support to restore access.',

                $user->account_status === User::STATUS_BANNED =>
                    'Your account has been banned. Contact system administrator.',

                $user->account_status === User::STATUS_INACTIVE =>
                    'Your account is inactive.',

                default =>
                    'You are not allowed to login.',
            };
        }

        return 'Login allowed.';
    }

    /**
     * STATUS LABEL (FOR UI BADGES)
     */
    public function statusLabel(User $user): string
    {
        return match (true) {

            $user->account_status === User::STATUS_BANNED =>
                'Banned',

            $user->account_status === User::STATUS_SUSPENDED =>
                'Suspended',

            $user->account_status === User::STATUS_INACTIVE =>
                'Inactive',

            $user->approval_status === User::APPROVAL_PENDING =>
                'Pending Approval',

            $user->approval_status === User::APPROVAL_REJECTED =>
                'Rejected',

            $user->approval_status === User::APPROVAL_APPROVED
            && $user->account_status === User::STATUS_ACTIVE =>
                'Active',

            default =>
                'Unknown',
        };
    }

    /**
     * CAN LOGIN CHECK MESSAGE BOOLEAN WRAPPER
     */
    public function canLoginMessage(User $user): array
    {
        return [
            'can_login' => $user->canLogin(),
            'message' => $this->loginMessage($user),
        ];
    }
}