<?php

namespace App\Http\Controllers\Api\Tenancy;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenancy\StoreTenancyRequest;
use App\Http\Requests\Tenancy\UpdateTenancyRequest;
use App\Http\Resources\TenancyResource;
use App\Repositories\Interfaces\TenancyRepositoryInterface;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Tenancy;

class TenancyController extends Controller
{
    protected TenancyRepositoryInterface $tenancies;

    public function __construct(TenancyRepositoryInterface $tenancies)
    {
        $this->tenancies = $tenancies;
        $this->authorizeResource(Tenancy::class, 'tenancy');
    }

    /**
     * List all tenancies (paginated).
     */
    public function index(Request $request)
    {
        $paginator = $this->tenancies->paginate($request->all(), $request->get('per_page', 15));
        return ApiResponse::paginated($paginator, 'Tenancies fetched successfully');
    }

    /**
     * Show a specific tenancy.
     */
    public function show(Tenancy $tenancy)
    {
        return ApiResponse::success(new TenancyResource($tenancy->load(['tenant.user','property','apartment','unit'])), 'Tenancy fetched successfully');
    }

    /**
     * Store a new tenancy.
     */
    public function store(StoreTenancyRequest $request)
    {
        $tenancy = $this->tenancies->create($request->validated());
        return ApiResponse::created(new TenancyResource($tenancy), 'Tenancy created successfully');
    }

    /**
     * Update tenancy.
     */
    public function update(UpdateTenancyRequest $request, Tenancy $tenancy)
    {
        $updated = $this->tenancies->update($tenancy, $request->validated());
        return ApiResponse::updated(new TenancyResource($updated), 'Tenancy updated successfully');
    }

    /**
     * Delete tenancy (soft delete).
     */
    public function destroy(Tenancy $tenancy)
    {
        $this->tenancies->delete($tenancy);
        return ApiResponse::deleted(null, 'Tenancy deleted successfully');
    }

    /**
     * Restore tenancy.
     */
    public function restore($id)
    {
        $tenancy = $this->tenancies->restore($id);
        return $tenancy
            ? ApiResponse::success(new TenancyResource($tenancy), 'Tenancy restored successfully')
            : ApiResponse::notFound('Tenancy not found');
    }

    /**
     * Force delete tenancy.
     */
    public function forceDelete($id)
    {
        $deleted = $this->tenancies->forceDelete($id);
        return $deleted
            ? ApiResponse::deleted(null, 'Tenancy permanently deleted')
            : ApiResponse::notFound('Tenancy not found');
    }

    /**
     * Activate tenancy.
     */
    public function activate(Tenancy $tenancy)
    {
        $activated = $this->tenancies->activate($tenancy);
        return ApiResponse::success(new TenancyResource($activated), 'Tenancy activated successfully');
    }

    /**
     * Deactivate tenancy.
     */
    public function deactivate(Tenancy $tenancy)
    {
        $deactivated = $this->tenancies->deactivate($tenancy);
        return ApiResponse::success(new TenancyResource($deactivated), 'Tenancy deactivated successfully');
    }

    /**
     * Renew tenancy.
     */
    public function renew(Request $request, Tenancy $tenancy)
    {
        $data = $request->validate([
            'end_date' => 'required|date|after:today',
        ]);

        $renewed = $this->tenancies->renew($tenancy, $data);
        return ApiResponse::success(new TenancyResource($renewed), 'Tenancy renewed successfully');
    }

    /**
     * Assign unit to tenant.
     */
    public function assignUnit(Request $request)
    {
        $data = $request->validate([
            'tenant_id' => 'required|integer|exists:tenants,id',
            'unit_id'   => 'required|integer|exists:units,id',
            'start_date'=> 'required|date',
            'end_date'  => 'nullable|date|after_or_equal:start_date',
            'rent_amount' => 'required|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
        ]);

        $tenancy = $this->tenancies->assignUnit($data['tenant_id'], $data['unit_id'], $data);
        return ApiResponse::created(new TenancyResource($tenancy), 'Unit assigned to tenant successfully');
    }

    /**
     * Tenancy statistics.
     */
    public function statistics()
    {
        $stats = $this->tenancies->statistics();
        return ApiResponse::success($stats, 'Tenancy statistics fetched successfully');
    }
}
