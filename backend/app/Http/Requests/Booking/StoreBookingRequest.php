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
        $data = [];

        /*
        |--------------------------------------------------------------------------
        | RELATIONSHIP IDS
        |--------------------------------------------------------------------------
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

                $data[$field] = $value === null || $value === ''
                    ? null
                    : (int) $value;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | BOOKING CLASSIFICATION
        |--------------------------------------------------------------------------
        */

        if ($this->has('booking_type')) {
            $data['booking_type'] = $this->filled('booking_type')
                ? strtolower(trim((string) $this->input('booking_type')))
                : 'reservation';
        }

        if ($this->has('source')) {
            $data['source'] = $this->filled('source')
                ? strtolower(trim((string) $this->input('source')))
                : 'other';
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        |
        | New bookings are always created as pending.
        | Workflow transitions are handled by BookingService.
        |
        */

        if ($this->has('status')) {
            $data['status'] = $this->filled('status')
                ? strtolower(trim((string) $this->input('status')))
                : 'pending';
        }

        /*
        |--------------------------------------------------------------------------
        | PAYMENT STATUS
        |--------------------------------------------------------------------------
        */

        if ($this->has('payment_status')) {
            $data['payment_status'] = $this->filled('payment_status')
                ? strtolower(trim((string) $this->input('payment_status')))
                : 'pending';
        }

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER SNAPSHOT
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
            if ($this->has($field) && $this->input($field) === '') {
                $data[$field] = null;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | FINANCIAL VALUES
        |--------------------------------------------------------------------------
        |
        | These are normalized here but the final total/balance calculation
        | remains the responsibility of BookingService / Booking model.
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

                $data[$field] = $value === null || $value === ''
                    ? null
                    : (float) $value;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | OCCUPANCY
        |--------------------------------------------------------------------------
        |
        | number_of_children is a COUNT, not a relationship ID.
        |
        */

        foreach ([
            'number_of_adults',
            'number_of_children',
        ] as $field) {
            if ($this->has($field)) {
                $value = $this->input($field);

                $data[$field] = $value === null || $value === ''
                    ? null
                    : (int) $value;
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
        | PAYMENT
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
        | SEO / METADATA
        |--------------------------------------------------------------------------
        */

        if ($this->has('meta_title')) {
            $data['meta_title'] = $this->filled('meta_title')
                ? trim((string) $this->input('meta_title'))
                : null;
        }

        if ($this->has('meta_description')) {
            $data['meta_description'] = $this->filled('meta_description')
                ? trim((string) $this->input('meta_description'))
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
            */

            /*
             * The authenticated application user is assigned by the service.
             *
             * The frontend must never be allowed to choose the booking owner.
             */
            'user_id' => [
                'prohibited',
            ],

            /*
             * customer_id references users.id.
             *
             * This represents the customer account selected from the
             * available customer/user list.
             */
            'customer_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            /*
             * tenant_id references tenants.id.
             */
            'tenant_id' => [
                'nullable',
                'integer',
                'exists:tenants,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | PROPERTY / APARTMENT / UNIT / TENANCY
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
                Rule::exists('apartments', 'id')
                    ->where(function ($query) {
                        $propertyId = $this->input('property_id');

                        if ($propertyId !== null) {
                            $query->where('property_id', $propertyId);
                        }
                    }),
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
            | BOOKING CLASSIFICATION
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
            | STATUS
            |--------------------------------------------------------------------------
            |
            | Store requests may only create pending bookings.
            | confirm/approve/reject/cancel/complete/expire are workflow
            | operations handled by BookingService.
            |
            */

            'status' => [
                'nullable',
                Rule::in([
                    'pending',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | PAYMENT STATUS
            |--------------------------------------------------------------------------
            */

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
            |
            | If customer_id exists, BookingService should populate the snapshot
            | from the selected customer account.
            |
            | If customer_id is not supplied, the snapshot is required for a
            | walk-in / unregistered customer.
            |
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

            /*
             * Amount actually paid can be supplied.
             *
             * BookingService/model calculates:
             *
             * total_amount
             * balance
             */
            'amount_paid' => [
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

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */

            'property_id.required' =>
                'Please select a property.',

            'property_id.integer' =>
                'The selected property is invalid.',

            'property_id.exists' =>
                'The selected property does not exist.',

            'apartment_id.integer' =>
                'The selected apartment is invalid.',

            'apartment_id.exists' =>
                'The selected apartment does not exist or does not belong to the selected property.',

            'unit_id.required' =>
                'Please select a unit.',

            'unit_id.integer' =>
                'The selected unit is invalid.',

            'unit_id.exists' =>
                'The selected unit does not exist.',

            'customer_id.integer' =>
                'The selected customer is invalid.',

            'customer_id.exists' =>
                'The selected customer does not exist.',

            'tenant_id.integer' =>
                'The selected tenant is invalid.',

            'tenant_id.exists' =>
                'The selected tenant does not exist.',

            'tenancy_id.integer' =>
                'The selected tenancy is invalid.',

            'tenancy_id.exists' =>
                'The selected tenancy does not exist.',

            /*
            |--------------------------------------------------------------------------
            | BOOKING
            |--------------------------------------------------------------------------
            */

            'booking_type.required' =>
                'Please select a booking type.',

            'booking_type.in' =>
                'The selected booking type is invalid.',

            'source.required' =>
                'Please select a booking source.',

            'source.in' =>
                'The selected booking source is invalid.',

            'status.in' =>
                'A new booking must start with pending status.',

            'payment_status.in' =>
                'The selected payment status is invalid.',

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */

            'booking_date.date' =>
                'The booking date must be a valid date.',

            'start_date.date' =>
                'The start date must be a valid date.',

            'end_date.date' =>
                'The end date must be a valid date.',

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
            | CUSTOMER
            |--------------------------------------------------------------------------
            */

            'first_name.required_without' =>
                'First name is required when no customer account is selected.',

            'last_name.required_without' =>
                'Last name is required when no customer account is selected.',

            'email.required_without' =>
                'Email is required when no customer account is selected.',

            'phone.required_without' =>
                'Phone number is required when no customer account is selected.',

            /*
            |--------------------------------------------------------------------------
            | OCCUPANCY
            |--------------------------------------------------------------------------
            */

            'number_of_adults.integer' =>
                'Number of adults must be a whole number.',

            'number_of_adults.min' =>
                'At least one adult is required.',

            'number_of_children.integer' =>
                'Number of children must be a whole number.',

            'number_of_children.min' =>
                'Number of children cannot be negative.',

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

            'total_amount.prohibited' =>
                'Total amount is calculated automatically.',

            'balance.prohibited' =>
                'Balance is calculated automatically.',
        ];
    }
}
