<?php

namespace App\Http\Requests\Booking;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CancelBookingRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to cancel a booking.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('bookings.cancel') ?? false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        /*
        |--------------------------------------------------------------------------
        | CANCELLATION REASON
        |--------------------------------------------------------------------------
        */

        if ($this->has('cancellation_reason')) {
            $data['cancellation_reason'] = $this->filled('cancellation_reason')
                ? trim((string) $this->cancellation_reason)
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | PAYMENT REFERENCE
        |--------------------------------------------------------------------------
        */

        if ($this->has('payment_reference')) {
            $data['payment_reference'] = $this->filled('payment_reference')
                ? trim((string) $this->payment_reference)
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | MERGE NORMALIZED VALUES
        |--------------------------------------------------------------------------
        */

        if (!empty($data)) {
            $this->merge($data);
        }
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
            | CANCELLATION REASON
            |--------------------------------------------------------------------------
            |
            | Every cancellation must contain an audit-friendly reason.
            |
            */

            'cancellation_reason' => [
                'required',
                'string',
                'min:3',
                'max:5000',
            ],

            /*
            |--------------------------------------------------------------------------
            | PAYMENT REFERENCE
            |--------------------------------------------------------------------------
            |
            | Optional because a booking may have no payment associated with it.
            |
            */

            'payment_reference' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],

            /*
            |--------------------------------------------------------------------------
            | REFUND AMOUNT
            |--------------------------------------------------------------------------
            |
            | The client must never decide the refund amount.
            |
            | BookingService/payment workflow determines whether the customer
            | is eligible for a refund and the exact amount.
            |
            */

            'refund_amount' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | BOOKING STATUS
            |--------------------------------------------------------------------------
            |
            | Cancellation changes the status internally through BookingService.
            |
            */

            'status' => [
                'prohibited',
            ],

            'cancelled_at' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | PAYMENT STATUS
            |--------------------------------------------------------------------------
            |
            | Payment status must be controlled by the cancellation/payment
            | workflow and must not be supplied by the frontend.
            |
            */

            'payment_status' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | REFUND WORKFLOW FIELDS
            |--------------------------------------------------------------------------
            |
            | These are intentionally protected from direct client manipulation.
            |
            */

            'refunded_at' => [
                'prohibited',
            ],

            'refund_reference' => [
                'prohibited',
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

            /*
            |--------------------------------------------------------------------------
            | CANCELLATION
            |--------------------------------------------------------------------------
            */

            'cancellation_reason.required' =>
                'Please provide a reason for cancelling this booking.',

            'cancellation_reason.min' =>
                'The cancellation reason must contain at least 3 characters.',

            'cancellation_reason.max' =>
                'The cancellation reason may not exceed 5000 characters.',

            /*
            |--------------------------------------------------------------------------
            | PAYMENT
            |--------------------------------------------------------------------------
            */

            'payment_reference.max' =>
                'The payment reference may not exceed 150 characters.',

            /*
            |--------------------------------------------------------------------------
            | REFUND
            |--------------------------------------------------------------------------
            */

            'refund_amount.prohibited' =>
                'Refund amount must be determined by the booking service.',

            'refunded_at.prohibited' =>
                'Refund date is generated automatically.',

            'refund_reference.prohibited' =>
                'Refund reference is generated automatically.',

            /*
            |--------------------------------------------------------------------------
            | STATUS / WORKFLOW
            |--------------------------------------------------------------------------
            */

            'status.prohibited' =>
                'Booking status cannot be changed directly during cancellation.',

            'cancelled_at.prohibited' =>
                'Cancellation date is generated automatically.',

            'payment_status.prohibited' =>
                'Payment status cannot be changed directly during cancellation.',
        ];
    }

    /**
     * Get the validated cancellation reason.
     */
    public function cancellationReason(): string
    {
        return (string) $this->validated('cancellation_reason');
    }

    /**
     * Get the optional payment reference.
     */
    public function paymentReference(): ?string
    {
        return $this->validated('payment_reference');
    }
} 