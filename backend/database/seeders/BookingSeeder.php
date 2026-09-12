<?php

namespace Database\Seeders;

use App\Models\Apartment;
use App\Models\Booking;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class BookingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | FETCH EXISTING DATA
        |--------------------------------------------------------------------------
        */

        $users = User::query()
            ->orderBy('id')
            ->get();

        $customers = $users->values();

        $tenants = Tenant::query()
            ->with('user')
            ->orderBy('id')
            ->get();

        $properties = Property::query()
            ->orderBy('id')
            ->get();

        $apartments = Apartment::query()
            ->with('property')
            ->orderBy('id')
            ->get();

        $units = Unit::query()
            ->with([
                'property',
                'apartment',
            ])
            ->orderBy('id')
            ->get();

        $tenancies = Tenancy::query()
            ->with([
                'tenant.user',
                'property',
                'apartment',
                'unit',
            ])
            ->orderBy('id')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        if ($customers->isEmpty()) {
            $this->command->warn(
                'No users found. Please run the UserSeeder first.'
            );

            return;
        }

        if ($properties->isEmpty()) {
            $this->command->warn(
                'No properties found. Please run the PropertySeeder first.'
            );

            return;
        }

        if ($units->isEmpty()) {
            $this->command->warn(
                'No units found. Please create units before running BookingSeeder.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | BOOKING TEMPLATES
        |--------------------------------------------------------------------------
        |
        | These records intentionally cover the complete booking lifecycle.
        |
        */

        $bookingTemplates = [
            [
                'booking_type' => Booking::TYPE_VIEWING,
                'status' => Booking::STATUS_PENDING,
                'payment_status' => Booking::PAYMENT_PENDING,
                'source' => Booking::SOURCE_WEBSITE,

                'rent_amount' => 0,
                'deposit_amount' => 0,
                'service_charge' => 0,
                'booking_fee' => 0,
                'discount_amount' => 0,

                'number_of_adults' => 1,
                'number_of_children' => 0,

                'special_requests' =>
                    'Would like to view the apartment in the afternoon.',

                'notes' =>
                    'Customer interested in a two-bedroom apartment.',
            ],

            [
                'booking_type' => Booking::TYPE_VIEWING,
                'status' => Booking::STATUS_CONFIRMED,
                'payment_status' => Booking::PAYMENT_PENDING,
                'source' => Booking::SOURCE_PHONE,

                'rent_amount' => 0,
                'deposit_amount' => 0,
                'service_charge' => 0,
                'booking_fee' => 0,
                'discount_amount' => 0,

                'number_of_adults' => 2,
                'number_of_children' => 1,

                'special_requests' =>
                    'Please arrange parking access during the viewing.',

                'notes' =>
                    'Family interested in a three-bedroom unit.',
            ],

            [
                'booking_type' => Booking::TYPE_RESERVATION,
                'status' => Booking::STATUS_APPROVED,
                'payment_status' => Booking::PAYMENT_PARTIAL,
                'source' => Booking::SOURCE_WEBSITE,

                'rent_amount' => 65000,
                'deposit_amount' => 65000,
                'service_charge' => 5000,
                'booking_fee' => 2500,
                'discount_amount' => 0,

                'number_of_adults' => 2,
                'number_of_children' => 0,

                'special_requests' =>
                    'Reserved unit should be available from the beginning of next month.',

                'notes' =>
                    'Reservation approved pending final payment.',
            ],

            [
                'booking_type' => Booking::TYPE_RESERVATION,
                'status' => Booking::STATUS_CONFIRMED,
                'payment_status' => Booking::PAYMENT_PAID,
                'source' => Booking::SOURCE_AGENT,

                'rent_amount' => 45000,
                'deposit_amount' => 45000,
                'service_charge' => 3500,
                'booking_fee' => 2000,
                'discount_amount' => 1500,

                'number_of_adults' => 2,
                'number_of_children' => 1,

                'special_requests' =>
                    'Customer requested a unit close to the parking area.',

                'notes' =>
                    'Reservation payment completed successfully.',
            ],

            [
                'booking_type' => Booking::TYPE_RENTAL,
                'status' => Booking::STATUS_COMPLETED,
                'payment_status' => Booking::PAYMENT_PAID,
                'source' => Booking::SOURCE_REFERRAL,

                'rent_amount' => 55000,
                'deposit_amount' => 55000,
                'service_charge' => 4500,
                'booking_fee' => 2500,
                'discount_amount' => 0,

                'number_of_adults' => 2,
                'number_of_children' => 2,

                'special_requests' =>
                    'Tenant requested additional parking space.',

                'notes' =>
                    'Rental booking completed and tenancy successfully created.',
            ],

            [
                'booking_type' => Booking::TYPE_RENTAL,
                'status' => Booking::STATUS_APPROVED,
                'payment_status' => Booking::PAYMENT_PARTIAL,
                'source' => Booking::SOURCE_WEBSITE,

                'rent_amount' => 75000,
                'deposit_amount' => 75000,
                'service_charge' => 6500,
                'booking_fee' => 3000,
                'discount_amount' => 5000,

                'number_of_adults' => 2,
                'number_of_children' => 0,

                'special_requests' =>
                    'Prefer a quiet unit with good natural lighting.',

                'notes' =>
                    'Approved rental awaiting remaining balance.',
            ],

            [
                'booking_type' => Booking::TYPE_RENTAL,
                'status' => Booking::STATUS_REJECTED,
                'payment_status' => Booking::PAYMENT_FAILED,
                'source' => Booking::SOURCE_AGENT,

                'rent_amount' => 60000,
                'deposit_amount' => 60000,
                'service_charge' => 5000,
                'booking_fee' => 2500,
                'discount_amount' => 0,

                'number_of_adults' => 2,
                'number_of_children' => 0,

                'special_requests' => null,

                'notes' =>
                    'Rental application reviewed and rejected.',
            ],

            [
                'booking_type' => Booking::TYPE_RESERVATION,
                'status' => Booking::STATUS_CANCELLED,
                'payment_status' => Booking::PAYMENT_REFUNDED,
                'source' => Booking::SOURCE_WEBSITE,

                'rent_amount' => 50000,
                'deposit_amount' => 50000,
                'service_charge' => 4000,
                'booking_fee' => 2000,
                'discount_amount' => 0,

                'number_of_adults' => 1,
                'number_of_children' => 0,

                'special_requests' => null,

                'notes' =>
                    'Customer cancelled the reservation before move-in.',
            ],

            [
                'booking_type' => Booking::TYPE_VIEWING,
                'status' => Booking::STATUS_COMPLETED,
                'payment_status' => Booking::PAYMENT_PENDING,
                'source' => Booking::SOURCE_PHONE,

                'rent_amount' => 0,
                'deposit_amount' => 0,
                'service_charge' => 0,
                'booking_fee' => 0,
                'discount_amount' => 0,

                'number_of_adults' => 1,
                'number_of_children' => 0,

                'special_requests' =>
                    'Customer requested a weekend viewing.',

                'notes' =>
                    'Property viewing completed successfully.',
            ],

            [
                'booking_type' => Booking::TYPE_RESERVATION,
                'status' => Booking::STATUS_EXPIRED,
                'payment_status' => Booking::PAYMENT_PENDING,
                'source' => Booking::SOURCE_WEBSITE,

                'rent_amount' => 40000,
                'deposit_amount' => 40000,
                'service_charge' => 3000,
                'booking_fee' => 1500,
                'discount_amount' => 0,

                'number_of_adults' => 2,
                'number_of_children' => 0,

                'special_requests' => null,

                'notes' =>
                    'Reservation expired because payment was not completed.',
            ],

            [
                'booking_type' => Booking::TYPE_RENTAL,
                'status' => Booking::STATUS_CONFIRMED,
                'payment_status' => Booking::PAYMENT_PAID,
                'source' => Booking::SOURCE_WEBSITE,

                'rent_amount' => 85000,
                'deposit_amount' => 85000,
                'service_charge' => 7500,
                'booking_fee' => 3500,
                'discount_amount' => 2500,

                'number_of_adults' => 3,
                'number_of_children' => 1,

                'special_requests' =>
                    'Family requires two parking spaces.',

                'notes' =>
                    'Rental booking confirmed and fully paid.',
            ],

            [
                'booking_type' => Booking::TYPE_RENTAL,
                'status' => Booking::STATUS_PENDING,
                'payment_status' => Booking::PAYMENT_PENDING,
                'source' => Booking::SOURCE_WEBSITE,

                'rent_amount' => 35000,
                'deposit_amount' => 35000,
                'service_charge' => 3000,
                'booking_fee' => 1500,
                'discount_amount' => 0,

                'number_of_adults' => 1,
                'number_of_children' => 0,

                'special_requests' =>
                    'Looking for a long-term rental.',

                'notes' =>
                    'Rental application awaiting approval.',
            ],

            [
                'booking_type' => Booking::TYPE_RESERVATION,
                'status' => Booking::STATUS_APPROVED,
                'payment_status' => Booking::PAYMENT_PAID,
                'source' => Booking::SOURCE_AGENT,

                'rent_amount' => 95000,
                'deposit_amount' => 95000,
                'service_charge' => 8000,
                'booking_fee' => 4000,
                'discount_amount' => 5000,

                'number_of_adults' => 2,
                'number_of_children' => 2,

                'special_requests' =>
                    'Customer requested a high-floor unit.',

                'notes' =>
                    'Reservation approved and payment received.',
            ],

            [
                'booking_type' => Booking::TYPE_VIEWING,
                'status' => Booking::STATUS_CANCELLED,
                'payment_status' => Booking::PAYMENT_PENDING,
                'source' => Booking::SOURCE_PHONE,

                'rent_amount' => 0,
                'deposit_amount' => 0,
                'service_charge' => 0,
                'booking_fee' => 0,
                'discount_amount' => 0,

                'number_of_adults' => 1,
                'number_of_children' => 0,

                'special_requests' => null,

                'notes' =>
                    'Viewing cancelled by customer.',
            ],

            [
                'booking_type' => Booking::TYPE_RENTAL,
                'status' => Booking::STATUS_COMPLETED,
                'payment_status' => Booking::PAYMENT_PAID,
                'source' => Booking::SOURCE_REFERRAL,

                'rent_amount' => 70000,
                'deposit_amount' => 70000,
                'service_charge' => 6000,
                'booking_fee' => 3000,
                'discount_amount' => 2000,

                'number_of_adults' => 2,
                'number_of_children' => 1,

                'special_requests' =>
                    'Tenant requested a unit near the swimming pool.',

                'notes' =>
                    'Completed rental booking.',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | AVAILABLE TENANCIES
        |--------------------------------------------------------------------------
        |
        | Only use a tenancy when its relationships are available and coherent.
        |
        */

        $validTenancies = $tenancies
            ->filter(function ($tenancy) {
                return !empty($tenancy->tenant_id)
                    && !empty($tenancy->property_id)
                    && !empty($tenancy->unit_id);
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | CREATE BOOKINGS
        |--------------------------------------------------------------------------
        */

        foreach ($bookingTemplates as $index => $template) {
            /*
            |--------------------------------------------------------------------------
            | Select property
            |--------------------------------------------------------------------------
            */

            $property = $properties[$index % $properties->count()];

            /*
            |--------------------------------------------------------------------------
            | Select apartment belonging to property
            |--------------------------------------------------------------------------
            */

            $propertyApartments = $apartments
                ->where('property_id', $property->id)
                ->values();

            $apartment = $propertyApartments->isNotEmpty()
                ? $propertyApartments->random()
                : null;

            /*
            |--------------------------------------------------------------------------
            | Select unit belonging to property/apartment
            |--------------------------------------------------------------------------
            */

            $propertyUnits = $units
                ->where('property_id', $property->id)
                ->values();

            if ($apartment) {
                $apartmentUnits = $propertyUnits
                    ->where('apartment_id', $apartment->id)
                    ->values();

                $unit = $apartmentUnits->isNotEmpty()
                    ? $apartmentUnits->random()
                    : (
                        $propertyUnits->isNotEmpty()
                            ? $propertyUnits->random()
                            : null
                    );
            } else {
                $unit = $propertyUnits->isNotEmpty()
                    ? $propertyUnits->random()
                    : null;
            }

            /*
            |--------------------------------------------------------------------------
            | Select customer
            |--------------------------------------------------------------------------
            */

            $customer = $customers[$index % $customers->count()];

            /*
            |--------------------------------------------------------------------------
            | Select tenancy
            |--------------------------------------------------------------------------
            |
            | Rental/completed bookings may reference an existing tenancy.
            | We first try to find a tenancy matching the selected property/unit.
            |
            */

            $tenancy = null;

            if (
                $template['booking_type'] === Booking::TYPE_RENTAL &&
                $validTenancies->isNotEmpty()
            ) {
                $matchingTenancies = $validTenancies
                    ->filter(function ($candidate) use ($property, $unit) {
                        if (
                            $candidate->property_id !== $property->id
                        ) {
                            return false;
                        }

                        if (
                            $unit &&
                            $candidate->unit_id !== $unit->id
                        ) {
                            return false;
                        }

                        return true;
                    })
                    ->values();

                $tenancy = $matchingTenancies->isNotEmpty()
                    ? $matchingTenancies->random()
                    : $validTenancies->random();
            }

            /*
            |--------------------------------------------------------------------------
            | Select tenant
            |--------------------------------------------------------------------------
            */

            $tenant = null;

            if ($tenancy) {
                $tenant = $tenants
                    ->firstWhere('id', $tenancy->tenant_id);
            }

            /*
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
            */

            $bookingDate = Carbon::now()
                ->subDays(rand(1, 90))
                ->subHours(rand(1, 12));

            /*
            | Historical records should generally have dates in the past.
            */

            if (
                in_array(
                    $template['status'],
                    [
                        Booking::STATUS_COMPLETED,
                        Booking::STATUS_CANCELLED,
                        Booking::STATUS_REJECTED,
                        Booking::STATUS_EXPIRED,
                    ],
                    true
                )
            ) {
                $startDate = $bookingDate
                    ->copy()
                    ->addDays(rand(1, 10))
                    ->startOfDay();

                /*
                | Ensure the end date is also historically sensible.
                */
                $endDate = $startDate
                    ->copy()
                    ->addDays(
                        $template['booking_type'] === Booking::TYPE_VIEWING
                            ? 0
                            : rand(30, 180)
                    );
            } else {
                $startDate = Carbon::now()
                    ->addDays(rand(3, 30))
                    ->startOfDay();

                $endDate = $startDate
                    ->copy()
                    ->addDays(
                        $template['booking_type'] === Booking::TYPE_VIEWING
                            ? 0
                            : rand(30, 180)
                    );
            }

            /*
            |--------------------------------------------------------------------------
            | Viewing bookings are single-day appointments.
            |--------------------------------------------------------------------------
            */

            if (
                $template['booking_type'] === Booking::TYPE_VIEWING
            ) {
                $endDate = $startDate->copy();
            }

            /*
            |--------------------------------------------------------------------------
            | Check-in / Check-out
            |--------------------------------------------------------------------------
            */

            $checkInDate = null;
            $checkOutDate = null;

            if (
                $template['booking_type'] !== Booking::TYPE_VIEWING
            ) {
                if (
                    in_array(
                        $template['status'],
                        [
                            Booking::STATUS_COMPLETED,
                        ],
                        true
                    )
                ) {
                    $checkInDate = $startDate->copy();
                    $checkOutDate = $endDate->copy();
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Financial Calculation
            |--------------------------------------------------------------------------
            */

            $subtotal =
                (float) $template['rent_amount'] +
                (float) $template['deposit_amount'] +
                (float) $template['service_charge'] +
                (float) $template['booking_fee'];

            $totalAmount = max(
                0,
                $subtotal -
                (float) $template['discount_amount']
            );

            /*
            |--------------------------------------------------------------------------
            | Amount Paid
            |--------------------------------------------------------------------------
            */

            $amountPaid = match ($template['payment_status']) {
                Booking::PAYMENT_PAID =>
                    $totalAmount,

                Booking::PAYMENT_PARTIAL =>
                    round($totalAmount * 0.50, 2),

                Booking::PAYMENT_REFUNDED =>
                    $totalAmount,

                default =>
                    0,
            };

            /*
            |--------------------------------------------------------------------------
            | Payment Information
            |--------------------------------------------------------------------------
            */

            $paymentMethod = null;
            $paymentReference = null;
            $paidAt = null;

            if (
                in_array(
                    $template['payment_status'],
                    [
                        Booking::PAYMENT_PAID,
                        Booking::PAYMENT_PARTIAL,
                        Booking::PAYMENT_REFUNDED,
                    ],
                    true
                )
            ) {
                $paymentMethod = 'mpesa';

                $paymentReference =
                    'MPESA-' .
                    strtoupper(
                        str()->random(10)
                    );

                $paidAt = $bookingDate
                    ->copy()
                    ->addHours(rand(1, 48));
            }

            /*
            |--------------------------------------------------------------------------
            | Status Timestamps
            |--------------------------------------------------------------------------
            */

            $confirmedAt = null;
            $approvedAt = null;
            $rejectedAt = null;
            $cancelledAt = null;
            $completedAt = null;

            /*
            | Confirmed
            */

            if (
                in_array(
                    $template['status'],
                    [
                        Booking::STATUS_CONFIRMED,
                        Booking::STATUS_APPROVED,
                        Booking::STATUS_COMPLETED,
                    ],
                    true
                )
            ) {
                $confirmedAt = $bookingDate
                    ->copy()
                    ->addHours(rand(1, 24));
            }

            /*
            | Approved
            */

            if (
                in_array(
                    $template['status'],
                    [
                        Booking::STATUS_APPROVED,
                        Booking::STATUS_COMPLETED,
                    ],
                    true
                )
            ) {
                $approvedAt = $bookingDate
                    ->copy()
                    ->addHours(rand(2, 48));
            }

            /*
            | Rejected
            */

            if (
                $template['status'] === Booking::STATUS_REJECTED
            ) {
                $rejectedAt = $bookingDate
                    ->copy()
                    ->addDays(rand(1, 5));
            }

            /*
            | Cancelled
            */

            if (
                $template['status'] === Booking::STATUS_CANCELLED
            ) {
                $cancelledAt = $bookingDate
                    ->copy()
                    ->addDays(rand(1, 5));
            }

            /*
            | Completed
            */

            if (
                $template['status'] === Booking::STATUS_COMPLETED
            ) {
                $completedAt = $endDate
                    ->copy()
                    ->endOfDay();
            }

            /*
            |--------------------------------------------------------------------------
            | Rejection / Cancellation Reasons
            |--------------------------------------------------------------------------
            */

            $rejectionReason = null;

            if (
                $template['status'] === Booking::STATUS_REJECTED
            ) {
                $rejectionReason =
                    'Booking application did not meet the required approval criteria.';
            }

            $cancellationReason = null;

            if (
                $template['status'] === Booking::STATUS_CANCELLED
            ) {
                $cancellationReason =
                    'Customer cancelled the booking.';
            }

            /*
            |--------------------------------------------------------------------------
            | Customer Snapshot
            |--------------------------------------------------------------------------
            */

            $firstName = $customer->first_name
                ?? 'Customer';

            $lastName = $customer->last_name
                ?? 'User';

            $email = $customer->email
                ?? 'customer@example.com';

            $phone = $customer->phone
                ?? null;

            /*
            |--------------------------------------------------------------------------
            | Metadata
            |--------------------------------------------------------------------------
            */

            $metadata = [
                'source' => $template['source'],
                'channel' => $template['source'] === Booking::SOURCE_WEBSITE
                    ? 'online'
                    : 'offline',
                'seeded' => true,
                'booking_index' => $index + 1,
                'seeded_at' => Carbon::now()->toIso8601String(),
            ];

            /*
            |--------------------------------------------------------------------------
            | CREATE BOOKING
            |--------------------------------------------------------------------------
            |
            | booking_number, reference, slug, total_amount and balance are
            | intentionally allowed to be handled by the Booking model.
            |
            */

            Booking::create([
                /*
                |--------------------------------------------------------------------------
                | Creator / Customer
                |--------------------------------------------------------------------------
                */

                'user_id' => $customer->id,

                'customer_id' => $customer->id,

                'tenant_id' => $tenant?->id,

                /*
                |--------------------------------------------------------------------------
                | Property Relationships
                |--------------------------------------------------------------------------
                */

                'property_id' => $property->id,

                'apartment_id' => $apartment?->id,

                'unit_id' => $unit?->id,

                'tenancy_id' => $tenancy?->id,

                /*
                |--------------------------------------------------------------------------
                | Booking
                |--------------------------------------------------------------------------
                */

                'booking_type' =>
                    $template['booking_type'],

                'status' =>
                    $template['status'],

                'payment_status' =>
                    $template['payment_status'],

                'source' =>
                    $template['source'],

                /*
                |--------------------------------------------------------------------------
                | Dates
                |--------------------------------------------------------------------------
                */

                'booking_date' =>
                    $bookingDate,

                'start_date' =>
                    $startDate,

                'end_date' =>
                    $endDate,

                'check_in_date' =>
                    $checkInDate,

                'check_out_date' =>
                    $checkOutDate,

                'confirmed_at' =>
                    $confirmedAt,

                'approved_at' =>
                    $approvedAt,

                'rejected_at' =>
                    $rejectedAt,

                'cancelled_at' =>
                    $cancelledAt,

                'completed_at' =>
                    $completedAt,

                /*
                |--------------------------------------------------------------------------
                | Customer Snapshot
                |--------------------------------------------------------------------------
                */

                'first_name' =>
                    $firstName,

                'last_name' =>
                    $lastName,

                'email' =>
                    $email,

                'phone' =>
                    $phone,

                /*
                |--------------------------------------------------------------------------
                | Financial
                |--------------------------------------------------------------------------
                */

                'rent_amount' =>
                    $template['rent_amount'],

                'deposit_amount' =>
                    $template['deposit_amount'],

                'service_charge' =>
                    $template['service_charge'],

                'booking_fee' =>
                    $template['booking_fee'],

                'discount_amount' =>
                    $template['discount_amount'],

                'amount_paid' =>
                    $amountPaid,

                /*
                |--------------------------------------------------------------------------
                | Guest Information
                |--------------------------------------------------------------------------
                */

                'number_of_adults' =>
                    $template['number_of_adults'],

                'number_of_children' =>
                    $template['number_of_children'],

                'special_requests' =>
                    $template['special_requests'],

                'notes' =>
                    $template['notes'],

                'rejection_reason' =>
                    $rejectionReason,

                'cancellation_reason' =>
                    $cancellationReason,

                /*
                |--------------------------------------------------------------------------
                | Payment
                |--------------------------------------------------------------------------
                */

                'payment_method' =>
                    $paymentMethod,

                'payment_reference' =>
                    $paymentReference,

                'paid_at' =>
                    $paidAt,

                /*
                |--------------------------------------------------------------------------
                | SEO
                |--------------------------------------------------------------------------
                */

                'meta_title' =>
                    ucfirst($template['booking_type']) .
                    ' booking - ' .
                    $property->name,

                'meta_description' =>
                    'Booking for ' .
                    $property->name .
                    ' created through the EstateKenya property management system.',

                /*
                |--------------------------------------------------------------------------
                | Metadata
                |--------------------------------------------------------------------------
                */

                'metadata' =>
                    $metadata,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | COMPLETE
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            count($bookingTemplates) .
            ' bookings seeded successfully.'
        );
    }
}