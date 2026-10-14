<?php

namespace App\Http\Requests\PlotPayment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlotPaymentRequest extends FormRequest
{
    /*
    |--------------------------------------------------------------------------
    | Authorization
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the authenticated user can update plot payments.
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
        if (
            method_exists($user, 'hasRole')
            && $user->hasRole('super-admin')
        ) {
            return true;
        }

        return $user->can('plot-payments.update');
    }

    /*
    |--------------------------------------------------------------------------
    | Validation Rules
    |--------------------------------------------------------------------------
    */

    /**
     * Get the validation rules for updating a plot payment.
     *
     * All fields are optional to support partial updates.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $payment = $this->route('plotPayment')
            ?? $this->route('plot_payment')
            ?? $this->route('payment')
            ?? $this->route('id');

        $paymentId = is_object($payment)
            ? $payment->getKey()
            : $payment;

        return [
            /*
            |--------------------------------------------------------------------------
            | Sale
            |--------------------------------------------------------------------------
            */

            'plot_sale_id' => [
                'sometimes',
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
                Rule::unique('plot_payments', 'payment_number')
                    ->ignore($paymentId),
            ],

            'receipt_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('plot_payments', 'receipt_number')
                    ->ignore($paymentId),
            ],

            'transaction_reference' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
                Rule::unique('plot_payments', 'transaction_reference')
                    ->ignore($paymentId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Payment Information
            |--------------------------------------------------------------------------
            */

            'amount' => [
                'sometimes',
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
                'sometimes',
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
                'sometimes',
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

            // Only allow pending status through this request.
            // Completion, failure, cancellation, and refunds should be
            // handled through authorized backend payment workflows.
            'status' => [
                'sometimes',
                'nullable',
                Rule::in([
                    'pending',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Activation
            |--------------------------------------------------------------------------
            */

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
            /*
            | Sale
            */

            'plot_sale_id.required' =>
                'Please select the plot sale for this payment.',

            'plot_sale_id.integer' =>
                'The selected plot sale must be valid.',

            'plot_sale_id.min' =>
                'The selected plot sale must be valid.',

            'plot_sale_id.exists' =>
                'The selected plot sale does not exist or is unavailable.',

            /*
            | Payment Identification
            */

            'payment_number.unique' =>
                'This payment number has already been used.',

            'payment_number.max' =>
                'The payment number cannot exceed 50 characters.',

            'receipt_number.unique' =>
                'This receipt number has already been used.',

            'receipt_number.max' =>
                'The receipt number cannot exceed 100 characters.',

            'transaction_reference.unique' =>
                'This transaction reference has already been used.',

            'transaction_reference.max' =>
                'The transaction reference cannot exceed 150 characters.',

            /*
            | Amount and Currency
            */

            'amount.required' =>
                'Please enter the payment amount.',

            'amount.numeric' =>
                'The payment amount must be a valid number.',

            'amount.gt' =>
                'The payment amount must be greater than zero.',

            'amount.decimal' =>
                'The payment amount can have a maximum of two decimal places.',

            'amount.max' =>
                'The payment amount exceeds the maximum allowed value.',

            'currency.size' =>
                'The currency must use a three-letter currency code, such as KES.',

            'currency.regex' =>
                'The currency must contain three uppercase letters, such as KES.',

            /*
            | Payment Type and Method
            */

            'payment_type.required' =>
                'Please select the payment type.',

            'payment_type.in' =>
                'The selected payment type is invalid.',

            'payment_method.required' =>
                'Please select the payment method.',

            'payment_method.in' =>
                'The selected payment method is invalid.',

            /*
            | Payment Date
            */

            'payment_date.date' =>
                'Please provide a valid payment date.',

            /*
            | Payer Information
            */

            'payer_name.max' =>
                'The payer name cannot exceed 150 characters.',

            'payer_phone.max' =>
                'The payer phone number cannot exceed 30 characters.',

            'payer_email.email' =>
                'Please provide a valid payer email address.',

            'payer_email.max' =>
                'The payer email cannot exceed 150 characters.',

            /*
            | Additional Information
            */

            'notes.max' =>
                'Payment notes cannot exceed 5,000 characters.',

            /*
            | Status and Activation
            */

            'status.in' =>
                'Only pending status is allowed through this update request.',

            'is_active.boolean' =>
                'The active status must be true or false.',
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
            'notes' => 'payment notes',
            'status' => 'payment status',
            'is_active' => 'active status',
        ];
    }
}
