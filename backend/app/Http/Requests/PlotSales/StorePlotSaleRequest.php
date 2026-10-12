<?php

namespace App\Http\Requests\PlotSales;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlotSaleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
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
            | Plot, Buyer and Agent
            |--------------------------------------------------------------------------
            */
            'plot_id' => [
                'required',
                'integer',
                'exists:plots,id',
            ],

            'buyer_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],

            'agent_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Sale and Agreement Information
            |--------------------------------------------------------------------------
            */
            'sale_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('plot_sales', 'sale_number'),
            ],

            'agreement_number' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('plot_sales', 'agreement_number'),
            ],

            'sale_date' => [
                'nullable',
                'date',
            ],

            'agreement_date' => [
                'nullable',
                'date',
                'required_with:agreement_number',
            ],

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */
            'sale_price' => [
                'required',
                'numeric',
                'gt:0',
                'max:999999999999.99',
            ],

            'deposit_amount' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
                'lte:sale_price',
            ],

            'discount_amount' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
                'lte:sale_price',
            ],

            // These fields are calculated and maintained by the application.
            'amount_paid' => [
                'prohibited',
            ],

            'balance' => [
                'prohibited',
            ],

            'currency' => [
                'nullable',
                'string',
                'size:3',
                'regex:/^[A-Z]{3}$/',
            ],

            /*
            |--------------------------------------------------------------------------
            | Payment Terms
            |--------------------------------------------------------------------------
            */
            'payment_frequency' => [
                'nullable',
                'string',
                'max:50',
            ],

            'due_date' => [
                'nullable',
                'date',
                'after_or_equal:sale_date',
            ],

            /*
            |--------------------------------------------------------------------------
            | Sale Status and Completion
            |--------------------------------------------------------------------------
            */
            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    'pending',
                    'reserved',
                ]),
            ],

            'completion_date' => [
                'prohibited',
            ],

            'is_active' => [
                'prohibited',
            ],

            'cancellation_reason' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | Additional Information
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
     * Prepare input before validation.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->filled('currency')) {
            $data['currency'] = strtoupper(
                trim((string) $this->input('currency'))
            );
        }

        if ($this->filled('sale_number')) {
            $data['sale_number'] = trim(
                (string) $this->input('sale_number')
            );
        }

        if ($this->filled('agreement_number')) {
            $data['agreement_number'] = trim(
                (string) $this->input('agreement_number')
            );
        }

        if ($this->filled('notes')) {
            $data['notes'] = trim(
                (string) $this->input('notes')
            );
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'plot_id.required' => 'Please select a plot for this sale.',
            'plot_id.exists' => 'The selected plot does not exist.',

            'buyer_id.required' => 'Please select a buyer.',
            'buyer_id.exists' => 'The selected buyer does not exist.',

            'agent_id.exists' => 'The selected agent does not exist.',

            'sale_number.unique' => 'This sale number is already in use.',
            'agreement_number.unique' => 'This agreement number is already in use.',

            'agreement_date.required_with' => 'An agreement date is required when an agreement number is provided.',

            'sale_price.required' => 'The sale price is required.',
            'sale_price.numeric' => 'The sale price must be a valid number.',
            'sale_price.gt' => 'The sale price must be greater than zero.',

            'deposit_amount.numeric' => 'The deposit amount must be a valid number.',
            'deposit_amount.min' => 'The deposit amount cannot be negative.',
            'deposit_amount.lte' => 'The deposit amount cannot exceed the sale price.',

            'discount_amount.numeric' => 'The discount amount must be a valid number.',
            'discount_amount.min' => 'The discount amount cannot be negative.',
            'discount_amount.lte' => 'The discount cannot exceed the sale price.',

            'currency.size' => 'The currency must be a three-letter currency code, such as KES.',
            'currency.regex' => 'The currency must contain three uppercase letters, such as KES.',

            'due_date.after_or_equal' => 'The due date must be on or after the sale date.',

            'status.in' => 'A new plot sale can only have pending or reserved status.',

            'amount_paid.prohibited' => 'Payments must be recorded through the plot payment module.',
            'balance.prohibited' => 'The sale balance is calculated automatically.',
            'completion_date.prohibited' => 'The completion date is managed when the sale is completed.',
            'is_active.prohibited' => 'The active status is managed by the application.',
            'cancellation_reason.prohibited' => 'A cancellation reason can only be provided when cancelling a sale.',
        ];
    }

    /**
     * Get custom attribute names for validation errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'plot_id' => 'plot',
            'buyer_id' => 'buyer',
            'agent_id' => 'sales agent',
            'sale_number' => 'sale number',
            'agreement_number' => 'agreement number',
            'sale_date' => 'sale date',
            'agreement_date' => 'agreement date',
            'sale_price' => 'sale price',
            'deposit_amount' => 'deposit amount',
            'discount_amount' => 'discount amount',
            'amount_paid' => 'amount paid',
            'payment_frequency' => 'payment frequency',
            'due_date' => 'payment due date',
            'completion_date' => 'completion date',
            'cancellation_reason' => 'cancellation reason',
        ];
    }
}
