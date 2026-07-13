<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

class RoleResource extends JsonResource
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
            | DISPLAY LABEL
            |--------------------------------------------------------------------------
            */
            'label' => $this->formatLabel($this->name),

            /*
            |--------------------------------------------------------------------------
            | SLUG
            |--------------------------------------------------------------------------
            */
            'slug' => Str::slug($this->name),

            /*
            |--------------------------------------------------------------------------
            | GUARD
            |--------------------------------------------------------------------------
            */
            'guard_name' => $this->guard_name,

            /*
            |--------------------------------------------------------------------------
            | PERMISSIONS (FULL OBJECTS)
            |--------------------------------------------------------------------------
            */
            'permissions' => $this->whenLoaded('permissions', function () {
                return $this->permissions->map(function ($permission) {
                    return [
                        'id'   => $permission->id,
                        'name' => $permission->name,
                    ];
                })->values();
            }),

            /*
            |--------------------------------------------------------------------------
            | PERMISSION NAMES (FOR CHECKBOX UI)
            |--------------------------------------------------------------------------
            */
            'permission_names' => $this->whenLoaded('permissions', function () {
                return $this->permissions->pluck('name')->values();
            }),

            /*
            |--------------------------------------------------------------------------
            | PERMISSION COUNT
            |--------------------------------------------------------------------------
            */
            'permissions_count' => $this->whenLoaded('permissions', function () {
                return $this->permissions->count();
            }, 0),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => optional($this->created_at)?->toISOString(),
            'updated_at' => optional($this->updated_at)?->toISOString(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT LABEL
    |--------------------------------------------------------------------------
    */
    private function formatLabel(string $name): string
    {
        return Str::of($name)
            ->replace(['_', '-'], ' ')
            ->title()
            ->toString();
    }
}