<?php

namespace App\Repositories\Eloquent;

use App\Models\RoleRequest;
use App\Repositories\Interfaces\RoleRequestRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class RoleRequestRepository implements RoleRequestRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASE QUERIES
    |--------------------------------------------------------------------------
    */

    public function all(): Collection
    {
        return RoleRequest::with(['user', 'reviewer'])
            ->latest()
            ->get();
    }

    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return RoleRequest::with(['user', 'reviewer'])
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): ?RoleRequest
    {
        return RoleRequest::find($id);
    }

    public function findWithRelations(int $id): ?RoleRequest
    {
        return RoleRequest::with(['user', 'reviewer'])->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    public function create(array $data): RoleRequest
    {
        return RoleRequest::create($data);
    }

    public function update(int $id, array $data): bool
    {
        $roleRequest = RoleRequest::find($id);

        if (!$roleRequest) {
            return false;
        }

        return $roleRequest->update($data);
    }

    public function delete(int $id): bool
    {
        $roleRequest = RoleRequest::find($id);

        if (!$roleRequest) {
            return false;
        }

        return $roleRequest->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | USER-SPECIFIC QUERIES
    |--------------------------------------------------------------------------
    */

    public function forUser(int $userId): Collection
    {
        return RoleRequest::with(['user', 'reviewer'])
            ->where('user_id', $userId)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS QUERIES
    |--------------------------------------------------------------------------
    */

    public function pending(): Collection
    {
        return RoleRequest::with(['user', 'reviewer'])
            ->where('status', RoleRequest::STATUS_PENDING)
            ->latest()
            ->get();
    }

    public function approved(): Collection
    {
        return RoleRequest::with(['user', 'reviewer'])
            ->where('status', RoleRequest::STATUS_APPROVED)
            ->latest()
            ->get();
    }

    public function rejected(): Collection
    {
        return RoleRequest::with(['user', 'reviewer'])
            ->where('status', RoleRequest::STATUS_REJECTED)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | 🔥 FIX: MISSING METHOD (THIS FIXES YOUR 500 ERROR)
    |--------------------------------------------------------------------------
    */

    public function findPendingByUser(int $userId): ?RoleRequest
    {
        return RoleRequest::with(['user', 'reviewer'])
            ->where('user_id', $userId)
            ->where('status', RoleRequest::STATUS_PENDING)
            ->latest()
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | OPTIONAL: GENERIC STATUS CHECK
    |--------------------------------------------------------------------------
    */

    public function findByUserAndStatus(int $userId, string $status): ?RoleRequest
    {
        return RoleRequest::with(['user', 'reviewer'])
            ->where('user_id', $userId)
            ->where('status', $status)
            ->latest()
            ->first();
    }
}