<?php

namespace App\Http\Controllers\Api\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Helpers\ApiResponse;
use App\Services\UserService;
use App\Services\RBACService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class UserController extends Controller
{
    public function __construct(
        protected UserService $userService,
        protected RBACService $rbacService
    ) {}


    /*
    |--------------------------------------------------------------------------
    | GET ALL USERS
    |--------------------------------------------------------------------------
    */
    public function index()
    {
        try {

            $users = $this->userService
                ->getAllUsers()
                ->load(['roles', 'permissions']);


            return ApiResponse::success(
                UserResource::collection($users),
                'Users fetched successfully.'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch users.',
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | GET SINGLE USER
    |--------------------------------------------------------------------------
    */
    public function show($id)
    {
        try {

            $user = $this->userService
                ->getUser($id);


            if (!$user) {

                return ApiResponse::notFound(
                    'User not found.'
                );
            }


            return ApiResponse::success(
                new UserResource(
                    $user->load([
                        'roles',
                        'permissions'
                    ])
                ),
                'User fetched successfully.'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch user.',
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE USER
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        try {

            $validated = $this->validateUser(
                $request,
                'create'
            );


            $creator = Auth::user();


            $user = $this->userService
                ->createUser(
                    $validated,
                    $creator
                );


            return ApiResponse::success(
                new UserResource(
                    $user->load([
                        'roles',
                        'permissions'
                    ])
                ),
                'User created successfully.',
                201
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'User creation failed.',
                $e->getMessage()
            );
        }
    }
        /*
    |--------------------------------------------------------------------------
    | UPDATE USER
    |--------------------------------------------------------------------------
    */
    public function update(Request $request, $id)
    {
        try {

            $user = $this->userService
                ->getUser($id);


            if (!$user) {

                return ApiResponse::notFound(
                    'User not found.'
                );
            }


            $validated = $this->validateUser(
                $request,
                'update',
                $id
            );


            $updatedUser = $this->userService
                ->updateUser(
                    (int) $id,
                    $validated
                );


            return ApiResponse::success(
                new UserResource(
                    $updatedUser->load([
                        'roles',
                        'permissions',
                    ])
                ),
                'User updated successfully.'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'User update failed.',
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE USER (SOFT DELETE)
    |--------------------------------------------------------------------------
    */
    public function destroy($id)
    {
        try {

            $user = $this->userService
                ->getUser($id);


            if (!$user) {

                return ApiResponse::notFound(
                    'User not found.'
                );
            }


            $this->userService
                ->deleteUser($id);


            return ApiResponse::success(
                null,
                'User deleted successfully.'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to delete user.',
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RESTORE USER
    |--------------------------------------------------------------------------
    */
    public function restore($id)
    {
        try {

            $user = User::withTrashed()
                ->find($id);


            if (!$user) {

                return ApiResponse::notFound(
                    'User not found.'
                );
            }


            $user->restore();


            return ApiResponse::success(
                new UserResource(
                    $user->load([
                        'roles',
                        'permissions',
                    ])
                ),
                'User restored successfully.'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to restore user.',
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE USER
    |--------------------------------------------------------------------------
    */
    public function forceDelete($id)
    {
        try {

            $user = User::withTrashed()
                ->find($id);


            if (!$user) {

                return ApiResponse::notFound(
                    'User not found.'
                );
            }


            /*
            |------------------------------------------------------
            | Image cleanup is handled automatically by User model
            | through forceDeleted event and ImageService
            |------------------------------------------------------
            */
            $user->forceDelete();


            return ApiResponse::success(
                null,
                'User permanently deleted.'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to permanently delete user.',
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SEARCH USERS
    |--------------------------------------------------------------------------
    */
    public function search(Request $request)
    {
        try {

            $keyword = $request->query('q');


            if (!$keyword) {

                return ApiResponse::error(
                    'Search keyword is required.'
                );
            }


            $users = $this->userService
                ->searchUsers($keyword)
                ->load([
                    'roles',
                    'permissions',
                ]);


            return ApiResponse::success(
                UserResource::collection($users),
                'Search results fetched successfully.'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Search failed.',
                $e->getMessage()
            );
        }
    }
        /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS
    |--------------------------------------------------------------------------
    */
    public function updateStatus(Request $request, $id)
    {
        try {

            $validated = $request->validate([
                'account_status' => [
                    'required',
                    Rule::in(User::STATUSES),
                ],

                'approval_status' => [
                    'nullable',
                    Rule::in(User::APPROVALS),
                ],
            ]);


            $user = $this->userService->updateStatus(
                (int) $id,
                $validated['account_status'],
                $validated['approval_status'] ?? null
            );


            return ApiResponse::success(
                new UserResource($user),
                'Status updated successfully.'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to update status.',
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | APPROVE USER
    |--------------------------------------------------------------------------
    */
    public function approve($id)
    {
        return $this->safeAction(
            fn () => $this->userService->approveUser($id),
            'approved'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | REJECT USER
    |--------------------------------------------------------------------------
    */
    public function reject($id)
    {
        return $this->safeAction(
            fn () => $this->userService->rejectUser($id),
            'rejected'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SUSPEND USER
    |--------------------------------------------------------------------------
    */
    public function suspend($id)
    {
        return $this->safeAction(
            fn () => $this->userService->suspendUser($id),
            'suspended'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | BAN USER
    |--------------------------------------------------------------------------
    */
    public function ban($id)
    {
        return $this->safeAction(
            fn () => $this->userService->banUser($id),
            'banned'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | SAFE ACTION HELPER
    |--------------------------------------------------------------------------
    */
    private function safeAction(
        callable $callback,
        string $action
    )
    {
        try {

            $user = $callback();


            return ApiResponse::success(
                new UserResource($user),
                "User {$action} successfully."
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                "Failed to {$action} user.",
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | USER VALIDATION
    |--------------------------------------------------------------------------
    */
    private function validateUser(
        Request $request,
        string $mode = 'create',
        $id = null
    )
    {
        return $request->validate([

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */
            'first_name' => $mode === 'create'
                ? 'required|string|max:100'
                : 'sometimes|string|max:100',

            'last_name' => $mode === 'create'
                ? 'required|string|max:100'
                : 'sometimes|string|max:100',

            'email' => $mode === 'create'
                ? 'required|email|unique:users,email'
                : 'sometimes|email|unique:users,email,' . $id,

            'phone' => 'sometimes|nullable|string',


            /*
            |--------------------------------------------------------------------------
            | PROFILE IMAGE
            |--------------------------------------------------------------------------
            */
            'image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpeg,jpg,png,webp,gif',
                'max:5120',
            ],


            /*
            |--------------------------------------------------------------------------
            | PASSWORD
            |--------------------------------------------------------------------------
            */
            'password' => $mode === 'create'
                ? 'required|string|min:6'
                : 'sometimes|nullable|string|min:6',


            /*
            |--------------------------------------------------------------------------
            | ACCOUNT SETTINGS
            |--------------------------------------------------------------------------
            */
            'account_status' => [
                'sometimes',
                Rule::in(User::STATUSES),
            ],

            'approval_status' => [
                'sometimes',
                Rule::in(User::APPROVALS),
            ],


            /*
            |--------------------------------------------------------------------------
            | ROLES & PERMISSIONS
            |--------------------------------------------------------------------------
            */
            'roles' => 'sometimes|array',

            'roles.*' => [
                'string',
                'exists:roles,name',
            ],

        ]);
    }
}