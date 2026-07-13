<?php

namespace App\Services;

use App\Models\RoleRequest;
use App\Models\User;
use App\Repositories\Interfaces\RoleRequestRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class RoleRequestService
{
    public function __construct(
        protected RoleRequestRepositoryInterface $repo,
        protected RBACService $rbacService,
        protected UserActivityService $userActivityService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | USER: CREATE ROLE REQUEST
    |--------------------------------------------------------------------------
    */
    public function createRequest(User $user, array $data): RoleRequest
    {
        return DB::transaction(function () use ($user, $data) {

            if (!$user?->id) {
                throw ValidationException::withMessages([
                    'role_request' => 'Invalid user account.',
                ]);
            }

            $requestedRole = strtolower(trim($data['requested_role']));

            if ($user->hasRole($requestedRole)) {
                throw ValidationException::withMessages([
                    'requested_role' => ['You already have this role assigned.'],
                ]);
            }

            $existing = $this->repo->findByUserAndStatus(
                $user->id,
                RoleRequest::STATUS_PENDING
            );

            if ($existing && $existing->requested_role === $requestedRole) {
                throw ValidationException::withMessages([
                    'requested_role' => ['You already have a pending request for this role.'],
                ]);
            }

            $roleRequest = $this->repo->create([
                'user_id' => $user->id,
                'requested_role' => $requestedRole,
                'reason' => $data['reason'] ?? null,
                'status' => RoleRequest::STATUS_PENDING,
                'timeline' => null,
            ]);

            /*
            |--------------------------------------
            | TIMELINE
            |--------------------------------------
            */
            $roleRequest->addTimelineEvent(
                'Request submitted',
                'created',
                $user->id
            );

            /*
            |--------------------------------------
            | ACTIVITY LOG
            |--------------------------------------
            */
            $this->userActivityService->logRoleRequest(
                $user,
                $requestedRole
            );

            return $roleRequest->fresh(['user', 'reviewer']);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN: APPROVE ROLE REQUEST
    |--------------------------------------------------------------------------
    */
    public function approve(RoleRequest $roleRequest, User $admin, ?string $notes = null): RoleRequest
    {
        return DB::transaction(function () use ($roleRequest, $admin, $notes) {

            $roleRequest->refresh();

            if (!$roleRequest->isPending()) {
                throw ValidationException::withMessages([
                    'role_request' => 'This request has already been processed.',
                ]);
            }

            $role = Role::where('guard_name', 'web')
                ->where('name', $roleRequest->requested_role)
                ->first();

            if (!$role) {
                throw ValidationException::withMessages([
                    'role_request' => 'Requested role does not exist.',
                ]);
            }

            /*
            |--------------------------------------
            | UPDATE REQUEST
            |--------------------------------------
            */
            $roleRequest->update([
                'status' => RoleRequest::STATUS_APPROVED,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'admin_notes' => $notes,
            ]);

            /*
            |--------------------------------------
            | ASSIGN ROLE
            |--------------------------------------
            */
            $user = $roleRequest->user;

            if ($user) {
                $this->rbacService->syncRoles($user, [$role->name]);

                $user->update([
                    'approval_status' => User::APPROVAL_APPROVED,
                    'account_status' => User::STATUS_ACTIVE,
                ]);
            }

            /*
            |--------------------------------------
            | TIMELINE EVENTS
            |--------------------------------------
            */
            $roleRequest->addTimelineEvent(
                "Approved by {$admin->name}",
                'approved',
                $admin->id
            );

            if ($notes) {
                $roleRequest->addTimelineEvent(
                    "Admin notes: {$notes}",
                    'note',
                    $admin->id
                );
            }

            $roleRequest->addTimelineEvent(
                "Role '{$role->name}' assigned to user",
                'system',
                $admin->id
            );

            /*
            |--------------------------------------
            | ACTIVITY LOG (FIXED)
            |--------------------------------------
            */
            $this->userActivityService->logApproval(
                $admin,
                "Role request approved: {$role->name}",
                [
                    'user_id' => $user?->id,
                    'role' => $role->name,
                ]
            );

            return $roleRequest->fresh(['user', 'reviewer']);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN: REJECT ROLE REQUEST
    |--------------------------------------------------------------------------
    */
    public function reject(RoleRequest $roleRequest, User $admin, ?string $notes = null): RoleRequest
    {
        return DB::transaction(function () use ($roleRequest, $admin, $notes) {

            if (!$roleRequest->isPending()) {
                throw ValidationException::withMessages([
                    'role_request' => 'This request has already been processed.',
                ]);
            }

            $roleRequest->update([
                'status' => RoleRequest::STATUS_REJECTED,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'admin_notes' => $notes,
            ]);

            /*
            |--------------------------------------
            | TIMELINE
            |--------------------------------------
            */
            $roleRequest->addTimelineEvent(
                "Rejected by {$admin->name}",
                'rejected',
                $admin->id
            );

            if ($notes) {
                $roleRequest->addTimelineEvent(
                    "Reason: {$notes}",
                    'note',
                    $admin->id
                );
            }

            /*
            |--------------------------------------
            | ACTIVITY LOG (FIXED)
            |--------------------------------------
            */
            $this->userActivityService->logRejection(
                $admin,
                "Role request rejected",
                [
                    'user_id' => $roleRequest->user_id,
                    'reason' => $notes,
                ]
            );

            return $roleRequest->fresh(['user', 'reviewer']);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | LISTING
    |--------------------------------------------------------------------------
    */
    public function getAllPaginated(int $perPage = 15)
    {
        return $this->repo->paginate($perPage);
    }

    public function getPending()
    {
        return $this->repo->pending();
    }

    public function getUserRequests(User $user)
    {
        return $this->repo->forUser($user->id);
    }

    public function delete(int $id): bool
    {
        return $this->repo->delete($id);
    }
}