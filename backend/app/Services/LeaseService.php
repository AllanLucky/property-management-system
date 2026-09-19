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
     *
     * Synchronizes ended active leases before retrieving records so the
     * returned API state reflects the current lease lifecycle.
     */
    public function getAll(array $filters = []): LengthAwarePaginator
    {
        $this->expireEndedLeases();

        return $this->leaseRepository->getAll($filters);
    }

    /**
     * Search leases.
     */
    public function search(array $filters = []): LengthAwarePaginator
    {
        $this->expireEndedLeases();

        return $this->leaseRepository->search($filters);
    }

    /**
     * Find a lease by ID.
     */
    public function findById(int $id): ?Lease
    {
        $this->expireEndedLeases();

        return $this->leaseRepository->findById($id);
    }

    /**
     * Find a lease by ID or fail.
     */
    public function findOrFail(int $id): Lease
    {
        $this->expireEndedLeases();

        return $this->leaseRepository->findOrFail($id);
    }

    /**
     * Find a lease by lease number.
     */
    public function findByLeaseNumber(string $leaseNumber): ?Lease
    {
        $this->expireEndedLeases();

        return $this->leaseRepository->findByLeaseNumber(
            trim($leaseNumber)
        );
    }

    /**
     * Get all leases belonging to a tenancy.
     */
    public function getByTenancy(int $tenancyId): Collection
    {
        $this->expireEndedLeases();

        return $this->leaseRepository->getByTenancy($tenancyId);
    }

    /**
     * Get active leases.
     */
    public function getActive(): Collection
    {
        $this->expireEndedLeases();

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
        $this->expireEndedLeases();

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
     * Get leases expiring between two dates.
     */
    public function getExpiringBetween(
        string $startDate,
        string $endDate
    ): Collection {
        $this->expireEndedLeases();

        try {
            $start = Carbon::parse($startDate)->startOfDay();
            $end = Carbon::parse($endDate)->endOfDay();
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'start_date' => 'The expiration start date is invalid.',
                'end_date' => 'The expiration end date is invalid.',
            ]);
        }

        if ($end->lt($start)) {
            throw ValidationException::withMessages([
                'end_date' => 'The expiration end date must be on or after the start date.',
            ]);
        }

        return $this->leaseRepository->getExpiringBetween(
            $start->toDateString(),
            $end->toDateString()
        );
    }

    /**
     * Get upcoming leases.
     */
    public function getUpcoming(?string $date = null): Collection
    {
        $this->expireEndedLeases();

        return $this->leaseRepository->getUpcoming($date);
    }

    /**
     * Get lease statistics.
     */
    public function getStatistics(): array
    {
        $this->expireEndedLeases();

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

            if (empty($data['tenancy_id'])) {
                throw ValidationException::withMessages([
                    'tenancy_id' => 'A tenancy is required to create a lease.',
                ]);
            }

            $tenancy = $this->getTenancy(
                (int) $data['tenancy_id']
            );

            $this->validateTenancyForLease($tenancy);

            $this->validateDateRange($data);

            $status = $data['status'] ?? Lease::STATUS_DRAFT;

            /*
             * A fixed-term lease requires an end date.
             */
            if (
                ($data['lease_type'] ?? Lease::TYPE_FIXED_TERM)
                === Lease::TYPE_FIXED_TERM
                && empty($data['end_date'])
            ) {
                throw ValidationException::withMessages([
                    'end_date' => 'A fixed-term lease must have an end date.',
                ]);
            }

            /*
             * Active leases must satisfy all activation rules.
             */
            if ($status === Lease::STATUS_ACTIVE) {
                $this->ensureNoOtherActiveLease(
                    (int) $tenancy->id
                );

                $this->validateActivationData($data);
            }

            /*
             * A newly-created expired lease must already have
             * passed its contractual end date.
             */
            if ($status === Lease::STATUS_EXPIRED) {
                if (!$this->dateHasEnded($data['end_date'] ?? null)) {
                    throw ValidationException::withMessages([
                        'status' => 'A lease can only be marked expired after its end date has passed.',
                    ]);
                }
            }

            /*
             * An active lease cannot have an end date in the past.
             */
            if (
                $status === Lease::STATUS_ACTIVE
                && $this->dateHasEnded($data['end_date'] ?? null)
            ) {
                throw ValidationException::withMessages([
                    'end_date' => 'An active lease cannot have an end date in the past.',
                ]);
            }

            /*
             * Terminated and cancelled leases must have a reason when
             * supplied through the service layer.
             */
            if (
                in_array(
                    $status,
                    [
                        Lease::STATUS_TERMINATED,
                        Lease::STATUS_CANCELLED,
                    ],
                    true
                )
                && empty($data['termination_reason'])
            ) {
                throw ValidationException::withMessages([
                    'termination_reason' => 'A reason is required for a terminated or cancelled lease.',
                ]);
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
     *
     * Normal updates cannot reopen terminal lease states.
     * Explicit lifecycle transitions should use their dedicated methods.
     */
    public function update(
        Lease $lease,
        array $data
    ): Lease {
        return DB::transaction(function () use ($lease, $data) {
            $lease = $this->refreshLease($lease);

            /*
             * Synchronize an ended active lease before processing an update.
             */
            if ($lease->shouldExpire()) {
                $this->synchronizeLeaseExpiration($lease);

                $lease = $this->refreshLease($lease);
            }

            $data = $this->prepareData($data);

            /*
             * These fields are immutable through a normal update.
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

            $finalLeaseType = array_key_exists(
                'lease_type',
                $data
            )
                ? $data['lease_type']
                : $lease->lease_type;

            $finalStatus = array_key_exists(
                'status',
                $data
            )
                ? $data['status']
                : $lease->status;

            /*
             * Validate the final effective date range.
             */
            $this->validateDateRange([
                'start_date' => $finalStartDate,
                'end_date' => $finalEndDate,
            ]);

            /*
             * Fixed-term leases must have an end date.
             */
            if (
                $finalLeaseType === Lease::TYPE_FIXED_TERM
                && empty($finalEndDate)
            ) {
                throw ValidationException::withMessages([
                    'end_date' => 'A fixed-term lease must have an end date.',
                ]);
            }

            /*
             * Terminal states cannot be reopened through normal update.
             */
            $this->ensureTerminalStateCannotReopen(
                $lease,
                $finalStatus
            );

            /*
             * If this update activates the lease, run all activation rules.
             */
            if (
                $finalStatus === Lease::STATUS_ACTIVE
                && !$lease->isActive()
            ) {
                $this->ensureLeaseCanActivate($lease);

                $this->ensureNoOtherActiveLease(
                    (int) $lease->tenancy_id,
                    (int) $lease->id
                );

                $this->validateActivationData([
                    'start_date' => $finalStartDate,
                    'end_date' => $finalEndDate,
                ]);
            }

            /*
             * An active lease cannot have an end date in the past.
             */
            if (
                $finalStatus === Lease::STATUS_ACTIVE
                && $this->dateHasEnded($finalEndDate)
            ) {
                throw ValidationException::withMessages([
                    'end_date' => 'An active lease cannot have an end date in the past.',
                ]);
            }

            /*
             * Generic updates may mark a lease expired only when its
             * contractual end date has actually passed.
             */
            if (
                $finalStatus === Lease::STATUS_EXPIRED
                && !$this->dateHasEnded($finalEndDate)
            ) {
                throw ValidationException::withMessages([
                    'status' => 'A lease can only be marked expired after its end date has passed.',
                ]);
            }

            /*
             * A terminated or cancelled status requires a reason.
             */
            if (
                in_array(
                    $finalStatus,
                    [
                        Lease::STATUS_TERMINATED,
                        Lease::STATUS_CANCELLED,
                    ],
                    true
                )
                && empty($data['termination_reason'])
                && empty($lease->termination_reason)
            ) {
                throw ValidationException::withMessages([
                    'termination_reason' => 'A reason is required for a terminated or cancelled lease.',
                ]);
            }

            /*
             * When explicitly changing away from terminated/cancelled,
             * the terminal-state guard above prevents reopening.
             */
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
        return DB::transaction(function () use ($lease) {
            $lease = $this->refreshLease($lease);

            /*
             * Synchronize stale active leases before checking deletion.
             */
            if ($lease->shouldExpire()) {
                $this->synchronizeLeaseExpiration($lease);

                $lease = $this->refreshLease($lease);
            }

            if ($lease->isActive()) {
                throw ValidationException::withMessages([
                    'lease' => 'An active lease cannot be deleted. Terminate or expire the lease first.',
                ]);
            }

            return $this->leaseRepository->delete($lease);
        });
    }

    /**
     * Restore a soft-deleted lease.
     */
    public function restore(Lease $lease): bool
    {
        return DB::transaction(function () use ($lease) {
            $restored = $this->leaseRepository->restore($lease);

            if (!$restored) {
                return false;
            }

            $restoredLease = $this->leaseRepository->findById(
                (int) $lease->id
            );

            if (!$restoredLease) {
                return false;
            }

            /*
             * A restored active lease whose end date has passed must
             * immediately be synchronized to expired.
             */
            if ($restoredLease->shouldExpire()) {
                $this->synchronizeLeaseExpiration($restoredLease);
            }

            return true;
        });
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

            /*
             * Synchronize an already-ended lease before activation.
             */
            if ($lease->shouldExpire()) {
                $this->synchronizeLeaseExpiration($lease);

                $lease = $this->refreshLease($lease);
            }

            $this->ensureLeaseCanActivate($lease);

            $this->ensureNoOtherActiveLease(
                (int) $lease->tenancy_id,
                (int) $lease->id
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

            if ($lease->shouldExpire()) {
                $this->synchronizeLeaseExpiration($lease);

                $lease = $this->refreshLease($lease);
            }

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

            if ($lease->shouldExpire()) {
                $this->synchronizeLeaseExpiration($lease);

                $lease = $this->refreshLease($lease);
            }

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
     * Manually expire a lease.
     *
     * Manual expiration is only valid once the contractual end date
     * has passed.
     */
    public function expire(Lease $lease): Lease
    {
        return DB::transaction(function () use ($lease) {
            $lease = $this->refreshLease($lease);

            /*
             * Expiring an already-expired lease is idempotent.
             */
            if ($lease->isExpired()) {
                return $lease;
            }

            if ($lease->isTerminated()) {
                throw ValidationException::withMessages([
                    'status' => 'A terminated lease cannot be expired.',
                ]);
            }

            if ($lease->isCancelled()) {
                throw ValidationException::withMessages([
                    'status' => 'A cancelled lease cannot be expired.',
                ]);
            }

            /*
             * Expiration is a contractual lifecycle state.
             * Require the end date to have passed.
             */
            if (!$lease->hasEnded()) {
                throw ValidationException::withMessages([
                    'status' => 'The lease has not reached its end date yet.',
                ]);
            }

            /*
             * Only active leases should normally transition automatically.
             * Draft/pending records should not silently become expired.
             */
            if (!$lease->isActive()) {
                throw ValidationException::withMessages([
                    'status' => 'Only an active lease can be expired.',
                ]);
            }

            return $this->leaseRepository->update(
                $lease,
                [
                    'status' => Lease::STATUS_EXPIRED,
                    'terminated_at' => null,
                ]
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

            /*
             * An ended active lease should first become expired.
             */
            if ($lease->shouldExpire()) {
                $this->synchronizeLeaseExpiration($lease);

                $lease = $this->refreshLease($lease);
            }

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

            $reason = $reason !== null
                ? trim($reason)
                : null;

            if ($reason === '') {
                $reason = null;
            }

            if ($reason === null && empty($lease->termination_reason)) {
                throw ValidationException::withMessages([
                    'termination_reason' => 'A termination reason is required.',
                ]);
            }

            $data = [
                'status' => Lease::STATUS_TERMINATED,
                'terminated_at' => now(),
            ];

            if ($reason !== null) {
                $data['termination_reason'] = $reason;
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
    public function cancel(
        Lease $lease,
        ?string $reason = null
    ): Lease {
        return DB::transaction(function () use ($lease, $reason) {
            $lease = $this->refreshLease($lease);

            /*
             * Synchronize ended active leases before cancellation.
             */
            if ($lease->shouldExpire()) {
                $this->synchronizeLeaseExpiration($lease);

                $lease = $this->refreshLease($lease);
            }

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

            if ($lease->isTerminated()) {
                throw ValidationException::withMessages([
                    'status' => 'A terminated lease cannot be cancelled.',
                ]);
            }

            if (!$lease->canCancel()) {
                throw ValidationException::withMessages([
                    'status' => 'This lease cannot be cancelled.',
                ]);
            }

            $reason = $reason !== null
                ? trim($reason)
                : null;

            if ($reason === '') {
                $reason = null;
            }

            if ($reason === null && empty($lease->termination_reason)) {
                throw ValidationException::withMessages([
                    'termination_reason' => 'A cancellation reason is required.',
                ]);
            }

            $data = [
                'status' => Lease::STATUS_CANCELLED,
                'terminated_at' => null,
            ];

            if ($reason !== null) {
                $data['termination_reason'] = $reason;
            }

            return $this->leaseRepository->update(
                $lease,
                $data
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | AUTOMATIC EXPIRATION
    |--------------------------------------------------------------------------
    */

    /**
     * Expire all active leases whose contractual end date has passed.
     *
     * Business rule:
     *
     *     end_date < today
     *
     * Therefore:
     *
     *     end_date = today     => active
     *     end_date < today     => expired
     *
     * Only active leases are synchronized.
     *
     * This operation is idempotent and safe to execute repeatedly.
     */
    public function expireEndedLeases(): int
    {
        return DB::transaction(function () {
            $today = today();

            $leases = Lease::query()
                ->where('status', Lease::STATUS_ACTIVE)
                ->whereNotNull('end_date')
                ->whereDate('end_date', '<', $today)
                ->lockForUpdate()
                ->get();

            if ($leases->isEmpty()) {
                return 0;
            }

            $count = 0;

            foreach ($leases as $lease) {
                /*
                 * updateQuietly prevents unnecessary model event
                 * processing for automatic system expiration.
                 */
                $updated = $lease->updateQuietly([
                    'status' => Lease::STATUS_EXPIRED,
                    'terminated_at' => null,
                ]);

                if ($updated) {
                    $count++;
                }
            }

            return $count;
        });
    }

    /**
     * Synchronize expiration for a single lease.
     *
     * Returns true only when the database status is changed.
     */
    public function synchronizeLeaseExpiration(
        Lease $lease
    ): bool {
        $lease = $this->refreshLease($lease);

        /*
         * Only active leases whose end date has passed should
         * automatically become expired.
         */
        if (!$lease->shouldExpire()) {
            return false;
        }

        if (!$lease->isActive()) {
            return false;
        }

        return $lease->updateQuietly([
            'status' => Lease::STATUS_EXPIRED,
            'terminated_at' => null,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | INTERNAL HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Refresh the lease from the database.
     */
    protected function refreshLease(Lease $lease): Lease
    {
        return $this->leaseRepository->findOrFail(
            (int) $lease->id
        );
    }

    /**
     * Get the tenancy required by a lease.
     */
    protected function getTenancy(int $tenancyId): Tenancy
    {
        $tenancy = Tenancy::query()->find($tenancyId);

        if (!$tenancy) {
            throw ValidationException::withMessages([
                'tenancy_id' => 'The selected tenancy does not exist.',
            ]);
        }

        return $tenancy;
    }

    /**
     * Prepare and normalize lease data.
     */
    protected function prepareData(array $data): array
    {
        /*
         * Normalize enum-like fields.
         */
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

        /*
         * Normalize text fields.
         */
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
         * Normalize date fields to database-safe Y-m-d values.
         */
        foreach ([
            'start_date',
            'end_date',
        ] as $field) {
            if (
                array_key_exists($field, $data)
                && $data[$field] !== null
                && $data[$field] !== ''
            ) {
                try {
                    $data[$field] = Carbon::parse(
                        $data[$field]
                    )->toDateString();
                } catch (\Throwable) {
                    throw ValidationException::withMessages([
                        $field => "The {$field} is invalid.",
                    ]);
                }
            }
        }

        /*
         * Apply creation/service defaults.
         *
         * Using ?? rather than array_key_exists keeps explicitly
         * supplied null values from becoming invalid enum values.
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
     * Validate lease start/end date range.
     */
    protected function validateDateRange(array $data): void
    {
        /*
         * An open-ended lease is allowed.
         */
        if (
            empty($data['start_date'])
            || empty($data['end_date'])
        ) {
            return;
        }

        try {
            $startDate = Carbon::parse(
                $data['start_date']
            )->startOfDay();

            $endDate = Carbon::parse(
                $data['end_date']
            )->startOfDay();
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'start_date' => 'The lease start date is invalid.',
                'end_date' => 'The lease end date is invalid.',
            ]);
        }

        if ($endDate->lt($startDate)) {
            throw ValidationException::withMessages([
                'end_date' => 'The lease end date must be on or after the start date.',
            ]);
        }
    }

    /**
     * Validate data required for activation.
     */
    protected function validateActivationData(
        array $data
    ): void {
        if (empty($data['start_date'])) {
            throw ValidationException::withMessages([
                'start_date' => 'A lease must have a start date before activation.',
            ]);
        }

        try {
            $startDate = Carbon::parse(
                $data['start_date']
            )->startOfDay();
        } catch (\Throwable) {
            throw ValidationException::withMessages([
                'start_date' => 'The lease start date is invalid.',
            ]);
        }

        /*
         * A future start date is allowed because some systems
         * permit activation before the contractual start date.
         */

        if (!empty($data['end_date'])) {
            try {
                $endDate = Carbon::parse(
                    $data['end_date']
                )->startOfDay();
            } catch (\Throwable) {
                throw ValidationException::withMessages([
                    'end_date' => 'The lease end date is invalid.',
                ]);
            }

            if ($endDate->lt($startDate)) {
                throw ValidationException::withMessages([
                    'end_date' => 'The lease end date cannot be before the start date.',
                ]);
            }

            /*
             * A lease ending today remains active today.
             * It becomes eligible for expiration tomorrow.
             */
            if ($endDate->lt(today())) {
                throw ValidationException::withMessages([
                    'end_date' => 'A lease with a passed end date cannot be activated.',
                ]);
            }
        }
    }

    /**
     * Determine whether a contractual end date has passed.
     *
     * Rules:
     *
     *     today      => false
     *     yesterday  => true
     *     older      => true
     */
    protected function dateHasEnded(
        string|Carbon|null $date
    ): bool {
        if ($date === null || $date === '') {
            return false;
        }

        try {
            return Carbon::parse($date)
                ->startOfDay()
                ->lt(today());
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Ensure a lease is eligible for activation.
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

        if ($lease->hasEnded()) {
            throw ValidationException::withMessages([
                'status' => 'A lease whose end date has passed cannot be activated.',
            ]);
        }

        if (!$lease->canActivate()) {
            throw ValidationException::withMessages([
                'status' => 'This lease is not eligible for activation.',
            ]);
        }
    }

    /**
     * Prevent terminal leases from being reopened through normal update.
     */
    protected function ensureTerminalStateCannotReopen(
        Lease $lease,
        string $finalStatus
    ): void {
        if (
            $lease->isTerminated()
            && $finalStatus !== Lease::STATUS_TERMINATED
        ) {
            throw ValidationException::withMessages([
                'status' => 'A terminated lease cannot be reopened through a normal update.',
            ]);
        }

        if (
            $lease->isCancelled()
            && $finalStatus !== Lease::STATUS_CANCELLED
        ) {
            throw ValidationException::withMessages([
                'status' => 'A cancelled lease cannot be reopened through a normal update.',
            ]);
        }

        if (
            $lease->isExpired()
            && $finalStatus !== Lease::STATUS_EXPIRED
        ) {
            throw ValidationException::withMessages([
                'status' => 'An expired lease cannot be reopened through a normal update.',
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
            $query->where('id', '!=', $exceptLeaseId);
        }

        if ($query->exists()) {
            throw ValidationException::withMessages([
                'tenancy_id' => 'This tenancy already has an active lease.',
            ]);
        }
    }
}
