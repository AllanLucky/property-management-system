<?php

namespace App\Http\Requests\Tenancy;

use App\Models\Tenancy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenancyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Property Hierarchy
            |--------------------------------------------------------------------------
            */

            'property_id' => [
                'required',
                'integer',
                'exists:properties,id',
            ],

            'apartment_id' => [
                'nullable',
                'integer',
                'exists:apartments,id',
            ],

            'unit_id' => [
                'required',
                'integer',
                'exists:units,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Tenant
            |--------------------------------------------------------------------------
            */

            'tenant_id' => [
                'required',
                'integer',
                'exists:tenants,id',

                /*
                 * A tenant can only have one active/pending tenancy
                 * at a time.
                 *
                 * Historical tenancies with expired, terminated,
                 * or cancelled status are still allowed.
                 */
                function ($attribute, $value, $fail) {
                    $hasBlockingTenancy = Tenancy::query()
                        ->where('tenant_id', $value)
                        ->whereIn('status', [
                            Tenancy::STATUS_ACTIVE,
                            Tenancy::STATUS_PENDING,
                        ])
                        ->where('is_active', true)
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

            /*
             * tenancy_number is normally generated automatically
             * by the Tenancy model.
             *
             * It is optional here in case you want to provide one.
             */

            'tenancy_number' => [
                'nullable',
                'string',
                'max:255',
                'unique:tenancies,tenancy_number',
            ],

            /*
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
            */

            'start_date' => [
                'required',
                'date',
            ],

            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            'move_in_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            'move_out_date' => [
                'nullable',
                'date',
                'after_or_equal:move_in_date',
                'after_or_equal:start_date',
            ],

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */

            'rent_amount' => [
                'required',
                'numeric',
                'min:0',
            ],

            'deposit_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'service_charge' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'late_fee' => [
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
                'required',
                'string',
                'in:daily,weekly,monthly,quarterly,yearly',
            ],

            'due_day' => [
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
                'nullable',
                'string',
                Rule::in(Tenancy::STATUSES),
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Agreement
            |--------------------------------------------------------------------------
            */

            'agreement_file' => [
                'nullable',
                'string',
                'max:2048',
            ],

            'agreement_public_id' => [
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
                'nullable',
                'string',
                'max:5000',
            ],
        ];
    }

    /**
     * Prepare data before validation.
     */
    protected function prepareForValidation(): void
    {
        /*
         * Convert empty strings to null for optional fields.
         */
        $this->merge([
            'apartment_id' => $this->filled('apartment_id')
                ? $this->apartment_id
                : null,

            'end_date' => $this->filled('end_date')
                ? $this->end_date
                : null,

            'move_in_date' => $this->filled('move_in_date')
                ? $this->move_in_date
                : null,

            'move_out_date' => $this->filled('move_out_date')
                ? $this->move_out_date
                : null,

            'deposit_amount' => $this->filled('deposit_amount')
                ? $this->deposit_amount
                : null,

            'service_charge' => $this->filled('service_charge')
                ? $this->service_charge
                : null,

            'late_fee' => $this->filled('late_fee')
                ? $this->late_fee
                : null,

            'due_day' => $this->filled('due_day')
                ? $this->due_day
                : null,

            'notes' => $this->filled('notes')
                ? $this->notes
                : null,
        ]);
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'property_id.required' =>
                'A property is required.',

            'property_id.exists' =>
                'The selected property does not exist.',

            'apartment_id.exists' =>
                'The selected apartment does not exist.',

            'unit_id.required' =>
                'A unit is required.',

            'unit_id.exists' =>
                'The selected unit does not exist.',

            'tenant_id.required' =>
                'A tenant is required.',

            'tenant_id.exists' =>
                'The selected tenant does not exist.',

            'tenancy_number.unique' =>
                'The tenancy number already exists.',

            'end_date.after_or_equal' =>
                'The end date must be on or after the start date.',

            'move_in_date.after_or_equal' =>
                'The move-in date must be on or after the start date.',

            'move_out_date.after_or_equal' =>
                'The move-out date must be on or after the move-in date.',

            'rent_amount.required' =>
                'Rent amount is required.',

            'rent_amount.numeric' =>
                'Rent amount must be a valid number.',

            'payment_frequency.required' =>
                'Payment frequency is required.',

            'payment_frequency.in' =>
                'The selected payment frequency is invalid.',

            'due_day.min' =>
                'Due day must be between 1 and 31.',

            'due_day.max' =>
                'Due day must be between 1 and 31.',

            'status.in' =>
                'The selected tenancy status is invalid.',
        ];
    }
}