<?php

namespace App\Http\Requests\RBAC;

use Illuminate\Foundation\Http\FormRequest;

class StorePermissionRequest extends FormRequest
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
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:permissions,name',

                // ✅ enforce RBAC format: module.action
                'regex:/^[a-z]+(\.[a-z]+)+$/',
            ],
        ];
    }

    /**
     * Normalize input before validation
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                // normalize casing + spacing
                'name' => strtolower(trim($this->name)),
            ]);
        }
    }

    /**
     * Custom validation messages
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Permission name is required.',
            'name.string'   => 'Permission name must be a valid string.',
            'name.max'      => 'Permission name must not exceed 255 characters.',
            'name.unique'   => 'This permission already exists.',
            'name.regex'    => 'Permission must follow format: module.action (example: users.create).',
        ];
    }
}