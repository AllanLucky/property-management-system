<?php

namespace App\Http\Requests\PlotSales;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlotSaleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to update a plot sale.
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
        $plotSale = $this->route('plotSale')
            ?? $this->route('plot_sale')
            ?? $this->route('sale');

        $saleId = is_object($plotSale)
            ? $plotSale->getKey()
            : $plotSale;

        return [
            /*
            |--------------------------------------------------------------------------
            | Plot, Buyer and Agent
            |--------------------------------------------------------------------------
            */
            'plot_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:plots,id',
            ],

            'buyer_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:users,id',
            ],

            'agent_id' => [
                'sometimes',
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
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('plot_sales', 'sale_number')
                    ->ignore($saleId),
            ],

            'agreement_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('plot_sales', 'agreement_number')
                    ->ignore($saleId),
            ],

            'sale_date' => [
                'sometimes',
                'required',
                'date',
            ],

            'agreement_date' => [
                'sometimes',
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
                'sometimes',
                'required',
                'numeric',
                'gt:0',
                'max:999999999999.99',
            ],

            'deposit_amount' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'discount_amount' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            // Payment totals and balances must be maintained by the application.
            'amount_paid' => [
                'prohibited',
            ],

            'balance' => [
                'prohibited',
            ],

            'currency' => [
                'sometimes',
                'required',
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
                'sometimes',
                'nullable',
                'string',
                'max:50',
            ],

            'due_date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            /*
            |--------------------------------------------------------------------------
            | Sale Status
            |--------------------------------------------------------------------------
            */
            'status' => [
                'sometimes',
                'required',
                Rule::in([
                    'pending',
                    'reserved',
                    'approved',
                ]),
            ],

            // These fields must be changed through dedicated business operations.
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
                'sometimes',
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

        if ($this->exists('currency') && $this->filled('currency')) {
            $data['currency'] = strtoupper(
                trim((string) $this->input('currency'))
            );
        }

        if ($this->exists('sale_number') && $this->filled('sale_number')) {
            $data['sale_number'] = trim(
                (string) $this->input('sale_number')
            );
        }

        if ($this->exists('agreement_number') && $this->filled('agreement_number')) {
            $data['agreement_number'] = trim(
                (string) $this->input('agreement_number')
            );
        }

        if ($this->exists('notes') && $this->filled('notes')) {
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
            'plot_id.required' => 'Please select a plot.',
            'plot_id.exists' => 'The selected plot does not exist.',

            'buyer_id.required' => 'Please select a buyer.',
            'buyer_id.exists' => 'The selected buyer does not exist.',

            'agent_id.exists' => 'The selected sales agent does not exist.',

            'sale_number.unique' => 'This sale number is already in use.',
            'agreement_number.unique' => 'This agreement number is already in use.',

            'sale_date.required' => 'The sale date is required when updating it.',
            'sale_date.date' => 'Please provide a valid sale date.',

            'agreement_date.required_with' =>
                'An agreement date is required when an agreement number is provided.',

            'sale_price.required' => 'The sale price is required.',
            'sale_price.numeric' => 'The sale price must be a valid number.',
            'sale_price.gt' => 'The sale price must be greater than zero.',

            'deposit_amount.numeric' => 'The deposit amount must be a valid number.',
            'deposit_amount.min' => 'The deposit amount cannot be negative.',

            'discount_amount.numeric' => 'The discount must be a valid number.',
            'discount_amount.min' => 'The discount cannot be negative.',

            'currency.size' => 'The currency must contain exactly three letters.',
            'currency.regex' => 'Use a valid uppercase currency code, such as KES.',

            'status.in' =>
                'The status must be pending, reserved, or approved. Use the dedicated operation for completion or cancellation.',

            'amount_paid.prohibited' =>
                'Record received payments through the plot payment module.',

            'balance.prohibited' =>
                'The balance is calculated automatically.',

            'completion_date.prohibited' =>
                'Use the sale completion operation to set the completion date.',

            'is_active.prohibited' =>
                'The active status is managed by the application.',

            'cancellation_reason.prohibited' =>
                'Use the cancellation operation to provide a cancellation reason.',
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