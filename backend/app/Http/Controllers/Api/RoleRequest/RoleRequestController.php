<?php

namespace App\Http\Controllers\Api\RoleRequest;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\RoleRequest\StoreRoleRequestRequest;
use App\Http\Resources\RoleRequestResource;
use App\Models\RoleRequest;
use App\Services\RoleRequestService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class RoleRequestController extends Controller
{
    public function __construct(
        protected RoleRequestService $roleRequestService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | LIST ROLE REQUESTS
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        try {
            $roleRequests = RoleRequest::query()
                ->with(['user', 'reviewer'])
                ->when($request->status, fn ($q, $status) =>
                    $q->where('status', $status)
                )
                ->when($request->requested_role, fn ($q, $role) =>
                    $q->where('requested_role', $role)
                )
                ->when($request->user_id, fn ($q, $userId) =>
                    $q->where('user_id', $userId)
                )
                ->latest()
                ->paginate($request->integer('per_page', 15));

            return ApiResponse::success(
                RoleRequestResource::collection($roleRequests),
                'Role requests fetched successfully.',
                200,
                [
                    'pagination' => [
                        'current_page' => $roleRequests->currentPage(),
                        'last_page' => $roleRequests->lastPage(),
                        'per_page' => $roleRequests->perPage(),
                        'total' => $roleRequests->total(),
                    ]
                ]
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to fetch role requests.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE ROLE REQUEST
    |--------------------------------------------------------------------------
    */
    public function store(StoreRoleRequestRequest $request)
    {
        try {
            $roleRequest = $this->roleRequestService->createRequest(
                $request->user(),
                $request->validated()
            );

            return ApiResponse::success(
                new RoleRequestResource(
                    $roleRequest->load(['user'])
                ),
                'Role request submitted successfully.',
                201
            );

        } catch (ValidationException $e) {
            return ApiResponse::error(
                'Validation failed.',
                $e->errors(),
                422
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to submit role request.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW ROLE REQUEST
    |--------------------------------------------------------------------------
    */
    public function show(RoleRequest $roleRequest)
    {
        try {
            return ApiResponse::success(
                new RoleRequestResource(
                    $roleRequest->load(['user', 'reviewer'])
                ),
                'Role request fetched successfully.'
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to fetch role request.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | APPROVE ROLE REQUEST
    |--------------------------------------------------------------------------
    */
    public function approve(Request $request, RoleRequest $roleRequest)
    {
        try {
            $data = $request->validate([
                'notes' => ['nullable', 'string', 'max:1000'],
            ]);

            $roleRequest = $this->roleRequestService->approve(
                $roleRequest,
                $request->user(),
                $data['notes'] ?? null
            );

            return ApiResponse::success(
                new RoleRequestResource(
                    $roleRequest->load(['user', 'reviewer'])
                ),
                'Role request approved successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::error(
                'Validation failed.',
                $e->errors(),
                422
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to approve role request.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | REJECT ROLE REQUEST
    |--------------------------------------------------------------------------
    */
    public function reject(Request $request, RoleRequest $roleRequest)
    {
        try {
            $data = $request->validate([
                'notes' => ['nullable', 'string', 'max:1000'],
            ]);

            $roleRequest = $this->roleRequestService->reject(
                $roleRequest,
                $request->user(),
                $data['notes'] ?? null
            );

            return ApiResponse::success(
                new RoleRequestResource(
                    $roleRequest->load(['user', 'reviewer'])
                ),
                'Role request rejected successfully.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::error(
                'Validation failed.',
                $e->errors(),
                422
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to reject role request.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE ROLE REQUEST
    |--------------------------------------------------------------------------
    */
    public function destroy(RoleRequest $roleRequest)
    {
        try {
            $roleRequest->delete();

            return ApiResponse::success(
                null,
                'Role request deleted successfully.'
            );

        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to delete role request.',
                $e->getMessage()
            );
        }
    }
}