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
use RuntimeException;
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
    | AVAILABLE TENANT USERS
    |--------------------------------------------------------------------------
    | GET /api/tenants/users
    |--------------------------------------------------------------------------
    |
    | Returns existing User accounts that:
    |
    | 1. Have the "tenant" Spatie role.
    | 2. Do not already have a Tenant profile.
    |
    | IMPORTANT:
    |
    | This endpoint does NOT create users.
    |
    | The frontend uses the returned user_id to create a Tenant profile
    | linked to the existing User account.
    |
    */

    public function tenantUsers(
        Request $request
    ): JsonResponse {
        try {
            $search = $request->input('search');

            $limit = (int) $request->input(
                'limit',
                100
            );

            $users = $this->tenantService->getAvailableTenantUsers(
                $search,
                $limit
            );

            $data = $users
                ->map(
                    static function ($user): array {
                        $name = trim(
                            implode(
                                ' ',
                                array_filter([
                                    $user->first_name,
                                    $user->last_name,
                                ])
                            )
                        );

                        return [
                            'id' => $user->id,

                            'first_name' =>
                                $user->first_name,

                            'last_name' =>
                                $user->last_name,

                            'name' =>
                                $name !== ''
                                    ? $name
                                    : $user->name,

                            'email' =>
                                $user->email,

                            'phone' =>
                                $user->phone,
                        ];
                    }
                )
                ->values();

            return ApiResponse::collection(
                $data,
                'Available tenant users fetched successfully.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to fetch available tenant users.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | ALL TENANT ROLE USERS
    |--------------------------------------------------------------------------
    | GET /api/tenants/all-users
    |--------------------------------------------------------------------------
    |
    | Returns ALL User accounts having the "tenant" Spatie role.
    |
    | Unlike tenantUsers(), users already linked to a Tenant profile are
    | also returned.
    |
    */

    public function allTenantUsers(): JsonResponse
    {
        try {
            /*
            |--------------------------------------------------------------------------
            | The TenantService intentionally exposes only available users.
            |
            | For the complete tenant-role user listing we query the User model
            | through the existing tenant relationship.
            |--------------------------------------------------------------------------
            */

            $users = \App\Models\User::query()
                ->role('tenant')
                ->with([
                    'tenant:id,user_id,tenant_number,status',
                ])
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get([
                    'id',
                    'first_name',
                    'last_name',
                    'name',
                    'email',
                    'phone',
                ]);

            $data = $users
                ->map(
                    static function ($user): array {
                        $name = trim(
                            implode(
                                ' ',
                                array_filter([
                                    $user->first_name,
                                    $user->last_name,
                                ])
                            )
                        );

                        return [
                            'id' =>
                                $user->id,

                            'first_name' =>
                                $user->first_name,

                            'last_name' =>
                                $user->last_name,

                            'name' =>
                                $name !== ''
                                    ? $name
                                    : $user->name,

                            'email' =>
                                $user->email,

                            'phone' =>
                                $user->phone,

                            'has_tenant_profile' =>
                                $user->tenant !== null,

                            'tenant' =>
                                $user->tenant
                                    ? [
                                        'id' =>
                                            $user->tenant->id,

                                        'tenant_number' =>
                                            $user->tenant->tenant_number,

                                        'status' =>
                                            $user->tenant->status,
                                    ]
                                    : null,
                        ];
                    }
                )
                ->values();

            return ApiResponse::collection(
                $data,
                'All tenant-role users fetched successfully.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to fetch tenant-role users.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | AVAILABLE USERS ALIAS
    |--------------------------------------------------------------------------
    | GET /api/tenants/available-users
    |--------------------------------------------------------------------------
    |
    | Backwards-compatible alias for tenantUsers().
    |
    */

    public function availableUsers(
        Request $request
    ): JsonResponse {
        return $this->tenantUsers($request);
    }


    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    | GET /api/tenants
    |--------------------------------------------------------------------------
    */

    public function index(
        Request $request
    ): JsonResponse {
        try {
            $filters = [
                /*
                |------------------------------------------------------------------
                | Search
                |------------------------------------------------------------------
                */

                'search' =>
                    $request->input('search'),

                /*
                |------------------------------------------------------------------
                | User
                |------------------------------------------------------------------
                */

                'user_id' =>
                    $request->input('user_id'),

                /*
                |------------------------------------------------------------------
                | Status
                |------------------------------------------------------------------
                */

                'status' =>
                    $request->input('status'),

                /*
                |------------------------------------------------------------------
                | Activity
                |------------------------------------------------------------------
                |
                | IMPORTANT:
                |
                | There is no is_active database column.
                |
                | TenantService translates this filter into the appropriate
                | status condition.
                |
                */

                'is_active' =>
                    $request->has('is_active')
                        ? $request->input('is_active')
                        : null,

                /*
                |------------------------------------------------------------------
                | Active Tenancy
                |------------------------------------------------------------------
                */

                'has_active_tenancy' =>
                    $request->has('has_active_tenancy')
                        ? $request->input('has_active_tenancy')
                        : null,

                /*
                |------------------------------------------------------------------
                | Verification
                |------------------------------------------------------------------
                */

                'is_verified' =>
                    $request->has('is_verified')
                        ? $request->input('is_verified')
                        : null,

                /*
                |------------------------------------------------------------------
                | Demographics
                |------------------------------------------------------------------
                */

                'gender' =>
                    $request->input('gender'),

                'nationality' =>
                    $request->input('nationality'),

                /*
                |------------------------------------------------------------------
                | Location
                |------------------------------------------------------------------
                */

                'country' =>
                    $request->input('country'),

                'region' =>
                    $request->input('region'),

                'county' =>
                    $request->input('county'),

                'city' =>
                    $request->input('city'),

                'area' =>
                    $request->input('area'),

                'postal_code' =>
                    $request->input('postal_code'),

                /*
                |------------------------------------------------------------------
                | Date Range
                |------------------------------------------------------------------
                */

                'start_date' =>
                    $request->input('start_date'),

                'end_date' =>
                    $request->input('end_date'),

                /*
                |------------------------------------------------------------------
                | Sorting
                |------------------------------------------------------------------
                */

                'sort_by' =>
                    $request->input(
                        'sort_by',
                        'created_at'
                    ),

                'sort_direction' =>
                    $request->input(
                        'sort_direction',
                        'desc'
                    ),

                /*
                |------------------------------------------------------------------
                | Pagination
                |------------------------------------------------------------------
                */

                'per_page' =>
                    $request->input(
                        'per_page',
                        15
                    ),
            ];

            /*
            |--------------------------------------------------------------------------
            | Remove only empty scalar filters
            |--------------------------------------------------------------------------
            */

            $filters = array_filter(
                $filters,
                static fn ($value): bool =>
                    $value !== null &&
                    $value !== ''
            );

            $tenants = $this->tenantService->paginate(
                $filters
            );

            $tenants->loadMissing([
                'user',
            ]);

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
    |
    | Creates a Tenant profile from an existing User account.
    |
    | The selected User must:
    |
    | 1. Exist.
    | 2. Have the tenant role.
    | 3. Not already have a Tenant profile.
    |
    | No User account is created here.
    |
    */

    public function store(
        CreateTenantRequest $request
    ): JsonResponse {
        try {
            $data = $request->validated();

            /*
            |--------------------------------------------------------------------------
            | Validate user selection
            |--------------------------------------------------------------------------
            */

            if (
                !isset($data['user_id']) ||
                !filled($data['user_id'])
            ) {
                return ApiResponse::validation([
                    'user_id' => [
                        'An existing user with the tenant role must be selected.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | Resolve available tenant user
            |--------------------------------------------------------------------------
            |
            | TenantService verifies:
            |
            | - User exists
            | - User has tenant role
            | - User does not already have a tenant profile
            |
            */

            $this->tenantService->getAvailableTenantUser(
                $data['user_id']
            );

            /*
            |--------------------------------------------------------------------------
            | Uploaded documents
            |--------------------------------------------------------------------------
            */

            $photo = $request->file('photo');

            $idFront = $request->file('id_front');

            $idBack = $request->file('id_back');

            /*
            |--------------------------------------------------------------------------
            | Create tenant profile
            |--------------------------------------------------------------------------
            */

            $tenant = $this->tenantService->create(
                $data,
                $photo,
                $idFront,
                $idBack
            );

            $tenant->loadMissing([
                'user',
            ]);

            return ApiResponse::created(
                new TenantResource($tenant),
                'Tenant profile created successfully from the existing tenant user account.'
            );

        } catch (RuntimeException $e) {
            return ApiResponse::validation([
                'user_id' => [
                    $e->getMessage(),
                ],
            ]);

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to create tenant profile.',
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

            $tenant->loadMissing([
                'user',
            ]);

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
            $data = $request->validated();

            $updatedTenant = $this->tenantService->update(
                $tenant,
                $data,
                $request->file('photo'),
                $request->file('id_front'),
                $request->file('id_back')
            );

            $updatedTenant->loadMissing([
                'user',
            ]);

            return ApiResponse::updated(
                new TenantResource($updatedTenant),
                'Tenant profile updated successfully.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to update tenant profile.',
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
    |
    | Performs a soft delete.
    |
    | The linked User account remains untouched.
    |
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
                    'Failed to delete tenant profile.'
                );
            }

            return ApiResponse::deleted(
                null,
                'Tenant profile deleted successfully. The user account remains unchanged.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to delete tenant profile.',
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
                        'Search term is required.',
                    ],
                ]);
            }

            $limit = max(
                1,
                min(
                    (int) $request->input(
                        'limit',
                        20
                    ),
                    100
                )
            );

            $tenants = $this->tenantService->search(
                $search,
                $limit
            );

            $tenants->loadMissing([
                'user',
            ]);

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
    | ACTIVE
    |--------------------------------------------------------------------------
    | GET /api/tenants/active
    |--------------------------------------------------------------------------
    */

    public function active(): JsonResponse
    {
        return $this->collectionResponse(
            fn () => $this->tenantService->getActive(),
            'Active tenants fetched successfully.',
            'Failed to fetch active tenants.'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | PENDING
    |--------------------------------------------------------------------------
    | GET /api/tenants/pending
    |--------------------------------------------------------------------------
    */

    public function pending(): JsonResponse
    {
        return $this->collectionResponse(
            fn () => $this->tenantService->getPending(),
            'Pending tenants fetched successfully.',
            'Failed to fetch pending tenants.'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | INACTIVE
    |--------------------------------------------------------------------------
    | GET /api/tenants/inactive
    |--------------------------------------------------------------------------
    */

    public function inactive(): JsonResponse
    {
        return $this->collectionResponse(
            fn () => $this->tenantService->getInactive(),
            'Inactive tenants fetched successfully.',
            'Failed to fetch inactive tenants.'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | BLACKLISTED
    |--------------------------------------------------------------------------
    | GET /api/tenants/blacklisted
    |--------------------------------------------------------------------------
    */

    public function blacklisted(): JsonResponse
    {
        return $this->collectionResponse(
            fn () => $this->tenantService->getBlacklisted(),
            'Blacklisted tenants fetched successfully.',
            'Failed to fetch blacklisted tenants.'
        );
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

            return $this->resourceResponse(
                $tenant,
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

            return $this->resourceResponse(
                $tenant,
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

            return $this->resourceResponse(
                $tenant,
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

            return $this->resourceResponse(
                $tenant,
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

            return $this->resourceResponse(
                $tenant,
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

            return $this->resourceResponse(
                $tenant,
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
            $statistics = $this->tenantService->statistics();

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
    | REPORTS
    |--------------------------------------------------------------------------
    | GET /api/tenants/reports
    |--------------------------------------------------------------------------
    |
    | Supports:
    |
    | ?start_date=2026-01-01
    | ?end_date=2026-12-31
    |
    */

    public function reports(
        Request $request
    ): JsonResponse {
        try {
            $filters = [
                'start_date' =>
                    $request->input('start_date'),

                'end_date' =>
                    $request->input('end_date'),
            ];

            $filters = array_filter(
                $filters,
                static fn ($value): bool =>
                    $value !== null &&
                    $value !== ''
            );

            $reports = $this->tenantService->reports(
                $filters
            );

            return ApiResponse::success(
                $reports,
                'Tenant reports fetched successfully.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to generate tenant reports.',
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

            return $this->resourceResponse(
                $tenant,
                'Tenant profile restored successfully.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to restore tenant profile.',
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
                    'Tenant profile not found.'
                );
            }

            return ApiResponse::deleted(
                null,
                'Tenant profile permanently deleted successfully. The user account remains untouched.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to permanently delete tenant profile.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD PHOTO
    |--------------------------------------------------------------------------
    | POST /api/tenants/{tenant}/photo
    |--------------------------------------------------------------------------
    */

    public function uploadPhoto(
        Request $request,
        Tenant $tenant
    ): JsonResponse {
        try {
            $request->validate([
                'photo' => [
                    'required',
                    'file',
                    'image',
                    'mimes:jpg,jpeg,png,webp',
                    'max:5120',
                ],
            ]);

            $tenant = $this->tenantService->uploadPhoto(
                $tenant,
                $request->file('photo')
            );

            return $this->resourceResponse(
                $tenant,
                'Tenant photo uploaded successfully.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to upload tenant photo.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD FRONT ID
    |--------------------------------------------------------------------------
    | POST /api/tenants/{tenant}/id-front
    |--------------------------------------------------------------------------
    */

    public function uploadIdFront(
        Request $request,
        Tenant $tenant
    ): JsonResponse {
        try {
            $request->validate([
                'id_front' => [
                    'required',
                    'file',
                    'mimes:jpg,jpeg,png,webp,pdf',
                    'max:5120',
                ],
            ]);

            $tenant = $this->tenantService->uploadIdFront(
                $tenant,
                $request->file('id_front')
            );

            return $this->resourceResponse(
                $tenant,
                'Tenant ID front uploaded successfully.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to upload tenant ID front.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD BACK ID
    |--------------------------------------------------------------------------
    | POST /api/tenants/{tenant}/id-back
    |--------------------------------------------------------------------------
    */

    public function uploadIdBack(
        Request $request,
        Tenant $tenant
    ): JsonResponse {
        try {
            $request->validate([
                'id_back' => [
                    'required',
                    'file',
                    'mimes:jpg,jpeg,png,webp,pdf',
                    'max:5120',
                ],
            ]);

            $tenant = $this->tenantService->uploadIdBack(
                $tenant,
                $request->file('id_back')
            );

            return $this->resourceResponse(
                $tenant,
                'Tenant ID back uploaded successfully.'
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                'Failed to upload tenant ID back.',
                $this->exceptionErrors($e)
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | PRIVATE RESPONSE HELPERS
    |--------------------------------------------------------------------------
    */

    protected function resourceResponse(
        Tenant $tenant,
        string $message
    ): JsonResponse {
        $tenant->loadMissing([
            'user',
        ]);

        return ApiResponse::updated(
            new TenantResource($tenant),
            $message
        );
    }


    protected function collectionResponse(
        callable $callback,
        string $successMessage,
        string $errorMessage
    ): JsonResponse {
        try {
            $tenants = $callback();

            $tenants->loadMissing([
                'user',
            ]);

            return ApiResponse::collection(
                TenantResource::collection($tenants),
                $successMessage
            );

        } catch (Throwable $e) {
            return ApiResponse::serverError(
                $errorMessage,
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
        | Never expose internal application details in production.
        |--------------------------------------------------------------------------
        */

        if (
            !app()->environment('local') &&
            !config('app.debug')
        ) {
            return null;
        }

        return [
            'error' =>
                $exception->getMessage(),

            'exception' =>
                get_class($exception),

            'file' =>
                $exception->getFile(),

            'line' =>
                $exception->getLine(),
        ];
    }
}
