<?php

namespace App\Http\Requests\Booking;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBookingRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('bookings.update') ?? false;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        /*
        |--------------------------------------------------------------------------
        | BOOKING CLASSIFICATION
        |--------------------------------------------------------------------------
        */

        if ($this->has('booking_type')) {
            $data['booking_type'] = $this->filled('booking_type')
                ? strtolower(trim((string) $this->booking_type))
                : null;
        }

        if ($this->has('source')) {
            $data['source'] = $this->filled('source')
                ? strtolower(trim((string) $this->source))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER INFORMATION
        |--------------------------------------------------------------------------
        */

        if ($this->has('first_name')) {
            $data['first_name'] = $this->filled('first_name')
                ? trim((string) $this->first_name)
                : null;
        }

        if ($this->has('last_name')) {
            $data['last_name'] = $this->filled('last_name')
                ? trim((string) $this->last_name)
                : null;
        }

        if ($this->has('email')) {
            $data['email'] = $this->filled('email')
                ? strtolower(trim((string) $this->email))
                : null;
        }

        if ($this->has('phone')) {
            $data['phone'] = $this->filled('phone')
                ? trim((string) $this->phone)
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | DATES
        |--------------------------------------------------------------------------
        */

        foreach ([
            'booking_date',
            'start_date',
            'end_date',
            'check_in_date',
            'check_out_date',
        ] as $field) {
            if ($this->has($field) && $this->filled($field)) {
                $data[$field] = trim((string) $this->{$field});
            }
        }

        /*
        |--------------------------------------------------------------------------
        | REQUESTS / NOTES
        |--------------------------------------------------------------------------
        */

        if ($this->has('special_requests')) {
            $data['special_requests'] = $this->filled('special_requests')
                ? trim((string) $this->special_requests)
                : null;
        }

        if ($this->has('notes')) {
            $data['notes'] = $this->filled('notes')
                ? trim((string) $this->notes)
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | PAYMENT INFORMATION
        |--------------------------------------------------------------------------
        */

        if ($this->has('payment_method')) {
            $data['payment_method'] = $this->filled('payment_method')
                ? strtolower(trim((string) $this->payment_method))
                : null;
        }

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
            | USER / CUSTOMER / TENANT
            |--------------------------------------------------------------------------
            |
            | user_id identifies the authenticated creator/owner of the booking.
            | It must never be changed through a normal update.
            |
            | customer_id identifies the customer user account.
            | tenant_id identifies the tenant profile.
            |
            */

            'user_id' => [
                'prohibited',
            ],

            'customer_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'tenant_id' => [
                'sometimes',
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
            | TENANCY
            |--------------------------------------------------------------------------
            |
            | A tenancy can be attached or detached when permitted by the
            | BookingService/business workflow.
            |
            */

            'tenancy_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:tenancies,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | BOOKING CLASSIFICATION
            |--------------------------------------------------------------------------
            */

            'booking_type' => [
                'sometimes',
                'required',
                Rule::in([
                    'viewing',
                    'reservation',
                    'rental',
                ]),
            ],

            'source' => [
                'sometimes',
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
            | STATUS / WORKFLOW
            |--------------------------------------------------------------------------
            |
            | Booking status must be changed through dedicated workflow
            | actions such as confirm, approve, reject, cancel, complete, etc.
            |
            */

            'status' => [
                'prohibited',
            ],

            'confirmed_at' => [
                'prohibited',
            ],

            'approved_at' => [
                'prohibited',
            ],

            'rejected_at' => [
                'prohibited',
            ],

            'cancelled_at' => [
                'prohibited',
            ],

            'completed_at' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | PAYMENT STATUS
            |--------------------------------------------------------------------------
            |
            | Payment status belongs to the payment workflow and should not be
            | manually changed through the general booking update endpoint.
            |
            */

            'payment_status' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | BOOKING DATES
            |--------------------------------------------------------------------------
            */

            'booking_date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            'start_date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            'end_date' => [
                'sometimes',
                'nullable',
                'date',
                'after_or_equal:start_date',
            ],

            'check_in_date' => [
                'sometimes',
                'nullable',
                'date',
            ],

            'check_out_date' => [
                'sometimes',
                'nullable',
                'date',
                'after_or_equal:check_in_date',
            ],

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER SNAPSHOT
            |--------------------------------------------------------------------------
            |
            | These fields are useful for walk-in/unregistered customers and
            | historical booking snapshots.
            |
            | When customer_id is supplied, BookingService should normally
            | synchronize these values from the selected User.
            |
            */

            'first_name' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'last_name' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            'email' => [
                'sometimes',
                'nullable',
                'email:rfc',
                'max:255',
            ],

            'phone' => [
                'sometimes',
                'nullable',
                'string',
                'max:30',
            ],

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL INFORMATION
            |--------------------------------------------------------------------------
            |
            | Component amounts may be changed.
            |
            | total_amount and balance are ALWAYS calculated by BookingService.
            |
            */

            'rent_amount' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'deposit_amount' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'service_charge' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'booking_fee' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'discount_amount' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'amount_paid' => [
                'sometimes',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            /*
            |--------------------------------------------------------------------------
            | SERVER-CALCULATED FINANCIAL FIELDS
            |--------------------------------------------------------------------------
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
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],

            'number_of_children' => [
                'sometimes',
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
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],

            'notes' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],

            /*
            |--------------------------------------------------------------------------
            | REJECTION / CANCELLATION
            |--------------------------------------------------------------------------
            |
            | These fields are controlled by dedicated workflow actions.
            |
            */

            'rejection_reason' => [
                'prohibited',
            ],

            'cancellation_reason' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | PAYMENT
            |--------------------------------------------------------------------------
            */

            'payment_method' => [
                'sometimes',
                'nullable',
                'string',
                'max:50',
            ],

            'payment_reference' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
            ],

            'paid_at' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | GENERATED IDENTIFIERS
            |--------------------------------------------------------------------------
            |
            | These identifiers are immutable.
            |
            */

            'booking_number' => [
                'prohibited',
            ],

            'reference' => [
                'prohibited',
            ],

            'slug' => [
                'prohibited',
            ],

            /*
            |--------------------------------------------------------------------------
            | SEO / METADATA
            |--------------------------------------------------------------------------
            */

            'meta_title' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'meta_description' => [
                'sometimes',
                'nullable',
                'string',
                'max:1000',
            ],

            'metadata' => [
                'sometimes',
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

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */

            'customer_id.exists' =>
                'The selected customer does not exist.',

            'tenant_id.exists' =>
                'The selected tenant does not exist.',

            'property_id.exists' =>
                'The selected property does not exist.',

            'apartment_id.exists' =>
                'The selected apartment does not exist.',

            'unit_id.exists' =>
                'The selected unit does not exist.',

            'tenancy_id.exists' =>
                'The selected tenancy does not exist.',

            /*
            |--------------------------------------------------------------------------
            | BOOKING
            |--------------------------------------------------------------------------
            */

            'booking_type.in' =>
                'The selected booking type is invalid.',

            'source.in' =>
                'The selected booking source is invalid.',

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */

            'end_date.after_or_equal' =>
                'The booking end date must be on or after the start date.',

            'check_out_date.after_or_equal' =>
                'The check-out date must be on or after the check-in date.',

            /*
            |--------------------------------------------------------------------------
            | FINANCIALS
            |--------------------------------------------------------------------------
            */

            'total_amount.prohibited' =>
                'Total amount is calculated automatically and cannot be changed directly.',

            'balance.prohibited' =>
                'Balance is calculated automatically and cannot be changed directly.',

            'amount_paid.max' =>
                'The amount paid exceeds the maximum allowed value.',

            /*
            |--------------------------------------------------------------------------
            | STATUS / WORKFLOW
            |--------------------------------------------------------------------------
            */

            'status.prohibited' =>
                'Booking status must be changed using the appropriate booking action.',

            'payment_status.prohibited' =>
                'Payment status must be managed through the payment workflow.',

            'confirmed_at.prohibited' =>
                'Confirmation date is generated automatically.',

            'approved_at.prohibited' =>
                'Approval date is generated automatically.',

            'rejected_at.prohibited' =>
                'Rejection date is generated automatically.',

            'cancelled_at.prohibited' =>
                'Cancellation date is generated automatically.',

            'completed_at.prohibited' =>
                'Completion date is generated automatically.',

            /*
            |--------------------------------------------------------------------------
            | GENERATED FIELDS
            |--------------------------------------------------------------------------
            */

            'booking_number.prohibited' =>
                'Booking number cannot be changed.',

            'reference.prohibited' =>
                'Booking reference cannot be changed.',

            'slug.prohibited' =>
                'Booking slug cannot be changed directly.',
        ];
    }
}