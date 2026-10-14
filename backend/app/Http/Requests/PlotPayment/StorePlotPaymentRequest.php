<?php

namespace App\Http\Requests\PlotPayment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlotPaymentRequest extends FormRequest
{
    /*
    |--------------------------------------------------------------------------
    | Authorization
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the authenticated user can create plot payments.
     *
     * Route middleware and policies should enforce the application's
     * actual payment permissions.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        // Super administrators may manage all plot payments.
        if (method_exists($user, 'hasRole')
            && $user->hasRole('super-admin')) {
            return true;
        }

        return $user->can('plot-payments.create');
    }

    /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    */

    /**
     * Get the validation rules for creating a plot payment.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | Sale
            |--------------------------------------------------------------------------
            */

            'plot_sale_id' => [
                'required',
                'integer',
                'min:1',
                Rule::exists('plot_sales', 'id')
                    ->whereNull('deleted_at'),
            ],

            /*
            |--------------------------------------------------------------------------
            | Payment Identification
            |--------------------------------------------------------------------------
            */

            'payment_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
                Rule::unique('plot_payments', 'payment_number'),
            ],

            'receipt_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('plot_payments', 'receipt_number'),
            ],

            'transaction_reference' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
                Rule::unique('plot_payments', 'transaction_reference'),
            ],

            /*
            |--------------------------------------------------------------------------
            | Payment Information
            |--------------------------------------------------------------------------
            */

            'amount' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,2',
                'max:999999999999.99',
            ],

            'currency' => [
                'sometimes',
                'nullable',
                'string',
                'size:3',
                'regex:/^[A-Z]{3}$/',
            ],

            'payment_type' => [
                'required',
                'string',
                Rule::in([
                    'deposit',
                    'installment',
                    'balance',
                    'full_payment',
                    'other',
                ]),
            ],

            'payment_method' => [
                'required',
                'string',
                Rule::in([
                    'mpesa',
                    'bank_transfer',
                    'cash',
                    'card',
                    'cheque',
                    'online',
                    'other',
                ]),
            ],

            'payment_date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            /*
            |--------------------------------------------------------------------------
            | Payer Information
            |--------------------------------------------------------------------------
            */

            'payer_name' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],

            'payer_phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],

            'payer_email' => [
                'sometimes',
                'nullable',
                'email:rfc',
                'max:150',
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

            /*
            |--------------------------------------------------------------------------
            | Payment Status
            |--------------------------------------------------------------------------
            */

            // New payments should normally start as pending.
            // Only trusted backend logic should mark payments completed.
            'status' => [
                'sometimes',
                'nullable',
                Rule::in([
                    'pending',
                ]),
            ],

            'is_active' => [
                'sometimes',
                'boolean',
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
            'plot_sale_id.required' => 'Please select the plot sale for this payment.',
            'plot_sale_id.exists' => 'The selected plot sale does not exist or is unavailable.',

            'payment_number.unique' => 'This payment number has already been used.',
            'payment_number.max' => 'The payment number cannot exceed 50 characters.',

            'receipt_number.unique' => 'This receipt number has already been used.',
            'transaction_reference.unique' => 'This transaction reference has already been used.',

            'amount.required' => 'Please enter the payment amount.',
            'amount.numeric' => 'The payment amount must be a valid number.',
            'amount.gt' => 'The payment amount must be greater than zero.',
            'amount.decimal' => 'The payment amount can have a maximum of two decimal places.',
            'amount.max' => 'The payment amount exceeds the maximum allowed value.',

            'currency.size' => 'The currency must use a three-letter currency code, such as KES.',
            'currency.regex' => 'The currency must contain three uppercase letters, such as KES.',

            'payment_type.required' => 'Please select the payment type.',
            'payment_type.in' => 'The selected payment type is invalid.',

            'payment_method.required' => 'Please select the payment method.',
            'payment_method.in' => 'The selected payment method is invalid.',

            'payment_date.date' => 'Please provide a valid payment date.',

            'payer_name.max' => 'The payer name cannot exceed 150 characters.',
            'payer_phone.max' => 'The payer phone number cannot exceed 30 characters.',
            'payer_email.email' => 'Please provide a valid payer email address.',
            'payer_email.max' => 'The payer email cannot exceed 150 characters.',

            'notes.max' => 'Payment notes cannot exceed 5,000 characters.',

            'status.in' => 'New payments must have a pending status.',
            'is_active.boolean' => 'The active status must be true or false.',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Validation Attributes
    |--------------------------------------------------------------------------
    */

    /**
     * Get human-readable attribute names.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'plot_sale_id' => 'plot sale',
            'payment_number' => 'payment number',
            'receipt_number' => 'receipt number',
            'transaction_reference' => 'transaction reference',
            'amount' => 'payment amount',
            'currency' => 'currency',
            'payment_type' => 'payment type',
            'payment_method' => 'payment method',
            'payment_date' => 'payment date',
            'payer_name' => 'payer name',
            'payer_phone' => 'payer phone number',
            'payer_email' => 'payer email',
            'is_active' => 'active status',
        ];
    }
}
