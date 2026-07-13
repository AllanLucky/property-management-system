<?php

namespace App\Http\Requests\RBAC;

use Illuminate\Foundation\Http\FormRequest;

class AssignRolePermissionRequest extends FormRequest
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
            'permissions'   => ['required', 'array', 'min:1'],

            // must exist in DB permissions table
            'permissions.*' => [
                'string',
                'exists:permissions,name',
                'max:100',
            ],
        ];
    }

    /**
     * Normalize input before validation
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('permissions')) {
            $this->merge([
                'permissions' => array_values(array_unique(array_map(
                    fn ($p) => trim(strtolower($p)),
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
            'permissions.required' => 'Permissions are required.',
            'permissions.array'    => 'Permissions must be an array.',
            'permissions.min'      => 'At least one permission must be selected.',
            'permissions.*.exists' => 'One or more selected permissions do not exist.',
        ];
    }
}