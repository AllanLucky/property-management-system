<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Unit;
use App\Models\Tenant;
use App\Models\Booking;
use App\Models\Apartment;
use App\Models\Property;
use App\Models\Tenancy;
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

        $users = User::query()->get();

        $tenants = Tenant::query()->get();

        $properties = Property::query()->get();

        $apartments = Apartment::query()
            ->with('property')
            ->get();

        $units = Unit::query()
            ->with([
                'property',
                'apartment',
            ])
            ->get();

        $tenancies = Tenancy::query()->get();

        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        if ($users->isEmpty()) {
            $this->command->warn(
                'No users found. Please run the UserSeeder first.'
            );

            return;
        }

        if ($properties->isEmpty()) {
            $this->command->warn(
                'No properties found. Please run the PropertiesSeeder first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | BOOKING DATA
        |--------------------------------------------------------------------------
        */

        $bookingTemplates = [
            [
                'booking_type' => Booking::TYPE_VIEWING,
                'status' => Booking::STATUS_PENDING,
                'payment_status' => Booking::PAYMENT_PENDING,

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

            $propertyApartments = $apartments->where(
                'property_id',
                $property->id
            );

            $apartment = $propertyApartments->isNotEmpty()
                ? $propertyApartments->random()
                : null;

            /*
            |--------------------------------------------------------------------------
            | Select unit
            |--------------------------------------------------------------------------
            */

            $propertyUnits = $units->where(
                'property_id',
                $property->id
            );

            if ($apartment) {
                $apartmentUnits = $propertyUnits->where(
                    'apartment_id',
                    $apartment->id
                );

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

            $customer = $users->random();

            /*
            |--------------------------------------------------------------------------
            | Select tenant
            |--------------------------------------------------------------------------
            */

            $tenant = $tenants->isNotEmpty()
                ? $tenants->random()
                : null;

            /*
            |--------------------------------------------------------------------------
            | Select tenancy
            |--------------------------------------------------------------------------
            */

            $tenancy = null;

            if (
                $template['booking_type'] === Booking::TYPE_RENTAL &&
                $tenancies->isNotEmpty()
            ) {
                $tenancy = $tenancies->random();
            }

            /*
            |--------------------------------------------------------------------------
            | Dates
            |--------------------------------------------------------------------------
            */

            $bookingDate = Carbon::now()
                ->subDays(rand(1, 90))
                ->subHours(rand(1, 12));

            $startDate = (clone $bookingDate)
                ->addDays(rand(1, 30))
                ->startOfDay();

            /*
            | Viewing bookings are normally short appointments.
            */

            if ($template['booking_type'] === Booking::TYPE_VIEWING) {
                $startDate = (clone $bookingDate)
                    ->addDays(rand(1, 14))
                    ->startOfDay();

                $endDate = (clone $startDate);
            } else {
                $endDate = (clone $startDate)
                    ->addMonths(rand(1, 12));
            }

            /*
            |--------------------------------------------------------------------------
            | Check-in / check-out
            |--------------------------------------------------------------------------
            */

            $checkInDate = null;
            $checkOutDate = null;

            if ($template['booking_type'] !== Booking::TYPE_VIEWING) {
                $checkInDate = $startDate->copy();

                $checkOutDate = $endDate->copy();
            }

            /*
            |--------------------------------------------------------------------------
            | Financial calculation
            |--------------------------------------------------------------------------
            */

            $subtotal =
                (float) $template['rent_amount'] +
                (float) $template['deposit_amount'] +
                (float) $template['service_charge'] +
                (float) $template['booking_fee'];

            $totalAmount = max(
                0,
                $subtotal - (float) $template['discount_amount']
            );

            /*
            |--------------------------------------------------------------------------
            | Amount paid
            |--------------------------------------------------------------------------
            */

            $amountPaid = match ($template['payment_status']) {
                Booking::PAYMENT_PAID =>
                    $totalAmount,

                Booking::PAYMENT_PARTIAL =>
                    round($totalAmount * 0.50, 2),

                Booking::PAYMENT_REFUNDED =>
                    0,

                default =>
                    0,
            };

            /*
            |--------------------------------------------------------------------------
            | Payment information
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
                    ],
                    true
                )
            ) {
                $paymentMethod = 'mpesa';

                $paymentReference =
                    'MPESA-' . strtoupper(
                        str()->random(10)
                    );

                $paidAt = $bookingDate->copy()
                    ->addHours(rand(1, 48));
            }

            /*
            |--------------------------------------------------------------------------
            | Status timestamps
            |--------------------------------------------------------------------------
            */

            $confirmedAt = null;
            $approvedAt = null;
            $rejectedAt = null;
            $cancelledAt = null;
            $completedAt = null;

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
                $confirmedAt = $bookingDate->copy()
                    ->addHours(rand(1, 24));
            }

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
                $approvedAt = $bookingDate->copy()
                    ->addHours(rand(2, 48));
            }

            if ($template['status'] === Booking::STATUS_REJECTED) {
                $rejectedAt = $bookingDate->copy()
                    ->addDays(rand(1, 5));
            }

            if ($template['status'] === Booking::STATUS_CANCELLED) {
                $cancelledAt = $bookingDate->copy()
                    ->addDays(rand(1, 5));
            }

            if ($template['status'] === Booking::STATUS_COMPLETED) {
                $completedAt = $endDate->copy()
                    ->endOfDay();
            }

            /*
            |--------------------------------------------------------------------------
            | Rejection / cancellation reasons
            |--------------------------------------------------------------------------
            */

            $rejectionReason = null;

            if ($template['status'] === Booking::STATUS_REJECTED) {
                $rejectionReason =
                    'Booking application did not meet the required approval criteria.';
            }

            $cancellationReason = null;

            if ($template['status'] === Booking::STATUS_CANCELLED) {
                $cancellationReason =
                    'Customer cancelled the booking.';
            }

            /*
            |--------------------------------------------------------------------------
            | Customer details
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
            | Create booking
            |--------------------------------------------------------------------------
            */

            Booking::create([
                /*
                | Identification
                */
                'booking_number' =>
                    'BK-' . strtoupper(
                        str()->random(10)
                    ),

                'reference' =>
                    'REF-' . strtoupper(
                        str()->random(12)
                    ),

                'slug' => null,

                /*
                | Relationships
                */
                'user_id' => $customer->id,

                'customer_id' => $customer->id,

                'tenant_id' => $tenant?->id,

                'property_id' => $property->id,

                'apartment_id' => $apartment?->id,

                'unit_id' => $unit?->id,

                'tenancy_id' => $tenancy?->id,

                /*
                | Booking
                */
                'booking_type' =>
                    $template['booking_type'],

                'status' =>
                    $template['status'],

                'payment_status' =>
                    $template['payment_status'],

                /*
                | Dates
                */
                'booking_date' => $bookingDate,

                'start_date' => $startDate,

                'end_date' => $endDate,

                'check_in_date' => $checkInDate,

                'check_out_date' => $checkOutDate,

                'confirmed_at' => $confirmedAt,

                'approved_at' => $approvedAt,

                'rejected_at' => $rejectedAt,

                'cancelled_at' => $cancelledAt,

                'completed_at' => $completedAt,

                /*
                | Customer
                */
                'first_name' => $firstName,

                'last_name' => $lastName,

                'email' => $email,

                'phone' => $phone,

                /*
                | Financial
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

                'total_amount' =>
                    $totalAmount,

                'amount_paid' =>
                    $amountPaid,

                'balance' =>
                    max(
                        0,
                        $totalAmount - $amountPaid
                    ),

                /*
                | Guest information
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
                | Payment
                */
                'payment_method' =>
                    $paymentMethod,

                'payment_reference' =>
                    $paymentReference,

                'paid_at' =>
                    $paidAt,

                /*
                | SEO / Metadata
                */
                'meta_title' =>
                    $template['booking_type'] .
                    ' booking - ' .
                    $property->name,

                'meta_description' =>
                    'Booking for ' .
                    $property->name .
                    ' created through the estate management system.',

                'metadata' => [
                    'source' => 'website',
                    'channel' => 'online',
                    'seeded' => true,
                    'booking_index' => $index + 1,
                ],
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
