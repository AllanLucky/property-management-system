<?php

namespace App\Http\Controllers\Api\RBAC;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\RBAC\AssignRolePermissionRequest;
use App\Http\Requests\RBAC\StoreRoleRequest;
use App\Http\Requests\RBAC\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Services\RBACService;

class RoleController extends Controller
{
    public function __construct(
        protected RBACService $rbacService
    ) {
        $this->middleware('permission:roles.view')
            ->only([
                'index',
                'show',
                'matrix',
                'getPermissions',
            ]);

        $this->middleware('permission:roles.create')
            ->only([
                'store',
            ]);

        $this->middleware('permission:roles.edit')
            ->only([
                'update',
                'assignPermissions',
            ]);

        $this->middleware('permission:roles.delete')
            ->only([
                'destroy',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | LIST ROLES
    |--------------------------------------------------------------------------
    */
    public function index()
    {
        try {
            $roles = $this->rbacService->getRoles();

            return ApiResponse::success(
                RoleResource::collection($roles),
                'Roles fetched successfully.'
            );
        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to fetch roles.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RBAC MATRIX
    |--------------------------------------------------------------------------
    */
    public function matrix()
    {
        try {
            return ApiResponse::success([
                'roles' => RoleResource::collection(
                    $this->rbacService->getRoles()
                ),
                'permissions' => $this->rbacService->getPermissions(),
            ], 'RBAC matrix loaded successfully.');
        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to load RBAC matrix.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE ROLE
    |--------------------------------------------------------------------------
    */
    public function store(StoreRoleRequest $request)
    {
        try {
            $role = $this->rbacService->createRole(
                $request->validated()
            );

            return ApiResponse::success(
                new RoleResource($role),
                'Role created successfully.',
                201
            );
        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to create role.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW ROLE
    |--------------------------------------------------------------------------
    */
    public function show(int $id)
    {
        try {
            $role = $this->rbacService->findRoleById($id);

            if (!$role) {
                return ApiResponse::notFound(
                    'Role not found.'
                );
            }

            return ApiResponse::success(
                new RoleResource(
                    $role->load('permissions')
                ),
                'Role retrieved successfully.'
            );
        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to retrieve role.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE ROLE
    |--------------------------------------------------------------------------
    */
    public function update(
        UpdateRoleRequest $request,
        int $id
    ) {
        try {
            $role = $this->rbacService->findRoleById($id);

            if (!$role) {
                return ApiResponse::notFound(
                    'Role not found.'
                );
            }

            $data = $request->validated();

            /*
            |--------------------------------------------------------------------------
            | PROTECT SUPER ADMIN ROLE NAME
            |--------------------------------------------------------------------------
            */
            if (
                $role->name === 'super-admin' &&
                isset($data['name']) &&
                $data['name'] !== 'super-admin'
            ) {
                return ApiResponse::forbidden(
                    'Super-admin role name cannot be modified.'
                );
            }

            $updatedRole = $this->rbacService->updateRole(
                $role,
                $data
            );

            return ApiResponse::success(
                new RoleResource($updatedRole),
                'Role updated successfully.'
            );
        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to update role.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE ROLE
    |--------------------------------------------------------------------------
    */
    public function destroy(int $id)
    {
        try {
            $role = $this->rbacService->findRoleById($id);

            if (!$role) {
                return ApiResponse::notFound(
                    'Role not found.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | PROTECT SYSTEM ROLES
            |--------------------------------------------------------------------------
            */
            if (
                in_array(
                    $role->name,
                    ['super-admin'],
                    true
                )
            ) {
                return ApiResponse::forbidden(
                    'This role is protected and cannot be deleted.'
                );
            }

            $this->rbacService->deleteRole($role);

            return ApiResponse::success(
                null,
                'Role deleted successfully.'
            );
        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to delete role.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE PERMISSIONS PAYLOAD
    |--------------------------------------------------------------------------
    |
    | Used by:
    | GET /rbac/roles/{id}/permissions
    |
    | Returns:
    | - role
    | - all permissions
    | - role assigned permissions
    |
    */
    public function getPermissions(int $id)
    {
        try {
            $payload = $this->rbacService
                ->getRolePermissionsPayload($id);

            if (!$payload) {
                return ApiResponse::notFound(
                    'Role not found.'
                );
            }

            return ApiResponse::success(
                $payload,
                'Role permissions loaded successfully.'
            );
        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to load role permissions.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN PERMISSIONS TO ROLE
    |--------------------------------------------------------------------------
    |
    | POST /rbac/roles/{id}/permissions
    |
    */
    public function assignPermissions(
        AssignRolePermissionRequest $request,
        int $id
    ) {
        try {
            $role = $this->rbacService->findRoleById($id);

            if (!$role) {
                return ApiResponse::notFound(
                    'Role not found.'
                );
            }

            $permissions = $request->validated()['permissions'] ?? [];

            $updatedRole = $this->rbacService
                ->assignPermissionsToRole(
                    $role,
                    $permissions
                );

            return ApiResponse::success(
                new RoleResource(
                    $updatedRole->load('permissions')
                ),
                'Role permissions updated successfully.'
            );
        } catch (\Throwable $e) {
            return ApiResponse::serverError(
                'Failed to update role permissions.',
                $e->getMessage()
            );
        }
    }
}