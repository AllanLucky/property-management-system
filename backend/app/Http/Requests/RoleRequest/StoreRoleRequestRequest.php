<?php

namespace App\Http\Requests\RoleRequest;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\RoleRequest;

class StoreRoleRequestRequest extends FormRequest
{
    /**
     * Only authenticated users can request roles
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Validation rules
     */
    public function rules(): array
    {
        return [
            'requested_role' => [
                'required',
                'string',
                Rule::in(RoleRequest::ALLOWED_ROLES),
            ],

            'reason' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    /**
     * Custom messages
     */
    public function messages(): array
    {
        return [
            'requested_role.required' => 'Please select a role to request.',
            'requested_role.in' => 'The selected role is not allowed for upgrade requests.',
            'reason.max' => 'The reason cannot exceed 1000 characters.',
        ];
    }

    /**
     * Clean input before validation
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'requested_role' => $this->requested_role
                ? strtolower(trim($this->requested_role))
                : null,

            'reason' => $this->reason
                ? trim($this->reason)
                : null,
        ]);
    }

    /**
     * Advanced validation rules
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {

            $user = auth()->user();
            $role = $this->requested_role;

            if (!$user || !$role) {
                return;
            }

            /*
            |--------------------------------------------------------------------------
            | FORBIDDEN ROLES
            |--------------------------------------------------------------------------
            */
            if (in_array($role, RoleRequest::FORBIDDEN_ROLES, true)) {
                $validator->errors()->add(
                    'requested_role',
                    'This role cannot be requested.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | USER ALREADY HAS ROLE
            |--------------------------------------------------------------------------
            */
            if ($user->hasRole($role)) {
                $validator->errors()->add(
                    'requested_role',
                    'This role is already assigned to your account.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | DUPLICATE PENDING REQUEST
            |--------------------------------------------------------------------------
            */
            $hasPending = RoleRequest::where('user_id', $user->id)
                ->where('requested_role', $role)
                ->where('status', RoleRequest::STATUS_PENDING)
                ->exists();

            if ($hasPending) {
                $validator->errors()->add(
                    'requested_role',
                    'You already have a pending request for this role. Please wait for approval.'
                );
            }
        });
    }
}