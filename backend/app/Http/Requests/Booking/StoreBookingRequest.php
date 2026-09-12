<?php

namespace App\Http\Requests\Booking;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('bookings.create') ?? false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Normalize Optional Values
        |--------------------------------------------------------------------------
        */

        $this->merge([
            'booking_type' => $this->filled('booking_type')
                ? strtolower(trim((string) $this->booking_type))
                : 'reservation',

            'source' => $this->filled('source')
                ? strtolower(trim((string) $this->source))
                : 'other',

            'payment_status' => $this->filled('payment_status')
                ? strtolower(trim((string) $this->payment_status))
                : 'pending',

            'status' => $this->filled('status')
                ? strtolower(trim((string) $this->status))
                : 'pending',

            'email' => $this->filled('email')
                ? strtolower(trim((string) $this->email))
                : null,

            'phone' => $this->filled('phone')
                ? trim((string) $this->phone)
                : null,

            'first_name' => $this->filled('first_name')
                ? trim((string) $this->first_name)
                : null,

            'last_name' => $this->filled('last_name')
                ? trim((string) $this->last_name)
                : null,

            'special_requests' => $this->filled('special_requests')
                ? trim((string) $this->special_requests)
                : null,

            'notes' => $this->filled('notes')
                ? trim((string) $this->notes)
                : null,

            'payment_method' => $this->filled('payment_method')
                ? strtolower(trim((string) $this->payment_method))
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
            | USER / CUSTOMER / TENANT
            |--------------------------------------------------------------------------
            */

            'user_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'customer_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'tenant_id' => [
                'nullable',
                'integer',
                'exists:tenants,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | PROPERTY / APARTMENT / UNIT
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

            'tenancy_id' => [
                'nullable',
                'integer',
                'exists:tenancies,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | BOOKING TYPE / STATUS
            |--------------------------------------------------------------------------
            */

            'booking_type' => [
                'required',
                Rule::in([
                    'viewing',
                    'reservation',
                    'rental',
                ]),
            ],

            /*
            | Status is intentionally restricted to creation-safe states.
            |
            | Confirming, approving, rejecting, cancelling, completing
            | and expiring should happen through BookingService actions.
            */
            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                ]),
            ],

            'payment_status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'partial',
                    'paid',
                    'failed',
                    'refunded',
                ]),
            ],

            'source' => [
                'required',
                Rule::in([
                    'website',
                    'walk_in',
                    'agent',
                    'phone',
                    'referral',
                    'other',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | BOOKING DATES
            |--------------------------------------------------------------------------
            */

            'booking_date' => [
                'nullable',
                'date',
            ],

            'start_date' => [
                'nullable',
                'date',
            ],

            'end_date' => [
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            'check_in_date' => [
                'nullable',
                'date',
            ],

            'check_out_date' => [
                'nullable',
                'date',
                'after_or_equal:check_in_date',
            ],

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER SNAPSHOT
            |--------------------------------------------------------------------------
            */

            'first_name' => [
                'required_without:customer_id',
                'nullable',
                'string',
                'max:100',
            ],

            'last_name' => [
                'required_without:customer_id',
                'nullable',
                'string',
                'max:100',
            ],

            'email' => [
                'required_without:customer_id',
                'nullable',
                'email:rfc',
                'max:255',
            ],

            'phone' => [
                'required_without:customer_id',
                'nullable',
                'string',
                'max:30',
            ],

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL INFORMATION
            |--------------------------------------------------------------------------
            */

            'rent_amount' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'deposit_amount' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'service_charge' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'booking_fee' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'discount_amount' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'amount_paid' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            /*
            | total_amount and balance are calculated by Booking.
            | They should not be trusted from the client.
            */
            'total_amount' => [
                'prohibited',
            ],

            'balance' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | OCCUPANCY
            |--------------------------------------------------------------------------
            */

            'number_of_adults' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],

            'number_of_children' => [
                'nullable',
                'integer',
                'min:0',
                'max:100',
            ],

            /*
            |--------------------------------------------------------------------------
            | REQUESTS / NOTES
            |--------------------------------------------------------------------------
            */

            'special_requests' => [
                'nullable',
                'string',
                'max:5000',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],

            /*
            |--------------------------------------------------------------------------
            | PAYMENT
            |--------------------------------------------------------------------------
            */

            'payment_method' => [
                'nullable',
                'string',
                'max:50',
            ],

            'payment_reference' => [
                'nullable',
                'string',
                'max:150',
            ],

            /*
            |--------------------------------------------------------------------------
            | SEO / METADATA
            |--------------------------------------------------------------------------
            */

            'meta_title' => [
                'nullable',
                'string',
                'max:255',
            ],

            'meta_description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'metadata' => [
                'nullable',
                'array',
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
            'property_id.required' => 'Please select a property.',
            'property_id.exists' => 'The selected property does not exist.',

            'apartment_id.exists' => 'The selected apartment does not exist.',

            'unit_id.required' => 'Please select a unit.',
            'unit_id.exists' => 'The selected unit does not exist.',

            'customer_id.exists' => 'The selected customer does not exist.',
            'tenant_id.exists' => 'The selected tenant does not exist.',
            'tenancy_id.exists' => 'The selected tenancy does not exist.',

            'booking_type.in' => 'The selected booking type is invalid.',
            'status.in' => 'A new booking must start with pending status.',
            'payment_status.in' => 'The selected payment status is invalid.',
            'source.in' => 'The selected booking source is invalid.',

            'end_date.after_or_equal' =>
                'The booking end date must be on or after the start date.',

            'check_out_date.after_or_equal' =>
                'The check-out date must be on or after the check-in date.',

            'first_name.required_without' =>
                'First name is required when no customer account is selected.',

            'last_name.required_without' =>
                'Last name is required when no customer account is selected.',

            'email.required_without' =>
                'Email is required when no customer account is selected.',

            'phone.required_without' =>
                'Phone number is required when no customer account is selected.',

            'number_of_adults.min' =>
                'At least one adult is required.',

            'total_amount.prohibited' =>
                'Total amount is calculated automatically.',

            'balance.prohibited' =>
                'Balance is calculated automatically.',
        ];
    }
}