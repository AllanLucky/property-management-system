<?php

namespace App\Http\Requests\Booking;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CancelBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
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
        $this->merge([
            'cancellation_reason' => $this->filled('cancellation_reason')
                ? trim((string) $this->cancellation_reason)
                : null,

            'payment_reference' => $this->filled('payment_reference')
                ? trim((string) $this->payment_reference)
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
            | CANCELLATION REASON
            |--------------------------------------------------------------------------
            |
            | A cancellation should always have an audit-friendly reason.
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
            | REFUND / PAYMENT INFORMATION
            |--------------------------------------------------------------------------
            |
            | These fields are optional because not every cancelled booking
            | will have a payment or refund.
            |
            */

            'payment_reference' => [
                'nullable',
                'string',
                'max:150',
            ],

            /*
            |--------------------------------------------------------------------------
            | REFUND AMOUNT
            |--------------------------------------------------------------------------
            |
            | The service should determine the actual refundable amount.
            | This field is therefore intentionally prohibited from the
            | cancellation request to prevent client-side financial
            | manipulation.
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
            | Status must be changed by BookingService.
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
            | Payment state should be calculated/updated by the service
            | according to the cancellation and refund workflow.
            |
            */

            'payment_status' => [
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
            'cancellation_reason.required' =>
                'Please provide a reason for cancelling this booking.',

            'cancellation_reason.min' =>
                'The cancellation reason must contain at least 3 characters.',

            'cancellation_reason.max' =>
                'The cancellation reason may not exceed 5000 characters.',

            'payment_reference.max' =>
                'The payment reference may not exceed 150 characters.',

            'refund_amount.prohibited' =>
                'Refund amount must be determined by the booking service.',

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