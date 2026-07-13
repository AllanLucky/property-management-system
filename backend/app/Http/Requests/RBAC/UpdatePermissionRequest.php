<?php

namespace App\Http\Requests\RBAC;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends FormRequest
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

                // ✅ Prevent duplicates except current permission
                Rule::unique('permissions', 'name')->ignore($this->route('id')),

                // ✅ Enforce RBAC format: module.action (e.g users.create)
                'regex:/^[a-z]+(\.[a-z]+)+$/',
            ],
        ];
    }

    /**
     * Prepare data before validation
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                // normalize: users.CREATE → users.create
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

            // 🔥 important for RBAC structure
            'name.regex'    => 'Permission must follow format: module.action (example: users.create).',
        ];
    }
}