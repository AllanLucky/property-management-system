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
            ->with('roles')
            ->orderBy('id')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER USERS
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | Admin and super-admin users must NEVER be used as customers.
        |
        | customer_id represents the actual customer account.
        |
        */

        $customers = User::query()
            ->whereDoesntHave('roles', function ($query) {
                $query->whereIn('name', [
                    'admin',
                    'super-admin',
                ]);
            })
            ->orderBy('id')
            ->get()
            ->values();

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

        if ($users->isEmpty()) {
            $this->command->warn(
                'No users found. Please run the UserSeeder first.'
            );

            return;
        }

        if ($customers->isEmpty()) {
            $this->command->warn(
                'No eligible customer users found. Admin and super-admin users are excluded.'
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
        | SELECT BOOKING CREATOR
        |--------------------------------------------------------------------------
        |
        | user_id represents the authenticated user who created the booking.
        |
        | This is intentionally different from customer_id.
        |
        | Admin/super-admin may legitimately be the creator of a booking.
        |
        */

        $creator = User::query()
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', [
                    'super-admin',
                    'admin',
                ]);
            })
            ->orderBy('id')
            ->first();

        if (!$creator) {
            $creator = $users->first();
        }

        if (!$creator) {
            $this->command->warn(
                'No booking creator user could be selected.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | BOOKING TEMPLATES
        |--------------------------------------------------------------------------
        |
        | total_amount and balance are intentionally NOT supplied.
        | They are calculated by the Booking model.
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
        | PREPARE RENTAL TENANCIES
        |--------------------------------------------------------------------------
        |
        | Rental bookings must use a real tenancy.
        |
        | IMPORTANT:
        |
        | We also exclude any tenancy whose tenant user is an admin
        | or super-admin.
        |
        */

        $rentalTenancies = $tenancies
            ->filter(function ($tenancy) {
                $customer = $tenancy->tenant?->user;

                if (!$customer) {
                    return false;
                }

                /*
                |------------------------------------------------------------------
                | ADMIN / SUPER-ADMIN MUST NEVER BE A BOOKING CUSTOMER
                |------------------------------------------------------------------
                */

                if (
                    $customer->hasAnyRole([
                        'admin',
                        'super-admin',
                    ])
                ) {
                    return false;
                }

                return $tenancy->tenant_id
                    && $tenancy->property_id
                    && $tenancy->unit_id;
            })
            ->values();

        /*
        |--------------------------------------------------------------------------
        | CREATE BOOKINGS
        |--------------------------------------------------------------------------
        */

        $rentalIndex = 0;

        foreach ($bookingTemplates as $index => $template) {
            /*
            |--------------------------------------------------------------------------
            | INITIALIZE RELATIONSHIPS
            |--------------------------------------------------------------------------
            */

            $customer = null;
            $tenant = null;
            $tenancy = null;

            $property = null;
            $apartment = null;
            $unit = null;

            /*
            |--------------------------------------------------------------------------
            | RENTAL BOOKINGS
            |--------------------------------------------------------------------------
            |
            | Rental bookings select a tenancy FIRST.
            |
            | The tenancy determines:
            |
            | tenant
            | customer
            | property
            | apartment
            | unit
            |
            */

            if (
                $template['booking_type'] === Booking::TYPE_RENTAL
                && $rentalTenancies->isNotEmpty()
            ) {
                $tenancy = $rentalTenancies[
                    $rentalIndex % $rentalTenancies->count()
                ];

                $rentalIndex++;

                /*
                |--------------------------------------------------------------------------
                | TENANT
                |--------------------------------------------------------------------------
                */

                $tenant = $tenancy->tenant;

                /*
                |--------------------------------------------------------------------------
                | CUSTOMER
                |--------------------------------------------------------------------------
                */

                $customer = $tenant?->user;

                /*
                |--------------------------------------------------------------------------
                | SAFETY CHECK
                |--------------------------------------------------------------------------
                |
                | Never allow admin or super-admin to become a customer.
                |
                */

                if (
                    !$customer ||
                    $customer->hasAnyRole([
                        'admin',
                        'super-admin',
                    ])
                ) {
                    $customer = null;
                    $tenant = null;
                    $tenancy = null;
                }

                /*
                |--------------------------------------------------------------------------
                | PROPERTY
                |--------------------------------------------------------------------------
                */

                if ($tenancy && $customer) {
                    $property = $tenancy->property;

                    if (!$property && $tenancy->property_id) {
                        $property = $properties->firstWhere(
                            'id',
                            $tenancy->property_id
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | UNIT
                    |--------------------------------------------------------------------------
                    */

                    $unit = $tenancy->unit;

                    if (!$unit && $tenancy->unit_id) {
                        $unit = $units->firstWhere(
                            'id',
                            $tenancy->unit_id
                        );
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | APARTMENT
                    |--------------------------------------------------------------------------
                    */

                    $apartment = $tenancy->apartment;

                    if (!$apartment && $unit?->apartment_id) {
                        $apartment = $apartments->firstWhere(
                            'id',
                            $unit->apartment_id
                        );
                    }

                    if (!$apartment && $tenancy->apartment_id) {
                        $apartment = $apartments->firstWhere(
                            'id',
                            $tenancy->apartment_id
                        );
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | NON-RENTAL / FALLBACK CUSTOMER
            |--------------------------------------------------------------------------
            |
            | $customers already excludes admin and super-admin.
            |
            */

            if (!$customer) {
                $customer = $customers[
                    $index % $customers->count()
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | FALLBACK PROPERTY
            |--------------------------------------------------------------------------
            */

            if (!$property) {
                $property = $properties[
                    $index % $properties->count()
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | FALLBACK APARTMENT
            |--------------------------------------------------------------------------
            */

            if (!$apartment) {
                $propertyApartments = $apartments
                    ->where('property_id', $property->id)
                    ->values();

                if ($propertyApartments->isNotEmpty()) {
                    $apartment = $propertyApartments->random();
                }
            }

            /*
            |--------------------------------------------------------------------------
            | FALLBACK UNIT
            |--------------------------------------------------------------------------
            */

            if (!$unit) {
                $propertyUnits = $units
                    ->where('property_id', $property->id)
                    ->values();

                if ($apartment) {
                    $apartmentUnits = $propertyUnits
                        ->where('apartment_id', $apartment->id)
                        ->values();

                    if ($apartmentUnits->isNotEmpty()) {
                        $unit = $apartmentUnits->random();
                    }
                }

                if (!$unit && $propertyUnits->isNotEmpty()) {
                    $unit = $propertyUnits->random();
                }
            }

            /*
            |--------------------------------------------------------------------------
            | NON-RENTAL TENANT
            |--------------------------------------------------------------------------
            |
            | A viewing/reservation can have a tenant profile if the selected
            | customer already has one.
            |
            | tenancy_id remains null.
            |
            */

            if (
                !$tenancy &&
                $template['booking_type'] !== Booking::TYPE_RENTAL
            ) {
                $tenant = $tenants
                    ->first(function ($tenant) use ($customer) {
                        return $tenant->user_id === $customer->id
                            && $tenant->user
                            && !$tenant->user->hasAnyRole([
                                'admin',
                                'super-admin',
                            ]);
                    });
            }

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */

            $historicalStatuses = [
                Booking::STATUS_COMPLETED,
                Booking::STATUS_CANCELLED,
                Booking::STATUS_REJECTED,
                Booking::STATUS_EXPIRED,
            ];

            $isHistorical = in_array(
                $template['status'],
                $historicalStatuses,
                true
            );

            if ($isHistorical) {
                /*
                |--------------------------------------------------------------------------
                | Historical bookings must end in the past.
                |--------------------------------------------------------------------------
                */

                $endDate = Carbon::now()
                    ->subDays(rand(2, 90))
                    ->endOfDay();

                if (
                    $template['booking_type'] === Booking::TYPE_VIEWING
                ) {
                    $startDate = $endDate
                        ->copy()
                        ->startOfDay();
                } else {
                    $duration = rand(30, 90);

                    $startDate = $endDate
                        ->copy()
                        ->subDays($duration)
                        ->startOfDay();
                }

                $bookingDate = $startDate
                    ->copy()
                    ->subDays(rand(1, 10))
                    ->addHours(rand(1, 12));
            } else {
                /*
                |--------------------------------------------------------------------------
                | Current / future bookings.
                |--------------------------------------------------------------------------
                */

                $bookingDate = Carbon::now()
                    ->subDays(rand(0, 7))
                    ->subHours(rand(1, 12));

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
            | VIEWINGS ARE SINGLE-DAY BOOKINGS
            |--------------------------------------------------------------------------
            */

            if (
                $template['booking_type'] === Booking::TYPE_VIEWING
            ) {
                $endDate = $startDate->copy();
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK-IN / CHECK-OUT
            |--------------------------------------------------------------------------
            */

            $checkInDate = null;
            $checkOutDate = null;

            if (
                $template['booking_type'] !== Booking::TYPE_VIEWING
                && $template['status'] === Booking::STATUS_COMPLETED
            ) {
                $checkInDate = $startDate->copy();
                $checkOutDate = $endDate->copy();
            }

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL CALCULATION
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
            | AMOUNT PAID
            |--------------------------------------------------------------------------
            */

            $amountPaid = match ($template['payment_status']) {
                Booking::PAYMENT_PAID,
                Booking::PAYMENT_REFUNDED =>
                    $totalAmount,

                Booking::PAYMENT_PARTIAL =>
                    round($totalAmount * 0.50, 2),

                default =>
                    0,
            };

            /*
            |--------------------------------------------------------------------------
            | PAYMENT INFORMATION
            |--------------------------------------------------------------------------
            */

            $paymentMethod = null;
            $paymentReference = null;
            $paidAt = null;

            if ($amountPaid > 0) {
                $paymentMethod = 'mpesa';

                $paymentReference =
                    'MPESA-' .
                    strtoupper(str()->random(10));

                $paidAt = $bookingDate
                    ->copy()
                    ->addHours(rand(1, 48));

                if ($paidAt->greaterThan(Carbon::now())) {
                    $paidAt = Carbon::now()
                        ->subHours(rand(1, 6));
                }
            }

            /*
            |--------------------------------------------------------------------------
            | STATUS TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $confirmedAt = null;
            $approvedAt = null;
            $rejectedAt = null;
            $cancelledAt = null;
            $completedAt = null;

            /*
            |--------------------------------------------------------------------------
            | CONFIRMED
            |--------------------------------------------------------------------------
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

                if ($confirmedAt->greaterThan(Carbon::now())) {
                    $confirmedAt = Carbon::now()
                        ->subHours(rand(1, 6));
                }
            }

            /*
            |--------------------------------------------------------------------------
            | APPROVED
            |--------------------------------------------------------------------------
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

                if ($approvedAt->greaterThan(Carbon::now())) {
                    $approvedAt = Carbon::now()
                        ->subHours(rand(1, 4));
                }

                if (
                    $confirmedAt &&
                    $approvedAt->lessThan($confirmedAt)
                ) {
                    $approvedAt = $confirmedAt
                        ->copy()
                        ->addHours(1);

                    if ($approvedAt->greaterThan(Carbon::now())) {
                        $approvedAt = Carbon::now()
                            ->subHours(1);
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | REJECTED
            |--------------------------------------------------------------------------
            */

            if (
                $template['status'] === Booking::STATUS_REJECTED
            ) {
                $rejectedAt = $bookingDate
                    ->copy()
                    ->addDays(rand(1, 5));

                if ($rejectedAt->greaterThan(Carbon::now())) {
                    $rejectedAt = Carbon::now()
                        ->subHours(rand(1, 6));
                }
            }

            /*
            |--------------------------------------------------------------------------
            | CANCELLED
            |--------------------------------------------------------------------------
            */

            if (
                $template['status'] === Booking::STATUS_CANCELLED
            ) {
                $cancelledAt = $bookingDate
                    ->copy()
                    ->addDays(rand(1, 5));

                if ($cancelledAt->greaterThan(Carbon::now())) {
                    $cancelledAt = Carbon::now()
                        ->subHours(rand(1, 6));
                }
            }

            /*
            |--------------------------------------------------------------------------
            | COMPLETED
            |--------------------------------------------------------------------------
            */

            if (
                $template['status'] === Booking::STATUS_COMPLETED
            ) {
                $completedAt = $endDate
                    ->copy()
                    ->endOfDay();

                if ($completedAt->greaterThan(Carbon::now())) {
                    $completedAt = Carbon::now()
                        ->subHours(rand(1, 6));
                }
            }

            /*
            |--------------------------------------------------------------------------
            | REJECTION REASON
            |--------------------------------------------------------------------------
            */

            $rejectionReason = null;

            if (
                $template['status'] === Booking::STATUS_REJECTED
            ) {
                $rejectionReason =
                    'Booking application did not meet the required approval criteria.';
            }

            /*
            |--------------------------------------------------------------------------
            | CANCELLATION REASON
            |--------------------------------------------------------------------------
            */

            $cancellationReason = null;

            if (
                $template['status'] === Booking::STATUS_CANCELLED
            ) {
                $cancellationReason =
                    'Customer cancelled the booking.';
            }

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER SNAPSHOT
            |--------------------------------------------------------------------------
            |
            | Snapshot comes from the authoritative customer user.
            |
            | Admin and super-admin can never reach this point as customers.
            |
            */

            $firstName = $customer->first_name
                ?? 'Customer';

            $lastName = $customer->last_name
                ?? 'User';

            $fullName = trim(
                $firstName . ' ' . $lastName
            );

            $email = $customer->email
                ?? 'customer@example.com';

            $phone = $customer->phone
                ?? null;

            /*
            |--------------------------------------------------------------------------
            | PROPERTY NAME
            |--------------------------------------------------------------------------
            */

            $propertyName = $property->name
                ?? $property->title
                ?? $property->slug
                ?? 'Property';

            /*
            |--------------------------------------------------------------------------
            | METADATA
            |--------------------------------------------------------------------------
            */

            $metadata = [
                'source' => $template['source'],

                'channel' =>
                    $template['source'] === Booking::SOURCE_WEBSITE
                        ? 'online'
                        : 'offline',

                'seeded' => true,

                'booking_index' => $index + 1,

                'seeded_at' =>
                    Carbon::now()->toIso8601String(),
            ];

            /*
            |--------------------------------------------------------------------------
            | CREATE BOOKING
            |--------------------------------------------------------------------------
            |
            | user_id      = booking creator
            | customer_id  = actual customer account
            | tenant_id    = tenant profile
            | tenancy_id   = actual tenancy
            |
            | Admin/super-admin are NEVER customer_id.
            |
            | total_amount and balance are intentionally NOT supplied.
            |
            */

            Booking::create([
                /*
                |--------------------------------------------------------------------------
                | CREATOR / CUSTOMER
                |--------------------------------------------------------------------------
                */

                'user_id' =>
                    $creator->id,

                'customer_id' =>
                    $customer->id,

                'tenant_id' =>
                    $tenant?->id,

                /*
                |--------------------------------------------------------------------------
                | PROPERTY RELATIONSHIPS
                |--------------------------------------------------------------------------
                */

                'property_id' =>
                    $property->id,

                'apartment_id' =>
                    $apartment?->id,

                'unit_id' =>
                    $unit?->id,

                /*
                |--------------------------------------------------------------------------
                | TENANCY
                |--------------------------------------------------------------------------
                */

                'tenancy_id' =>
                    $tenancy?->id,

                /*
                |--------------------------------------------------------------------------
                | BOOKING
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
                | DATES
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
                | CUSTOMER SNAPSHOT
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
                | FINANCIALS
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
                | GUEST INFORMATION
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
                | PAYMENT
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
                    $propertyName,

                'meta_description' =>
                    'Booking for ' .
                    $propertyName .
                    ' created through the EstateKenya property management system.',

                /*
                |--------------------------------------------------------------------------
                | METADATA
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