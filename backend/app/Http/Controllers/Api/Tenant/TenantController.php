<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\CreateTenantRequest;
use App\Http\Requests\Tenant\UpdateTenantRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Services\TenantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class TenantController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Constructor
    |--------------------------------------------------------------------------
    */

    public function __construct(
        protected TenantService $tenantService
    ) {
    }


    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    | GET /api/tenants
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        try {

            $filters = [

                'search' => $request->input('search'),

                'status' => $request->input('status'),

                'is_active' => $request->has('is_active')
                    ? $request->boolean('is_active')
                    : null,

                'is_verified' => $request->has('is_verified')
                    ? $request->boolean('is_verified')
                    : null,

                'gender' => $request->input('gender'),

                'country' => $request->input('country'),

                'county' => $request->input('county'),

                'city' => $request->input('city'),

                'sort_by' => $request->input(
                    'sort_by',
                    'created_at'
                ),

                'sort_direction' => $request->input(
                    'sort_direction',
                    'desc'
                ),

                'per_page' => $request->input(
                    'per_page',
                    15
                ),
            ];


            $tenants = $this->tenantService->paginate(
                $filters
            );


            return ApiResponse::paginated(
                TenantResource::collection($tenants),
                'Tenants fetched successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch tenants.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    | POST /api/tenants
    |--------------------------------------------------------------------------
    */

    public function store(
        CreateTenantRequest $request
    ): JsonResponse {

        try {

            $tenant = $this->tenantService->create(
                $request->validated()
            );


            return ApiResponse::created(
                new TenantResource($tenant),
                'Tenant created successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to create tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    | GET /api/tenants/{tenant}
    |--------------------------------------------------------------------------
    */

    public function show(
        Tenant $tenant
    ): JsonResponse {

        try {

            $tenant = $this->tenantService->find(
                $tenant->id
            );


            if (!$tenant) {

                return ApiResponse::notFound(
                    'Tenant not found.'
                );
            }


            return ApiResponse::success(
                new TenantResource($tenant),
                'Tenant fetched successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    | PUT/PATCH /api/tenants/{tenant}
    |--------------------------------------------------------------------------
    */

    public function update(
        UpdateTenantRequest $request,
        Tenant $tenant
    ): JsonResponse {

        try {

            $updatedTenant = $this->tenantService->update(
                $tenant,
                $request->validated()
            );


            return ApiResponse::updated(
                new TenantResource($updatedTenant),
                'Tenant updated successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to update tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DESTROY
    |--------------------------------------------------------------------------
    | DELETE /api/tenants/{tenant}
    |--------------------------------------------------------------------------
    */

    public function destroy(
        Tenant $tenant
    ): JsonResponse {

        try {

            $deleted = $this->tenantService->delete(
                $tenant
            );


            if (!$deleted) {

                return ApiResponse::serverError(
                    'Failed to delete tenant.'
                );
            }


            return ApiResponse::deleted(
                null,
                'Tenant deleted successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to delete tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    | GET /api/tenants/search
    |--------------------------------------------------------------------------
    */

    public function search(
        Request $request
    ): JsonResponse {

        try {

            $search = trim(
                (string) $request->input(
                    'search',
                    ''
                )
            );


            if ($search === '') {

                return ApiResponse::validation([
                    'search' => [
                        'Search term is required.'
                    ],
                ]);
            }


            $limit = (int) $request->input(
                'limit',
                20
            );


            $tenants = $this->tenantService->search(
                $search,
                $limit
            );


            return ApiResponse::collection(
                TenantResource::collection($tenants),
                'Tenant search completed successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to search tenants.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | ACTIVE TENANTS
    |--------------------------------------------------------------------------
    | GET /api/tenants/active
    |--------------------------------------------------------------------------
    */

    public function active(): JsonResponse
    {
        try {

            $tenants = $this->tenantService->getActive();


            return ApiResponse::collection(
                TenantResource::collection($tenants),
                'Active tenants fetched successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch active tenants.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | PENDING TENANTS
    |--------------------------------------------------------------------------
    | GET /api/tenants/pending
    |--------------------------------------------------------------------------
    */

    public function pending(): JsonResponse
    {
        try {

            $tenants = $this->tenantService->getPending();


            return ApiResponse::collection(
                TenantResource::collection($tenants),
                'Pending tenants fetched successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch pending tenants.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | INACTIVE TENANTS
    |--------------------------------------------------------------------------
    | GET /api/tenants/inactive
    |--------------------------------------------------------------------------
    */

    public function inactive(): JsonResponse
    {
        try {

            $tenants = $this->tenantService->getInactive();


            return ApiResponse::collection(
                TenantResource::collection($tenants),
                'Inactive tenants fetched successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch inactive tenants.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | BLACKLISTED TENANTS
    |--------------------------------------------------------------------------
    | GET /api/tenants/blacklisted
    |--------------------------------------------------------------------------
    */

    public function blacklisted(): JsonResponse
    {
        try {

            $tenants = $this->tenantService->getBlacklisted();


            return ApiResponse::collection(
                TenantResource::collection($tenants),
                'Blacklisted tenants fetched successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch blacklisted tenants.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | ACTIVATE
    |--------------------------------------------------------------------------
    | PATCH /api/tenants/{tenant}/activate
    |--------------------------------------------------------------------------
    */

    public function activate(
        Tenant $tenant
    ): JsonResponse {

        try {

            $tenant = $this->tenantService->activate(
                $tenant
            );


            return ApiResponse::updated(
                new TenantResource($tenant),
                'Tenant activated successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to activate tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE
    |--------------------------------------------------------------------------
    | PATCH /api/tenants/{tenant}/deactivate
    |--------------------------------------------------------------------------
    */

    public function deactivate(
        Tenant $tenant
    ): JsonResponse {

        try {

            $tenant = $this->tenantService->deactivate(
                $tenant
            );


            return ApiResponse::updated(
                new TenantResource($tenant),
                'Tenant deactivated successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to deactivate tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | BLACKLIST
    |--------------------------------------------------------------------------
    | PATCH /api/tenants/{tenant}/blacklist
    |--------------------------------------------------------------------------
    */

    public function blacklist(
        Tenant $tenant
    ): JsonResponse {

        try {

            $tenant = $this->tenantService->blacklist(
                $tenant
            );


            return ApiResponse::updated(
                new TenantResource($tenant),
                'Tenant blacklisted successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to blacklist tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SET PENDING
    |--------------------------------------------------------------------------
    | PATCH /api/tenants/{tenant}/pending
    |--------------------------------------------------------------------------
    */

    public function pendingStatus(
        Tenant $tenant
    ): JsonResponse {

        try {

            $tenant = $this->tenantService->setPending(
                $tenant
            );


            return ApiResponse::updated(
                new TenantResource($tenant),
                'Tenant status changed to pending.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to update tenant status.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | VERIFY
    |--------------------------------------------------------------------------
    | PATCH /api/tenants/{tenant}/verify
    |--------------------------------------------------------------------------
    */

    public function verify(
        Tenant $tenant
    ): JsonResponse {

        try {

            $tenant = $this->tenantService->verify(
                $tenant
            );


            return ApiResponse::updated(
                new TenantResource($tenant),
                'Tenant verified successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to verify tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UNVERIFY
    |--------------------------------------------------------------------------
    | PATCH /api/tenants/{tenant}/unverify
    |--------------------------------------------------------------------------
    */

    public function unverify(
        Tenant $tenant
    ): JsonResponse {

        try {

            $tenant = $this->tenantService->unverify(
                $tenant
            );


            return ApiResponse::updated(
                new TenantResource($tenant),
                'Tenant verification removed successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to remove tenant verification.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    | GET /api/tenants/statistics
    |--------------------------------------------------------------------------
    */

    public function statistics(): JsonResponse
    {
        try {

            $statistics =
                $this->tenantService->statistics();


            return ApiResponse::success(
                $statistics,
                'Tenant statistics fetched successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch tenant statistics.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    | PATCH /api/tenants/{id}/restore
    |--------------------------------------------------------------------------
    */

    public function restore(
        int $id
    ): JsonResponse {

        try {

            $tenant = $this->tenantService->restore(
                $id
            );


            if (!$tenant) {

                return ApiResponse::notFound(
                    'Tenant not found.'
                );
            }


            return ApiResponse::updated(
                new TenantResource($tenant),
                'Tenant restored successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to restore tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    | DELETE /api/tenants/{id}/force
    |--------------------------------------------------------------------------
    */

    public function forceDelete(
        int $id
    ): JsonResponse {

        try {

            $deleted = $this->tenantService->forceDelete(
                $id
            );


            if (!$deleted) {

                return ApiResponse::notFound(
                    'Tenant not found.'
                );
            }


            return ApiResponse::deleted(
                null,
                'Tenant permanently deleted successfully.'
            );

        } catch (Throwable $e) {

            return ApiResponse::serverError(
                'Failed to permanently delete tenant.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | EXCEPTION ERRORS
    |--------------------------------------------------------------------------
    */

    protected function exceptionErrors(
        Throwable $exception
    ): ?array {

        /*
        |--------------------------------------------------------------------------
        | Do not expose internal exception details in production.
        |--------------------------------------------------------------------------
        */

        if (
            !app()->environment('local') &&
            !config('app.debug')
        ) {
            return null;
        }


        return [
            'error' => $exception->getMessage(),

            'exception' => get_class(
                $exception
            ),

            'file' => $exception->getFile(),

            'line' => $exception->getLine(),
        ];
    }
}