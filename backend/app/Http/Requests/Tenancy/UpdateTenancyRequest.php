<?php

namespace App\Http\Requests\Tenancy;

use App\Models\Tenancy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenancyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the tenancy being updated.
     */
    protected function tenancy(): ?Tenancy
    {
        $tenancy = $this->route('tenancy');

        if ($tenancy instanceof Tenancy) {
            return $tenancy;
        }

        if (is_numeric($tenancy)) {
            return Tenancy::find($tenancy);
        }

        return null;
    }

    /**
     * Get the tenancy ID safely.
     */
    protected function tenancyId(): mixed
    {
        $tenancy = $this->route('tenancy');

        return $tenancy instanceof Tenancy
            ? $tenancy->id
            : $tenancy;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        $tenancyId = $this->tenancyId();

        return [

            /*
            |--------------------------------------------------------------------------
            | Property Hierarchy
            |--------------------------------------------------------------------------
            */

            'property_id' => [
                'sometimes',
                'integer',
                'exists:properties,id',
            ],

            'apartment_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:apartments,id',
            ],

            'unit_id' => [
                'sometimes',
                'integer',
                'exists:units,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Tenant
            |--------------------------------------------------------------------------
            */

            'tenant_id' => [
                'sometimes',
                'integer',
                'exists:tenants,id',

                /*
                 * Prevent assigning this tenancy to another tenant
                 * who already has an active or pending tenancy.
                 *
                 * The current tenancy is excluded from the check.
                 */
                function ($attribute, $value, $fail) use ($tenancyId) {

                    $hasBlockingTenancy = Tenancy::query()
                        ->where('tenant_id', $value)
                        ->whereKeyNot($tenancyId)
                        ->blockingTenantAssignment()
                        ->exists();

                    if ($hasBlockingTenancy) {
                        $fail(
                            'The selected tenant is already assigned to an active or pending tenancy.'
                        );
                    }
                },
            ],

            /*
            |--------------------------------------------------------------------------
            | Tenancy Identification
            |--------------------------------------------------------------------------
            */

            'tenancy_number' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('tenancies', 'tenancy_number')
                    ->ignore($tenancyId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
            */

            'start_date' => [
                'sometimes',
                'date',
            ],

            'end_date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            'move_in_date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            'move_out_date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */

            'rent_amount' => [
                'sometimes',
                'numeric',
                'min:0',
            ],

            'deposit_amount' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'service_charge' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'late_fee' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | Payment Configuration
            |--------------------------------------------------------------------------
            */

            'payment_frequency' => [
                'sometimes',
                'string',
                Rule::in([
                    'daily',
                    'weekly',
                    'monthly',
                    'quarterly',
                    'yearly',
                ]),
            ],

            'due_day' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
                'max:31',
            ],

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            'status' => [
                'sometimes',
                'string',
                Rule::in(Tenancy::STATUSES),
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Agreement
            |--------------------------------------------------------------------------
            */

            'agreement_file' => [
                'sometimes',
                'nullable',
                'string',
                'max:2048',
            ],

            'agreement_public_id' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
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
     * Prepare data before validation.
     *
     * Empty strings are converted to null only for fields
     * that explicitly allow null.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        /*
        |--------------------------------------------------------------------------
        | Nullable Fields
        |--------------------------------------------------------------------------
        */

        $nullableFields = [
            'apartment_id',
            'end_date',
            'move_in_date',
            'move_out_date',
            'deposit_amount',
            'service_charge',
            'late_fee',
            'due_day',
            'agreement_file',
            'agreement_public_id',
            'notes',
        ];

        foreach ($nullableFields as $field) {
            if (
                $this->has($field) &&
                $this->input($field) === ''
            ) {
                $data[$field] = null;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Boolean
        |--------------------------------------------------------------------------
        |
        | Frontend/Postman clients may send:
        |
        | true / false
        | 1 / 0
        | "true" / "false"
        | "1" / "0"
        |
        */

        if ($this->has('is_active')) {
            $value = $this->input('is_active');

            if ($value === 'true' || $value === '1' || $value === 1) {
                $data['is_active'] = true;
            }

            if ($value === 'false' || $value === '0' || $value === 0) {
                $data['is_active'] = false;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Merge Normalized Data
        |--------------------------------------------------------------------------
        */

        if (!empty($data)) {
            $this->merge($data);
        }
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Property
            |--------------------------------------------------------------------------
            */

            'property_id.integer' =>
                'The property ID must be a valid number.',

            'property_id.exists' =>
                'The selected property does not exist.',

            /*
            |--------------------------------------------------------------------------
            | Apartment
            |--------------------------------------------------------------------------
            */

            'apartment_id.integer' =>
                'The apartment ID must be a valid number.',

            'apartment_id.exists' =>
                'The selected apartment does not exist.',

            /*
            |--------------------------------------------------------------------------
            | Unit
            |--------------------------------------------------------------------------
            */

            'unit_id.integer' =>
                'The unit ID must be a valid number.',

            'unit_id.exists' =>
                'The selected unit does not exist.',

            /*
            |--------------------------------------------------------------------------
            | Tenant
            |--------------------------------------------------------------------------
            */

            'tenant_id.integer' =>
                'The tenant ID must be a valid number.',

            'tenant_id.exists' =>
                'The selected tenant does not exist.',

            /*
            |--------------------------------------------------------------------------
            | Tenancy Number
            |--------------------------------------------------------------------------
            */

            'tenancy_number.string' =>
                'The tenancy number must be a valid string.',

            'tenancy_number.max' =>
                'The tenancy number may not exceed 255 characters.',

            'tenancy_number.unique' =>
                'The tenancy number already exists.',

            /*
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
            */

            'start_date.date' =>
                'The start date must be a valid date.',

            'end_date.date' =>
                'The end date must be a valid date.',

            'move_in_date.date' =>
                'The move-in date must be a valid date.',

            'move_out_date.date' =>
                'The move-out date must be a valid date.',

            /*
            |--------------------------------------------------------------------------
            | Financial
            |--------------------------------------------------------------------------
            */

            'rent_amount.numeric' =>
                'Rent amount must be a valid number.',

            'rent_amount.min' =>
                'Rent amount cannot be negative.',

            'deposit_amount.numeric' =>
                'Deposit amount must be a valid number.',

            'deposit_amount.min' =>
                'Deposit amount cannot be negative.',

            'service_charge.numeric' =>
                'Service charge must be a valid number.',

            'service_charge.min' =>
                'Service charge cannot be negative.',

            'late_fee.numeric' =>
                'Late fee must be a valid number.',

            'late_fee.min' =>
                'Late fee cannot be negative.',

            /*
            |--------------------------------------------------------------------------
            | Payment
            |--------------------------------------------------------------------------
            */

            'payment_frequency.in' =>
                'The selected payment frequency is invalid.',

            'due_day.integer' =>
                'Due day must be a valid number.',

            'due_day.min' =>
                'Due day must be between 1 and 31.',

            'due_day.max' =>
                'Due day must be between 1 and 31.',

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            'status.in' =>
                'The selected tenancy status is invalid.',

            'is_active.boolean' =>
                'The active status must be true or false.',

            /*
            |--------------------------------------------------------------------------
            | Agreement
            |--------------------------------------------------------------------------
            */

            'agreement_file.string' =>
                'The agreement file must be a valid string.',

            'agreement_file.max' =>
                'The agreement file may not exceed 2048 characters.',

            'agreement_public_id.string' =>
                'The agreement public ID must be a valid string.',

            'agreement_public_id.max' =>
                'The agreement public ID may not exceed 255 characters.',

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

            'notes.string' =>
                'Notes must be a valid string.',

            'notes.max' =>
                'Notes may not exceed 5000 characters.',
        ];
    }

    /**
     * Additional validation after normal validation.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {

            $tenancy = $this->tenancy();

            /*
            |--------------------------------------------------------------------------
            | Ensure Tenancy Exists
            |--------------------------------------------------------------------------
            */

            if (!$tenancy) {
                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Determine Effective Tenant
            |--------------------------------------------------------------------------
            |
            | If tenant_id is not being changed, use the existing tenant.
            |
            */

            $tenantId = $this->has('tenant_id')
                ? $this->input('tenant_id')
                : $tenancy->tenant_id;

            /*
            |--------------------------------------------------------------------------
            | Tenant Assignment Protection
            |--------------------------------------------------------------------------
            |
            | This is intentionally repeated here as an additional safety layer.
            |
            | The current tenancy is excluded from the query.
            |
            */

            if (!empty($tenantId)) {

                $hasBlockingTenancy = Tenancy::query()
                    ->where('tenant_id', $tenantId)
                    ->whereKeyNot($tenancy->id)
                    ->blockingTenantAssignment()
                    ->exists();

                if ($hasBlockingTenancy) {
                    $validator->errors()->add(
                        'tenant_id',
                        'The selected tenant is already assigned to an active or pending tenancy.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Determine Effective Dates
            |--------------------------------------------------------------------------
            */

            $startDate = $this->has('start_date')
                ? $this->input('start_date')
                : $tenancy->start_date;

            $endDate = $this->has('end_date')
                ? $this->input('end_date')
                : $tenancy->end_date;

            /*
            |--------------------------------------------------------------------------
            | Start Date / End Date
            |--------------------------------------------------------------------------
            */

            if (
                !empty($startDate) &&
                !empty($endDate)
            ) {
                $startTimestamp = strtotime($startDate);
                $endTimestamp = strtotime($endDate);

                if (
                    $startTimestamp !== false &&
                    $endTimestamp !== false &&
                    $endTimestamp < $startTimestamp
                ) {
                    $validator->errors()->add(
                        'end_date',
                        'The end date must be on or after the start date.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Move-In / Move-Out Dates
            |--------------------------------------------------------------------------
            */

            $moveInDate = $this->has('move_in_date')
                ? $this->input('move_in_date')
                : $tenancy->move_in_date;

            $moveOutDate = $this->has('move_out_date')
                ? $this->input('move_out_date')
                : $tenancy->move_out_date;

            if (
                !empty($moveInDate) &&
                !empty($moveOutDate)
            ) {
                $moveInTimestamp = strtotime($moveInDate);
                $moveOutTimestamp = strtotime($moveOutDate);

                if (
                    $moveInTimestamp !== false &&
                    $moveOutTimestamp !== false &&
                    $moveOutTimestamp < $moveInTimestamp
                ) {
                    $validator->errors()->add(
                        'move_out_date',
                        'The move-out date must be on or after the move-in date.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Move-In Date vs Start Date
            |--------------------------------------------------------------------------
            */

            if (
                !empty($moveInDate) &&
                !empty($startDate)
            ) {
                $moveInTimestamp = strtotime($moveInDate);
                $startTimestamp = strtotime($startDate);

                if (
                    $moveInTimestamp !== false &&
                    $startTimestamp !== false &&
                    $moveInTimestamp < $startTimestamp
                ) {
                    $validator->errors()->add(
                        'move_in_date',
                        'The move-in date cannot be before the tenancy start date.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Move-Out Date vs End Date
            |--------------------------------------------------------------------------
            */

            if (
                !empty($moveOutDate) &&
                !empty($endDate)
            ) {
                $moveOutTimestamp = strtotime($moveOutDate);
                $endTimestamp = strtotime($endDate);

                if (
                    $moveOutTimestamp !== false &&
                    $endTimestamp !== false &&
                    $moveOutTimestamp > $endTimestamp
                ) {
                    $validator->errors()->add(
                        'move_out_date',
                        'The move-out date cannot be after the tenancy end date.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Due Day Validation
            |--------------------------------------------------------------------------
            */

            $paymentFrequency = $this->has('payment_frequency')
                ? $this->input('payment_frequency')
                : $tenancy->payment_frequency;

            $dueDay = $this->has('due_day')
                ? $this->input('due_day')
                : $tenancy->due_day;

            if (
                $paymentFrequency === 'monthly' &&
                $dueDay !== null &&
                $dueDay !== ''
            ) {
                $dueDay = (int) $dueDay;

                if ($dueDay < 1 || $dueDay > 31) {
                    $validator->errors()->add(
                        'due_day',
                        'For monthly payments, the due day must be between 1 and 31.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Effective Status / Active State
            |--------------------------------------------------------------------------
            */

            $status = $this->has('status')
                ? $this->input('status')
                : $tenancy->status;

            $isActive = $this->has('is_active')
                ? $this->boolean('is_active')
                : (bool) $tenancy->is_active;

            /*
            |--------------------------------------------------------------------------
            | Status / Active Consistency
            |--------------------------------------------------------------------------
            */

            if (
                $status !== Tenancy::STATUS_ACTIVE &&
                $isActive
            ) {
                $validator->errors()->add(
                    'is_active',
                    'A tenancy with a non-active status cannot be marked as active.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Move-Out / Active Consistency
            |--------------------------------------------------------------------------
            */

            if (
                !empty($moveOutDate) &&
                $isActive
            ) {
                $validator->errors()->add(
                    'is_active',
                    'A tenancy with a move-out date cannot be marked as active.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Terminal Status Protection
            |--------------------------------------------------------------------------
            |
            | Expired, terminated and cancelled tenancies should never
            | remain active.
            |
            */

            if (
                in_array($status, [
                    Tenancy::STATUS_EXPIRED,
                    Tenancy::STATUS_TERMINATED,
                    Tenancy::STATUS_CANCELLED,
                ], true) &&
                $isActive
            ) {
                $validator->errors()->add(
                    'is_active',
                    'Expired, terminated, or cancelled tenancies cannot be marked as active.'
                );
            }
        });
    }
}