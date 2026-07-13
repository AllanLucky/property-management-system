<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Repositories\Interfaces\RoleRepositoryInterface;
use App\Repositories\Interfaces\PermissionRepositoryInterface;

class RBACService
{
    public function __construct(
        protected RoleRepositoryInterface $roleRepository,
        protected PermissionRepositoryInterface $permissionRepository
    ) {}

    /*
    |--------------------------------------------------------------------------
    | CONFIG
    |--------------------------------------------------------------------------
    */
    protected string $guard = 'web';

    protected array $protectedRoles = [
        'super-admin',
    ];

    protected array $protectedPermissions = [
        'system.manage',
    ];

    /*
    |--------------------------------------------------------------------------
    | ROLES
    |--------------------------------------------------------------------------
    */
    public function getRoles()
    {
        return $this->roleRepository->getAll()->load('permissions');
    }

    public function findRoleById(int $id): ?Role
    {
        return Role::with('permissions')
            ->where('guard_name', $this->guard)
            ->find($id);
    }

    public function createRole(array $data): Role
    {
        return DB::transaction(function () use ($data) {

            $data['guard_name'] = $this->guard;

            $role = $this->roleRepository->create($data);

            $permissions = $this->normalizePermissions($data['permissions'] ?? []);

            if (!empty($permissions)) {
                $role->syncPermissions($permissions);
            }

            return $role->load('permissions');
        });
    }

    public function updateRole(Role $role, array $data): Role
    {
        $this->ensureRoleIsNotProtected($role->name);

        return DB::transaction(function () use ($role, $data) {

            $data['guard_name'] = $this->guard;

            $role = $this->roleRepository->update($role, $data);

            if (array_key_exists('permissions', $data)) {
                $role->syncPermissions(
                    $this->normalizePermissions($data['permissions'] ?? [])
                );
            }

            return $role->load('permissions');
        });
    }

    public function deleteRole(Role $role): bool
    {
        $this->ensureRoleIsNotProtected($role->name);
        return $this->roleRepository->delete($role);
    }

    /*
    |--------------------------------------------------------------------------
    | PERMISSIONS
    |--------------------------------------------------------------------------
    */
    public function getPermissions()
    {
        return $this->permissionRepository->getAll();
    }

    public function findPermissionById(int $id): ?Permission
    {
        return Permission::where('guard_name', $this->guard)->find($id);
    }

    public function createPermission(array $data): Permission
    {
        return DB::transaction(function () use ($data) {

            $data['guard_name'] = $this->guard;

            return $this->permissionRepository->create($data);
        });
    }

    public function updatePermission(Permission $permission, array $data): Permission
    {
        $this->ensurePermissionIsNotProtected($permission->name);

        return DB::transaction(function () use ($permission, $data) {

            $permission = $this->permissionRepository->update($permission, $data);

            return $permission->refresh();
        });
    }

    public function deletePermission(Permission $permission): bool
    {
        $this->ensurePermissionIsNotProtected($permission->name);
        return $this->permissionRepository->delete($permission);
    }

    /*
    |--------------------------------------------------------------------------
    | ROLE ↔ PERMISSIONS
    |--------------------------------------------------------------------------
    */
    public function assignPermissionsToRole(Role $role, array $permissions): Role
    {
        $this->ensureRoleIsNotProtected($role->name);

        $role->syncPermissions(
            $this->normalizePermissions($permissions)
        );

        return $role->load('permissions');
    }

    /*
    |--------------------------------------------------------------------------
    | 🔥 CRITICAL FIX: ROLE PERMISSIONS PAYLOAD (FRONTEND FIX)
    |--------------------------------------------------------------------------
    */
    public function getRolePermissionsPayload(int $roleId): ?array
    {
        $role = Role::with('permissions')
            ->where('guard_name', $this->guard)
            ->find($roleId);

        if (!$role) {
            return null;
        }

        return [
            'role' => $role,
            'permissions' => $this->getPermissions(),
            'rolePermissions' => $role->permissions->pluck('name')->toArray(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | USER ROLE MANAGEMENT
    |--------------------------------------------------------------------------
    */

    public function syncRoles($user, array $roles): void
    {
        $roles = array_values(array_filter($roles));

        if (empty($roles)) {
            $user->syncRoles([]);
            return;
        }

        $validRoles = Role::query()
            ->where('guard_name', $this->guard)
            ->where(function ($q) use ($roles) {
                $q->whereIn('name', $roles)
                  ->orWhereIn('id', $roles);
            })
            ->pluck('name')
            ->toArray();

        $user->syncRoles($validRoles);
    }

    public function syncPermissions($user, array $permissions): void
    {
        $user->syncPermissions(
            $this->normalizePermissions($permissions)
        );
    }

    public function assignRoleToUser($user, string|array $roles)
    {
        $this->syncRoles($user, (array) $roles);
        return $user->load('roles');
    }

    public function givePermissionToUser($user, string|array $permissions)
    {
        $user->syncPermissions(
            $this->normalizePermissions((array) $permissions)
        );

        return $user->load('permissions');
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZATION (FIX FOR ID OR NAME INPUT)
    |--------------------------------------------------------------------------
    */
    protected function normalizePermissions(array $permissions): array
    {
        $permissions = array_values(array_filter($permissions));

        if (empty($permissions)) {
            return [];
        }

        return Permission::query()
            ->where('guard_name', $this->guard)
            ->where(function ($q) use ($permissions) {
                $q->whereIn('name', $permissions)
                  ->orWhereIn('id', $permissions);
            })
            ->pluck('name')
            ->toArray();
    }

    /*
    |--------------------------------------------------------------------------
    | SAFETY PROTECTION
    |--------------------------------------------------------------------------
    */
    public function isProtectedRole(string $name): bool
    {
        return in_array($name, $this->protectedRoles, true);
    }

    public function isProtectedPermission(string $name): bool
    {
        return in_array($name, $this->protectedPermissions, true);
    }

    protected function ensureRoleIsNotProtected(string $name): void
    {
        if ($this->isProtectedRole($name)) {
            abort(403, 'This role is system-protected and cannot be modified.');
        }
    }

    protected function ensurePermissionIsNotProtected(string $name): void
    {
        if ($this->isProtectedPermission($name)) {
            abort(403, 'This permission is system-protected and cannot be modified.');
        }
    }
}