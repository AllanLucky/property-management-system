<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant;
use App\Models\User;
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
     * IMPORTANT:
     *
     * The User account is created separately through User Management.
     *
     * Create Tenant only creates the tenant profile for an existing
     * User who already has the "tenant" Spatie role.
     *
     * User owns:
     * - first_name
     * - last_name
     * - email
     * - phone
     * - password
     * - roles / permissions
     *
     * Tenant owns:
     * - tenant_number
     * - other_names
     * - nationality
     * - date_of_birth
     * - gender
     * - identification
     * - address
     * - employment
     * - emergency contact
     * - documents
     * - verification
     * - tenant status
     * - notes
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Existing User Account
            |--------------------------------------------------------------------------
            |
            | The selected user must:
            |
            | 1. Exist
            | 2. Have the "tenant" role
            | 3. Not already have a tenant profile
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
            |
            | Optional from the frontend.
            |
            | If omitted, TenantService should generate it automatically.
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
            | Tenant-Specific Personal Information
            |--------------------------------------------------------------------------
            |
            | DO NOT include:
            |
            | first_name
            | last_name
            | email
            | phone
            |
            | Those belong to the selected User.
            |
            */

            'other_names' => [
                'nullable',
                'string',
                'max:150',
            ],

            /*
            |--------------------------------------------------------------------------
            | Nationality
            |--------------------------------------------------------------------------
            |
            | Nationality represents the tenant's citizenship/national identity.
            |
            | This is intentionally separate from:
            |
            | country
            |
            | where country represents the tenant's residential/location country.
            |
            */

            'nationality' => [
                'nullable',
                'string',
                'max:100',
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
            | At least one identification number is required.
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
            | Address / Location
            |--------------------------------------------------------------------------
            |
            | country is the tenant's residential/location country.
            |
            | It is NOT the same as nationality.
            |
            */

            'country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'region' => [
                'nullable',
                'string',
                'max:150',
            ],

            'county' => [
                'nullable',
                'string',
                'max:150',
            ],

            'city' => [
                'nullable',
                'string',
                'max:150',
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
            | Employment / Financial Information
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
            | Normally verification should happen through dedicated
            | verification endpoints.
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
            | Tenant Status
            |--------------------------------------------------------------------------
            |
            | New tenants should normally start as "pending".
            |
            | The service should enforce pending as the default.
            |
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
                'Please select an existing user account for this tenant.',

            'user_id.integer' =>
                'The selected user account is invalid.',

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

            'tenant_number.max' =>
                'Tenant number may not exceed 50 characters.',

            /*
            |--------------------------------------------------------------------------
            | Tenant Information
            |--------------------------------------------------------------------------
            */

            'other_names.string' =>
                'Other names must be valid text.',

            'other_names.max' =>
                'Other names may not exceed 150 characters.',

            'nationality.string' =>
                'Nationality must be valid text.',

            'nationality.max' =>
                'Nationality may not exceed 100 characters.',

            'date_of_birth.date' =>
                'Please provide a valid date of birth.',

            'date_of_birth.before' =>
                'Date of birth must be before today.',

            'gender.in' =>
                'The selected gender is invalid.',

            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            */

            'id_number.unique' =>
                'This National ID number is already registered.',

            'passport_number.unique' =>
                'This passport number is already registered.',

            /*
            |--------------------------------------------------------------------------
            | Address / Location
            |--------------------------------------------------------------------------
            */

            'country.string' =>
                'Country must be valid text.',

            'region.string' =>
                'Region must be valid text.',

            'county.string' =>
                'County must be valid text.',

            'city.string' =>
                'City must be valid text.',

            'area.string' =>
                'Area must be valid text.',

            'postal_code.string' =>
                'Postal code must be valid text.',

            'address.string' =>
                'Address must be valid text.',

            /*
            |--------------------------------------------------------------------------
            | Employment
            |--------------------------------------------------------------------------
            */

            'occupation.string' =>
                'Occupation must be valid text.',

            'employer.string' =>
                'Employer must be valid text.',

            'monthly_income.numeric' =>
                'Monthly income must be a valid number.',

            'monthly_income.min' =>
                'Monthly income cannot be negative.',

            /*
            |--------------------------------------------------------------------------
            | Emergency Contact
            |--------------------------------------------------------------------------
            */

            'emergency_contact_name.string' =>
                'Emergency contact name must be valid text.',

            'emergency_contact_phone.string' =>
                'Emergency contact phone must be valid text.',

            'emergency_contact_relationship.string' =>
                'Emergency contact relationship must be valid text.',

            /*
            |--------------------------------------------------------------------------
            | Documents
            |--------------------------------------------------------------------------
            */

            'photo.file' =>
                'The tenant photo must be a valid file.',

            'photo.image' =>
                'The tenant photo must be a valid image.',

            'photo.mimes' =>
                'The tenant photo must be JPG, JPEG, PNG, or WEBP.',

            'photo.max' =>
                'The tenant photo may not be larger than 5MB.',

            'id_front.file' =>
                'The front ID document must be a valid file.',

            'id_front.image' =>
                'The front ID document must be a valid image.',

            'id_front.mimes' =>
                'The front ID document must be JPG, JPEG, PNG, or WEBP.',

            'id_front.max' =>
                'The front ID document may not be larger than 5MB.',

            'id_back.file' =>
                'The back ID document must be a valid file.',

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
                'Verification status must be true or false.',

            'verified_at.date' =>
                'The verification date must be valid.',

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
                'Notes must be valid text.',

            'notes.max' =>
                'Notes may not exceed 5000 characters.',
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
                ? trim((string) $this->input('tenant_number'))
                : null,

            /*
            |--------------------------------------------------------------------------
            | Tenant-Specific Personal Information
            |--------------------------------------------------------------------------
            */

            'other_names' => $this->filled('other_names')
                ? trim((string) $this->input('other_names'))
                : null,

            /*
            |--------------------------------------------------------------------------
            | Nationality
            |--------------------------------------------------------------------------
            |
            | Default nationality is Kenyan when no nationality is supplied.
            |
            | This is separate from the residential country field.
            |
            */

            'nationality' => $this->filled('nationality')
                ? trim((string) $this->input('nationality'))
                : 'Kenyan',

            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            */

            'id_number' => $this->filled('id_number')
                ? strtoupper(trim((string) $this->input('id_number')))
                : null,

            'passport_number' => $this->filled('passport_number')
                ? strtoupper(trim((string) $this->input('passport_number')))
                : null,

            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            */

            'country' => $this->filled('country')
                ? trim((string) $this->input('country'))
                : 'Kenya',

            'region' => $this->filled('region')
                ? trim((string) $this->input('region'))
                : null,

            'county' => $this->filled('county')
                ? trim((string) $this->input('county'))
                : null,

            'city' => $this->filled('city')
                ? trim((string) $this->input('city'))
                : null,

            'area' => $this->filled('area')
                ? trim((string) $this->input('area'))
                : null,

            'postal_code' => $this->filled('postal_code')
                ? trim((string) $this->input('postal_code'))
                : null,

            'address' => $this->filled('address')
                ? trim((string) $this->input('address'))
                : null,

            /*
            |--------------------------------------------------------------------------
            | Employment
            |--------------------------------------------------------------------------
            */

            'occupation' => $this->filled('occupation')
                ? trim((string) $this->input('occupation'))
                : null,

            'employer' => $this->filled('employer')
                ? trim((string) $this->input('employer'))
                : null,

            /*
            |--------------------------------------------------------------------------
            | Emergency Contact
            |--------------------------------------------------------------------------
            */

            'emergency_contact_name' =>
                $this->filled('emergency_contact_name')
                    ? trim((string) $this->input('emergency_contact_name'))
                    : null,

            'emergency_contact_phone' =>
                $this->filled('emergency_contact_phone')
                    ? trim((string) $this->input('emergency_contact_phone'))
                    : null,

            'emergency_contact_relationship' =>
                $this->filled('emergency_contact_relationship')
                    ? trim((string) $this->input('emergency_contact_relationship'))
                    : null,

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

            'notes' => $this->filled('notes')
                ? trim((string) $this->input('notes'))
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
            | Existing User Validation
            |--------------------------------------------------------------------------
            |
            | The selected User must:
            |
            | 1. Exist
            | 2. Have the tenant role
            | 3. Not already have a tenant profile
            |
            */

            if ($this->filled('user_id')) {

                $user = User::find($this->input('user_id'));

                if (! $user) {
                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | Tenant Role
                |--------------------------------------------------------------------------
                */

                if (! $user->hasRole('tenant')) {

                    $validator->errors()->add(
                        'user_id',
                        'The selected user does not have the tenant role.'
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Existing Tenant Profile
                |--------------------------------------------------------------------------
                |
                | One User can have one Tenant profile.
                |
                | A Tenant can later have multiple Tenancies.
                |
                */

                if (
                    Tenant::where('user_id', $user->id)->exists()
                ) {

                    $validator->errors()->add(
                        'user_id',
                        'This user already has a tenant profile.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Identification Requirement
            |--------------------------------------------------------------------------
            |
            | At least one government identification number is required.
            |
            */

            if (
                blank($this->input('id_number')) &&
                blank($this->input('passport_number'))
            ) {

                $validator->errors()->add(
                    'identification',
                    'Either a National ID number or Passport number is required.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Emergency Contact Validation
            |--------------------------------------------------------------------------
            |
            | If one emergency contact field is supplied,
            | all emergency contact fields are required.
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