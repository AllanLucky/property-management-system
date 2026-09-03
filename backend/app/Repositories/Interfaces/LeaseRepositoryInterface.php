<?php

namespace App\Repositories\Interfaces;

use App\Models\Lease;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface LeaseRepositoryInterface
{
    /**
     * Get paginated leases.
     *
     * @param array<string, mixed> $filters
     */
    public function getAll(array $filters = []): LengthAwarePaginator;

    /**
     * Find a lease by ID.
     */
    public function findById(int $id): ?Lease;

    /**
     * Find a lease by ID or fail.
     */
    public function findOrFail(int $id): Lease;

    /**
     * Find a lease by lease number.
     */
    public function findByLeaseNumber(string $leaseNumber): ?Lease;

    /**
     * Get all leases for a tenancy.
     *
     * @return Collection<int, Lease>
     */
    public function getByTenancy(int $tenancyId): Collection;

    /**
     * Get active leases.
     *
     * @return Collection<int, Lease>
     */
    public function getActive(): Collection;

    /**
     * Get draft leases.
     *
     * @return Collection<int, Lease>
     */
    public function getDraft(): Collection;

    /**
     * Get pending leases.
     *
     * @return Collection<int, Lease>
     */
    public function getPending(): Collection;

    /**
     * Get expired leases.
     *
     * @return Collection<int, Lease>
     */
    public function getExpired(): Collection;

    /**
     * Get terminated leases.
     *
     * @return Collection<int, Lease>
     */
    public function getTerminated(): Collection;

    /**
     * Get cancelled leases.
     *
     * @return Collection<int, Lease>
     */
    public function getCancelled(): Collection;

    /**
     * Get leases expiring within a date range.
     *
     * @return Collection<int, Lease>
     */
    public function getExpiringBetween(
        string $startDate,
        string $endDate
    ): Collection;

    /**
     * Get upcoming leases.
     *
     * @return Collection<int, Lease>
     */
    public function getUpcoming(?string $date = null): Collection;

    /**
     * Search leases.
     *
     * @param array<string, mixed> $filters
     */
    public function search(array $filters = []): LengthAwarePaginator;

    /**
     * Create a lease.
     *
     * @param array<string, mixed> $data
     */
    public function create(array $data): Lease;

    /**
     * Update a lease.
     *
     * @param array<string, mixed> $data
     */
    public function update(Lease $lease, array $data): Lease;

    /**
     * Delete a lease.
     */
    public function delete(Lease $lease): bool;

    /**
     * Restore a soft-deleted lease.
     */
    public function restore(Lease $lease): bool;

    /**
     * Permanently delete a lease.
     */
    public function forceDelete(Lease $lease): bool;

    /**
     * Update the lease status.
     */
    public function updateStatus(Lease $lease, string $status): Lease;

    /**
     * Get lease statistics.
     *
     * @return array<string, mixed>
     */
    public function getStatistics(): array;
}