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
     * Validation rules.
     */
    public function rules(): array
    {
        /*
         * Get tenancy ID from the route.
         *
         * Supports:
         * /tenancies/{id}
         */

        $tenancy = $this->route('tenancy');

        $tenancyId = $tenancy instanceof Tenancy
            ? $tenancy->id
            : $tenancy;

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
                'in:daily,weekly,monthly,quarterly,yearly',
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
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        /*
         * Only convert fields that were actually supplied.
         *
         * This is important for PATCH requests.
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
            if ($this->has($field) && $this->input($field) === '') {
                $data[$field] = null;
            }
        }

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
            'property_id.exists' =>
                'The selected property does not exist.',

            'apartment_id.exists' =>
                'The selected apartment does not exist.',

            'unit_id.exists' =>
                'The selected unit does not exist.',

            'tenant_id.exists' =>
                'The selected tenant does not exist.',

            'tenancy_number.unique' =>
                'The tenancy number already exists.',

            'end_date.date' =>
                'The end date must be a valid date.',

            'move_in_date.date' =>
                'The move-in date must be a valid date.',

            'move_out_date.date' =>
                'The move-out date must be a valid date.',

            'rent_amount.numeric' =>
                'Rent amount must be a valid number.',

            'deposit_amount.numeric' =>
                'Deposit amount must be a valid number.',

            'service_charge.numeric' =>
                'Service charge must be a valid number.',

            'late_fee.numeric' =>
                'Late fee must be a valid number.',

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

    /**
     * Additional validation after normal rules.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {

            /*
             * Validate end date against supplied start date.
             */

            if (
                $this->filled('start_date') &&
                $this->filled('end_date')
            ) {
                $startDate = strtotime($this->start_date);
                $endDate = strtotime($this->end_date);

                if (
                    $startDate !== false &&
                    $endDate !== false &&
                    $endDate < $startDate
                ) {
                    $validator->errors()->add(
                        'end_date',
                        'The end date must be on or after the start date.'
                    );
                }
            }

            /*
             * Validate move-out date against move-in date.
             */

            if (
                $this->filled('move_in_date') &&
                $this->filled('move_out_date')
            ) {
                $moveInDate = strtotime($this->move_in_date);
                $moveOutDate = strtotime($this->move_out_date);

                if (
                    $moveInDate !== false &&
                    $moveOutDate !== false &&
                    $moveOutDate < $moveInDate
                ) {
                    $validator->errors()->add(
                        'move_out_date',
                        'The move-out date must be on or after the move-in date.'
                    );
                }
            }
        });
    }
}