<?php

namespace App\Services;

use App\Models\MaintenanceAssignment;
use App\Models\MaintenanceExpense;
use App\Models\MaintenanceRequest;
use App\Repositories\Interfaces\MaintenanceRequestRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;

class MaintenanceRequestService
{
    protected MaintenanceRequestRepositoryInterface $repository;

    /**
     * Valid maintenance request statuses.
     */
    protected array $statuses = [
        'pending',
        'approved',
        'rejected',
        'assigned',
        'in_progress',
        'on_hold',
        'completed',
        'cancelled',
    ];

    /**
     * Valid maintenance request priorities.
     */
    protected array $priorities = [
        'low',
        'medium',
        'high',
        'urgent',
    ];

    /**
     * Allowed status transitions.
     */
    protected array $statusTransitions = [
        'pending' => [
            'approved',
            'rejected',
            'cancelled',
        ],
        'approved' => [
            'assigned',
            'cancelled',
        ],
        'assigned' => [
            'in_progress',
            'on_hold',
            'cancelled',
        ],
        'in_progress' => [
            'on_hold',
            'completed',
            'cancelled',
        ],
        'on_hold' => [
            'in_progress',
            'cancelled',
        ],
        'rejected' => [],
        'completed' => [],
        'cancelled' => [],
    ];

    /**
     * Fields editable through the general update operation.
     */
    protected array $editableFields = [
        'property_id',
        'apartment_id',
        'unit_id',
        'tenant_id',
        'category_id',
        'title',
        'description',
        'priority',
        'is_emergency',
        'scheduled_at',
        'estimated_cost',
    ];

    /**
     * Allowed filter fields.
     */
    protected array $allowedFilters = [
        'search',
        'property_id',
        'apartment_id',
        'unit_id',
        'tenant_id',
        'technician_id',
        'category_id',
        'status',
        'priority',
        'is_emergency',
        'reported_by',
        'date_from',
        'date_to',
        'scheduled_from',
        'scheduled_to',
        'sort_by',
        'sort_direction',
    ];

    /**
     * Allowed sorting columns.
     */
    protected array $sortableColumns = [
        'id',
        'reference',
        'status',
        'priority',
        'scheduled_at',
        'completed_at',
        'total_cost',
        'created_at',
        'updated_at',
    ];

