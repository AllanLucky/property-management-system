<?php

namespace App\Http\Controllers\Api\Tenant;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\CreateTenantRequest;
use App\Http\Requests\Tenant\UpdateTenantRequest;
use App\Http\Resources\TenantResource;
use App\Models\Tenant;
use App\Models\User;
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
    | AVAILABLE TENANT USERS
    |--------------------------------------------------------------------------
    | GET /api/tenants/users
    |--------------------------------------------------------------------------
    |
    | PURPOSE:
    |
    | Return existing User accounts that:
    |
    | 1. Have the "tenant" Spatie role.
    | 2. Do NOT already have a Tenant profile.
    |
    | This endpoint is intended for the Create Tenant form.
    |
    | IMPORTANT:
    |
    | We are NOT creating a new User here.
    |
    | We are selecting an existing User and creating a Tenant profile
    | connected to that User through tenants.user_id.
    |
    */

    public function tenantUsers(): JsonResponse
    {
        try {

            /*
            |--------------------------------------------------------------------------
            | Find users already assigned to tenant profiles
            |--------------------------------------------------------------------------
            */

            $assignedUserIds = Tenant::query()
                ->whereNotNull('user_id')
                ->pluck('user_id');


            /*
            |--------------------------------------------------------------------------
            | Fetch available tenant users
            |--------------------------------------------------------------------------
            |
            | Spatie role:
            |
            | tenant
            |
            | Exclude users who already have a tenant profile.
            |
            */

            $users = User::query()
                ->whereHas(
                    'roles',
                    function ($query) {
                        $query->where('name', 'tenant');
                    }
                )
                ->when(
                    $assignedUserIds->isNotEmpty(),
                    function ($query) use ($assignedUserIds) {
                        $query->whereNotIn(
                            'id',
                            $assignedUserIds
                        );
                    }
                )
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get([
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'phone',
                ]);


            /*
            |--------------------------------------------------------------------------
            | Format response
            |--------------------------------------------------------------------------
            */

            $data = $users
                ->map(
                    static function (User $user): array {

                        return [
                            'id' => $user->id,

                            'first_name' => $user->first_name,

                            'last_name' => $user->last_name,

                            'name' => trim(
                                implode(
                                    ' ',
                                    array_filter([
                                        $user->first_name,
                                        $user->last_name,
                                    ])
                                )
                            ),

                            'email' => $user->email,

                            'phone' => $user->phone,
                        ];
                    }
                )
                ->values();


            /*
            |--------------------------------------------------------------------------
            | Return response
            |--------------------------------------------------------------------------
            */

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
    | PURPOSE:
    |
    | Return ALL users who have the "tenant" role.
    |
    | Unlike tenantUsers(), this endpoint does NOT exclude users who
    | already have a tenant profile.
    |
    | This is useful for:
    |
    | - Tenant reports
    | - User management
    | - Tenant-role listings
    | - Administration
    |
    */

    public function allTenantUsers(): JsonResponse
    {
        try {

            $users = User::query()
                ->whereHas(
                    'roles',
                    function ($query) {
                        $query->where('name', 'tenant');
                    }
                )
                ->with('tenant:id,user_id,tenant_number,status')
                ->orderBy('first_name')
                ->orderBy('last_name')
                ->get([
                    'id',
                    'first_name',
                    'last_name',
                    'email',
                    'phone',
                ]);


            /*
            |--------------------------------------------------------------------------
            | Format response
            |--------------------------------------------------------------------------
            */

            $data = $users
                ->map(
                    static function (User $user): array {

                        return [
                            'id' => $user->id,

                            'first_name' => $user->first_name,

                            'last_name' => $user->last_name,

                            'name' => trim(
                                implode(
                                    ' ',
                                    array_filter([
                                        $user->first_name,
                                        $user->last_name,
                                    ])
                                )
                            ),

                            'email' => $user->email,

                            'phone' => $user->phone,

                            /*
                            |------------------------------------------------------
                            | Tenant profile information
                            |------------------------------------------------------
                            */

                            'has_tenant_profile' => $user->tenant !== null,

                            'tenant' => $user->tenant
                                ? [
                                    'id' => $user->tenant->id,

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
    | AVAILABLE TENANT USERS
    |--------------------------------------------------------------------------
    | GET /api/tenants/available-users
    |--------------------------------------------------------------------------
    |
    | Alias of tenantUsers().
    |
    | This keeps backward compatibility if your frontend or another part
    | of the application already uses /available-users.
    |
    */

    public function availableUsers(): JsonResponse
    {
        return $this->tenantUsers();
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

                /*
                |----------------------------------------------------------------------
                | Search
                |----------------------------------------------------------------------
                */

                'search' => $request->input('search'),

                /*
                |----------------------------------------------------------------------
                | User
                |----------------------------------------------------------------------
                */

                'user_id' => $request->input('user_id'),

                /*
                |----------------------------------------------------------------------
                | Status
                |----------------------------------------------------------------------
                */

                'status' => $request->input('status'),

                /*
                |----------------------------------------------------------------------
                | Active filter
                |----------------------------------------------------------------------
                |
                | IMPORTANT:
                |
                | is_active is NOT a database column.
                |
                | TenantService must translate:
                |
                | is_active=true
                |
                | into:
                |
                | status=active
                |
                */

                'is_active' => $request->has('is_active')
                    ? $request->input('is_active')
                    : null,

                /*
                |----------------------------------------------------------------------
                | Verification
                |----------------------------------------------------------------------
                */

                'is_verified' => $request->has('is_verified')
                    ? $request->input('is_verified')
                    : null,

                /*
                |----------------------------------------------------------------------
                | Demographics
                |----------------------------------------------------------------------
                */

                'gender' => $request->input('gender'),

                /*
                |----------------------------------------------------------------------
                | Location
                |----------------------------------------------------------------------
                */

                'country' => $request->input('country'),

                'region' => $request->input('region'),

                'county' => $request->input('county'),

                'city' => $request->input('city'),

                'area' => $request->input('area'),

                'postal_code' => $request->input('postal_code'),

                /*
                |----------------------------------------------------------------------
                | Sorting
                |----------------------------------------------------------------------
                */

                'sort_by' => $request->input(
                    'sort_by',
                    'created_at'
                ),

                'sort_direction' => $request->input(
                    'sort_direction',
                    'desc'
                ),

                /*
                |----------------------------------------------------------------------
                | Pagination
                |----------------------------------------------------------------------
                */

                'per_page' => $request->input(
                    'per_page',
                    15
                ),
            ];


            /*
            |--------------------------------------------------------------------------
            | Remove empty filters
            |--------------------------------------------------------------------------
            */

            $filters = array_filter(
                $filters,
                static fn ($value) =>
                    $value !== null &&
                    $value !== ''
            );


            /*
            |--------------------------------------------------------------------------
            | Fetch tenants
            |--------------------------------------------------------------------------
            */

            $tenants = $this->tenantService->paginate(
                $filters
            );


            /*
            |--------------------------------------------------------------------------
            | Load user relationship
            |--------------------------------------------------------------------------
            */

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
    | Creates a Tenant PROFILE from an existing User account.
    |
    | It does NOT create another User.
    |
    */

    public function store(
        CreateTenantRequest $request
    ): JsonResponse {

        try {

            $data = $request->validated();


            /*
            |--------------------------------------------------------------------------
            | Require existing tenant user
            |--------------------------------------------------------------------------
            */

            if (
                !isset($data['user_id']) ||
                !filled($data['user_id'])
            ) {

                return ApiResponse::validation([
                    'user_id' => [
                        'An existing user with the tenant role must be selected.'
                    ],
                ]);
            }


            /*
            |--------------------------------------------------------------------------
            | Get selected user
            |--------------------------------------------------------------------------
            */

            $user = User::query()
                ->whereKey($data['user_id'])
                ->whereHas(
                    'roles',
                    function ($query) {
                        $query->where('name', 'tenant');
                    }
                )
                ->first();


            /*
            |--------------------------------------------------------------------------
            | Ensure selected user is a tenant-role user
            |--------------------------------------------------------------------------
            */

            if (!$user) {

                return ApiResponse::validation([
                    'user_id' => [
                        'The selected user must have the tenant role.'
                    ],
                ]);
            }


            /*
            |--------------------------------------------------------------------------
            | Prevent duplicate tenant profile
            |--------------------------------------------------------------------------
            */

            $existingTenant = Tenant::query()
                ->where('user_id', $user->id)
                ->first();


            if ($existingTenant) {

                return ApiResponse::validation([
                    'user_id' => [
                        'This user already has a tenant profile.'
                    ],
                ]);
            }


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


            /*
            |--------------------------------------------------------------------------
            | Load relationships
            |--------------------------------------------------------------------------
            */

            $tenant->loadMissing([
                'user',
            ]);


            return ApiResponse::created(
                new TenantResource($tenant),
                'Tenant profile created successfully from the existing tenant user account.'
            );

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

            $photo = $request->file('photo');

            $idFront = $request->file('id_front');

            $idBack = $request->file('id_back');


            $updatedTenant = $this->tenantService->update(
                $tenant,
                $data,
                $photo,
                $idFront,
                $idBack
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
                        'Search term is required.'
                    ],
                ]);
            }


            $limit = (int) $request->input(
                'limit',
                20
            );


            $limit = max(
                1,
                min($limit, 100)
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
        try {

            $tenants = $this->tenantService->getActive();

            $tenants->loadMissing([
                'user',
            ]);


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
    | PENDING
    |--------------------------------------------------------------------------
    | GET /api/tenants/pending
    |--------------------------------------------------------------------------
    */

    public function pending(): JsonResponse
    {
        try {

            $tenants = $this->tenantService->getPending();

            $tenants->loadMissing([
                'user',
            ]);


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
    | INACTIVE
    |--------------------------------------------------------------------------
    | GET /api/tenants/inactive
    |--------------------------------------------------------------------------
    */

    public function inactive(): JsonResponse
    {
        try {

            $tenants = $this->tenantService->getInactive();

            $tenants->loadMissing([
                'user',
            ]);


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
    | BLACKLISTED
    |--------------------------------------------------------------------------
    | GET /api/tenants/blacklisted
    |--------------------------------------------------------------------------
    */

    public function blacklisted(): JsonResponse
    {
        try {

            $tenants = $this->tenantService->getBlacklisted();

            $tenants->loadMissing([
                'user',
            ]);


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

            $tenant->loadMissing([
                'user',
            ]);


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

            $tenant->loadMissing([
                'user',
            ]);


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

            $tenant->loadMissing([
                'user',
            ]);


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

            $tenant->loadMissing([
                'user',
            ]);


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

            $tenant->loadMissing([
                'user',
            ]);


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

            $tenant->loadMissing([
                'user',
            ]);


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

            $tenant->loadMissing([
                'user',
            ]);


            return ApiResponse::updated(
                new TenantResource($tenant),
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


            $tenant->loadMissing([
                'user',
            ]);


            return ApiResponse::updated(
                new TenantResource($tenant),
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


            $tenant->loadMissing([
                'user',
            ]);


            return ApiResponse::updated(
                new TenantResource($tenant),
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


            $tenant->loadMissing([
                'user',
            ]);


            return ApiResponse::updated(
                new TenantResource($tenant),
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
    | EXCEPTION ERRORS
    |--------------------------------------------------------------------------
    */

    protected function exceptionErrors(
        Throwable $exception
    ): ?array {

        /*
        |--------------------------------------------------------------------------
        | Do not expose internal errors in production
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

