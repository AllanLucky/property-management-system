<?php

namespace App\Repositories\Eloquent;

use App\Models\ActivityLog;
use App\Repositories\Interfaces\ActivityLogRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class ActivityLogRepository implements ActivityLogRepositoryInterface
{
    /*
    |-----------------------------------------
    | BASE METHODS
    |-----------------------------------------
    */
    public function all(): Collection
    {
        return ActivityLog::with('user')
            ->latest()
            ->get();
    }

    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return ActivityLog::with('user')
            ->latest()
            ->paginate($perPage);
    }

    public function find(int $id): ?ActivityLog
    {
        return ActivityLog::with('user')->find($id);
    }

    public function create(array $data): ActivityLog
    {
        return ActivityLog::create($data);
    }

    public function delete(int $id): bool
    {
        $log = ActivityLog::find($id);

        if (!$log) {
            return false;
        }

        return $log->delete();
    }

    /*
    |-----------------------------------------
    | USER FILTER
    |-----------------------------------------
    */
    public function forUser(int $userId): Collection
    {
        return ActivityLog::with('user')
            ->where('user_id', $userId)
            ->latest()
            ->get();
    }

    /*
    |-----------------------------------------
    | ADVANCED FILTERING (ADMIN DASHBOARD)
    |-----------------------------------------
    */
    public function filter(array $filters, int $perPage = 20): LengthAwarePaginator
    {
        return ActivityLog::with('user')
            ->when($filters['user_id'] ?? null, fn($q, $userId) =>
                $q->where('user_id', $userId)
            )
            ->when($filters['action'] ?? null, fn($q, $action) =>
                $q->where('action', $action)
            )
            ->when($filters['type'] ?? null, fn($q, $type) =>
                $q->where('type', $type)
            )
            ->when($filters['from'] ?? null, fn($q, $from) =>
                $q->whereDate('created_at', '>=', $from)
            )
            ->when($filters['to'] ?? null, fn($q, $to) =>
                $q->whereDate('created_at', '<=', $to)
            )
            ->latest()
            ->paginate($perPage);
    }
}