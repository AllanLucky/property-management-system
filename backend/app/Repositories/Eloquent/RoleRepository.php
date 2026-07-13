<?php

namespace App\Repositories\Eloquent;

use Spatie\Permission\Models\Role;
use App\Repositories\Interfaces\RoleRepositoryInterface;

class RoleRepository implements RoleRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | CONFIG
    |--------------------------------------------------------------------------
    */
    protected string $guard = 'web';

    /*
    |--------------------------------------------------------------------------
    | GET ALL ROLES
    |--------------------------------------------------------------------------
    */
    public function getAll()
    {
        return Role::with('permissions')
            ->where('guard_name', $this->guard)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY ID
    |--------------------------------------------------------------------------
    */
    public function findById(int $id): Role
    {
        return Role::with('permissions')
            ->where('guard_name', $this->guard)
            ->findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY NAME
    |--------------------------------------------------------------------------
    */
    public function findByName(string $name): ?Role
    {
        return Role::with('permissions')
            ->where('guard_name', $this->guard)
            ->where('name', $this->normalize($name))
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE ROLE
    |--------------------------------------------------------------------------
    */
    public function create(array $data): Role
    {
        return Role::create([
            'name' => $this->normalize($data['name']),
            'guard_name' => $this->guard,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE ROLE
    |--------------------------------------------------------------------------
    */
    public function update(Role $role, array $data): Role
    {
        $role->update([
            'name' => isset($data['name'])
                ? $this->normalize($data['name'])
                : $role->name,
        ]);

        return $role->refresh();
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE ROLE
    |--------------------------------------------------------------------------
    */
    public function delete(Role $role): bool
    {
        return (bool) $role->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | EXISTS CHECK (IMPORTANT FOR VALIDATION / REACT)
    |--------------------------------------------------------------------------
    */
    public function exists(string $name): bool
    {
        return Role::where('guard_name', $this->guard)
            ->where('name', $this->normalize($name))
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZATION (CRITICAL FOR CLEAN DATA)
    |--------------------------------------------------------------------------
    */
    protected function normalize(string $name): string
    {
        return strtolower(trim($name));
    }
}