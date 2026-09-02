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
     * IMPORTANT:
     *
     * The linked User account owns:
     *
     * - user_id
     * - first_name
     * - last_name
     * - email
     * - phone
     *
     * A normal tenant update does not change the linked User account.
     *
     * tenant_number is also system-managed and cannot be changed.
     *
     * Tenant-specific information remains editable here.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Tenant-Specific Personal Information
            |--------------------------------------------------------------------------
            */

            'other_names' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
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
                    ->ignore($this->tenant()?->id),
            ],

            'passport_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('tenants', 'passport_number')
                    ->ignore($this->tenant()?->id),
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
                'max:150',
            ],

            'county' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],

            'city' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
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
     */
    public function messages(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Tenant Personal Information
            |--------------------------------------------------------------------------
            */

            'other_names.string' =>
                'Other names must be a valid text value.',

            'other_names.max' =>
                'Other names may not exceed 150 characters.',

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

            'id_number.string' =>
                'The ID number must be a valid text value.',

            'id_number.unique' =>
                'This ID number is already registered to another tenant.',

            'passport_number.string' =>
                'The passport number must be a valid text value.',

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

            'occupation.string' =>
                'Occupation must be a valid text value.',

            'employer.string' =>
                'Employer must be a valid text value.',

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
                'Emergency contact name must be a valid text value.',

            'emergency_contact_phone.string' =>
                'Emergency contact phone must be a valid text value.',

            'emergency_contact_relationship.string' =>
                'Emergency contact relationship must be a valid text value.',

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
     *
     * Only fields supported by TenantService::update() are normalized.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        /*
        |--------------------------------------------------------------------------
        | Tenant-Specific Personal Information
        |--------------------------------------------------------------------------
        */

        if ($this->has('other_names')) {
            $data['other_names'] = $this->filled('other_names')
                ? trim((string) $this->input('other_names'))
                : null;
        }

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

            $tenant = $this->tenant();

            /*
            |--------------------------------------------------------------------------
            | Tenant Existence
            |--------------------------------------------------------------------------
            */

            if (!$tenant) {
                $validator->errors()->add(
                    'tenant',
                    'The tenant being updated could not be found.'
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Identification Requirement
            |--------------------------------------------------------------------------
            |
            | If identification information is being updated, the final
            | tenant record must still contain either:
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
                $idNumber = $this->has('id_number')
                    ? $this->input('id_number')
                    : $tenant->id_number;

                $passportNumber = $this->has('passport_number')
                    ? $this->input('passport_number')
                    : $tenant->passport_number;

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
            | If any emergency contact field is being changed,
            | all three fields must exist in the final record.
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

                foreach ($emergencyFields as $field) {

                    $value = $this->has($field)
                        ? $this->input($field)
                        : $tenant->{$field};

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
            |
            | TenantService::update() automatically:
            |
            | - sets verified_at when is_verified = true
            | - clears verified_at when is_verified = false
            |
            | Therefore we only reject an explicitly supplied conflicting
            | verification date.
            |
            */

            if ($this->has('is_verified')) {

                $isVerified = filter_var(
                    $this->input('is_verified'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                );

                if ($isVerified === true) {

                    /*
                    |--------------------------------------------------------------------------
                    | When verified, verified_at may be omitted because
                    | TenantService will automatically set it to now().
                    |--------------------------------------------------------------------------
                    */

                }

                if ($isVerified === false) {

                    /*
                    |--------------------------------------------------------------------------
                    | When explicitly unverified, the service will clear
                    | verified_at automatically.
                    |--------------------------------------------------------------------------
                    |
                    | Do not reject an existing verified_at here because
                    | TenantService is responsible for clearing it.
                    |--------------------------------------------------------------------------
                    */
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Protected User Fields
            |--------------------------------------------------------------------------
            |
            | These belong to the linked User model and are not tenant
            | fields.
            |
            */

            $userFields = [
                'user_id',
                'first_name',
                'last_name',
                'email',
                'phone',
                'tenant_number',
                'is_active',
            ];

            foreach ($userFields as $field) {

                if ($this->has($field)) {

                    $validator->errors()->add(
                        $field,
                        $this->protectedFieldMessage($field)
                    );
                }
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Protected Field Message
    |--------------------------------------------------------------------------
    */

    /**
     * Get the validation message for protected fields.
     */
    protected function protectedFieldMessage(string $field): string
    {
        return match ($field) {

            'user_id' =>
                'The linked user account cannot be changed during a tenant update.',

            'tenant_number' =>
                'The tenant number is system-managed and cannot be changed.',

            'first_name' =>
                'The first name belongs to the user account and must be updated from the user profile.',

            'last_name' =>
                'The last name belongs to the user account and must be updated from the user profile.',

            'email' =>
                'The email belongs to the user account and must be updated from the user profile.',

            'phone' =>
                'The phone number belongs to the user account and must be updated from the user profile.',

            'is_active' =>
                'The is_active field is not supported for tenant updates.',

            default =>
                "The {$field} cannot be changed during a tenant update.",
        };
    }
}
