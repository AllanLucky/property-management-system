<?php

namespace App\Http\Controllers\Api\RBAC;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Services\RBACService;
use App\Http\Resources\PermissionResource;
use App\Http\Requests\RBAC\StorePermissionRequest;
use App\Http\Requests\RBAC\UpdatePermissionRequest;
use Throwable;

class PermissionController extends Controller
{
    public function __construct(
        protected RBACService $rbacService
    ) {
        /*
        |--------------------------------------------------------------------------
        | PERMISSION MIDDLEWARE (CLEAN RBAC RULES)
        |--------------------------------------------------------------------------
        */
        $this->middleware('permission:permissions.view')->only(['index', 'show']);
        $this->middleware('permission:permissions.create')->only(['store']);
        $this->middleware('permission:permissions.edit')->only(['update']);
        $this->middleware('permission:permissions.delete')->only(['destroy']);
    }

    /*
    |--------------------------------------------------------------------------
    | LIST PERMISSIONS
    |--------------------------------------------------------------------------
    */
    public function index()
    {
        return ApiResponse::success(
            PermissionResource::collection($this->rbacService->getPermissions()),
            'Permissions fetched successfully'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW SINGLE PERMISSION
    |--------------------------------------------------------------------------
    */
    public function show($id)
    {
        try {
            $permission = $this->rbacService->findPermissionById($id);

            if (!$permission) {
                return ApiResponse::notFound('Permission not found');
            }

            return ApiResponse::success(
                new PermissionResource($permission),
                'Permission details fetched successfully'
            );
        } catch (Throwable $e) {
            return ApiResponse::notFound('Permission not found');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PERMISSION
    |--------------------------------------------------------------------------
    */
    public function store(StorePermissionRequest $request)
    {
        try {
            $permission = $this->rbacService->createPermission(
                $request->validated()
            );

            return ApiResponse::success(
                new PermissionResource($permission),
                'Permission created successfully',
                201
            );
        } catch (Throwable $e) {
            return ApiResponse::error(
                'Failed to create permission',
                $e->getMessage(),
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PERMISSION
    |--------------------------------------------------------------------------
    */
    public function update(UpdatePermissionRequest $request, $id)
    {
        try {
            $permission = $this->rbacService->findPermissionById($id);

            if (!$permission) {
                return ApiResponse::notFound('Permission not found');
            }

            $updatedPermission = $this->rbacService->updatePermission(
                $permission,
                $request->validated()
            );

            return ApiResponse::success(
                new PermissionResource($updatedPermission),
                'Permission updated successfully'
            );
        } catch (Throwable $e) {
            return ApiResponse::notFound('Permission not found');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE PERMISSION
    |--------------------------------------------------------------------------
    */
    public function destroy($id)
    {
        try {
            $permission = $this->rbacService->findPermissionById($id);

            if (!$permission) {
                return ApiResponse::notFound('Permission not found');
            }

            /*
            |--------------------------------------------------------------------------
            | PROTECTED SYSTEM PERMISSIONS
            |--------------------------------------------------------------------------
            */
            if ($this->rbacService->isProtectedPermission($permission->name)) {
                return ApiResponse::forbidden(
                    'This permission is protected and cannot be deleted.'
                );
            }

            $this->rbacService->deletePermission($permission);

            return ApiResponse::success(
                null,
                'Permission deleted successfully'
            );
        } catch (Throwable $e) {
            return ApiResponse::notFound('Permission not found');
        }
    }
}