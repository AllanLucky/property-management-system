<?php

namespace App\Services\Tenancy;

use App\Models\Tenancy;
use App\Helpers\ApiResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TenancyService
{
    protected array $relations = [
        'tenant.user',
        'property',
        'apartment',
        'unit',
    ];

    // -------------------------------
    // LIST / INDEX
    // -------------------------------
    public function getAll(array $filters = []): \Illuminate\Http\JsonResponse
    {
        $query = Tenancy::query()->with($this->relations);
        // apply filters...
        $perPage = $filters['per_page'] ?? 15;
        $paginator = $query->paginate($perPage);

        return ApiResponse::paginated($paginator, 'Tenancies fetched successfully');
    }

    public function all(array $filters = []): \Illuminate\Http\JsonResponse
    {
        $query = Tenancy::query()->with($this->relations);
        // apply filters...
        $collection = $query->latest()->get();

        return ApiResponse::collection($collection, 'Tenancies fetched successfully');
    }

    // -------------------------------
    // FIND
    // -------------------------------
    public function find(int|string $id): \Illuminate\Http\JsonResponse
    {
        try {
            $tenancy = Tenancy::query()->with($this->relations)->findOrFail($id);
            return ApiResponse::success($tenancy, 'Tenancy fetched successfully');
        } catch (\Exception $e) {
            return ApiResponse::notFound('Tenancy not found');
        }
    }

    public function findByNumber(string $number): \Illuminate\Http\JsonResponse
    {
        try {
            $tenancy = Tenancy::query()->with($this->relations)
                ->where('tenancy_number', $number)
                ->firstOrFail();
            return ApiResponse::success($tenancy, 'Tenancy fetched successfully');
        } catch (\Exception $e) {
            return ApiResponse::notFound('Tenancy not found');
        }
    }

    // -------------------------------
    // CREATE
    // -------------------------------
    public function create(array $data): \Illuminate\Http\JsonResponse
    {
        return DB::transaction(function () use ($data) {
            if (empty($data['tenant_id'])) {
                return ApiResponse::validation(['tenant_id' => 'Tenant is required']);
            }

            $exists = Tenancy::query()
                ->where('tenant_id', $data['tenant_id'])
                ->where('unit_id', $data['unit_id'] ?? null)
                ->active()
                ->exists();

            if ($exists) {
                return ApiResponse::conflict('Tenant already has an active tenancy for this unit');
            }

            $data['status'] = $data['status'] ?? Tenancy::STATUS_PENDING;
            $data['is_active'] = $data['is_active'] ?? true;

            $tenancy = Tenancy::create($data)->load($this->relations);
            return ApiResponse::created($tenancy, 'Tenancy created successfully');
        });
    }

    // -------------------------------
    // UPDATE
    // -------------------------------
    public function update(Tenancy $tenancy, array $data): \Illuminate\Http\JsonResponse
    {
        return DB::transaction(function () use ($tenancy, $data) {
            $tenancy->update($data);
            $tenancy->refresh()->load($this->relations);
            return ApiResponse::updated($tenancy, 'Tenancy updated successfully');
        });
    }

    // -------------------------------
    // DELETE / RESTORE / FORCE DELETE
    // -------------------------------
    public function delete(Tenancy $tenancy): \Illuminate\Http\JsonResponse
    {
        $tenancy->update(['is_active' => false]);
        $tenancy->delete();
        return ApiResponse::deleted(null, 'Tenancy deleted successfully');
    }

    public function restore(int|string $id): \Illuminate\Http\JsonResponse
    {
        $tenancy = Tenancy::withTrashed()->findOrFail($id);
        $tenancy->restore()->load($this->relations);
        return ApiResponse::success($tenancy, 'Tenancy restored successfully');
    }

    public function forceDelete(int|string $id): \Illuminate\Http\JsonResponse
    {
        $tenancy = Tenancy::withTrashed()->findOrFail($id);
        $tenancy->forceDelete();
        return ApiResponse::deleted(null, 'Tenancy permanently deleted');
    }

    // -------------------------------
    // LIFECYCLE METHODS
    // -------------------------------
    public function activate(Tenancy $tenancy): \Illuminate\Http\JsonResponse
    {
        $tenancy->update(['status' => Tenancy::STATUS_ACTIVE, 'is_active' => true]);
        return ApiResponse::success($tenancy->refresh()->load($this->relations), 'Tenancy activated');
    }

    public function deactivate(Tenancy $tenancy): \Illuminate\Http\JsonResponse
    {
        $tenancy->update(['is_active' => false]);
        return ApiResponse::success($tenancy->refresh()->load($this->relations), 'Tenancy deactivated');
    }

    public function expire(Tenancy $tenancy): \Illuminate\Http\JsonResponse
    {
        $tenancy->update(['status' => Tenancy::STATUS_EXPIRED, 'is_active' => false]);
        return ApiResponse::success($tenancy->refresh()->load($this->relations), 'Tenancy expired');
    }

    public function terminate(Tenancy $tenancy, ?string $notes = null): \Illuminate\Http\JsonResponse
    {
        $tenancy->update(['status' => Tenancy::STATUS_TERMINATED, 'is_active' => false, 'notes' => $notes]);
        return ApiResponse::success($tenancy->refresh()->load($this->relations), 'Tenancy terminated');
    }

    public function cancel(Tenancy $tenancy, ?string $notes = null): \Illuminate\Http\JsonResponse
    {
        $tenancy->update(['status' => Tenancy::STATUS_CANCELLED, 'is_active' => false, 'notes' => $notes]);
        return ApiResponse::success($tenancy->refresh()->load($this->relations), 'Tenancy cancelled');
    }

    public function pending(Tenancy $tenancy): \Illuminate\Http\JsonResponse
    {
        $tenancy->update(['status' => Tenancy::STATUS_PENDING, 'is_active' => false]);
        return ApiResponse::success($tenancy->refresh()->load($this->relations), 'Tenancy marked pending');
    }

    // -------------------------------
    // NEW: ASSIGN UNIT
    // -------------------------------
    public function assignUnit(int $tenantId, int $unitId, array $data = []): \Illuminate\Http\JsonResponse
    {
        return DB::transaction(function () use ($tenantId, $unitId, $data) {
            $exists = Tenancy::query()->where('unit_id', $unitId)->currentlyActive()->exists();
            if ($exists) {
                return ApiResponse::conflict('Unit is already occupied');
            }

            $data['tenant_id'] = $tenantId;
            $data['unit_id']   = $unitId;
            $data['status']    = Tenancy::STATUS_ACTIVE;
            $data['is_active'] = true;

            $tenancy = Tenancy::create($data)->load($this->relations);
            return ApiResponse::created($tenancy, 'Unit assigned to tenant successfully');
        });
    }

    // -------------------------------
    // NEW: RENEW TENANCY
    // -------------------------------
    public function renew(Tenancy $tenancy, array $data): \Illuminate\Http\JsonResponse
    {
        $tenancy->update([
            'end_date' => $data['end_date'],
            'status'   => Tenancy::STATUS_ACTIVE,
            'is_active'=> true,
        ]);
        return ApiResponse::success($tenancy->refresh()->load($this->relations), 'Tenancy renewed successfully');
    }

    // -------------------------------
    // STATISTICS
    // -------------------------------
    public function statistics(): \Illuminate\Http\JsonResponse
    {
        $stats = [
            'total'            => Tenancy::count(),
            'active'           => Tenancy::active()->count(),
            'pending'          => Tenancy::pending()->count(),
            'expired'          => Tenancy::expired()->count(),
            'terminated'       => Tenancy::terminated()->count(),
            'cancelled'        => Tenancy::cancelled()->count(),
            'currently_active' => Tenancy::currentlyActive()->count(),
            'moved_in'         => Tenancy::whereNotNull('move_in_date')->count(),
            'moved_out'        => Tenancy::whereNotNull('move_out_date')->count(),
            'total_rent'       => Tenancy::whereNotIn('status', [Tenancy::STATUS_CANCELLED])->sum('rent_amount'),
            'total_deposits'   => Tenancy::whereNotIn('status', [Tenancy::STATUS_CANCELLED])->sum('deposit_amount'),
        ];

        return ApiResponse::success($stats, 'Tenancy statistics fetched successfully');
    }
}
