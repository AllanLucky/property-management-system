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

class TenancyController extends Controller
{
    /**
     * Tenancy repository.
     */
    protected TenancyRepositoryInterface $tenancies;

    /**
     * Create controller instance.
     */
    public function __construct(TenancyRepositoryInterface $tenancies)
    {
        $this->tenancies = $tenancies;

        $this->authorizeResource(
            Tenancy::class,
            'tenancy'
        );
    }

    /**
     * List all tenancies.
     */
    public function index(Request $request)
    {
        $paginator = $this->tenancies->paginate(
            $request->all(),
            $request->get('per_page', 15)
        );

        return ApiResponse::paginated(
            $paginator,
            'Tenancies fetched successfully'
        );
    }

    /**
     * Show a specific tenancy.
     */
    public function show(Tenancy $tenancy)
    {
        $tenancy->load([
            'tenant.user',
            'property',
            'apartment',
            'unit',
        ]);

        return ApiResponse::success(
            new TenancyResource($tenancy),
            'Tenancy fetched successfully'
        );
    }

    /**
     * Store a new tenancy.
     */
    public function store(StoreTenancyRequest $request)
    {
        $tenancy = $this->tenancies->create(
            $request->validated()
        );

        /*
         * Load relationships required by the resource.
         */
        $tenancy->load([
            'tenant.user',
            'property',
            'apartment',
            'unit',
        ]);

        return ApiResponse::created(
            new TenancyResource($tenancy),
            'Tenancy created successfully'
        );
    }

    /**
     * Update tenancy.
     */
    public function update(
        UpdateTenancyRequest $request,
        Tenancy $tenancy
    ) {
        $updated = $this->tenancies->update(
            $tenancy,
            $request->validated()
        );

        /*
         * Load relationships required by the resource.
         */
        $updated->load([
            'tenant.user',
            'property',
            'apartment',
            'unit',
        ]);

        return ApiResponse::updated(
            new TenancyResource($updated),
            'Tenancy updated successfully'
        );
    }

    /**
     * Delete tenancy.
     *
     * IMPORTANT:
     * Do not use implicit model binding here.
     *
     * This allows us to return our own API response when the
     * tenancy does not exist instead of Laravel returning:
     *
     * "No query results for model [App\Models\Tenancy] {id}"
     */
    public function destroy($id)
    {
        /*
         * Find the tenancy manually.
         *
         * withTrashed() is useful when the model uses SoftDeletes.
         * This allows us to correctly identify records that have
         * already been deleted.
         */
        $tenancy = Tenancy::withTrashed()->find($id);

        /*
         * Tenancy does not exist.
         */
        if (!$tenancy) {
            return ApiResponse::notFound(
                'Tenancy not found.'
            );
        }

        /*
         * Tenancy already exists but was previously soft deleted.
         */
        if ($tenancy->trashed()) {
            return ApiResponse::notFound(
                'Tenancy not found or has already been deleted.'
            );
        }

        /*
         * Delete the tenancy through the repository.
         */
        $deleted = $this->tenancies->delete($tenancy);

        /*
         * Make sure the delete operation succeeded.
         */
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
    }

    /**
     * Restore tenancy.
     */
    public function restore($id)
    {
        $tenancy = $this->tenancies->restore($id);

        if (!$tenancy) {
            return ApiResponse::notFound(
                'Tenancy not found.'
            );
        }

        /*
         * Load relationships for the response.
         */
        $tenancy->load([
            'tenant.user',
            'property',
            'apartment',
            'unit',
        ]);

        return ApiResponse::success(
            new TenancyResource($tenancy),
            'Tenancy restored successfully'
        );
    }

    /**
     * Permanently delete tenancy.
     */
    public function forceDelete($id)
    {
        /*
         * Check whether the record exists before force deletion.
         */
        $tenancy = Tenancy::withTrashed()->find($id);

        if (!$tenancy) {
            return ApiResponse::notFound(
                'Tenancy not found.'
            );
        }

        $deleted = $this->tenancies->forceDelete($id);

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
    }

    /**
     * Activate tenancy.
     */
    public function activate(Tenancy $tenancy)
    {
        $activated = $this->tenancies->activate(
            $tenancy
        );

        $activated->load([
            'tenant.user',
            'property',
            'apartment',
            'unit',
        ]);

        return ApiResponse::success(
            new TenancyResource($activated),
            'Tenancy activated successfully'
        );
    }

    /**
     * Deactivate tenancy.
     */
    public function deactivate(Tenancy $tenancy)
    {
        $deactivated = $this->tenancies->deactivate(
            $tenancy
        );

        $deactivated->load([
            'tenant.user',
            'property',
            'apartment',
            'unit',
        ]);

        return ApiResponse::success(
            new TenancyResource($deactivated),
            'Tenancy deactivated successfully'
        );
    }

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

        $renewed = $this->tenancies->renew(
            $tenancy,
            $data
        );

        $renewed->load([
            'tenant.user',
            'property',
            'apartment',
            'unit',
        ]);

        return ApiResponse::success(
            new TenancyResource($renewed),
            'Tenancy renewed successfully'
        );
    }

    /**
     * Assign unit to tenant.
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

        $tenancy = $this->tenancies->assignUnit(
            $data['tenant_id'],
            $data['unit_id'],
            $data
        );

        $tenancy->load([
            'tenant.user',
            'property',
            'apartment',
            'unit',
        ]);

        return ApiResponse::created(
            new TenancyResource($tenancy),
            'Unit assigned to tenant successfully'
        );
    }

    /**
     * Tenancy statistics.
     */
    public function statistics()
    {
        $stats = $this->tenancies->statistics();

        return ApiResponse::success(
            $stats,
            'Tenancy statistics fetched successfully'
        );
    }
}