<?php

namespace App\Repositories\Eloquent;

use App\Models\Lease;
use App\Repositories\Interfaces\LeaseRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class LeaseRepository implements LeaseRepositoryInterface
{
    /**
     * The Lease model instance.
     */
    protected Lease $model;

    /**
     * Create a new repository instance.
     */
    public function __construct(Lease $model)
    {
        $this->model = $model;
    }

    /**
     * Get paginated leases.
     *
     * @param array<string, mixed> $filters
     */
    public function getAll(array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseQuery();

        $this->applyFilters($query, $filters);

        return $query
            ->latest('id')
            ->paginate(
                $filters['per_page'] ?? 15
            )
            ->withQueryString();
    }

    /**
     * Find a lease by ID.
     */
    public function findById(int $id): ?Lease
    {
        return $this->baseQuery()
            ->whereKey($id)
            ->first();
    }

    /**
     * Find a lease by ID or fail.
     */
    public function findOrFail(int $id): Lease
    {
        return $this->baseQuery()
            ->whereKey($id)
            ->firstOrFail();
    }

    /**
     * Find a lease by lease number.
     */
    public function findByLeaseNumber(string $leaseNumber): ?Lease
    {
        return $this->baseQuery()
            ->where('lease_number', $leaseNumber)
            ->first();
    }

    /**
     * Get all leases for a tenancy.
     *
     * @return Collection<int, Lease>
     */
    public function getByTenancy(int $tenancyId): Collection
    {
        return $this->baseQuery()
            ->where('tenancy_id', $tenancyId)
            ->latest('start_date')
            ->get();
    }

    /**
     * Get active leases.
     *
     * @return Collection<int, Lease>
     */
    public function getActive(): Collection
    {
        return $this->baseQuery()
            ->active()
            ->latest('start_date')
            ->get();
    }

    /**
     * Get draft leases.
     *
     * @return Collection<int, Lease>
     */
    public function getDraft(): Collection
    {
        return $this->baseQuery()
            ->draft()
            ->latest('created_at')
            ->get();
    }

    /**
     * Get pending leases.
     *
     * @return Collection<int, Lease>
     */
    public function getPending(): Collection
    {
        return $this->baseQuery()
            ->pending()
            ->latest('created_at')
            ->get();
    }

    /**
     * Get expired leases.
     *
     * @return Collection<int, Lease>
     */
    public function getExpired(): Collection
    {
        return $this->baseQuery()
            ->expired()
            ->latest('end_date')
            ->get();
    }

    /**
     * Get terminated leases.
     *
     * @return Collection<int, Lease>
     */
    public function getTerminated(): Collection
    {
        return $this->baseQuery()
            ->terminated()
            ->latest('terminated_at')
            ->get();
    }

    /**
     * Get cancelled leases.
     *
     * @return Collection<int, Lease>
     */
    public function getCancelled(): Collection
    {
        return $this->baseQuery()
            ->cancelled()
            ->latest('updated_at')
            ->get();
    }

    /**
     * Get leases expiring within a date range.
     *
     * @return Collection<int, Lease>
     */
    public function getExpiringBetween(
        string $startDate,
        string $endDate
    ): Collection {
        return $this->baseQuery()
            ->expiringBetween($startDate, $endDate)
            ->orderBy('end_date')
            ->get();
    }

    /**
     * Get upcoming leases.
     *
     * @return Collection<int, Lease>
     */
    public function getUpcoming(?string $date = null): Collection
    {
        return $this->baseQuery()
            ->upcoming($date)
            ->orderBy('start_date')
            ->get();
    }

    /**
     * Search leases.
     *
     * @param array<string, mixed> $filters
     */
    public function search(array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        return $query
            ->latest('id')
            ->paginate(
                $filters['per_page'] ?? 15
            )
            ->withQueryString();
    }

    /**
     * Create a lease.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Lease
    {
        $lease = $this->model->newQuery()->create($data);

        return $this->findOrFail($lease->id);
    }

    /**
     * Update a lease.
     *
     * @param array<string, mixed> $data
     */
    public function update(Lease $lease, array $data): Lease
    {
        $lease->fill($data);
        $lease->save();

        return $this->findOrFail($lease->id);
    }

    /**
     * Delete a lease.
     */
    public function delete(Lease $lease): bool
    {
        return (bool) $lease->delete();
    }

    /**
     * Restore a soft-deleted lease.
     */
    public function restore(Lease $lease): bool
    {
        return (bool) $lease->restore();
    }

    /**
     * Permanently delete a lease.
     */
    public function forceDelete(Lease $lease): bool
    {
        return (bool) $lease->forceDelete();
    }

    /**
     * Update the lease status.
     */
    public function updateStatus(
        Lease $lease,
        string $status
    ): Lease {
        $lease->status = $status;
        $lease->save();

        return $this->findOrFail($lease->id);
    }

    /**
     * Get lease statistics.
     *
     * @return array<string, mixed>
     */
    public function getStatistics(): array
    {
        $query = $this->model->newQuery();

        return [
            'total' => (clone $query)->count(),

            'draft' => (clone $query)
                ->where('status', Lease::STATUS_DRAFT)
                ->count(),

            'pending' => (clone $query)
                ->where('status', Lease::STATUS_PENDING)
                ->count(),

            'active' => (clone $query)
                ->where('status', Lease::STATUS_ACTIVE)
                ->count(),

            'expired' => (clone $query)
                ->where('status', Lease::STATUS_EXPIRED)
                ->count(),

            'terminated' => (clone $query)
                ->where('status', Lease::STATUS_TERMINATED)
                ->count(),

            'cancelled' => (clone $query)
                ->where('status', Lease::STATUS_CANCELLED)
                ->count(),

            'expiring_soon' => (clone $query)
                ->where('status', Lease::STATUS_ACTIVE)
                ->whereNotNull('end_date')
                ->whereBetween('end_date', [
                    now()->toDateString(),
                    now()->addDays(30)->toDateString(),
                ])
                ->count(),

            'total_rent_amount' => (clone $query)
                ->where('status', Lease::STATUS_ACTIVE)
                ->sum('rent_amount'),

            'total_deposit_amount' => (clone $query)
                ->where('status', Lease::STATUS_ACTIVE)
                ->sum('deposit_amount'),

            'total_service_charge' => (clone $query)
                ->where('status', Lease::STATUS_ACTIVE)
                ->sum('service_charge'),
        ];
    }

    /**
     * Create the base lease query.
     *
     * Relationships are loaded here so all repository reads return a
     * consistent Lease representation.
     */
    protected function baseQuery()
    {
        return $this->model
            ->newQuery()
            ->with([
                'tenancy.tenant.user',
                'tenancy.property',
                'tenancy.apartment',
                'tenancy.unit',
            ]);
    }

    /**
     * Apply general filters.
     *
     * @param mixed $query
     * @param array<string, mixed> $filters
     */
    protected function applyFilters($query, array $filters): void
    {
        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Lease Type
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['lease_type'])) {
            $query->where(
                'lease_type',
                $filters['lease_type']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Tenancy
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['tenancy_id'])) {
            $query->where(
                'tenancy_id',
                $filters['tenancy_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Start Date
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['start_date'])) {
            $query->whereDate(
                'start_date',
                '>=',
                $filters['start_date']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | End Date
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['end_date'])) {
            $query->whereDate(
                'end_date',
                '<=',
                $filters['end_date']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Payment Frequency
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['payment_frequency'])) {
            $query->where(
                'payment_frequency',
                $filters['payment_frequency']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Include Deleted
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['with_trashed'])) {
            $query->withTrashed();
        }

        /*
        |--------------------------------------------------------------------------
        | Only Deleted
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['only_trashed'])) {
            $query->onlyTrashed();
        }
    }

    /**
     * Apply search criteria.
     *
     * @param mixed $query
     * @param array<string, mixed> $filters
     */
    protected function applySearch($query, array $filters): void
    {
        $search = trim(
            (string) ($filters['search'] ?? '')
        );

        if ($search === '') {
            return;
        }

        $query->where(function ($query) use ($search) {
            $query
                ->where('lease_number', 'like', "%{$search}%")
                ->orWhere('status', 'like', "%{$search}%")
                ->orWhere('lease_type', 'like', "%{$search}%")
                ->orWhere('payment_frequency', 'like', "%{$search}%")
                ->orWhereHas('tenancy', function ($query) use ($search) {
                    $query->where(
                        'tenancy_number',
                        'like',
                        "%{$search}%"
                    );
                })
                ->orWhereHas('tenancy.tenant', function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query
                            ->where('tenant_number', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('other_names', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                })
                ->orWhereHas('tenancy.tenant.user', function ($query) use ($search) {
                    $query->where(function ($query) use ($search) {
                        $query
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
                });
        });
    }
}