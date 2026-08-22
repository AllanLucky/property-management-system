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
     * Relationships required by TenancyResource.
     */
    protected array $resourceRelations = [
        'tenant.user.roles',
        'tenant.user.permissions',
        'property.propertyType',
        'property.propertyCategory',
        'apartment.property',
        'unit',
    ];

    /**
     * Constructor.
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

    /**
     * List all tenancies.
     *
     * GET /api/tenancies
     */
    public function index(Request $request)
    {
        $perPage = (int) $request->get('per_page', 15);

        /*
         * Protect pagination from invalid values.
         */
        $perPage = max(1, min($perPage, 100));

        $paginator = $this->tenancies->paginate(
            $request->all(),
            $perPage
        );

        return ApiResponse::paginated(
            $paginator,
            'Tenancies fetched successfully'
        );
    }

    /**
     * Show a specific tenancy.
     *
     * GET /api/tenancies/{tenancy}
     */
    public function show(Tenancy $tenancy)
    {
        /*
         * Load all relationships required by TenancyResource.
         *
         * property.propertyType and property.propertyCategory
         * are especially important so the response contains the
         * complete property information.
         */
        $tenancy->load($this->resourceRelations);

        return ApiResponse::success(
            new TenancyResource($tenancy),
            'Tenancy fetched successfully'
        );
    }

    /**
     * Store a new tenancy.
     *
     * POST /api/tenancies
     */
    public function store(StoreTenancyRequest $request)
    {
        $tenancy = $this->tenancies->create(
            $request->validated()
        );

        /*
         * Reload relationships after creation.
         *
         * Repository create() may return a model without all
         * relationships loaded.
         */
        $tenancy->load($this->resourceRelations);

        return ApiResponse::created(
            new TenancyResource($tenancy),
            'Tenancy created successfully'
        );
    }

    /**
     * Update tenancy.
     *
     * PUT /api/tenancies/{tenancy}
     */
    public function update(
        UpdateTenancyRequest $request,
        Tenancy $tenancy
    ) {
        /*
         * Only validated fields are passed to the repository.
         */
        $data = $request->validated();

        /*
         * Update the tenancy through the repository.
         */
        $updated = $this->tenancies->update(
            $tenancy,
            $data
        );

        /*
         * Make sure we have a valid model instance.
         */
        if (!$updated instanceof Tenancy) {
            $updated = Tenancy::query()->find($tenancy->id);
        }

        /*
         * Reload all relationships after the update.
         *
         * This is important because the update response should have
         * the same complete structure as the GET /tenancies response.
         */
        $updated->load($this->resourceRelations);

        return ApiResponse::updated(
            new TenancyResource($updated),
            'Tenancy updated successfully'
        );
    }

    /**
     * Delete tenancy.
     *
     * Performs a soft delete through the repository.
     *
     * DELETE /api/tenancies/{tenancy}
     */
    public function destroy(Tenancy $tenancy)
    {
        $this->tenancies->delete($tenancy);

        return ApiResponse::deleted(
            null,
            'Tenancy deleted successfully'
        );
    }

    /**
     * Restore a soft-deleted tenancy.
     *
     * PATCH /api/tenancies/{id}/restore
     */
    public function restore($id)
    {
        $tenancy = $this->tenancies->restore($id);

        if (!$tenancy) {
            return ApiResponse::notFound(
                'Tenancy not found'
            );
        }

        /*
         * Load complete resource relationships.
         */
        $tenancy->load($this->resourceRelations);

        return ApiResponse::success(
            new TenancyResource($tenancy),
            'Tenancy restored successfully'
        );
    }

    /**
     * Permanently delete tenancy.
     *
     * DELETE /api/tenancies/{id}/force
     */
    public function forceDelete($id)
    {
        $deleted = $this->tenancies->forceDelete($id);

        if (!$deleted) {
            return ApiResponse::notFound(
                'Tenancy not found'
            );
        }

        return ApiResponse::deleted(
            null,
            'Tenancy permanently deleted'
        );
    }

    /**
     * Activate tenancy.
     *
     * PATCH /api/tenancies/{tenancy}/activate
     */
    public function activate(Tenancy $tenancy)
    {
        $activated = $this->tenancies->activate(
            $tenancy
        );

        /*
         * Reload relationships after status change.
         */
        $activated->load($this->resourceRelations);

        return ApiResponse::success(
            new TenancyResource($activated),
            'Tenancy activated successfully'
        );
    }

    /**
     * Deactivate tenancy.
     *
     * PATCH /api/tenancies/{tenancy}/deactivate
     */
    public function deactivate(Tenancy $tenancy)
    {
        $deactivated = $this->tenancies->deactivate(
            $tenancy
        );

        /*
         * Reload relationships after status change.
         */
        $deactivated->load($this->resourceRelations);

        return ApiResponse::success(
            new TenancyResource($deactivated),
            'Tenancy deactivated successfully'
        );
    }

    /**
     * Renew tenancy.
     *
     * POST /api/tenancies/{tenancy}/renew
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

        /*
         * Load complete resource relationships.
         */
        $renewed->load($this->resourceRelations);

        return ApiResponse::success(
            new TenancyResource($renewed),
            'Tenancy renewed successfully'
        );
    }

    /**
     * Assign a unit to a tenant.
     *
     * POST /api/tenancies/assign-unit
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

        /*
         * Load complete relationships for the response.
         */
        $tenancy->load($this->resourceRelations);

        return ApiResponse::created(
            new TenancyResource($tenancy),
            'Unit assigned to tenant successfully'
        );
    }

    /**
     * Get tenancy statistics.
     *
     * GET /api/tenancies/statistics
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