    public function __construct(
        MaintenanceRequestRepositoryInterface $repository
    ) {
        $this->repository = $repository;
    }

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    public function all(): Collection
    {
        return $this->repository->all();
    }

    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return $this->repository->paginate(
            $this->normalizePerPage($perPage)
        );
    }

    public function find(int $id): ?MaintenanceRequest
    {
        $this->validateId($id, 'maintenance_request_id');

        return $this->repository->find($id);
    }

    public function findByReference(string $reference): ?MaintenanceRequest
    {
        $reference = trim($reference);

        if ($reference === '') {
            throw ValidationException::withMessages([
                'reference' => [
                    'A maintenance request reference is required.',
                ],
            ]);
        }

        return $this->repository->findByReference($reference);
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Create a maintenance request.
     *
     * Location details are resolved from the selected unit.
     * The reporter is always the authenticated user.
     */
    public function create(array $data): MaintenanceRequest
    {
        return DB::transaction(function () use ($data) {
            $user = auth()->user();

            if (!$user) {
                throw ValidationException::withMessages([
                    'reported_by' => [
                        'An authenticated user is required to create a maintenance request.',
                    ],
                ]);
            }

            $data = $this->onlyFillableFields($data);

            /*
             * Remove system-managed values.
             * These must never be supplied by the client.
             */
            unset(
                $data['reference'],
                $data['reported_by'],
                $data['approved_by'],
                $data['assigned_by'],
                $data['rejected_at'],
                $data['cancelled_at'],
                $data['started_at'],
                $data['completed_at'],
                $data['completion_notes'],
                $data['total_cost']
            );

            /*
             * Automatically resolve tenant information for
             * authenticated tenant accounts.
             */
            $data = $this->resolveAuthenticatedTenant(
                $data,
                $user
            );

            /*
             * Validate and resolve property, apartment and unit.
             */
            $data = $this->resolveAndValidateLocation($data);

            /*
             * Validate tenant ownership and active tenancy.
             */
            $this->validateTenantTenancy($data, $user);

            /*
             * Set authenticated reporter.
             */
            $data['reported_by'] = $user->id;

            /*
             * Every new request starts as pending.
             */
            $data['status'] = MaintenanceRequest::STATUS_PENDING;

            if (isset($data['priority'])) {
                $this->validatePriority($data['priority']);
            }

            if (array_key_exists('is_emergency', $data)) {
                $data['is_emergency'] = $this->normalizeBoolean(
                    $data['is_emergency'],
                    'is_emergency'
                );
            }

            $this->validateCost(
                $data['estimated_cost'] ?? null,
                'estimated_cost'
            );

            return $this->repository->create($data);
        });
    }

    /**
     * Update an existing maintenance request.
     */
    public function update(
        int $id,
        array $data
    ): ?MaintenanceRequest {
        $this->validateId($id, 'maintenance_request_id');

        return DB::transaction(function () use ($id, $data) {
            $maintenanceRequest = $this->repository->find($id);

            if (!$maintenanceRequest) {
                return null;
            }

            if (in_array($maintenanceRequest->status, [
                MaintenanceRequest::STATUS_REJECTED,
                MaintenanceRequest::STATUS_COMPLETED,
                MaintenanceRequest::STATUS_CANCELLED,
            ], true)) {
                throw ValidationException::withMessages([
                    'status' => [
                        'This maintenance request can no longer be edited.',
                    ],
                ]);
            }

            $data = array_intersect_key(
                $data,
                array_flip($this->editableFields)
            );

            if (empty($data)) {
                return $maintenanceRequest;
            }

            /*
             * Validate the complete location relationship when
             * any location or tenant field is being changed.
             */
            $locationFields = [
                'property_id',
                'apartment_id',
                'unit_id',
                'tenant_id',
            ];

            if (count(array_intersect(
                array_keys($data),
                $locationFields
            )) > 0) {
                $locationData = [
                    'property_id' => $data['property_id']
                        ?? $maintenanceRequest->property_id,

                    'apartment_id' => array_key_exists(
                        'apartment_id',
                        $data
                    )
                        ? $data['apartment_id']
                        : $maintenanceRequest->apartment_id,

                    'unit_id' => $data['unit_id']
                        ?? $maintenanceRequest->unit_id,

                    'tenant_id' => array_key_exists(
                        'tenant_id',
                        $data
                    )
                        ? $data['tenant_id']
                        : $maintenanceRequest->tenant_id,
                ];

                $locationData = $this->resolveAndValidateLocation(
                    $locationData
                );

                $this->validateTenantTenancy(
                    $locationData,
                    auth()->user()
                );

                $data = array_merge($data, $locationData);
            }

            if (isset($data['priority'])) {
                $this->validatePriority($data['priority']);
            }

            if (array_key_exists('is_emergency', $data)) {
                $data['is_emergency'] = $this->normalizeBoolean(
                    $data['is_emergency'],
                    'is_emergency'
                );
            }

            if (array_key_exists('estimated_cost', $data)) {
                $this->validateCost(
                    $data['estimated_cost'],
                    'estimated_cost'
                );
            }

            return $this->repository->update($id, $data);
        });
    }

    /**
     * Delete a maintenance request.
     */
    public function delete(int $id): bool
    {
        $this->validateId($id, 'maintenance_request_id');

        return DB::transaction(function () use ($id) {
            $maintenanceRequest = $this->repository->find($id);

            if (!$maintenanceRequest) {
                return false;
            }

            if (in_array($maintenanceRequest->status, [
                MaintenanceRequest::STATUS_ASSIGNED,
                MaintenanceRequest::STATUS_IN_PROGRESS,
                MaintenanceRequest::STATUS_ON_HOLD,
            ], true)) {
                throw ValidationException::withMessages([
                    'status' => [
                        'This maintenance request cannot be deleted while it is actively being handled.',
                    ],
                ]);
            }

            return $this->repository->delete($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION VALIDATION
    |--------------------------------------------------------------------------
    */

    /**
     * Resolve property and apartment from the selected unit.
     *
     * The unit is the source of truth for its property and apartment.
     */
    protected function resolveAndValidateLocation(array $data): array
    {
        $unitId = $data['unit_id'] ?? null;

        if ($unitId) {
            $unit = DB::table('units')
                ->where('id', $unitId)
                ->first();

            if (!$unit) {
                throw ValidationException::withMessages([
                    'unit_id' => [
                        'The selected unit does not exist.',
                    ],
                ]);
            }

            /*
             * Reject mismatched property IDs.
             */
            if (
                !empty($data['property_id'])
                && (int) $data['property_id'] !== (int) $unit->property_id
            ) {
                throw ValidationException::withMessages([
                    'property_id' => [
                        'The selected property does not belong to the selected unit.',
                    ],
                ]);
            }

            /*
             * Reject mismatched apartment IDs.
             */
            if (
                !empty($data['apartment_id'])
                && (int) $data['apartment_id'] !== (int) $unit->apartment_id
            ) {
                throw ValidationException::withMessages([
                    'apartment_id' => [
                        'The selected apartment does not belong to the selected unit.',
                    ],
                ]);
            }

            /*
             * Always use the unit's actual relationships.
             */
            $data['property_id'] = $unit->property_id;
            $data['apartment_id'] = $unit->apartment_id;
        }

        /*
         * Validate property existence when supplied.
         */
        if (!empty($data['property_id'])) {
            $propertyExists = DB::table('properties')
                ->where('id', $data['property_id'])
                ->exists();

            if (!$propertyExists) {
                throw ValidationException::withMessages([
                    'property_id' => [
                        'The selected property does not exist.',
                    ],
                ]);
            }
        }

        /*
         * Validate apartment belongs to the selected property.
         */
        if (!empty($data['apartment_id'])) {
            $apartmentQuery = DB::table('apartments')
                ->where('id', $data['apartment_id']);

            if (!empty($data['property_id'])) {
                $apartmentQuery->where(
                    'property_id',
                    $data['property_id']
                );
            }

            if (!$apartmentQuery->exists()) {
                throw ValidationException::withMessages([
                    'apartment_id' => [
                        'The selected apartment does not belong to the selected property.',
                    ],
                ]);
            }
        }

        return $data;
    }

    /**
     * Resolve tenant automatically for a tenant account.
     */
    protected function resolveAuthenticatedTenant(
        array $data,
        $user
    ): array {
        if (
            !method_exists($user, 'hasRole')
            || !$user->hasRole('tenant', 'web')
        ) {
            return $data;
        }

        $tenant = DB::table('tenants')
            ->where('user_id', $user->id)
            ->first();

        if (!$tenant) {
            throw ValidationException::withMessages([
                'tenant_id' => [
                    'Your user account is not linked to a tenant profile.',
                ],
            ]);
        }

        if (
            !empty($data['tenant_id'])
            && (int) $data['tenant_id'] !== (int) $tenant->id
        ) {
            throw ValidationException::withMessages([
                'tenant_id' => [
                    'You can only create maintenance requests for your own tenant account.',
                ],
            ]);
        }

        $data['tenant_id'] = $tenant->id;

        return $data;
    }

    /**
     * Validate tenant and active tenancy for the selected unit.
     */
    protected function validateTenantTenancy(
        array $data,
        $user = null
    ): void {
        $tenantId = $data['tenant_id'] ?? null;
        $unitId = $data['unit_id'] ?? null;

        if (!$tenantId) {
            return;
        }

        $tenant = DB::table('tenants')
            ->where('id', $tenantId)
            ->first();

        if (!$tenant) {
            throw ValidationException::withMessages([
                'tenant_id' => [
                    'The selected tenant does not exist.',
                ],
            ]);
        }

        /*
         * A tenant account cannot submit requests for another tenant.
         */
        if (
            $user
            && method_exists($user, 'hasRole')
            && $user->hasRole('tenant', 'web')
            && (int) $tenant->user_id !== (int) $user->id
        ) {
            throw ValidationException::withMessages([
                'tenant_id' => [
                    'You can only create maintenance requests for your own tenant account.',
                ],
            ]);
        }

        /*
         * When a unit is specified, the tenant must have an
         * active tenancy for that particular unit.
         */
        if ($unitId) {
            $tenancyQuery = DB::table('tenancies')
                ->where('tenant_id', $tenantId)
                ->where('unit_id', $unitId)
                ->where('status', 'active');

            if (Schema::hasColumn('tenancies', 'is_active')) {
                $tenancyQuery->where('is_active', true);
            }

            if (!$tenancyQuery->exists()) {
                throw ValidationException::withMessages([
                    'tenant_id' => [
                        'The selected tenant does not have an active tenancy for this unit.',
                    ],
                ]);
            }
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERING AND SEARCH
    |--------------------------------------------------------------------------
    */

    public function filter(
        array $filters,
        int $perPage = 20
    ): LengthAwarePaginator {
        $filters = $this->cleanFilters($filters);

        return $this->repository->filter(
            $filters,
            $this->normalizePerPage($perPage)
        );
    }

    protected function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, 100));
    }

    protected function cleanFilters(array $filters): array
    {
        $cleanFilters = array_intersect_key(
            $filters,
            array_flip($this->allowedFilters)
        );

        // Search
        if (array_key_exists('search', $cleanFilters)) {
            $cleanFilters['search'] = trim(
                (string) $cleanFilters['search']
            );

            if ($cleanFilters['search'] === '') {
                unset($cleanFilters['search']);
            }
        }

        // Foreign key filters
        foreach ([
            'property_id',
            'apartment_id',
            'unit_id',
            'tenant_id',
            'technician_id',
            'category_id',
            'reported_by',
        ] as $key) {
            if (
                array_key_exists($key, $cleanFilters)
                && $cleanFilters[$key] !== null
                && $cleanFilters[$key] !== ''
            ) {
                $value = filter_var(
                    $cleanFilters[$key],
                    FILTER_VALIDATE_INT
                );

                if ($value === false || $value < 1) {
                    throw ValidationException::withMessages([
                        $key => [
                            "The {$key} must be a positive integer.",
                        ],
                    ]);
                }

                $cleanFilters[$key] = $value;
            } else {
                unset($cleanFilters[$key]);
            }
        }

        // Status
        if (isset($cleanFilters['status'])) {
            $this->validateStatus($cleanFilters['status']);
        }

        // Priority
        if (isset($cleanFilters['priority'])) {
            $this->validatePriority($cleanFilters['priority']);
        }

        // Emergency filter
        if (array_key_exists('is_emergency', $cleanFilters)) {
            $cleanFilters['is_emergency'] = $this->normalizeBoolean(
                $cleanFilters['is_emergency'],
                'is_emergency'
            );
        }

        // Date filters
        foreach ([
            'date_from',
            'date_to',
            'scheduled_from',
            'scheduled_to',
        ] as $key) {
            if (
                isset($cleanFilters[$key])
                && strtotime((string) $cleanFilters[$key]) === false
            ) {
                throw ValidationException::withMessages([
                    $key => [
                        "The {$key} must be a valid date.",
                    ],
                ]);
            }
        }

        // Date range validation
        if (
            isset($cleanFilters['date_from'], $cleanFilters['date_to'])
            && strtotime($cleanFilters['date_from'])
                > strtotime($cleanFilters['date_to'])
        ) {
            throw ValidationException::withMessages([
                'date_to' => [
                    'The end date must be on or after the start date.',
                ],
            ]);
        }

        if (
            isset(
                $cleanFilters['scheduled_from'],
                $cleanFilters['scheduled_to']
            )
            && strtotime($cleanFilters['scheduled_from'])
                > strtotime($cleanFilters['scheduled_to'])
        ) {
            throw ValidationException::withMessages([
                'scheduled_to' => [
                    'The scheduled end date must be on or after the scheduled start date.',
                ],
            ]);
        }

        // Sort column
        if (isset($cleanFilters['sort_by'])) {
            if (!in_array(
                $cleanFilters['sort_by'],
                $this->sortableColumns,
                true
            )) {
                throw ValidationException::withMessages([
                    'sort_by' => [
                        'The selected sort column is invalid.',
                    ],
                ]);
            }
        }

        // Sort direction
        if (isset($cleanFilters['sort_direction'])) {
            $direction = strtolower(
                (string) $cleanFilters['sort_direction']
            );

            if (!in_array($direction, ['asc', 'desc'], true)) {
                throw ValidationException::withMessages([
                    'sort_direction' => [
                        'Sort direction must be asc or desc.',
                    ],
                ]);
            }

            $cleanFilters['sort_direction'] = $direction;
        }

        return $cleanFilters;
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP QUERIES
    |--------------------------------------------------------------------------
    */

    public function findByProperty(int $propertyId): Collection
    {
        $this->validateId($propertyId, 'property_id');

        return $this->repository->findByProperty($propertyId);
    }

    public function findByUnit(int $unitId): Collection
    {
        $this->validateId($unitId, 'unit_id');

        return $this->repository->findByUnit($unitId);
    }

    public function findByTenant(int $tenantId): Collection
    {
        $this->validateId($tenantId, 'tenant_id');

        return $this->repository->findByTenant($tenantId);
    }

    public function findByTechnician(int $technicianId): Collection
    {
        $this->validateId($technicianId, 'technician_id');

        return $this->repository->findByTechnician($technicianId);
    }

    public function findByCategory(int $categoryId): Collection
    {
        $this->validateId($categoryId, 'category_id');

        return $this->repository->findByCategory($categoryId);
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS QUERIES
    |--------------------------------------------------------------------------
    */

    public function findByStatus(string $status): Collection
    {
        $this->validateStatus($status);

        return $this->repository->findByStatus($status);
    }

    public function pending(): Collection
    {
        return $this->repository->pending();
    }

    public function approved(): Collection
    {
        return $this->repository->approved();
    }

    public function rejected(): Collection
    {
        return $this->repository->rejected();
    }

    public function assigned(): Collection
    {
        return $this->repository->assigned();
    }

    public function inProgress(): Collection
    {
        return $this->repository->inProgress();
    }

    public function onHold(): Collection
    {
        return $this->repository->onHold();
    }

    public function completed(): Collection
    {
        return $this->repository->completed();
    }

    public function cancelled(): Collection
    {
        return $this->repository->cancelled();
    }

    public function overdue(): Collection
    {
        return $this->repository->overdue();
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS WORKFLOW
    |--------------------------------------------------------------------------
    */

    public function updateStatus(
        int $id,
        array $data
    ): ?MaintenanceRequest {
        $this->validateId($id, 'maintenance_request_id');

        return DB::transaction(function () use ($id, $data) {
            $maintenanceRequest = $this->repository->find($id);

            if (!$maintenanceRequest) {
                return null;
            }

            $newStatus = $data['status'] ?? null;

            $this->validateStatus($newStatus);

            $currentStatus = $maintenanceRequest->status;

            $this->validateStatusTransition(
                $currentStatus,
                $newStatus
            );

            // Required workflow reasons
            if (
                $newStatus === MaintenanceRequest::STATUS_REJECTED
                && empty($data['rejection_reason'])
                && empty($data['reason'])
            ) {
                throw ValidationException::withMessages([
                    'rejection_reason' => [
                        'A rejection reason is required.',
                    ],
                ]);
            }

            if (
                $newStatus === MaintenanceRequest::STATUS_CANCELLED
                && empty($data['cancellation_reason'])
                && empty($data['reason'])
            ) {
                throw ValidationException::withMessages([
                    'cancellation_reason' => [
                        'A cancellation reason is required.',
                    ],
                ]);
            }

            $updateData = [
                'status' => $newStatus,
            ];

            $userId = auth()->id();

            // Approved
            if ($newStatus === MaintenanceRequest::STATUS_APPROVED) {
                if (!$userId) {
                    throw ValidationException::withMessages([
                        'approved_by' => [
                            'An authenticated user is required to approve this request.',
                        ],
                    ]);
                }

                $updateData['approved_by'] = $userId;
            }

            // Rejected
            if ($newStatus === MaintenanceRequest::STATUS_REJECTED) {
                $updateData['rejected_at'] = now();

                $updateData['rejection_reason'] = trim(
                    (string) (
                        $data['rejection_reason']
                        ?? $data['reason']
                    )
                );
            }

            // Assigned
            if ($newStatus === MaintenanceRequest::STATUS_ASSIGNED) {
                if (!$userId) {
                    throw ValidationException::withMessages([
                        'assigned_by' => [
                            'An authenticated user is required to assign this request.',
                        ],
                    ]);
                }

                $updateData['assigned_by'] = $userId;
            }

            // In progress
            if ($newStatus === MaintenanceRequest::STATUS_IN_PROGRESS) {
                $updateData['started_at'] =
                    $maintenanceRequest->started_at ?? now();
            }

            // Completed
            if ($newStatus === MaintenanceRequest::STATUS_COMPLETED) {
                /*
                 * Calculate the final cost on the server.
                 *
                 * Do not accept total_cost from the client.
                 */
                $updateData['completed_at'] = now();

                $updateData['total_cost'] = $this->calculateFinalCost(
                    $maintenanceRequest
                );

                if (array_key_exists('completion_notes', $data)) {
                    $updateData['completion_notes'] =
                        $data['completion_notes'];
                }
            }

            // Cancelled
            if ($newStatus === MaintenanceRequest::STATUS_CANCELLED) {
                $updateData['cancelled_at'] = now();

                $updateData['cancellation_reason'] = trim(
                    (string) (
                        $data['cancellation_reason']
                        ?? $data['reason']
                    )
                );
            }

            /*
             * On hold:
             * The current MaintenanceRequest model does not have
             * held_at or hold_reason fields.
             */

            return $this->repository->update(
                $id,
                $updateData
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE COST CALCULATION
    |--------------------------------------------------------------------------
    */

    /**
     * Calculate the final actual maintenance cost.
     *
     * Formula:
     *
     * Completed assignment actual costs
     * +
     * Approved eligible maintenance expenses.
     *
     * Labour expenses linked to assignments are excluded because
     * their cost is already represented by assignment.actual_cost.
     *
     * Approved labour expenses without an assignment link are
     * included because they are not represented by an assignment.
     *
     * Payment status is intentionally not considered here:
     * approved expenses contribute to actual cost even when unpaid.
     */
    protected function calculateFinalCost(
        MaintenanceRequest $maintenanceRequest
    ): float {
        /*
         * 1. Actual labour cost from completed assignments.
         *
         * Estimated assignment costs are deliberately excluded.
         */
        $actualLabourCost = $maintenanceRequest->assignments()
            ->where(
                'status',
                MaintenanceAssignment::STATUS_COMPLETED
            )
            ->sum('actual_cost');

        /*
         * 2. Approved expenses.
         *
         * Include:
         * - Approved materials
         * - Approved spare parts
         * - Approved transport
         * - Approved equipment
         * - Approved services
         * - Approved other expenses
         * - Approved labour expenses without an assignment link
         *
         * Exclude:
         * - Pending expenses
         * - Rejected expenses
         * - Labour expenses already linked to assignments
         */
        $approvedExpenses = $maintenanceRequest->expenses()
            ->where(
                'status',
                MaintenanceExpense::STATUS_APPROVED
            )
            ->where(function ($query) {
                $query
                    ->where(
                        'category',
                        '!=',
                        MaintenanceExpense::CATEGORY_LABOUR
                    )
                    ->orWhereNull('maintenance_assignment_id');
            })
            ->sum('amount');

        /*
         * 3. Calculate the final total.
         */
        return round(
            (float) $actualLabourCost + (float) $approvedExpenses,
            2
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS VALIDATION
    |--------------------------------------------------------------------------
    */

    protected function validateStatus(?string $status): void
    {
        if (
            !$status
            || !in_array($status, $this->statuses, true)
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'The selected maintenance status is invalid.',
                ],
            ]);
        }
    }

    protected function validatePriority(?string $priority): void
    {
        if (
            !$priority
            || !in_array($priority, $this->priorities, true)
        ) {
            throw ValidationException::withMessages([
                'priority' => [
                    'The selected maintenance priority is invalid.',
                ],
            ]);
        }
    }

    protected function validateStatusTransition(
        string $currentStatus,
        string $newStatus
    ): void {
        if ($currentStatus === $newStatus) {
            throw ValidationException::withMessages([
                'status' => [
                    'The maintenance request already has this status.',
                ],
            ]);
        }

        $allowedTransitions =
            $this->statusTransitions[$currentStatus] ?? [];

        if (!in_array($newStatus, $allowedTransitions, true)) {
            throw ValidationException::withMessages([
                'status' => [
                    "A maintenance request cannot move from {$currentStatus} to {$newStatus}.",
                ],
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(array $filters = []): array
    {
        return $this->repository->statistics(
            $this->cleanFilters($filters)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DATA HELPERS
    |--------------------------------------------------------------------------
    */

    protected function onlyFillableFields(array $data): array
    {
        $model = new MaintenanceRequest();

        return array_intersect_key(
            $data,
            array_flip($model->getFillable())
        );
    }

    /**
     * Validate monetary values.
     */
    protected function validateCost(
        mixed $value,
        string $field
    ): void {
        if (
            $value !== null
            && $value !== ''
            && (
                !is_numeric($value)
                || (float) $value < 0
            )
        ) {
            throw ValidationException::withMessages([
                $field => [
                    "The {$field} must be a non-negative number.",
                ],
            ]);
        }
    }

    protected function normalizeBoolean(
        mixed $value,
        string $field
    ): bool {
        $normalized = filter_var(
            $value,
            FILTER_VALIDATE_BOOLEAN,
            FILTER_NULL_ON_FAILURE
        );

        if ($normalized === null) {
            throw ValidationException::withMessages([
                $field => [
                    "The {$field} field must be true or false.",
                ],
            ]);
        }

        return $normalized;
    }

    protected function validateId(
        int $id,
        string $field
    ): void {
        if ($id < 1) {
            throw ValidationException::withMessages([
                $field => [
                    'The identifier must be a positive integer.',
                ],
            ]);
        }
    }
}
