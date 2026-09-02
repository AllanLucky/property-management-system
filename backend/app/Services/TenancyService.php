<?php

namespace App\Services\Tenancy;

use App\Helpers\ApiResponse;
use App\Models\Tenancy;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Throwable;

class TenancyService
{
    /**
     * Relationships loaded whenever a tenancy is returned.
     */
    protected array $relations = [
        'tenant.user.roles',
        'tenant.user.permissions',
        'tenant.tenancies',
        'property.propertyType',
        'property.propertyCategory',
        'apartment.property',
        'unit',
    ];

    /*
    |--------------------------------------------------------------------------
    | LIST / INDEX
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated tenancies.
     */
    public function getAll(array $filters = []): JsonResponse
    {
        $query = Tenancy::query()
            ->with($this->relations);

        $this->applyFilters($query, $filters);

        $perPage = max(
            1,
            min((int) ($filters['per_page'] ?? 15), 100)
        );

        $paginator = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return ApiResponse::paginated(
            $paginator,
            'Tenancies fetched successfully'
        );
    }

    /**
     * Get all tenancies without pagination.
     */
    public function all(array $filters = []): JsonResponse
    {
        $query = Tenancy::query()
            ->with($this->relations);

        $this->applyFilters($query, $filters);

        $collection = $query
            ->latest()
            ->get();

        return ApiResponse::collection(
            $collection,
            'Tenancies fetched successfully'
        );
    }

