<?php

namespace App\Repositories\Eloquent;

use App\Models\Tenancy;
use App\Repositories\Interfaces\TenancyRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class TenancyRepository implements TenancyRepositoryInterface
{
    protected array $relations = [
        'tenant.user',
        'property',
        'apartment',
        'unit',
    ];

    public function all(array $filters = []): Collection
    {
        return Tenancy::query()
            ->with($this->relations)
            ->latest()
            ->get();
    }

    public function paginate(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return Tenancy::query()
            ->with($this->relations)
            ->latest()
            ->paginate($perPage);
    }

    public function find(int|string $id): ?Tenancy
    {
        return Tenancy::query()->with($this->relations)->find($id);
    }

    public function findByNumber(string $number): ?Tenancy
    {
        return Tenancy::query()
            ->with($this->relations)
            ->where('tenancy_number', $number)
            ->first();
    }

    public function create(array $data): Tenancy
    {
        return DB::transaction(function () use ($data) {
            return Tenancy::create($data)->load($this->relations);
        });
    }

    public function update(Tenancy $tenancy, array $data): Tenancy
    {
        $tenancy->update($data);
        return $tenancy->refresh()->load($this->relations);
    }

    public function delete(Tenancy $tenancy): bool
    {
        $tenancy->update(['is_active' => false]);
        return (bool) $tenancy->delete();
    }

    public function restore(int|string $id): ?Tenancy
    {
        $tenancy = Tenancy::withTrashed()->find($id);
        if ($tenancy) {
            $tenancy->restore();
            return $tenancy->load($this->relations);
        }
        return null;
    }

    public function forceDelete(int|string $id): bool
    {
        $tenancy = Tenancy::withTrashed()->find($id);
        return $tenancy ? (bool) $tenancy->forceDelete() : false;
    }

    public function activate(Tenancy $tenancy): Tenancy
    {
        $tenancy->update(['status' => Tenancy::STATUS_ACTIVE, 'is_active' => true]);
        return $tenancy->refresh()->load($this->relations);
    }

    public function deactivate(Tenancy $tenancy): Tenancy
    {
        $tenancy->update(['is_active' => false]);
        return $tenancy->refresh()->load($this->relations);
    }

    public function expire(Tenancy $tenancy): Tenancy
    {
        $tenancy->update(['status' => Tenancy::STATUS_EXPIRED, 'is_active' => false]);
        return $tenancy->refresh()->load($this->relations);
    }

    public function terminate(Tenancy $tenancy, ?string $notes = null): Tenancy
    {
        $tenancy->update(['status' => Tenancy::STATUS_TERMINATED, 'is_active' => false, 'notes' => $notes]);
        return $tenancy->refresh()->load($this->relations);
    }

    public function cancel(Tenancy $tenancy, ?string $notes = null): Tenancy
    {
        $tenancy->update(['status' => Tenancy::STATUS_CANCELLED, 'is_active' => false, 'notes' => $notes]);
        return $tenancy->refresh()->load($this->relations);
    }

    public function renew(Tenancy $tenancy, array $data): Tenancy
    {
        $tenancy->update([
            'end_date' => $data['end_date'],
            'status'   => Tenancy::STATUS_ACTIVE,
            'is_active'=> true,
        ]);
        return $tenancy->refresh()->load($this->relations);
    }

    public function assignUnit(int $tenantId, int $unitId, array $data = []): Tenancy
    {
        return DB::transaction(function () use ($tenantId, $unitId, $data) {
            $data['tenant_id'] = $tenantId;
            $data['unit_id']   = $unitId;
            $data['status']    = Tenancy::STATUS_ACTIVE;
            $data['is_active'] = true;

            return Tenancy::create($data)->load($this->relations);
        });
    }

    public function statistics(): array
    {
        return [
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
    }
}
