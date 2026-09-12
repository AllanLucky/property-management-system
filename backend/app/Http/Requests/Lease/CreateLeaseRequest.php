<?php

namespace App\Http\Requests\Lease;

use App\Models\Lease;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateLeaseRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'tenancy_id' => $this->filled('tenancy_id')
                ? (int) $this->input('tenancy_id')
                : null,

            'lease_type' => $this->filled('lease_type')
                ? strtolower(trim((string) $this->input('lease_type')))
                : Lease::TYPE_FIXED_TERM,

            'payment_frequency' => $this->filled('payment_frequency')
                ? strtolower(trim((string) $this->input('payment_frequency')))
                : 'monthly',

            'status' => $this->filled('status')
                ? strtolower(trim((string) $this->input('status')))
                : Lease::STATUS_DRAFT,

            'start_date' => $this->filled('start_date')
                ? trim((string) $this->input('start_date'))
                : null,

            'end_date' => $this->filled('end_date')
                ? trim((string) $this->input('end_date'))
                : null,

            'rent_amount' => $this->filled('rent_amount')
                ? $this->input('rent_amount')
                : null,

            'deposit_amount' => $this->filled('deposit_amount')
                ? $this->input('deposit_amount')
                : null,

            'service_charge' => $this->filled('service_charge')
                ? $this->input('service_charge')
                : 0,

            'late_fee' => $this->filled('late_fee')
                ? $this->input('late_fee')
                : 0,

            'due_day' => $this->filled('due_day')
                ? $this->input('due_day')
                : null,

            'notice_period_days' => $this->filled('notice_period_days')
                ? $this->input('notice_period_days')
                : null,

            'signed_at' => $this->filled('signed_at')
                ? trim((string) $this->input('signed_at'))
                : null,

            'terminated_at' => $this->filled('terminated_at')
                ? trim((string) $this->input('terminated_at'))
                : null,

            'termination_reason' => $this->filled('termination_reason')
                ? trim((string) $this->input('termination_reason'))
                : null,

            'document_path' => $this->filled('document_path')
                ? trim((string) $this->input('document_path'))
                : null,

            'notes' => $this->filled('notes')
                ? trim((string) $this->input('notes'))
                : null,
        ]);
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
            | Tenancy
            |--------------------------------------------------------------------------
            |
            | A lease belongs to one tenancy.
            | Tenant/property/unit information is resolved through the tenancy.
            |
            */

            'tenancy_id' => [
                'required',
                'integer',
                'exists:tenancies,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Lease Configuration
            |--------------------------------------------------------------------------
            */

            'lease_type' => [
                'required',
                'string',
                'max:30',
                Rule::in(Lease::LEASE_TYPES),
            ],

            /*
            |--------------------------------------------------------------------------
            | Lease Dates
            |--------------------------------------------------------------------------
            |
            | Start date is always required.
            |
            | End date:
            | - Required for fixed-term leases.
            | - Optional for other lease types.
            |
            */

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                Rule::requiredIf(
                    fn (): bool =>
                        $this->input('lease_type') === Lease::TYPE_FIXED_TERM
                ),
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            /*
            |--------------------------------------------------------------------------
            | Financial Terms
            |--------------------------------------------------------------------------
            */

            'rent_amount' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'deposit_amount' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'service_charge' => [
                'nullable',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'late_fee' => [
                'nullable',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            /*
            |--------------------------------------------------------------------------
            | Payment Terms
            |--------------------------------------------------------------------------
            */

            'payment_frequency' => [
                'required',
                'string',
                'max:30',
                Rule::in([
                    'daily',
                    'weekly',
                    'monthly',
                    'quarterly',
                    'semi_annually',
                    'annually',
                    'one_time',
                ]),
            ],

            'due_day' => [
                'nullable',
                'integer',
                'between:1,31',
            ],

            'notice_period_days' => [
                'nullable',
                'integer',
                'min:0',
                'max:365',
            ],

            /*
            |--------------------------------------------------------------------------
            | Lease Status
            |--------------------------------------------------------------------------
            |
            | New leases normally start as draft.
            |
            */

            'status' => [
                'nullable',
                'string',
                'max:30',
                Rule::in(Lease::STATUSES),
            ],

            /*
            |--------------------------------------------------------------------------
            | Signature / Termination
            |--------------------------------------------------------------------------
            */

            'signed_at' => [
                'nullable',
                'date',
            ],

            'terminated_at' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            'termination_reason' => [
                'nullable',
                'string',
                'max:5000',
            ],

            /*
            |--------------------------------------------------------------------------
            | Documents / Notes
            |--------------------------------------------------------------------------
            */

            'document_path' => [
                'nullable',
                'string',
                'max:500',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:10000',
            ],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator): void {
            $startDate = $this->input('start_date');
            $endDate = $this->input('end_date');
            $leaseType = $this->input('lease_type');
            $status = $this->input('status');

            /*
            |--------------------------------------------------------------------------
            | Validate Date Range
            |--------------------------------------------------------------------------
            */

            if (
                filled($startDate) &&
                filled($endDate)
            ) {
                try {
                    $start = \Carbon\Carbon::parse($startDate)->startOfDay();
                    $end = \Carbon\Carbon::parse($endDate)->startOfDay();

                    if ($end->lt($start)) {
                        $validator->errors()->add(
                            'end_date',
                            'The lease end date must be on or after the start date.'
                        );
                    }
                } catch (\Throwable) {
                    // The normal date validation rule handles invalid dates.
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Fixed-Term Lease Validation
            |--------------------------------------------------------------------------
            */

            if (
                $leaseType === Lease::TYPE_FIXED_TERM &&
                blank($endDate)
            ) {
                $validator->errors()->add(
                    'end_date',
                    'The end date is required for a fixed-term lease.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Active Lease Validation
            |--------------------------------------------------------------------------
            |
            | An active lease must not already be expired.
            |
            */

            if (
                $status === Lease::STATUS_ACTIVE &&
                filled($endDate)
            ) {
                try {
                    $end = \Carbon\Carbon::parse($endDate)->startOfDay();

                    if ($end->lt(today())) {
                        $validator->errors()->add(
                            'end_date',
                            'An active lease cannot have an end date in the past.'
                        );
                    }
                } catch (\Throwable) {
                    // Normal date validation handles invalid dates.
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Expired Lease Validation
            |--------------------------------------------------------------------------
            |
            | If the caller explicitly creates an expired lease, its end date
            | must already have passed.
            |
            */

            if (
                $status === Lease::STATUS_EXPIRED &&
                filled($endDate)
            ) {
                try {
                    $end = \Carbon\Carbon::parse($endDate)->startOfDay();

                    if ($end->gte(today())) {
                        $validator->errors()->add(
                            'status',
                            'A lease can only be created as expired when its end date has already passed.'
                        );
                    }
                } catch (\Throwable) {
                    // Normal date validation handles invalid dates.
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Termination Validation
            |--------------------------------------------------------------------------
            */

            if (
                $status === Lease::STATUS_TERMINATED &&
                blank($this->input('termination_reason'))
            ) {
                $validator->errors()->add(
                    'termination_reason',
                    'A termination reason is required when creating a terminated lease.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Cancelled Lease Validation
            |--------------------------------------------------------------------------
            */

            if (
                $status === Lease::STATUS_CANCELLED &&
                blank($this->input('termination_reason'))
            ) {
                $validator->errors()->add(
                    'termination_reason',
                    'A cancellation reason is required when creating a cancelled lease.'
                );
            }
        });
    }

    /**
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | Tenancy
            |--------------------------------------------------------------------------
            */

            'tenancy_id.required' =>
                'A tenancy is required to create a lease.',

            'tenancy_id.integer' =>
                'The selected tenancy is invalid.',

            'tenancy_id.exists' =>
                'The selected tenancy does not exist.',

            /*
            |--------------------------------------------------------------------------
            | Lease Configuration
            |--------------------------------------------------------------------------
            */

            'lease_type.required' =>
                'The lease type is required.',

            'lease_type.in' =>
                'The selected lease type is invalid.',

            /*
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
            */

            'start_date.required' =>
                'The lease start date is required.',

            'start_date.date' =>
                'The lease start date must be a valid date.',

            'end_date.required' =>
                'The lease end date is required for a fixed-term lease.',

            'end_date.date' =>
                'The lease end date must be a valid date.',

            'end_date.after_or_equal' =>
                'The lease end date must be on or after the start date.',

            /*
            |--------------------------------------------------------------------------
            | Financial Terms
            |--------------------------------------------------------------------------
            */

            'rent_amount.required' =>
                'The rent amount is required.',

            'rent_amount.numeric' =>
                'The rent amount must be a valid number.',

            'rent_amount.min' =>
                'The rent amount cannot be negative.',

            'rent_amount.decimal' =>
                'The rent amount may contain a maximum of two decimal places.',

            'deposit_amount.required' =>
                'The deposit amount is required.',

            'deposit_amount.numeric' =>
                'The deposit amount must be a valid number.',

            'deposit_amount.min' =>
                'The deposit amount cannot be negative.',

            'deposit_amount.decimal' =>
                'The deposit amount may contain a maximum of two decimal places.',

            'service_charge.numeric' =>
                'The service charge must be a valid number.',

            'service_charge.min' =>
                'The service charge cannot be negative.',

            'service_charge.decimal' =>
                'The service charge may contain a maximum of two decimal places.',

            'late_fee.numeric' =>
                'The late fee must be a valid number.',

            'late_fee.min' =>
                'The late fee cannot be negative.',

            'late_fee.decimal' =>
                'The late fee may contain a maximum of two decimal places.',

            /*
            |--------------------------------------------------------------------------
            | Payment Terms
            |--------------------------------------------------------------------------
            */

            'payment_frequency.required' =>
                'The payment frequency is required.',

            'payment_frequency.in' =>
                'The selected payment frequency is invalid.',

            'due_day.integer' =>
                'The due day must be a valid number.',

            'due_day.between' =>
                'The due day must be between 1 and 31.',

            'notice_period_days.integer' =>
                'The notice period must be a valid number.',

            'notice_period_days.min' =>
                'The notice period cannot be negative.',

            'notice_period_days.max' =>
                'The notice period cannot exceed 365 days.',

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            'status.in' =>
                'The selected lease status is invalid.',

            /*
            |--------------------------------------------------------------------------
            | Signature / Termination
            |--------------------------------------------------------------------------
            */

            'signed_at.date' =>
                'The signed date must be a valid date.',

            'terminated_at.date' =>
                'The termination date must be a valid date.',

            'terminated_at.after_or_equal' =>
                'The termination date must be on or after the lease start date.',

            'termination_reason.string' =>
                'The termination reason must be valid text.',

            'termination_reason.max' =>
                'The termination reason cannot exceed 5000 characters.',

            /*
            |--------------------------------------------------------------------------
            | Documents / Notes
            |--------------------------------------------------------------------------
            */

            'document_path.string' =>
                'The document path must be valid text.',

            'document_path.max' =>
                'The document path cannot exceed 500 characters.',

            'notes.string' =>
                'The notes must be valid text.',

            'notes.max' =>
                'The notes cannot exceed 10000 characters.',
        ];
    }

    /**
     * Get validated data prepared for the application layer.
     *
     * @return array<string, mixed>
     */
    public function validatedData(): array
    {
        $data = $this->validated();

        /*
        |--------------------------------------------------------------------------
        | Application Defaults
        |--------------------------------------------------------------------------
        */

        $data['service_charge'] = $data['service_charge'] ?? 0;
        $data['late_fee'] = $data['late_fee'] ?? 0;

        $data['status'] = $data['status'] ?? Lease::STATUS_DRAFT;

        $data['lease_type'] =
            $data['lease_type'] ?? Lease::TYPE_FIXED_TERM;

        $data['payment_frequency'] =
            $data['payment_frequency'] ?? 'monthly';

        /*
        |--------------------------------------------------------------------------
        | Normalize Empty Optional Values
        |--------------------------------------------------------------------------
        */

        foreach ([
            'end_date',
            'due_day',
            'notice_period_days',
            'signed_at',
            'terminated_at',
            'termination_reason',
            'document_path',
            'notes',
        ] as $field) {
            if (
                array_key_exists($field, $data) &&
                ($data[$field] === '' || $data[$field] === null)
            ) {
                $data[$field] = null;
            }
        }

        return $data;
    }
}
