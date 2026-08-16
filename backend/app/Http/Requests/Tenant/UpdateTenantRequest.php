<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the tenant being updated.
     */
    protected function tenant(): ?Tenant
    {
        $tenant = $this->route('tenant');

        if ($tenant instanceof Tenant) {
            return $tenant;
        }

        if (is_numeric($tenant)) {
            return Tenant::find($tenant);
        }

        return null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $tenant = $this->tenant();

        $tenantId = $tenant?->id;

        return [

            /*
            |--------------------------------------------------------------------------
            | User Relationship
            |--------------------------------------------------------------------------
            */
            'user_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:users,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
            |
            | Normally this should not be changed after creation.
            |
            */
            'tenant_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
                Rule::unique('tenants', 'tenant_number')
                    ->ignore($tenantId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            */
            'first_name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:100',
            ],

            'last_name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:100',
            ],

            'other_names' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],

            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
            ],

            'phone' => [
                'sometimes',
                'required',
                'string',
                'max:30',
                Rule::unique('tenants', 'phone')
                    ->ignore($tenantId),
            ],

            'date_of_birth' => [
                'sometimes',
                'nullable',
                'date',
                'before:today',
            ],

            'gender' => [
                'sometimes',
                'nullable',
                Rule::in([
                    'male',
                    'female',
                    'other',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            */
            'id_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('tenants', 'id_number')
                    ->ignore($tenantId),
            ],

            'passport_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('tenants', 'passport_number')
                    ->ignore($tenantId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Address
            |--------------------------------------------------------------------------
            */
            'country' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'county' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'city' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'postal_code' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],

            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:1000',
            ],

            /*
            |--------------------------------------------------------------------------
            | Employment Information
            |--------------------------------------------------------------------------
            */
            'occupation' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],

            'employer' => [
                'sometimes',
                'nullable',
                'string',
                'max:200',
            ],

            'monthly_income' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'max:9999999999.99',
            ],

            /*
            |--------------------------------------------------------------------------
            | Emergency Contact
            |--------------------------------------------------------------------------
            */
            'emergency_contact_name' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],

            'emergency_contact_phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],

            'emergency_contact_relationship' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            /*
            |--------------------------------------------------------------------------
            | Tenant Photo
            |--------------------------------------------------------------------------
            */
            'photo' => [
                'sometimes',
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            /*
            |--------------------------------------------------------------------------
            | Identification Documents
            |--------------------------------------------------------------------------
            */
            'id_front' => [
                'sometimes',
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'id_back' => [
                'sometimes',
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            /*
            |--------------------------------------------------------------------------
            | Verification
            |--------------------------------------------------------------------------
            |
            | Verification should normally be handled through a dedicated
            | verification endpoint rather than a normal update.
            |
            */
            'is_verified' => [
                'sometimes',
                'boolean',
            ],

            'verified_at' => [
                'sometimes',
                'nullable',
                'date',
            ],

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            'status' => [
                'sometimes',
                Rule::in(Tenant::STATUSES),
            ],

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */
            'notes' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
            */
            'tenant_number.unique' =>
                'This tenant number is already assigned to another tenant.',

            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            */
            'first_name.required' =>
                'First name is required.',

            'first_name.min' =>
                'First name must be at least 2 characters.',

            'last_name.required' =>
                'Last name is required.',

            'last_name.min' =>
                'Last name must be at least 2 characters.',

            'email.email' =>
                'Please provide a valid email address.',

            'phone.required' =>
                'Phone number is required.',

            'phone.unique' =>
                'This phone number is already registered to another tenant.',

            'date_of_birth.before' =>
                'Date of birth must be a date before today.',

            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            */
            'id_number.unique' =>
                'This ID number is already registered to another tenant.',

            'passport_number.unique' =>
                'This passport number is already registered to another tenant.',

            /*
            |--------------------------------------------------------------------------
            | User
            |--------------------------------------------------------------------------
            */
            'user_id.exists' =>
                'The selected user account does not exist.',

            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */
            'photo.image' =>
                'The tenant photo must be a valid image.',

            'photo.mimes' =>
                'The tenant photo must be JPG, JPEG, PNG, or WEBP.',

            'photo.max' =>
                'The tenant photo may not be larger than 5MB.',

            'id_front.image' =>
                'The front ID document must be a valid image.',

            'id_front.mimes' =>
                'The front ID document must be JPG, JPEG, PNG, or WEBP.',

            'id_front.max' =>
                'The front ID document may not be larger than 5MB.',

            'id_back.image' =>
                'The back ID document must be a valid image.',

            'id_back.mimes' =>
                'The back ID document must be JPG, JPEG, PNG, or WEBP.',

            'id_back.max' =>
                'The back ID document may not be larger than 5MB.',

            /*
            |--------------------------------------------------------------------------
            | Verification
            |--------------------------------------------------------------------------
            */
            'is_verified.boolean' =>
                'The verification status must be true or false.',

            'verified_at.date' =>
                'The verification date must be a valid date.',

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            'status.in' =>
                'The selected tenant status is invalid.',
        ];
    }

    /**
     * Prepare request data before validation.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        /*
        |--------------------------------------------------------------------------
        | Personal Information
        |--------------------------------------------------------------------------
        */

        if ($this->has('first_name')) {
            $data['first_name'] = $this->filled('first_name')
                ? trim($this->input('first_name'))
                : null;
        }

        if ($this->has('last_name')) {
            $data['last_name'] = $this->filled('last_name')
                ? trim($this->input('last_name'))
                : null;
        }

        if ($this->has('other_names')) {
            $data['other_names'] = $this->filled('other_names')
                ? trim($this->input('other_names'))
                : null;
        }

        if ($this->has('email')) {
            $data['email'] = $this->filled('email')
                ? strtolower(trim($this->input('email')))
                : null;
        }

        if ($this->has('phone')) {
            $data['phone'] = $this->filled('phone')
                ? trim($this->input('phone'))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Identification
        |--------------------------------------------------------------------------
        */

        if ($this->has('id_number')) {
            $data['id_number'] = $this->filled('id_number')
                ? strtoupper(trim($this->input('id_number')))
                : null;
        }

        if ($this->has('passport_number')) {
            $data['passport_number'] = $this->filled('passport_number')
                ? strtoupper(trim($this->input('passport_number')))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Address
        |--------------------------------------------------------------------------
        */

        if ($this->has('country')) {
            $data['country'] = $this->filled('country')
                ? trim($this->input('country'))
                : null;
        }

        if ($this->has('county')) {
            $data['county'] = $this->filled('county')
                ? trim($this->input('county'))
                : null;
        }

        if ($this->has('city')) {
            $data['city'] = $this->filled('city')
                ? trim($this->input('city'))
                : null;
        }

        if ($this->has('postal_code')) {
            $data['postal_code'] = $this->filled('postal_code')
                ? trim($this->input('postal_code'))
                : null;
        }

        if ($this->has('address')) {
            $data['address'] = $this->filled('address')
                ? trim($this->input('address'))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Employment
        |--------------------------------------------------------------------------
        */

        if ($this->has('occupation')) {
            $data['occupation'] = $this->filled('occupation')
                ? trim($this->input('occupation'))
                : null;
        }

        if ($this->has('employer')) {
            $data['employer'] = $this->filled('employer')
                ? trim($this->input('employer'))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Emergency Contact
        |--------------------------------------------------------------------------
        */

        if ($this->has('emergency_contact_name')) {
            $data['emergency_contact_name'] =
                $this->filled('emergency_contact_name')
                    ? trim($this->input('emergency_contact_name'))
                    : null;
        }

        if ($this->has('emergency_contact_phone')) {
            $data['emergency_contact_phone'] =
                $this->filled('emergency_contact_phone')
                    ? trim($this->input('emergency_contact_phone'))
                    : null;
        }

        if ($this->has('emergency_contact_relationship')) {
            $data['emergency_contact_relationship'] =
                $this->filled('emergency_contact_relationship')
                    ? trim($this->input('emergency_contact_relationship'))
                    : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Notes
        |--------------------------------------------------------------------------
        */

        if ($this->has('notes')) {
            $data['notes'] = $this->filled('notes')
                ? trim($this->input('notes'))
                : null;
        }

        $this->merge($data);
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {

            /*
            |--------------------------------------------------------------------------
            | Identification Requirement
            |--------------------------------------------------------------------------
            |
            | Only enforce this when the request is attempting to change
            | identification information.
            |
            */
            if (
                $this->has('id_number') ||
                $this->has('passport_number')
            ) {
                $idNumber = $this->input('id_number');
                $passportNumber = $this->input('passport_number');

                /*
                | If both are explicitly cleared, reject the request.
                */
                if (
                    blank($idNumber) &&
                    blank($passportNumber)
                ) {
                    $validator->errors()->add(
                        'identification',
                        'A tenant must have at least an ID number or passport number.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Emergency Contact Validation
            |--------------------------------------------------------------------------
            |
            | If any emergency contact field is supplied, all three should
            | be supplied together.
            |
            */
            $emergencyFields = [
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relationship',
            ];

            $hasEmergencyContact = collect($emergencyFields)
                ->contains(
                    fn ($field) => $this->has($field)
                );

            if ($hasEmergencyContact) {

                foreach ($emergencyFields as $field) {

                    if (
                        $this->has($field) &&
                        blank($this->input($field))
                    ) {
                        $validator->errors()->add(
                            $field,
                            'This field is required when updating emergency contact details.'
                        );
                    }
                }
            }
        });
    }
}