<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class PermissionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'id'   => $this->id,
            'name' => $this->name,

            /*
            |--------------------------------------------------------------------------
            | FRONTEND IDENTIFIER (SAFE KEY)
            |--------------------------------------------------------------------------
            */
            'slug' => Str::slug($this->name),

            /*
            |--------------------------------------------------------------------------
            | HUMAN READABLE LABEL
            |--------------------------------------------------------------------------
            */
            'label' => $this->formatLabel($this->name),

            /*
            |--------------------------------------------------------------------------
            | GUARD
            |--------------------------------------------------------------------------
            */
            'guard_name' => $this->guard_name,

            /*
            |--------------------------------------------------------------------------
            | CRUD TYPE DETECTION (CORE OF YOUR SYSTEM)
            |--------------------------------------------------------------------------
            | This helps frontend group permissions properly:
            | users.view → users
            | roles.create → roles
            | permissions.delete → permissions
            */
            'module' => $this->getModule($this->name),

            'action' => $this->getAction($this->name),

            /*
            |--------------------------------------------------------------------------
            | SYSTEM PROTECTION
            |--------------------------------------------------------------------------
            | Prevent deleting critical system permissions
            |--------------------------------------------------------------------------
            */
            'is_system' => $this->isSystemPermission($this->name),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | EXTRACT MODULE (users, roles, permissions)
    |--------------------------------------------------------------------------
    */
    private function getModule(string $name): string
    {
        return Str::before($name, '.');
    }

    /*
    |--------------------------------------------------------------------------
    | EXTRACT ACTION (view, create, edit, delete)
    |--------------------------------------------------------------------------
    */
    private function getAction(string $name): string
    {
        return Str::after($name, '.');
    }

    /*
    |--------------------------------------------------------------------------
    | SYSTEM PROTECTION RULES
    |--------------------------------------------------------------------------
    */
    private function isSystemPermission(string $name): bool
    {
        return in_array($name, [
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            'roles.view',
            'roles.create',
            'roles.edit',
            'roles.delete',
            'permissions.view',
            'permissions.create',
            'permissions.edit',
            'permissions.delete',
            'system.manage',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT LABEL
    |--------------------------------------------------------------------------
    */
    private function formatLabel(string $name): string
    {
        return Str::of($name)
            ->replace('.', ' ')
            ->replace(['_', '-'], ' ')
            ->title()
            ->toString();
    }
}