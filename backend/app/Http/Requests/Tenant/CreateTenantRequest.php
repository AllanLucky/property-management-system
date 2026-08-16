<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateTenantRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | User Relationship
            |--------------------------------------------------------------------------
            */
            'user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
            |
            | Usually generated automatically by the Tenant model.
            | We allow it only when explicitly supplied.
            |
            */
            'tenant_number' => [
                'nullable',
                'string',
                'max:50',
                'unique:tenants,tenant_number',
            ],

            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            */
            'first_name' => [
                'required',
                'string',
                'min:2',
                'max:100',
            ],

            'last_name' => [
                'required',
                'string',
                'min:2',
                'max:100',
            ],

            'other_names' => [
                'nullable',
                'string',
                'max:150',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'phone' => [
                'required',
                'string',
                'max:30',
                'unique:tenants,phone',
            ],

            'date_of_birth' => [
                'nullable',
                'date',
                'before:today',
            ],

            'gender' => [
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
            |
            | A tenant should provide at least one identification document
            | number: ID number or passport number.
            |
            */
            'id_number' => [
                'nullable',
                'string',
                'max:100',
                'unique:tenants,id_number',
            ],

            'passport_number' => [
                'nullable',
                'string',
                'max:100',
                'unique:tenants,passport_number',
            ],

            /*
            |--------------------------------------------------------------------------
            | Address
            |--------------------------------------------------------------------------
            */
            'country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'county' => [
                'nullable',
                'string',
                'max:100',
            ],

            'city' => [
                'nullable',
                'string',
                'max:100',
            ],

            'postal_code' => [
                'nullable',
                'string',
                'max:30',
            ],

            'address' => [
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
                'nullable',
                'string',
                'max:150',
            ],

            'employer' => [
                'nullable',
                'string',
                'max:200',
            ],

            'monthly_income' => [
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
                'nullable',
                'string',
                'max:150',
            ],

            'emergency_contact_phone' => [
                'nullable',
                'string',
                'max:30',
            ],

            'emergency_contact_relationship' => [
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
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'id_back' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            'status' => [
                'nullable',
                Rule::in(Tenant::STATUSES),
            ],

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */
            'notes' => [
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
                'This ID number is already registered.',

            'passport_number.unique' =>
                'This passport number is already registered.',

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
        $this->merge([
            'first_name' => $this->filled('first_name')
                ? trim($this->input('first_name'))
                : null,

            'last_name' => $this->filled('last_name')
                ? trim($this->input('last_name'))
                : null,

            'other_names' => $this->filled('other_names')
                ? trim($this->input('other_names'))
                : null,

            'email' => $this->filled('email')
                ? strtolower(trim($this->input('email')))
                : null,

            'phone' => $this->filled('phone')
                ? trim($this->input('phone'))
                : null,

            'id_number' => $this->filled('id_number')
                ? strtoupper(trim($this->input('id_number')))
                : null,

            'passport_number' => $this->filled('passport_number')
                ? strtoupper(trim($this->input('passport_number')))
                : null,

            'country' => $this->filled('country')
                ? trim($this->input('country'))
                : 'Kenya',

            'county' => $this->filled('county')
                ? trim($this->input('county'))
                : null,

            'city' => $this->filled('city')
                ? trim($this->input('city'))
                : null,

            'postal_code' => $this->filled('postal_code')
                ? trim($this->input('postal_code'))
                : null,

            'address' => $this->filled('address')
                ? trim($this->input('address'))
                : null,

            'occupation' => $this->filled('occupation')
                ? trim($this->input('occupation'))
                : null,

            'employer' => $this->filled('employer')
                ? trim($this->input('employer'))
                : null,

            'emergency_contact_name' =>
                $this->filled('emergency_contact_name')
                    ? trim($this->input('emergency_contact_name'))
                    : null,

            'emergency_contact_phone' =>
                $this->filled('emergency_contact_phone')
                    ? trim($this->input('emergency_contact_phone'))
                    : null,

            'emergency_contact_relationship' =>
                $this->filled('emergency_contact_relationship')
                    ? trim($this->input('emergency_contact_relationship'))
                    : null,

            'notes' => $this->filled('notes')
                ? trim($this->input('notes'))
                : null,
        ]);
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
            | Require at least one government identification number.
            |
            */
            if (
                blank($this->input('id_number')) &&
                blank($this->input('passport_number'))
            ) {
                $validator->errors()->add(
                    'identification',
                    'Either an ID number or passport number is required.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Emergency Contact Validation
            |--------------------------------------------------------------------------
            |
            | If one emergency-contact field is supplied, require the others.
            |
            */
            $emergencyFields = [
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relationship',
            ];

            $hasEmergencyContact = collect($emergencyFields)
                ->contains(
                    fn ($field) => filled($this->input($field))
                );

            if ($hasEmergencyContact) {

                foreach ($emergencyFields as $field) {
                    if (blank($this->input($field))) {
                        $validator->errors()->add(
                            $field,
                            'All emergency contact details are required when providing an emergency contact.'
                        );
                    }
                }
            }
        });
    }
}