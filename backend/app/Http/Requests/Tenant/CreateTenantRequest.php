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
     * A tenant is an existing User account with the "tenant" role.
     *
     * The users table is therefore the source of:
     *
     * - name
     * - email
     * - phone
     * - login/account information
     *
     * The tenants table stores tenant-specific information.
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | User Relationship
            |--------------------------------------------------------------------------
            |
            | Every tenant MUST belong to an existing user account.
            |
            | The user must also have the "tenant" Spatie role.
            |
            */

            'user_id' => [
                'required',
                'integer',
                'exists:users,id',

                Rule::unique('tenants', 'user_id'),
            ],


            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
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
            |
            | These fields may be copied from the selected User when creating
            | the tenant profile.
            |
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
            | Address / Location
            |--------------------------------------------------------------------------
            */

            'country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'region' => [
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

            'area' => [
                'nullable',
                'string',
                'max:150',
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
            | Verification
            |--------------------------------------------------------------------------
            |
            | These should normally be controlled by dedicated verification
            | endpoints rather than manually during creation.
            |
            */

            'is_verified' => [
                'nullable',
                'boolean',
            ],

            'verified_at' => [
                'nullable',
                'date',
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
     */
    public function messages(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | User
            |--------------------------------------------------------------------------
            */

            'user_id.required' =>
                'A user account is required when creating a tenant.',

            'user_id.integer' =>
                'The user ID must be a valid integer.',

            'user_id.exists' =>
                'The selected user account does not exist.',

            'user_id.unique' =>
                'This user already has a tenant profile.',


            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
            */

            'tenant_number.unique' =>
                'This tenant number is already registered.',


            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            */

            'first_name.required' =>
                'First name is required.',

            'first_name.min' =>
                'First name must be at least 2 characters.',

            'first_name.max' =>
                'First name may not exceed 100 characters.',

            'last_name.required' =>
                'Last name is required.',

            'last_name.min' =>
                'Last name must be at least 2 characters.',

            'last_name.max' =>
                'Last name may not exceed 100 characters.',

            'email.email' =>
                'Please provide a valid email address.',

            'phone.required' =>
                'Phone number is required.',

            'phone.unique' =>
                'This phone number is already registered to another tenant.',

            'date_of_birth.date' =>
                'Please provide a valid date of birth.',

            'date_of_birth.before' =>
                'Date of birth must be a date before today.',

            'gender.in' =>
                'The selected gender is invalid.',


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
            | Location
            |--------------------------------------------------------------------------
            */

            'country.string' =>
                'Country must be a valid text value.',

            'region.string' =>
                'Region must be a valid text value.',

            'county.string' =>
                'County must be a valid text value.',

            'city.string' =>
                'City must be a valid text value.',

            'area.string' =>
                'Area must be a valid text value.',

            'postal_code.string' =>
                'Postal code must be a valid text value.',

            'address.string' =>
                'Address must be a valid text value.',


            /*
            |--------------------------------------------------------------------------
            | Employment
            |--------------------------------------------------------------------------
            */

            'monthly_income.numeric' =>
                'Monthly income must be a valid number.',

            'monthly_income.min' =>
                'Monthly income cannot be negative.',


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


            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

            'notes.string' =>
                'Notes must be a valid text value.',
        ];
    }


    /**
     * Prepare request data before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([

            /*
            |--------------------------------------------------------------------------
            | User
            |--------------------------------------------------------------------------
            */

            'user_id' => $this->filled('user_id')
                ? (int) $this->input('user_id')
                : null,


            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
            */

            'tenant_number' => $this->filled('tenant_number')
                ? trim($this->input('tenant_number'))
                : null,


            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            */

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


            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            */

            'id_number' => $this->filled('id_number')
                ? strtoupper(trim($this->input('id_number')))
                : null,

            'passport_number' => $this->filled('passport_number')
                ? strtoupper(trim($this->input('passport_number')))
                : null,


            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            */

            'country' => $this->filled('country')
                ? trim($this->input('country'))
                : 'Kenya',

            'region' => $this->filled('region')
                ? trim($this->input('region'))
                : null,

            'county' => $this->filled('county')
                ? trim($this->input('county'))
                : null,

            'city' => $this->filled('city')
                ? trim($this->input('city'))
                : null,

            'area' => $this->filled('area')
                ? trim($this->input('area'))
                : null,

            'postal_code' => $this->filled('postal_code')
                ? trim($this->input('postal_code'))
                : null,

            'address' => $this->filled('address')
                ? trim($this->input('address'))
                : null,


            /*
            |--------------------------------------------------------------------------
            | Employment
            |--------------------------------------------------------------------------
            */

            'occupation' => $this->filled('occupation')
                ? trim($this->input('occupation'))
                : null,

            'employer' => $this->filled('employer')
                ? trim($this->input('employer'))
                : null,


            /*
            |--------------------------------------------------------------------------
            | Emergency Contact
            |--------------------------------------------------------------------------
            */

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


            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

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
            | User Role Validation
            |--------------------------------------------------------------------------
            |
            | The selected user MUST have the tenant role.
            |
            | This is important because your Users Management already uses
            | Spatie roles and permissions.
            |
            */

            if ($this->filled('user_id')) {

                $user = \App\Models\User::find($this->input('user_id'));

                if ($user && ! $user->hasRole('tenant')) {

                    $validator->errors()->add(
                        'user_id',
                        'The selected user does not have the tenant role.'
                    );
                }
            }


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
            | If one emergency-contact field is supplied,
            | require all emergency-contact fields.
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

