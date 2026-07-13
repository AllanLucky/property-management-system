<?php

namespace App\Http\Requests\RBAC;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    /**
     * Authorize request
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules
     */
    public function rules(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | ROLE NAME
            |--------------------------------------------------------------------------
            */
            'name' => [
                'required',
                'string',
                'max:255',

                // ✅ proper Laravel unique ignore
                Rule::unique('roles', 'name')->ignore($this->route('id')),

                // 🔥 strict role naming rule
                'regex:/^[a-z0-9-_]+$/',
            ],

            /*
            |--------------------------------------------------------------------------
            | PERMISSIONS
            |--------------------------------------------------------------------------
            */
            'permissions'   => ['nullable', 'array', 'min:0'],

            'permissions.*' => [
                'string',
                'exists:permissions,name',

                // 🔥 enforce RBAC format: users.create
                'regex:/^[a-z]+(\.[a-z]+)+$/',
            ],
        ];
    }

    /**
     * Normalize input BEFORE validation
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => strtolower(trim($this->name)),
            ]);
        }

        if ($this->has('permissions')) {
            $this->merge([
                'permissions' => array_values(array_unique(array_map(
                    fn ($p) => strtolower(trim($p)),
                    (array) $this->permissions
                ))),
            ]);
        }
    }

    /**
     * Custom messages
     */
    public function messages(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | ROLE ERRORS
            |--------------------------------------------------------------------------
            */
            'name.required' => 'Role name is required.',
            'name.string'   => 'Role name must be a valid string.',
            'name.unique'   => 'This role already exists.',
            'name.regex'    => 'Role name can only contain lowercase letters, numbers, dashes, and underscores.',

            /*
            |--------------------------------------------------------------------------
            | PERMISSION ERRORS
            |--------------------------------------------------------------------------
            */
            'permissions.array'    => 'Permissions must be an array.',
            'permissions.min'      => 'Invalid permissions format.',
            'permissions.*.exists' => 'One or more permissions do not exist.',
            'permissions.*.regex'  => 'Invalid permission format (use module.action).',
        ];
    }
}