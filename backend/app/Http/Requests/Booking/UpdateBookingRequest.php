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
                ? strtolower(trim((string) $this->input('booking_type')))
                : null;
        }

        if ($this->has('source')) {
            $data['source'] = $this->filled('source')
                ? strtolower(trim((string) $this->input('source')))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER INFORMATION
        |--------------------------------------------------------------------------
        */

        if ($this->has('first_name')) {
            $data['first_name'] = $this->filled('first_name')
                ? trim((string) $this->input('first_name'))
                : null;
        }

        if ($this->has('last_name')) {
            $data['last_name'] = $this->filled('last_name')
                ? trim((string) $this->input('last_name'))
                : null;
        }

        if ($this->has('email')) {
            $data['email'] = $this->filled('email')
                ? strtolower(trim((string) $this->input('email')))
                : null;
        }

        if ($this->has('phone')) {
            $data['phone'] = $this->filled('phone')
                ? trim((string) $this->input('phone'))
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
            if ($this->has($field)) {
                $value = $this->input($field);

                $data[$field] = $value !== null && $value !== ''
                    ? trim((string) $value)
                    : null;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | REQUESTS / NOTES
        |--------------------------------------------------------------------------
        */

        if ($this->has('special_requests')) {
            $data['special_requests'] = $this->filled('special_requests')
                ? trim((string) $this->input('special_requests'))
                : null;
        }

        if ($this->has('notes')) {
            $data['notes'] = $this->filled('notes')
                ? trim((string) $this->input('notes'))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | PAYMENT INFORMATION
        |--------------------------------------------------------------------------
        */

        if ($this->has('payment_method')) {
            $data['payment_method'] = $this->filled('payment_method')
                ? strtolower(trim((string) $this->input('payment_method')))
                : null;
        }

        if ($this->has('payment_reference')) {
            $data['payment_reference'] = $this->filled('payment_reference')
                ? trim((string) $this->input('payment_reference'))
                : null;
        }

        /*
        |--------------------------------------------------------------------------
        | NUMERIC OCCUPANCY VALUES
        |--------------------------------------------------------------------------
        |
        | These are COUNTS, not foreign keys / IDs.
        |
        | Example:
        | number_of_adults   = 2
        | number_of_children = 0
        |
        */

        foreach ([
            'number_of_adults',
            'number_of_children',
        ] as $field) {
            if ($this->has($field)) {
                $value = $this->input($field);

                /*
                 * Preserve null if explicitly supplied.
                 * Otherwise normalize numeric strings to integers.
                 */
                if ($value === null || $value === '') {
                    $data[$field] = null;
                } elseif (is_numeric($value)) {
                    $data[$field] = (int) $value;
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | INTEGER RELATIONSHIP IDS
        |--------------------------------------------------------------------------
        |
        | Normalize IDs only for actual relationship fields.
        |
        | IMPORTANT:
        | number_of_adults and number_of_children are NOT IDs.
        |
        */

        foreach ([
            'customer_id',
            'tenant_id',
            'property_id',
            'apartment_id',
            'unit_id',
            'tenancy_id',
        ] as $field) {
            if ($this->has($field)) {
                $value = $this->input($field);

                if ($value === null || $value === '') {
                    $data[$field] = null;
                } elseif (is_numeric($value)) {
                    $data[$field] = (int) $value;
                }
            }
        }

        /*
        |--------------------------------------------------------------------------
        | FINANCIAL VALUES
        |--------------------------------------------------------------------------
        |
        | Normalize supplied component amounts.
        |
        | total_amount and balance are intentionally NOT normalized because
        | they are server-calculated and prohibited below.
        |
        */

        foreach ([
            'rent_amount',
            'deposit_amount',
            'service_charge',
            'booking_fee',
            'discount_amount',
            'amount_paid',
        ] as $field) {
            if ($this->has($field)) {
                $value = $this->input($field);

                if ($value === null || $value === '') {
                    $data[$field] = null;
                } elseif (is_numeric($value)) {
                    $data[$field] = round((float) $value, 2);
                }
            }
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
            */

            'user_id' => [
                'prohibited',
            ],

            'customer_id' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
                'exists:users,id',
            ],

            'tenant_id' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
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
                'min:1',
                'exists:properties,id',
            ],

            'apartment_id' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
                'exists:apartments,id',
            ],

            'unit_id' => [
                'sometimes',
                'integer',
                'min:1',
                'exists:units,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | TENANCY
            |--------------------------------------------------------------------------
            */

            'tenancy_id' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
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
            | These values must be changed through dedicated workflow endpoints.
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
            */

            'rent_amount' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'deposit_amount' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'service_charge' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'max:999999999999.99',
            ],

            'booking_fee' => [
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

            'amount_paid' => [
                'sometimes',
                'nullable',
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
            |
            | IMPORTANT:
            | These are integer COUNTS.
            |
            | number_of_adults:
            |   1 - 100
            |
            | number_of_children:
            |   0 - 100
            |
            | There is intentionally NO exists rule here.
            |
            */

            'number_of_adults' => [
                'sometimes',
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],

            'number_of_children' => [
                'sometimes',
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

            'customer_id.integer' =>
                'The selected customer ID must be a valid integer.',

            'customer_id.exists' =>
                'The selected customer does not exist.',

            'tenant_id.integer' =>
                'The selected tenant ID must be a valid integer.',

            'tenant_id.exists' =>
                'The selected tenant does not exist.',

            'property_id.integer' =>
                'The selected property ID must be a valid integer.',

            'property_id.exists' =>
                'The selected property does not exist.',

            'apartment_id.integer' =>
                'The selected apartment ID must be a valid integer.',

            'apartment_id.exists' =>
                'The selected apartment does not exist.',

            'unit_id.integer' =>
                'The selected unit ID must be a valid integer.',

            'unit_id.exists' =>
                'The selected unit does not exist.',

            'tenancy_id.integer' =>
                'The selected tenancy ID must be a valid integer.',

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

            'booking_date.date' =>
                'The booking date must be a valid date.',

            'start_date.date' =>
                'The booking start date must be a valid date.',

            'end_date.date' =>
                'The booking end date must be a valid date.',

            'end_date.after_or_equal' =>
                'The booking end date must be on or after the start date.',

            'check_in_date.date' =>
                'The check-in date must be a valid date.',

            'check_out_date.date' =>
                'The check-out date must be a valid date.',

            'check_out_date.after_or_equal' =>
                'The check-out date must be on or after the check-in date.',

            /*
            |--------------------------------------------------------------------------
            | FINANCIALS
            |--------------------------------------------------------------------------
            */

            'rent_amount.numeric' =>
                'Rent amount must be a valid number.',

            'deposit_amount.numeric' =>
                'Deposit amount must be a valid number.',

            'service_charge.numeric' =>
                'Service charge must be a valid number.',

            'booking_fee.numeric' =>
                'Booking fee must be a valid number.',

            'discount_amount.numeric' =>
                'Discount amount must be a valid number.',

            'amount_paid.numeric' =>
                'Amount paid must be a valid number.',

            'amount_paid.max' =>
                'The amount paid exceeds the maximum allowed value.',

            'total_amount.prohibited' =>
                'Total amount is calculated automatically and cannot be changed directly.',

            'balance.prohibited' =>
                'Balance is calculated automatically and cannot be changed directly.',

            /*
            |--------------------------------------------------------------------------
            | OCCUPANCY
            |--------------------------------------------------------------------------
            */

            'number_of_adults.integer' =>
                'Number of adults must be a valid whole number.',

            'number_of_adults.min' =>
                'Number of adults must be at least 1.',

            'number_of_adults.max' =>
                'Number of adults cannot exceed 100.',

            'number_of_children.integer' =>
                'Number of children must be a valid whole number.',

            'number_of_children.min' =>
                'Number of children cannot be less than 0.',

            'number_of_children.max' =>
                'Number of children cannot exceed 100.',

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