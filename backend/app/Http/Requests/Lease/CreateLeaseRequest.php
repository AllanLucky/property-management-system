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
            'lease_type' => $this->filled('lease_type')
                ? strtolower(trim((string) $this->input('lease_type')))
                : Lease::TYPE_FIXED_TERM,

            'payment_frequency' => $this->filled('payment_frequency')
                ? strtolower(trim((string) $this->input('payment_frequency')))
                : 'monthly',

            'status' => $this->filled('status')
                ? strtolower(trim((string) $this->input('status')))
                : Lease::STATUS_DRAFT,

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
            | Tenancy Relationship
            |--------------------------------------------------------------------------
            |
            | A lease belongs to exactly one tenancy.
            | Tenant, property, apartment and unit are resolved through tenancy.
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

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
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
     * Custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tenancy_id.required' => 'A tenancy is required to create a lease.',
            'tenancy_id.exists' => 'The selected tenancy does not exist.',

            'lease_type.in' => 'The selected lease type is invalid.',

            'start_date.required' => 'The lease start date is required.',
            'end_date.after_or_equal' => 'The lease end date must be on or after the start date.',

            'rent_amount.required' => 'The rent amount is required.',
            'rent_amount.numeric' => 'The rent amount must be a valid number.',
            'rent_amount.min' => 'The rent amount cannot be negative.',

            'deposit_amount.required' => 'The deposit amount is required.',
            'deposit_amount.numeric' => 'The deposit amount must be a valid number.',
            'deposit_amount.min' => 'The deposit amount cannot be negative.',

            'service_charge.numeric' => 'The service charge must be a valid number.',
            'service_charge.min' => 'The service charge cannot be negative.',

            'late_fee.numeric' => 'The late fee must be a valid number.',
            'late_fee.min' => 'The late fee cannot be negative.',

            'payment_frequency.in' => 'The selected payment frequency is invalid.',

            'due_day.between' => 'The due day must be between 1 and 31.',

            'notice_period_days.min' => 'The notice period cannot be negative.',
            'notice_period_days.max' => 'The notice period cannot exceed 365 days.',

            'status.in' => 'The selected lease status is invalid.',

            'terminated_at.after_or_equal' =>
                'The termination date must be on or after the lease start date.',
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
         * These defaults match the Lease model/database defaults.
         */
        $data['service_charge'] = $data['service_charge'] ?? 0;
        $data['late_fee'] = $data['late_fee'] ?? 0;
        $data['status'] = $data['status'] ?? Lease::STATUS_DRAFT;
        $data['lease_type'] = $data['lease_type'] ?? Lease::TYPE_FIXED_TERM;
        $data['payment_frequency'] = $data['payment_frequency'] ?? 'monthly';

        return $data;
    }
}