    /**
     * Apply supported tenancy filters.
     */
    protected function applyFilters($query, array $filters): void
    {
        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['search'])) {
            $search = trim((string) $filters['search']);

            $query->where(function ($q) use ($search) {
                $q->where('tenancy_number', 'like', "%{$search}%")
                    ->orWhereHas('tenant', function ($tenantQuery) use ($search) {
                        $tenantQuery
                            ->where('tenant_number', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('other_names', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    })
                    ->orWhereHas('tenant.user', function ($userQuery) use ($search) {
                        $userQuery
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    });
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        /*
        |--------------------------------------------------------------------------
        | Active
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('is_active', $filters)) {
            $value = filter_var(
                $filters['is_active'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($value !== null) {
                $query->where('is_active', $value);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Tenant
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['tenant_id'])) {
            $query->where(
                'tenant_id',
                (int) $filters['tenant_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Property
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['property_id'])) {
            $query->where(
                'property_id',
                (int) $filters['property_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Apartment
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['apartment_id'])) {
            $query->where(
                'apartment_id',
                (int) $filters['apartment_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Unit
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['unit_id'])) {
            $query->where(
                'unit_id',
                (int) $filters['unit_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Date Filters
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['start_date_from'])) {
            $query->whereDate(
                'start_date',
                '>=',
                $filters['start_date_from']
            );
        }

        if (!empty($filters['start_date_to'])) {
            $query->whereDate(
                'start_date',
                '<=',
                $filters['start_date_to']
            );
        }

        if (!empty($filters['end_date_from'])) {
            $query->whereDate(
                'end_date',
                '>=',
                $filters['end_date_from']
            );
        }

        if (!empty($filters['end_date_to'])) {
            $query->whereDate(
                'end_date',
                '<=',
                $filters['end_date_to']
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FIND
    |--------------------------------------------------------------------------
    */

    /**
     * Find tenancy by ID.
     */
    public function find(int|string $id): JsonResponse
    {
        try {
            $tenancy = Tenancy::query()
                ->with($this->relations)
                ->findOrFail($id);

            return ApiResponse::success(
                $tenancy,
                'Tenancy fetched successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::notFound(
                'Tenancy not found'
            );
        }
    }

    /**
     * Find tenancy by tenancy number.
     */
    public function findByNumber(string $number): JsonResponse
    {
        try {
            $tenancy = Tenancy::query()
                ->with($this->relations)
                ->where('tenancy_number', $number)
                ->firstOrFail();

            return ApiResponse::success(
                $tenancy,
                'Tenancy fetched successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::notFound(
                'Tenancy not found'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new tenancy.
     *
     * Business rule:
     * A tenant cannot have more than one active or pending
     * tenancy at the same time.
     */
    public function create(array $data): JsonResponse
    {
        return DB::transaction(function () use ($data) {

            /*
            |--------------------------------------------------------------------------
            | Tenant is required
            |--------------------------------------------------------------------------
            */

            if (empty($data['tenant_id'])) {
                return ApiResponse::validation([
                    'tenant_id' => 'Tenant is required.',
                ]);
            }

            $tenantId = (int) $data['tenant_id'];

            /*
            |--------------------------------------------------------------------------
            | Normalize defaults
            |--------------------------------------------------------------------------
            */

            $data['status'] = $data['status']
                ?? Tenancy::STATUS_PENDING;

            $data['is_active'] = array_key_exists(
                'is_active',
                $data
            )
                ? (bool) $data['is_active']
                : true;

            /*
            |--------------------------------------------------------------------------
            | Prevent duplicate tenant assignment
            |--------------------------------------------------------------------------
            |
            | Active and pending tenancies both block a tenant from being
            | assigned to another tenancy.
            |
            */

            $blockingTenancy = Tenancy::query()
                ->where('tenant_id', $tenantId)
                ->blockingTenantAssignment()
                ->lockForUpdate()
                ->first();

            if ($blockingTenancy) {
                return ApiResponse::conflict(
                    'The selected tenant is already assigned to an active or pending tenancy.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Prevent double occupancy of the unit
            |--------------------------------------------------------------------------
            */

            if (!empty($data['unit_id'])) {
                $unitHasBlockingTenancy = Tenancy::query()
                    ->where('unit_id', (int) $data['unit_id'])
                    ->blockingTenantAssignment()
                    ->lockForUpdate()
                    ->exists();

                if ($unitHasBlockingTenancy) {
                    return ApiResponse::conflict(
                        'The selected unit is already occupied or reserved by another tenancy.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Create tenancy
            |--------------------------------------------------------------------------
            */

            $tenancy = Tenancy::create($data)
                ->load($this->relations);

            return ApiResponse::created(
                $tenancy,
                'Tenancy created successfully'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing tenancy.
     *
     * The tenant may only be changed to another tenant who does not
     * already have an active or pending tenancy.
     */
    public function update(
        Tenancy $tenancy,
        array $data
    ): JsonResponse {
        return DB::transaction(function () use ($tenancy, $data) {

            /*
            |--------------------------------------------------------------------------
            | Lock current tenancy
            |--------------------------------------------------------------------------
            */

            $tenancy->refresh();

            /*
            |--------------------------------------------------------------------------
            | Tenant reassignment protection
            |--------------------------------------------------------------------------
            */

            if (
                array_key_exists('tenant_id', $data)
                && !empty($data['tenant_id'])
                && (int) $data['tenant_id'] !== (int) $tenancy->tenant_id
            ) {
                $newTenantId = (int) $data['tenant_id'];

                $blockingTenancy = Tenancy::query()
                    ->where('tenant_id', $newTenantId)
                    ->where('id', '!=', $tenancy->id)
                    ->blockingTenantAssignment()
                    ->lockForUpdate()
                    ->first();

                if ($blockingTenancy) {
                    return ApiResponse::conflict(
                        'The selected tenant is already assigned to an active or pending tenancy.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Unit reassignment protection
            |--------------------------------------------------------------------------
            */

            if (
                array_key_exists('unit_id', $data)
                && !empty($data['unit_id'])
                && (int) $data['unit_id'] !== (int) $tenancy->unit_id
            ) {
                $newUnitId = (int) $data['unit_id'];

                $unitHasBlockingTenancy = Tenancy::query()
                    ->where('unit_id', $newUnitId)
                    ->where('id', '!=', $tenancy->id)
                    ->blockingTenantAssignment()
                    ->lockForUpdate()
                    ->exists();

                if ($unitHasBlockingTenancy) {
                    return ApiResponse::conflict(
                        'The selected unit is already occupied or reserved by another tenancy.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Apply update
            |--------------------------------------------------------------------------
            */

            $tenancy->update($data);

            $tenancy->refresh()
                ->load($this->relations);

            return ApiResponse::updated(
                $tenancy,
                'Tenancy updated successfully'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE / RESTORE / FORCE DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a tenancy.
     */
    public function delete(Tenancy $tenancy): JsonResponse
    {
        return DB::transaction(function () use ($tenancy) {

            $tenancy->update([
                'is_active' => false,
            ]);

            $tenancy->delete();

            return ApiResponse::deleted(
                null,
                'Tenancy deleted successfully'
            );
        });
    }

    /**
     * Restore a soft-deleted tenancy.
     *
     * A restored active/pending tenancy must not conflict with
     * another active/pending tenancy belonging to the same tenant.
     */
    public function restore(int|string $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {

            $tenancy = Tenancy::withTrashed()
                ->findOrFail($id);

            /*
            |--------------------------------------------------------------------------
            | Check tenant conflict before restoring
            |--------------------------------------------------------------------------
            */

            if (
                in_array(
                    $tenancy->status,
                    [
                        Tenancy::STATUS_ACTIVE,
                        Tenancy::STATUS_PENDING,
                    ],
                    true
                )
                && $tenancy->tenant_id
            ) {
                $blockingTenancy = Tenancy::query()
                    ->where('tenant_id', $tenancy->tenant_id)
                    ->where('id', '!=', $tenancy->id)
                    ->blockingTenantAssignment()
                    ->lockForUpdate()
                    ->first();

                if ($blockingTenancy) {
                    return ApiResponse::conflict(
                        'This tenancy cannot be restored because the tenant already has an active or pending tenancy.'
                    );
                }
            }

            $tenancy->restore();

            /*
            |--------------------------------------------------------------------------
            | Restore active/pending tenancy as active
            |--------------------------------------------------------------------------
            */

            if (
                in_array(
                    $tenancy->status,
                    [
                        Tenancy::STATUS_ACTIVE,
                        Tenancy::STATUS_PENDING,
                    ],
                    true
                )
            ) {
                $tenancy->update([
                    'is_active' => true,
                ]);
            }

            $tenancy->refresh()
                ->load($this->relations);

            return ApiResponse::success(
                $tenancy,
                'Tenancy restored successfully'
            );
        });
    }

    /**
     * Permanently delete a tenancy.
     */
    public function forceDelete(int|string $id): JsonResponse
    {
        return DB::transaction(function () use ($id) {

            $tenancy = Tenancy::withTrashed()
                ->findOrFail($id);

            $tenancy->forceDelete();

            return ApiResponse::deleted(
                null,
                'Tenancy permanently deleted'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | LIFECYCLE METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a tenancy.
     *
     * Before activation:
     * - Tenant cannot already have another active/pending tenancy.
     * - Unit cannot already have another active/pending tenancy.
     */
    public function activate(Tenancy $tenancy): JsonResponse
    {
        return DB::transaction(function () use ($tenancy) {

            $tenancy->refresh();

            /*
            |--------------------------------------------------------------------------
            | Tenant protection
            |--------------------------------------------------------------------------
            */

            if ($tenancy->tenant_id) {
                $blockingTenancy = Tenancy::query()
                    ->where('tenant_id', $tenancy->tenant_id)
                    ->where('id', '!=', $tenancy->id)
                    ->blockingTenantAssignment()
                    ->lockForUpdate()
                    ->first();

                if ($blockingTenancy) {
                    return ApiResponse::conflict(
                        'This tenant is already assigned to another active or pending tenancy.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Unit protection
            |--------------------------------------------------------------------------
            */

            if ($tenancy->unit_id) {
                $unitHasBlockingTenancy = Tenancy::query()
                    ->where('unit_id', $tenancy->unit_id)
                    ->where('id', '!=', $tenancy->id)
                    ->blockingTenantAssignment()
                    ->lockForUpdate()
                    ->exists();

                if ($unitHasBlockingTenancy) {
                    return ApiResponse::conflict(
                        'The selected unit is already occupied or reserved by another tenancy.'
                    );
                }
            }

            $tenancy->update([
                'status' => Tenancy::STATUS_ACTIVE,
                'is_active' => true,
            ]);

            $tenancy->refresh()
                ->load($this->relations);

            return ApiResponse::success(
                $tenancy,
                'Tenancy activated successfully'
            );
        });
    }

    /**
     * Deactivate a tenancy without changing its status.
     */
    public function deactivate(Tenancy $tenancy): JsonResponse
    {
        $tenancy->update([
            'is_active' => false,
        ]);

        return ApiResponse::success(
            $tenancy->refresh()->load($this->relations),
            'Tenancy deactivated successfully'
        );
    }

    /**
     * Expire a tenancy.
     */
    public function expire(Tenancy $tenancy): JsonResponse
    {
        $tenancy->update([
            'status' => Tenancy::STATUS_EXPIRED,
            'is_active' => false,
        ]);

        return ApiResponse::success(
            $tenancy->refresh()->load($this->relations),
            'Tenancy expired successfully'
        );
    }

    /**
     * Terminate a tenancy.
     */
    public function terminate(
        Tenancy $tenancy,
        ?string $notes = null
    ): JsonResponse {
        $updates = [
            'status' => Tenancy::STATUS_TERMINATED,
            'is_active' => false,
        ];

        if ($notes !== null) {
            $updates['notes'] = $notes;
        }

        $tenancy->update($updates);

        return ApiResponse::success(
            $tenancy->refresh()->load($this->relations),
            'Tenancy terminated successfully'
        );
    }

    /**
     * Cancel a tenancy.
     */
    public function cancel(
        Tenancy $tenancy,
        ?string $notes = null
    ): JsonResponse {
        $updates = [
            'status' => Tenancy::STATUS_CANCELLED,
            'is_active' => false,
        ];

        if ($notes !== null) {
            $updates['notes'] = $notes;
        }

        $tenancy->update($updates);

        return ApiResponse::success(
            $tenancy->refresh()->load($this->relations),
            'Tenancy cancelled successfully'
        );
    }

    /**
     * Mark tenancy as pending.
     *
     * IMPORTANT:
     * Pending tenancies remain active because they reserve the tenant
     * and therefore prevent another tenancy from being created.
     */
    public function pending(Tenancy $tenancy): JsonResponse
    {
        return DB::transaction(function () use ($tenancy) {

            $tenancy->refresh();

            /*
            |--------------------------------------------------------------------------
            | Tenant protection
            |--------------------------------------------------------------------------
            */

            if ($tenancy->tenant_id) {
                $blockingTenancy = Tenancy::query()
                    ->where('tenant_id', $tenancy->tenant_id)
                    ->where('id', '!=', $tenancy->id)
                    ->blockingTenantAssignment()
                    ->lockForUpdate()
                    ->first();

                if ($blockingTenancy) {
                    return ApiResponse::conflict(
                        'This tenant is already assigned to another active or pending tenancy.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Pending remains active
            |--------------------------------------------------------------------------
            */

            $tenancy->update([
                'status' => Tenancy::STATUS_PENDING,
                'is_active' => true,
            ]);

            $tenancy->refresh()
                ->load($this->relations);

            return ApiResponse::success(
                $tenancy,
                'Tenancy marked as pending successfully'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN UNIT
    |--------------------------------------------------------------------------
    */

    /**
     * Assign a unit to a tenant by creating an active tenancy.
     */
    public function assignUnit(
        int $tenantId,
        int $unitId,
        array $data = []
    ): JsonResponse {
        return DB::transaction(function () use (
            $tenantId,
            $unitId,
            $data
        ) {

            /*
            |--------------------------------------------------------------------------
            | Tenant protection
            |--------------------------------------------------------------------------
            */

            $tenantHasBlockingTenancy = Tenancy::query()
                ->where('tenant_id', $tenantId)
                ->blockingTenantAssignment()
                ->lockForUpdate()
                ->exists();

            if ($tenantHasBlockingTenancy) {
                return ApiResponse::conflict(
                    'The selected tenant is already assigned to an active or pending tenancy.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Unit protection
            |--------------------------------------------------------------------------
            */

            $unitHasBlockingTenancy = Tenancy::query()
                ->where('unit_id', $unitId)
                ->blockingTenantAssignment()
                ->lockForUpdate()
                ->exists();

            if ($unitHasBlockingTenancy) {
                return ApiResponse::conflict(
                    'Unit is already occupied or reserved.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Create tenancy
            |--------------------------------------------------------------------------
            */

            $data['tenant_id'] = $tenantId;
            $data['unit_id'] = $unitId;
            $data['status'] = Tenancy::STATUS_ACTIVE;
            $data['is_active'] = true;

            $tenancy = Tenancy::create($data)
                ->load($this->relations);

            return ApiResponse::created(
                $tenancy,
                'Unit assigned to tenant successfully'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RENEW TENANCY
    |--------------------------------------------------------------------------
    */

    /**
     * Renew an existing tenancy.
     *
     * Renewal keeps the same tenancy record and extends its end date.
     */
    public function renew(
        Tenancy $tenancy,
        array $data
    ): JsonResponse {
        return DB::transaction(function () use (
            $tenancy,
            $data
        ) {

            $tenancy->refresh();

            if (empty($data['end_date'])) {
                return ApiResponse::validation([
                    'end_date' => 'The end date is required.',
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Ensure another tenancy does not conflict
            |--------------------------------------------------------------------------
            */

            if ($tenancy->tenant_id) {
                $blockingTenancy = Tenancy::query()
                    ->where('tenant_id', $tenancy->tenant_id)
                    ->where('id', '!=', $tenancy->id)
                    ->blockingTenantAssignment()
                    ->lockForUpdate()
                    ->first();

                if ($blockingTenancy) {
                    return ApiResponse::conflict(
                        'The tenant already has another active or pending tenancy.'
                    );
                }
            }

            $updates = [
                'end_date' => $data['end_date'],
                'status' => Tenancy::STATUS_ACTIVE,
                'is_active' => true,
            ];

            /*
            |--------------------------------------------------------------------------
            | Optional renewal fields
            |--------------------------------------------------------------------------
            */

            foreach ([
                'rent_amount',
                'deposit_amount',
                'service_charge',
                'late_fee',
                'payment_frequency',
                'due_day',
                'notes',
            ] as $field) {
                if (array_key_exists($field, $data)) {
                    $updates[$field] = $data[$field];
                }
            }

            $tenancy->update($updates);

            $tenancy->refresh()
                ->load($this->relations);

            return ApiResponse::success(
                $tenancy,
                'Tenancy renewed successfully'
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE TENANTS
    |--------------------------------------------------------------------------
    */

    /**
     * Get tenants who are eligible to be assigned to a new tenancy.
     *
     * A tenant is available when they do not have another active
     * or pending tenancy.
     */
    public function availableTenants(): JsonResponse
    {
        $tenants = \App\Models\Tenant::query()
            ->with([
                'user',
            ])
            ->availableForTenancy()
            ->latest()
            ->get();

        return ApiResponse::collection(
            $tenants,
            'Available tenants fetched successfully'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get tenancy statistics.
     */
    public function statistics(): JsonResponse
    {
        $stats = [
            /*
            |--------------------------------------------------------------------------
            | Counts
            |--------------------------------------------------------------------------
            */

            'total' => Tenancy::count(),

            'active' => Tenancy::active()
                ->count(),

            'pending' => Tenancy::pending()
                ->count(),

            'expired' => Tenancy::expired()
                ->count(),

            'terminated' => Tenancy::terminated()
                ->count(),

            'cancelled' => Tenancy::cancelled()
                ->count(),

            'currently_active' => Tenancy::currentlyActive()
                ->count(),

            /*
            |--------------------------------------------------------------------------
            | Move-in / Move-out
            |--------------------------------------------------------------------------
            */

            'moved_in' => Tenancy::query()
                ->whereNotNull('move_in_date')
                ->count(),

            'moved_out' => Tenancy::query()
                ->whereNotNull('move_out_date')
                ->count(),

            /*
            |--------------------------------------------------------------------------
            | Financial totals
            |--------------------------------------------------------------------------
            */

            'total_rent' => (float) Tenancy::query()
                ->whereNotIn('status', [
                    Tenancy::STATUS_CANCELLED,
                ])
                ->sum('rent_amount'),

            'total_deposits' => (float) Tenancy::query()
                ->whereNotIn('status', [
                    Tenancy::STATUS_CANCELLED,
                ])
                ->sum('deposit_amount'),
        ];

        return ApiResponse::success(
            $stats,
            'Tenancy statistics fetched successfully'
        );
    }
}