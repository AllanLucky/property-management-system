<?php

namespace App\Services;

use App\Models\Lease;
use App\Models\Tenancy;
use App\Repositories\Interfaces\LeaseRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LeaseService
{
    /**
     * LeaseService constructor.
     */
    public function __construct(
        protected LeaseRepositoryInterface $leaseRepository
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Get all leases with filters and pagination.
     */
    public function getAll(array $filters = []): LengthAwarePaginator
    {
        return $this->leaseRepository->getAll($filters);
    }

    /**
     * Search leases.
     */
    public function search(array $filters = []): LengthAwarePaginator
    {
        return $this->leaseRepository->search($filters);
    }

    /**
     * Find lease by ID.
     */
    public function findById(int $id): ?Lease
    {
        return $this->leaseRepository->findById($id);
    }

    /**
     * Find lease or fail.
     */
    public function findOrFail(int $id): Lease
    {
        return $this->leaseRepository->findOrFail($id);
    }

    /**
     * Find lease by lease number.
     */
    public function findByLeaseNumber(string $leaseNumber): ?Lease
    {
        return $this->leaseRepository->findByLeaseNumber(
            trim($leaseNumber)
        );
    }

    /**
     * Get leases belonging to a tenancy.
     */
    public function getByTenancy(int $tenancyId): Collection
    {
        return $this->leaseRepository->getByTenancy($tenancyId);
    }

    /**
     * Get active leases.
     */
    public function getActive(): Collection
    {
        return $this->leaseRepository->getActive();
    }

    /**
     * Get draft leases.
     */
    public function getDraft(): Collection
    {
        return $this->leaseRepository->getDraft();
    }

    /**
     * Get pending leases.
     */
    public function getPending(): Collection
    {
        return $this->leaseRepository->getPending();
    }

    /**
     * Get expired leases.
     */
    public function getExpired(): Collection
    {
        return $this->leaseRepository->getExpired();
    }

    /**
     * Get terminated leases.
     */
    public function getTerminated(): Collection
    {
        return $this->leaseRepository->getTerminated();
    }

    /**
     * Get cancelled leases.
     */
    public function getCancelled(): Collection
    {
        return $this->leaseRepository->getCancelled();
    }

    /**
     * Get leases expiring between dates.
     */
    public function getExpiringBetween(
        string $startDate,
        string $endDate
    ): Collection {
        return $this->leaseRepository->getExpiringBetween(
            $startDate,
            $endDate
        );
    }

    /**
     * Get upcoming leases.
     */
    public function getUpcoming(?string $date = null): Collection
    {
        return $this->leaseRepository->getUpcoming($date);
    }

    /**
     * Get lease statistics.
     */
    public function getStatistics(): array
    {
        return $this->leaseRepository->getStatistics();
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new lease.
     */
    public function create(array $data): Lease
    {
        return DB::transaction(function () use ($data) {
            $data = $this->prepareData($data);

            $tenancy = $this->getTenancy(
                (int) $data['tenancy_id']
            );

            $this->validateTenancyForLease($tenancy);

            $this->validateDateRange($data);

            /*
             * If the caller explicitly creates an active lease,
             * ensure the tenancy does not already have one.
             */
            if (
                ($data['status'] ?? Lease::STATUS_DRAFT)
                === Lease::STATUS_ACTIVE
            ) {
                $this->ensureNoOtherActiveLease(
                    $tenancy->id
                );

                $this->validateActivationData($data);
            }

            return $this->leaseRepository->create($data);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing lease.
     */
    public function update(
        Lease $lease,
        array $data
    ): Lease {
        return DB::transaction(function () use ($lease, $data) {
            $lease = $this->refreshLease($lease);

            $data = $this->prepareData($data);

            /*
             * tenancy_id and lease_number are protected by
             * UpdateLeaseRequest. We also enforce that rule
             * here at the service layer.
             */
            unset(
                $data['tenancy_id'],
                $data['lease_number']
            );

            $finalStartDate = array_key_exists(
                'start_date',
                $data
            )
                ? $data['start_date']
                : $lease->start_date?->toDateString();

            $finalEndDate = array_key_exists(
                'end_date',
                $data
            )
                ? $data['end_date']
                : $lease->end_date?->toDateString();

            $this->validateDateRange([
                'start_date' => $finalStartDate,
                'end_date' => $finalEndDate,
            ]);

            /*
             * Prevent reopening terminated/cancelled leases
             * through the generic update endpoint.
             */
            if (
                $lease->isTerminated()
                && isset($data['status'])
                && $data['status'] !== Lease::STATUS_TERMINATED
            ) {
                throw ValidationException::withMessages([
                    'status' => 'A terminated lease cannot be reopened through a normal update.',
                ]);
            }

            if (
                $lease->isCancelled()
                && isset($data['status'])
                && $data['status'] !== Lease::STATUS_CANCELLED
            ) {
                throw ValidationException::withMessages([
                    'status' => 'A cancelled lease cannot be reopened through a normal update.',
                ]);
            }

            /*
             * If update changes status to active, apply the
             * same rules as explicit activation.
             */
            if (
                isset($data['status'])
                && $data['status'] === Lease::STATUS_ACTIVE
                && !$lease->isActive()
            ) {
                $this->ensureLeaseCanActivate($lease);

                $this->ensureNoOtherActiveLease(
                    $lease->tenancy_id,
                    $lease->id
                );

                $this->validateActivationData([
                    'start_date' => $finalStartDate,
                    'end_date' => $finalEndDate,
                ]);
            }

            return $this->leaseRepository->update(
                $lease,
                $data
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a lease.
     */
    public function delete(Lease $lease): bool
    {
        $lease = $this->refreshLease($lease);

        if ($lease->isActive()) {
            throw ValidationException::withMessages([
                'lease' => 'An active lease cannot be deleted. Terminate or expire the lease first.',
            ]);
        }

        return $this->leaseRepository->delete($lease);
    }

    /**
     * Restore a deleted lease.
     */
    public function restore(Lease $lease): bool
    {
        return $this->leaseRepository->restore($lease);
    }

    /**
     * Permanently delete a lease.
     */
    public function forceDelete(Lease $lease): bool
    {
        return $this->leaseRepository->forceDelete($lease);
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS MANAGEMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a lease.
     */
    public function activate(Lease $lease): Lease
    {
        return DB::transaction(function () use ($lease) {
            $lease = $this->refreshLease($lease);

            $this->ensureLeaseCanActivate($lease);

            $this->ensureNoOtherActiveLease(
                $lease->tenancy_id,
                $lease->id
            );

            $this->validateActivationData([
                'start_date' => $lease->start_date?->toDateString(),
                'end_date' => $lease->end_date?->toDateString(),
            ]);

            return $this->leaseRepository->updateStatus(
                $lease,
                Lease::STATUS_ACTIVE
            );
        });
    }

    /**
     * Set lease to pending.
     */
    public function setPending(Lease $lease): Lease
    {
        return DB::transaction(function () use ($lease) {
            $lease = $this->refreshLease($lease);

            if ($lease->isActive()) {
                throw ValidationException::withMessages([
                    'status' => 'An active lease cannot be moved to pending.',
                ]);
            }

            if ($lease->isTerminated()) {
                throw ValidationException::withMessages([
                    'status' => 'A terminated lease cannot be moved to pending.',
                ]);
            }

            if ($lease->isCancelled()) {
                throw ValidationException::withMessages([
                    'status' => 'A cancelled lease cannot be moved to pending.',
                ]);
            }

            if ($lease->isExpired()) {
                throw ValidationException::withMessages([
                    'status' => 'An expired lease cannot be moved to pending.',
                ]);
            }

            return $this->leaseRepository->updateStatus(
                $lease,
                Lease::STATUS_PENDING
            );
        });
    }

    /**
     * Set lease to draft.
     */
    public function setDraft(Lease $lease): Lease
    {
        return DB::transaction(function () use ($lease) {
            $lease = $this->refreshLease($lease);

            if ($lease->isActive()) {
                throw ValidationException::withMessages([
                    'status' => 'An active lease cannot be moved to draft.',
                ]);
            }

            if ($lease->isTerminated()) {
                throw ValidationException::withMessages([
                    'status' => 'A terminated lease cannot be moved to draft.',
                ]);
            }

            if ($lease->isExpired()) {
                throw ValidationException::withMessages([
                    'status' => 'An expired lease cannot be moved to draft.',
                ]);
            }

            if ($lease->isCancelled()) {
                throw ValidationException::withMessages([
                    'status' => 'A cancelled lease cannot be moved to draft.',
                ]);
            }

            return $this->leaseRepository->updateStatus(
                $lease,
                Lease::STATUS_DRAFT
            );
        });
    }

    /**
     * Mark an active lease as expired.
     */
    public function expire(Lease $lease): Lease
    {
        return DB::transaction(function () use ($lease) {
            $lease = $this->refreshLease($lease);

            if (!$lease->isActive()) {
                throw ValidationException::withMessages([
                    'status' => 'Only an active lease can be marked as expired.',
                ]);
            }

            if (!$lease->hasEnded()) {
                throw ValidationException::withMessages([
                    'status' => 'The lease has not reached its end date yet.',
                ]);
            }

            return $this->leaseRepository->updateStatus(
                $lease,
                Lease::STATUS_EXPIRED
            );
        });
    }

    /**
     * Terminate an active lease.
     */
    public function terminate(
        Lease $lease,
        ?string $reason = null
    ): Lease {
        return DB::transaction(function () use ($lease, $reason) {
            $lease = $this->refreshLease($lease);

            if (!$lease->isActive()) {
                throw ValidationException::withMessages([
                    'status' => 'Only an active lease can be terminated.',
                ]);
            }

            if (!$lease->canTerminate()) {
                throw ValidationException::withMessages([
                    'status' => 'This lease cannot be terminated.',
                ]);
            }

            $data = [
                'status' => Lease::STATUS_TERMINATED,
                'terminated_at' => now(),
            ];

            if ($reason !== null) {
                $reason = trim($reason);

                if ($reason !== '') {
                    $data['termination_reason'] = $reason;
                }
            }

            return $this->leaseRepository->update(
                $lease,
                $data
            );
        });
    }

    /**
     * Cancel a lease.
     */
    public function cancel(Lease $lease): Lease
    {
        return DB::transaction(function () use ($lease) {
            $lease = $this->refreshLease($lease);

            if ($lease->isCancelled()) {
                throw ValidationException::withMessages([
                    'status' => 'The lease is already cancelled.',
                ]);
            }

            if ($lease->isActive()) {
                throw ValidationException::withMessages([
                    'status' => 'An active lease cannot be cancelled. Terminate it instead.',
                ]);
            }

            if ($lease->isExpired()) {
                throw ValidationException::withMessages([
                    'status' => 'An expired lease cannot be cancelled.',
                ]);
            }

            if (!$lease->canCancel()) {
                throw ValidationException::withMessages([
                    'status' => 'This lease cannot be cancelled.',
                ]);
            }

            return $this->leaseRepository->updateStatus(
                $lease,
                Lease::STATUS_CANCELLED
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | AUTOMATIC EXPIRATION
    |--------------------------------------------------------------------------
    */

    /**
     * Expire all active leases whose end date has passed.
     *
     * Suitable for a scheduled command.
     */
    public function expireEndedLeases(): int
    {
        $leases = Lease::query()
            ->where('status', Lease::STATUS_ACTIVE)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', today())
            ->get();

        if ($leases->isEmpty()) {
            return 0;
        }

        return DB::transaction(function () use ($leases) {
            $count = 0;

            foreach ($leases as $lease) {
                $this->leaseRepository->updateStatus(
                    $lease,
                    Lease::STATUS_EXPIRED
                );

                $count++;
            }

            return $count;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | INTERNAL HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Refresh lease from database.
     */
    protected function refreshLease(Lease $lease): Lease
    {
        return $this->leaseRepository->findOrFail(
            (int) $lease->id
        );
    }

    /**
     * Get tenancy required by a lease.
     */
    protected function getTenancy(int $tenancyId): Tenancy
    {
        $tenancy = Tenancy::query()
            ->with([
                'tenant',
                'property',
                'apartment',
                'unit',
            ])
            ->find($tenancyId);

        if (!$tenancy) {
            throw ValidationException::withMessages([
                'tenancy_id' => 'The selected tenancy does not exist.',
            ]);
        }

        return $tenancy;
    }

    /**
     * Prepare lease data.
     */
    protected function prepareData(array $data): array
    {
        foreach ([
            'lease_type',
            'payment_frequency',
            'status',
        ] as $field) {
            if (
                array_key_exists($field, $data)
                && $data[$field] !== null
            ) {
                $data[$field] = strtolower(
                    trim((string) $data[$field])
                );
            }
        }

        foreach ([
            'termination_reason',
            'document_path',
            'notes',
        ] as $field) {
            if (
                array_key_exists($field, $data)
                && $data[$field] !== null
            ) {
                $data[$field] = trim(
                    (string) $data[$field]
                );
            }
        }

        /*
         * Creation defaults.
         */
        $data['lease_type']
            ??= Lease::TYPE_FIXED_TERM;

        $data['payment_frequency']
            ??= 'monthly';

        $data['status']
            ??= Lease::STATUS_DRAFT;

        $data['service_charge']
            ??= 0;

        $data['late_fee']
            ??= 0;

        return $data;
    }

    /**
     * Validate tenancy before creating a lease.
     */
    protected function validateTenancyForLease(
        Tenancy $tenancy
    ): void {
        if (
            method_exists($tenancy, 'isCancelled')
            && $tenancy->isCancelled()
        ) {
            throw ValidationException::withMessages([
                'tenancy_id' => 'A lease cannot be created for a cancelled tenancy.',
            ]);
        }

        if (
            method_exists($tenancy, 'isTerminated')
            && $tenancy->isTerminated()
        ) {
            throw ValidationException::withMessages([
                'tenancy_id' => 'A lease cannot be created for a terminated tenancy.',
            ]);
        }
    }

    /**
     * Validate lease date range.
     */
    protected function validateDateRange(array $data): void
    {
        if (
            empty($data['start_date'])
            || empty($data['end_date'])
        ) {
            return;
        }

        $startDate = Carbon::parse(
            $data['start_date']
        );

        $endDate = Carbon::parse(
            $data['end_date']
        );

        if ($endDate->lt($startDate)) {
            throw ValidationException::withMessages([
                'end_date' => 'The lease end date must be on or after the start date.',
            ]);
        }
    }

    /**
     * Validate lease data before activation.
     */
    protected function validateActivationData(
        array $data
    ): void {
        if (empty($data['start_date'])) {
            throw ValidationException::withMessages([
                'start_date' => 'A lease must have a start date before activation.',
            ]);
        }

        if (
            !empty($data['end_date'])
            && Carbon::parse($data['end_date'])
                ->lt(Carbon::parse($data['start_date']))
        ) {
            throw ValidationException::withMessages([
                'end_date' => 'The lease end date cannot be before the start date.',
            ]);
        }

        if (
            !empty($data['end_date'])
            && Carbon::parse($data['end_date'])->lt(today())
        ) {
            throw ValidationException::withMessages([
                'end_date' => 'A lease with a passed end date cannot be activated.',
            ]);
        }
    }

    /**
     * Ensure lease is eligible for activation.
     */
    protected function ensureLeaseCanActivate(
        Lease $lease
    ): void {
        if ($lease->isActive()) {
            throw ValidationException::withMessages([
                'status' => 'The lease is already active.',
            ]);
        }

        if ($lease->isTerminated()) {
            throw ValidationException::withMessages([
                'status' => 'A terminated lease cannot be activated.',
            ]);
        }

        if ($lease->isCancelled()) {
            throw ValidationException::withMessages([
                'status' => 'A cancelled lease cannot be activated.',
            ]);
        }

        if ($lease->isExpired()) {
            throw ValidationException::withMessages([
                'status' => 'An expired lease cannot be activated.',
            ]);
        }

        if (!$lease->canActivate()) {
            throw ValidationException::withMessages([
                'status' => 'This lease is not eligible for activation.',
            ]);
        }
    }

    /**
     * Ensure a tenancy has only one active lease.
     */
    protected function ensureNoOtherActiveLease(
        int $tenancyId,
        ?int $exceptLeaseId = null
    ): void {
        $query = Lease::query()
            ->where('tenancy_id', $tenancyId)
            ->where('status', Lease::STATUS_ACTIVE);

        if ($exceptLeaseId !== null) {
            $query->whereKey('!=', $exceptLeaseId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'tenancy_id' => 'This tenancy already has an active lease.',
            ]);
        }
    }
}