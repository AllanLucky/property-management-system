<?php

namespace App\Http\Controllers\Api\Tenancy;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenancy\StoreTenancyRequest;
use App\Http\Requests\Tenancy\UpdateTenancyRequest;
use App\Http\Resources\TenancyResource;
use App\Models\Tenancy;
use App\Repositories\Interfaces\TenancyRepositoryInterface;
use Illuminate\Http\Request;
use Throwable;

class TenancyController extends Controller
{
    /**
     * Tenancy repository.
     */
    protected TenancyRepositoryInterface $tenancies;

    /**
     * Relationships required by TenancyResource.
     *
     * Keeping this in one place prevents the controller from
     * repeatedly declaring slightly different relationship sets.
     */
    protected array $resourceRelations = [
        'tenant.user.roles',
        'tenant.user.permissions',
        'tenant.tenancies',
        'property.propertyType',
        'property.propertyCategory',
        'apartment.property',
        'unit',
    ];

    /**
     * Create controller instance.
     */
    public function __construct(
        TenancyRepositoryInterface $tenancies
    ) {
        $this->tenancies = $tenancies;

        $this->authorizeResource(
            Tenancy::class,
            'tenancy'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | LIST / INDEX
    |--------------------------------------------------------------------------
    */

    /**
     * List all tenancies.
     */
    public function index(Request $request)
    {
        $paginator = $this->tenancies->paginate(
            $request->all(),
            $request->get('per_page', 15)
        );

        /*
         * Ensure the relationships required by TenancyResource
         * are loaded on the paginated tenancy collection.
         *
         * Repositories may already eager-load some of these.
         * loadMissing() avoids unnecessarily reloading them.
         */
        $paginator->getCollection()->loadMissing(
            $this->resourceRelations
        );

        return ApiResponse::paginated(
            $paginator,
            'Tenancies fetched successfully'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    /**
     * Show a specific tenancy.
     */
    public function show(Tenancy $tenancy)
    {
        $tenancy->loadMissing(
            $this->resourceRelations
        );

        return ApiResponse::success(
            new TenancyResource($tenancy),
            'Tenancy fetched successfully'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    /**
     * Store a new tenancy.
     */
    public function store(StoreTenancyRequest $request)
    {
        try {
            $tenancy = $this->tenancies->create(
                $request->validated()
            );

            /*
             * Repository create() should return the created
             * Tenancy model.
             */
            if (!$tenancy instanceof Tenancy) {
                return ApiResponse::error(
                    'Failed to create tenancy.',
                    500
                );
            }

            $tenancy->loadMissing(
                $this->resourceRelations
            );

            return ApiResponse::created(
                new TenancyResource($tenancy),
                'Tenancy created successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to create tenancy.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Update tenancy.
     */
    public function update(
        UpdateTenancyRequest $request,
        Tenancy $tenancy
    ) {
        try {
            $updated = $this->tenancies->update(
                $tenancy,
                $request->validated()
            );

            if (!$updated instanceof Tenancy) {
                return ApiResponse::error(
                    'Failed to update tenancy.',
                    500
                );
            }

            $updated->loadMissing(
                $this->resourceRelations
            );

            return ApiResponse::updated(
                new TenancyResource($updated),
                'Tenancy updated successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to update tenancy.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Delete tenancy.
     *
     * IMPORTANT:
     * Do not use implicit model binding here.
     *
     * This allows the controller to return the application's
     * own API response when a tenancy does not exist.
     */
    public function destroy($id)
    {
        /*
         * Find manually so we can handle:
         *
         * 1. Non-existent tenancy
         * 2. Already deleted tenancy
         * 3. Existing active tenancy
         */
        $tenancy = Tenancy::withTrashed()->find($id);

        if (!$tenancy) {
            return ApiResponse::notFound(
                'Tenancy not found.'
            );
        }

        /*
         * Already soft deleted.
         */
        if ($tenancy->trashed()) {
            return ApiResponse::notFound(
                'Tenancy not found or has already been deleted.'
            );
        }

        try {
            /*
             * Repository handles the actual delete operation.
             *
             * The repository should:
             * - set is_active = false
             * - soft delete the tenancy
             */
            $deleted = $this->tenancies->delete(
                $tenancy
            );

            if (!$deleted) {
                return ApiResponse::error(
                    'Failed to delete tenancy.',
                    500
                );
            }

            return ApiResponse::deleted(
                null,
                'Tenancy deleted successfully.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to delete tenancy.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    /**
     * Restore tenancy.
     */
    public function restore($id)
    {
        try {
            /*
             * The repository is responsible for checking whether
             * restoring this tenancy would create a tenant/unit
             * assignment conflict.
             */
            $tenancy = $this->tenancies->restore($id);

            if (!$tenancy instanceof Tenancy) {
                return ApiResponse::notFound(
                    'Tenancy not found.'
                );
            }

            $tenancy->loadMissing(
                $this->resourceRelations
            );

            return ApiResponse::success(
                new TenancyResource($tenancy),
                'Tenancy restored successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to restore tenancy.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete tenancy.
     */
    public function forceDelete($id)
    {
        /*
         * Check whether the record exists before force deletion.
         *
         * withTrashed() is important because a soft-deleted tenancy
         * can still be permanently removed.
         */
        $tenancy = Tenancy::withTrashed()->find($id);

        if (!$tenancy) {
            return ApiResponse::notFound(
                'Tenancy not found.'
            );
        }

        try {
            $deleted = $this->tenancies->forceDelete(
                $id
            );

            if (!$deleted) {
                return ApiResponse::error(
                    'Failed to permanently delete tenancy.',
                    500
                );
            }

            return ApiResponse::deleted(
                null,
                'Tenancy permanently deleted.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to permanently delete tenancy.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE
    |--------------------------------------------------------------------------
    */

    /**
     * Activate tenancy.
     *
     * The repository/service layer must verify that:
     *
     * - The tenant does not have another active/pending tenancy.
     * - The unit does not have another active/pending tenancy.
     */
    public function activate(Tenancy $tenancy)
    {
        try {
            $activated = $this->tenancies->activate(
                $tenancy
            );

            if (!$activated instanceof Tenancy) {
                return ApiResponse::error(
                    'Failed to activate tenancy.',
                    500
                );
            }

            $activated->loadMissing(
                $this->resourceRelations
            );

            return ApiResponse::success(
                new TenancyResource($activated),
                'Tenancy activated successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to activate tenancy.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE
    |--------------------------------------------------------------------------
    */

    /**
     * Deactivate tenancy.
     */
    public function deactivate(Tenancy $tenancy)
    {
        try {
            $deactivated = $this->tenancies->deactivate(
                $tenancy
            );

            if (!$deactivated instanceof Tenancy) {
                return ApiResponse::error(
                    'Failed to deactivate tenancy.',
                    500
                );
            }

            $deactivated->loadMissing(
                $this->resourceRelations
            );

            return ApiResponse::success(
                new TenancyResource($deactivated),
                'Tenancy deactivated successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to deactivate tenancy.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RENEW
    |--------------------------------------------------------------------------
    */

    /**
     * Renew tenancy.
     */
    public function renew(
        Request $request,
        Tenancy $tenancy
    ) {
        $data = $request->validate([
            'end_date' => [
                'required',
                'date',
                'after:today',
            ],
        ]);

        try {
            $renewed = $this->tenancies->renew(
                $tenancy,
                $data
            );

            if (!$renewed instanceof Tenancy) {
                return ApiResponse::error(
                    'Failed to renew tenancy.',
                    500
                );
            }

            $renewed->loadMissing(
                $this->resourceRelations
            );

            return ApiResponse::success(
                new TenancyResource($renewed),
                'Tenancy renewed successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to renew tenancy.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN UNIT
    |--------------------------------------------------------------------------
    */

    /**
     * Assign unit to tenant.
     *
     * Existing route is preserved.
     *
     * The repository/service layer is responsible for enforcing:
     *
     * - Tenant cannot already have active/pending tenancy.
     * - Unit cannot already have active/pending tenancy.
     */
    public function assignUnit(Request $request)
    {
        $data = $request->validate([
            'tenant_id' => [
                'required',
                'integer',
                'exists:tenants,id',
            ],

            'unit_id' => [
                'required',
                'integer',
                'exists:units,id',
            ],

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            'rent_amount' => [
                'required',
                'numeric',
                'min:0',
            ],

            'deposit_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],
        ]);

        try {
            $tenancy = $this->tenancies->assignUnit(
                $data['tenant_id'],
                $data['unit_id'],
                $data
            );

            if (!$tenancy instanceof Tenancy) {
                return ApiResponse::error(
                    'Failed to assign unit to tenant.',
                    500
                );
            }

            $tenancy->loadMissing(
                $this->resourceRelations
            );

            return ApiResponse::created(
                new TenancyResource($tenancy),
                'Unit assigned to tenant successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to assign unit to tenant.',
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Tenancy statistics.
     */
    public function statistics()
    {
        try {
            $stats = $this->tenancies->statistics();

            return ApiResponse::success(
                $stats,
                'Tenancy statistics fetched successfully'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::error(
                'Failed to fetch tenancy statistics.',
                500
            );
        }
    }
}