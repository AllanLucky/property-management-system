<?php

namespace App\Http\Requests\Tenant;

use App\Models\Tenant;
use App\Models\User;
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

    /*
    |--------------------------------------------------------------------------
    | Tenant
    |--------------------------------------------------------------------------
    */

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
            return Tenant::find((int) $tenant);
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    */

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
            | User Account
            |--------------------------------------------------------------------------
            |
            | Every tenant profile must belong to an existing user account.
            |
            | The additional withValidator() check below makes sure that the
            | selected user actually has the "tenant" Spatie role.
            |
            */

            'user_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:users,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
            |
            | Tenant number normally should not be changed after creation,
            | but it is still supported here for administrative updates.
            |
            */

            'tenant_number' => [
                'sometimes',
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
            | Address / Location
            |--------------------------------------------------------------------------
            */

            'country' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'region' => [
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

            'area' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
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
            | Employment
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

    /*
    |--------------------------------------------------------------------------
    | Validation Messages
    |--------------------------------------------------------------------------
    */

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
            | User Account
            |--------------------------------------------------------------------------
            */

            'user_id.required' =>
                'A user account is required for every tenant.',

            'user_id.integer' =>
                'The user ID must be a valid integer.',

            'user_id.exists' =>
                'The selected user account does not exist.',

            /*
            |--------------------------------------------------------------------------
            | Tenant Role
            |--------------------------------------------------------------------------
            */

            'tenant_role' =>
                'The selected user must have the tenant role.',

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
                'This ID number is already registered to another tenant.',

            'passport_number.unique' =>
                'This passport number is already registered to another tenant.',

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

    /*
    |--------------------------------------------------------------------------
    | Prepare Request
    |--------------------------------------------------------------------------
    */

    /**
     * Prepare request data before validation.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        /*
        |--------------------------------------------------------------------------
        | User Account
        |--------------------------------------------------------------------------
        */

        if ($this->has('user_id')) {

            $userId = $this->input('user_id');

            $data['user_id'] = filled($userId)
                ? (int) $userId
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Tenant Number
        |--------------------------------------------------------------------------
        */

        if ($this->has('tenant_number')) {

            $data['tenant_number'] = $this->filled('tenant_number')
                ? trim((string) $this->input('tenant_number'))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Personal Information
        |--------------------------------------------------------------------------
        */

        if ($this->has('first_name')) {

            $data['first_name'] = $this->filled('first_name')
                ? trim((string) $this->input('first_name'))
                : null;
        }

        if ($this->has('last_name')) {

            $data['last_name'] = $this->filled('last_name')
                ? trim((string) $this->input('last_name'))
                : null;
        }

        if ($this->has('other_names')) {

            $data['other_names'] = $this->filled('other_names')
                ? trim((string) $this->input('other_names'))
                : null;
        }

        if ($this->has('email')) {

            $data['email'] = $this->filled('email')
                ? strtolower(trim((string) $this->input('email')))
                : null;
        }

        if ($this->has('phone')) {

            $data['phone'] = $this->filled('phone')
                ? trim((string) $this->input('phone'))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Date / Gender
        |--------------------------------------------------------------------------
        */

        if ($this->has('date_of_birth')) {

            $data['date_of_birth'] = $this->filled('date_of_birth')
                ? $this->input('date_of_birth')
                : null;
        }

        if ($this->has('gender')) {

            $data['gender'] = $this->filled('gender')
                ? strtolower(trim((string) $this->input('gender')))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Identification
        |--------------------------------------------------------------------------
        */

        if ($this->has('id_number')) {

            $data['id_number'] = $this->filled('id_number')
                ? strtoupper(trim((string) $this->input('id_number')))
                : null;
        }

        if ($this->has('passport_number')) {

            $data['passport_number'] = $this->filled('passport_number')
                ? strtoupper(trim((string) $this->input('passport_number')))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Address / Location
        |--------------------------------------------------------------------------
        */

        if ($this->has('country')) {

            $data['country'] = $this->filled('country')
                ? trim((string) $this->input('country'))
                : null;
        }

        if ($this->has('region')) {

            $data['region'] = $this->filled('region')
                ? trim((string) $this->input('region'))
                : null;
        }

        if ($this->has('county')) {

            $data['county'] = $this->filled('county')
                ? trim((string) $this->input('county'))
                : null;
        }

        if ($this->has('city')) {

            $data['city'] = $this->filled('city')
                ? trim((string) $this->input('city'))
                : null;
        }

        if ($this->has('area')) {

            $data['area'] = $this->filled('area')
                ? trim((string) $this->input('area'))
                : null;
        }

        if ($this->has('postal_code')) {

            $data['postal_code'] = $this->filled('postal_code')
                ? trim((string) $this->input('postal_code'))
                : null;
        }

        if ($this->has('address')) {

            $data['address'] = $this->filled('address')
                ? trim((string) $this->input('address'))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Employment
        |--------------------------------------------------------------------------
        */

        if ($this->has('occupation')) {

            $data['occupation'] = $this->filled('occupation')
                ? trim((string) $this->input('occupation'))
                : null;
        }

        if ($this->has('employer')) {

            $data['employer'] = $this->filled('employer')
                ? trim((string) $this->input('employer'))
                : null;
        }

        if ($this->has('monthly_income')) {

            $data['monthly_income'] = $this->filled('monthly_income')
                ? $this->input('monthly_income')
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
                    ? trim((string) $this->input('emergency_contact_name'))
                    : null;
        }

        if ($this->has('emergency_contact_phone')) {

            $data['emergency_contact_phone'] =
                $this->filled('emergency_contact_phone')
                    ? trim((string) $this->input('emergency_contact_phone'))
                    : null;
        }

        if ($this->has('emergency_contact_relationship')) {

            $data['emergency_contact_relationship'] =
                $this->filled('emergency_contact_relationship')
                    ? trim((string) $this->input('emergency_contact_relationship'))
                    : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Verification
        |--------------------------------------------------------------------------
        */

        if ($this->has('is_verified')) {

            $value = $this->input('is_verified');

            $data['is_verified'] = filter_var(
                $value,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );
        }

        if ($this->has('verified_at')) {

            $data['verified_at'] = $this->filled('verified_at')
                ? $this->input('verified_at')
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        if ($this->has('status')) {

            $data['status'] = $this->filled('status')
                ? strtolower(trim((string) $this->input('status')))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Notes
        |--------------------------------------------------------------------------
        */

        if ($this->has('notes')) {

            $data['notes'] = $this->filled('notes')
                ? trim((string) $this->input('notes'))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | Merge
        |--------------------------------------------------------------------------
        */

        $this->merge($data);
    }

    /*
    |--------------------------------------------------------------------------
    | Additional Validation
    |--------------------------------------------------------------------------
    */

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {

            /*
            |--------------------------------------------------------------------------
            | User Account Validation
            |--------------------------------------------------------------------------
            |
            | If user_id is being changed, make sure:
            |
            | 1. The user exists.
            | 2. The user has the tenant role.
            |
            */

            if ($this->has('user_id')) {

                $userId = $this->input('user_id');

                if (!filled($userId)) {

                    $validator->errors()->add(
                        'user_id',
                        'A tenant cannot be updated without a valid user account.'
                    );

                } else {

                    $user = User::find($userId);

                    if (!$user) {

                        $validator->errors()->add(
                            'user_id',
                            'The selected user account does not exist.'
                        );

                    } elseif (!$user->hasRole('tenant')) {

                        $validator->errors()->add(
                            'tenant_role',
                            'The selected user must have the tenant role.'
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Identification Requirement
            |--------------------------------------------------------------------------
            |
            | The final tenant record must always have either:
            |
            | - ID number
            | OR
            | - Passport number
            |
            */

            if (
                $this->has('id_number') ||
                $this->has('passport_number')
            ) {

                $tenant = $this->tenant();

                $idNumber = $this->has('id_number')
                    ? $this->input('id_number')
                    : $tenant?->id_number;

                $passportNumber = $this->has('passport_number')
                    ? $this->input('passport_number')
                    : $tenant?->passport_number;

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
            | If any emergency contact field is updated, all three fields
            | must exist in the final tenant record.
            |
            */

            $emergencyFields = [
                'emergency_contact_name',
                'emergency_contact_phone',
                'emergency_contact_relationship',
            ];

            $hasEmergencyUpdate = collect($emergencyFields)
                ->contains(
                    fn ($field) => $this->has($field)
                );

            if ($hasEmergencyUpdate) {

                $tenant = $this->tenant();

                foreach ($emergencyFields as $field) {

                    $value = $this->has($field)
                        ? $this->input($field)
                        : $tenant?->{$field};

                    if (blank($value)) {

                        $validator->errors()->add(
                            $field,
                            'All emergency contact details are required when updating emergency contact information.'
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Verification Consistency
            |--------------------------------------------------------------------------
            */

            if ($this->has('is_verified')) {

                $isVerified = filter_var(
                    $this->input('is_verified'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                );

                if ($isVerified === true) {

                    $verifiedAt = $this->has('verified_at')
                        ? $this->input('verified_at')
                        : $this->tenant()?->verified_at;

                    if (blank($verifiedAt)) {

                        $validator->errors()->add(
                            'verified_at',
                            'A verification date is required when the tenant is verified.'
                        );
                    }
                }

                if ($isVerified === false) {

                    $verifiedAt = $this->has('verified_at')
                        ? $this->input('verified_at')
                        : null;

                    if (filled($verifiedAt)) {

                        $validator->errors()->add(
                            'verified_at',
                            'A tenant who is not verified cannot have a verification date.'
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | User/Tenant Relationship Protection
            |--------------------------------------------------------------------------
            |
            | Prevent two tenant records from being attached to the same
            | user account.
            |
            */

            if ($this->has('user_id') && filled($this->input('user_id'))) {

                $existingTenant = Tenant::where(
                    'user_id',
                    $this->input('user_id')
                )
                    ->when(
                        $this->tenant(),
                        fn ($query, $tenant) =>
                            $query->where('id', '!=', $tenant->id)
                    )
                    ->first();

                if ($existingTenant) {

                    $validator->errors()->add(
                        'user_id',
                        'This user account is already linked to another tenant.'
                    );
                }
            }
        });
    }
}
