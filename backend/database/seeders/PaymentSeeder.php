<?php

namespace Database\Seeders;

use App\Models\Payment;
use App\Models\Tenant;
use App\Models\Tenancy;
use App\Models\User;
use App\Models\Property;
use App\Models\Apartment;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Load Existing Records
        |--------------------------------------------------------------------------
        |
        | Payments should reference existing operational records.
        | We therefore avoid hard-coding IDs where possible.
        |
        */

        $tenancies = Tenancy::query()
            ->with([
                'tenant',
                'property',
                'apartment',
                'unit',
            ])
            ->get();

        if ($tenancies->isEmpty()) {
            $this->command->warn(
                'No tenancies found. Payment seeding skipped.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | System Users
        |--------------------------------------------------------------------------
        */

        $users = User::query()
            ->pluck('id')
            ->values();

        /*
        |--------------------------------------------------------------------------
        | Payment Records
        |--------------------------------------------------------------------------
        |
        | These records intentionally cover different payment scenarios:
        |
        | - Monthly rent
        | - Security deposit
        | - Service charge
        | - Utility
        | - Penalty
        | - Other
        |
        | And different payment methods:
        |
        | - M-Pesa
        | - Bank transfer
        | - Cash
        | - Card
        | - Cheque
        |
        */

        $paymentRecords = [];

        foreach ($tenancies->take(10) as $index => $tenancy) {
            $tenant = $tenancy->tenant;

            /*
            |--------------------------------------------------------------------------
            | Resolve User
            |--------------------------------------------------------------------------
            */

            $userId = $tenant?->user_id;

            if (! $userId && $users->isNotEmpty()) {
                $userId = $users->random();
            }

            /*
            |--------------------------------------------------------------------------
            | Resolve Related IDs
            |--------------------------------------------------------------------------
            */

            $tenantId = $tenancy->tenant_id;
            $propertyId = $tenancy->property_id;
            $apartmentId = $tenancy->apartment_id;
            $unitId = $tenancy->unit_id;

            /*
            |--------------------------------------------------------------------------
            | Payment Date
            |--------------------------------------------------------------------------
            */

            $paymentDate = now()
                ->subMonths($index % 4)
                ->startOfMonth()
                ->addDays(2 + ($index % 5));

            /*
            |--------------------------------------------------------------------------
            | Rent Payment
            |--------------------------------------------------------------------------
            */

            $rentAmount = (float) $tenancy->rent_amount;

            if ($rentAmount <= 0) {
                $rentAmount = 60000;
            }

            $paymentRecords[] = [
                'user_id' => $userId,
                'tenant_id' => $tenantId,
                'tenancy_id' => $tenancy->id,
                'property_id' => $propertyId,
                'apartment_id' => $apartmentId,
                'unit_id' => $unitId,

                'amount' => $rentAmount,

                'currency' => Payment::DEFAULT_CURRENCY,

                'payment_type' => Payment::TYPE_RENT,

                'payment_method' => Payment::METHOD_MPESA,

                'status' => Payment::STATUS_COMPLETED,

                'payment_date' => $paymentDate,

                'paid_at' => $paymentDate
                    ->copy()
                    ->setTime(10, 30),

                'transaction_reference' =>
                    'MPE-' . strtoupper(
                        substr(
                            md5(
                                'rent-' .
                                $tenancy->id .
                                '-' .
                                $index
                            ),
                            0,
                            12
                        )
                    ),

                'description' =>
                    'Monthly rent payment for tenancy '
                    . $tenancy->tenancy_number,

                'notes' =>
                    'Seeded rent payment for development and testing.',

                'created_by' => $userId,
                'updated_by' => $userId,
            ];

            /*
            |--------------------------------------------------------------------------
            | Security Deposit
            |--------------------------------------------------------------------------
            */

            if ($index < 5) {
                $depositAmount = (float) $tenancy->deposit_amount;

                if ($depositAmount > 0) {
                    $depositDate = $paymentDate
                        ->copy()
                        ->subDays(3);

                    $paymentRecords[] = [
                        'user_id' => $userId,
                        'tenant_id' => $tenantId,
                        'tenancy_id' => $tenancy->id,
                        'property_id' => $propertyId,
                        'apartment_id' => $apartmentId,
                        'unit_id' => $unitId,

                        'amount' => $depositAmount,

                        'currency' => Payment::DEFAULT_CURRENCY,

                        'payment_type' => Payment::TYPE_DEPOSIT,

                        'payment_method' =>
                            Payment::METHOD_BANK_TRANSFER,

                        'status' => Payment::STATUS_COMPLETED,

                        'payment_date' => $depositDate,

                        'paid_at' => $depositDate
                            ->copy()
                            ->setTime(14, 15),

                        'transaction_reference' =>
                            'DEP-' . strtoupper(
                                substr(
                                    md5(
                                        'deposit-' .
                                        $tenancy->id .
                                        '-' .
                                        $index
                                    ),
                                    0,
                                    12
                                )
                            ),

                        'description' =>
                            'Security deposit for tenancy '
                            . $tenancy->tenancy_number,

                        'notes' =>
                            'Seeded security deposit payment.',

                        'created_by' => $userId,
                        'updated_by' => $userId,
                    ];
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Service Charge
            |--------------------------------------------------------------------------
            */

            $serviceCharge = (float) $tenancy->service_charge;

            if ($serviceCharge > 0 && $index < 7) {
                $serviceChargeDate = $paymentDate
                    ->copy()
                    ->addDays(1);

                $paymentRecords[] = [
                    'user_id' => $userId,
                    'tenant_id' => $tenantId,
                    'tenancy_id' => $tenancy->id,
                    'property_id' => $propertyId,
                    'apartment_id' => $apartmentId,
                    'unit_id' => $unitId,

                    'amount' => $serviceCharge,

                    'currency' => Payment::DEFAULT_CURRENCY,

                    'payment_type' =>
                        Payment::TYPE_SERVICE_CHARGE,

                    'payment_method' =>
                        Payment::METHOD_CASH,

                    'status' => Payment::STATUS_COMPLETED,

                    'payment_date' => $serviceChargeDate,

                    'paid_at' => $serviceChargeDate
                        ->copy()
                        ->setTime(11, 0),

                    'transaction_reference' =>
                        'SC-' . strtoupper(
                            substr(
                                md5(
                                    'service-charge-' .
                                    $tenancy->id .
                                    '-' .
                                    $index
                                ),
                                0,
                                12
                            )
                        ),

                    'description' =>
                        'Service charge payment for tenancy '
                        . $tenancy->tenancy_number,

                    'notes' =>
                        'Seeded service charge payment.',

                    'created_by' => $userId,
                    'updated_by' => $userId,
                ];
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Additional Utility Payment
        |--------------------------------------------------------------------------
        */

        if ($tenancies->isNotEmpty()) {
            $tenancy = $tenancies->first();

            $tenant = $tenancy->tenant;

            $userId = $tenant?->user_id;

            if (! $userId && $users->isNotEmpty()) {
                $userId = $users->first();
            }

            $utilityDate = now()
                ->subDays(12)
                ->startOfDay();

            $paymentRecords[] = [
                'user_id' => $userId,
                'tenant_id' => $tenancy->tenant_id,
                'tenancy_id' => $tenancy->id,
                'property_id' => $tenancy->property_id,
                'apartment_id' => $tenancy->apartment_id,
                'unit_id' => $tenancy->unit_id,

                'amount' => 3500.00,

                'currency' => Payment::DEFAULT_CURRENCY,

                'payment_type' => Payment::TYPE_UTILITY,

                'payment_method' => Payment::METHOD_MPESA,

                'status' => Payment::STATUS_COMPLETED,

                'payment_date' => $utilityDate,

                'paid_at' => $utilityDate
                    ->copy()
                    ->setTime(9, 45),

                'transaction_reference' =>
                    'UTL-' . strtoupper(
                        substr(
                            md5(
                                'utility-' .
                                $tenancy->id
                            ),
                            0,
                            12
                        )
                    ),

                'description' =>
                    'Utility payment for tenancy '
                    . $tenancy->tenancy_number,

                'notes' =>
                    'Seeded utility payment.',

                'created_by' => $userId,
                'updated_by' => $userId,
            ];

            /*
            |--------------------------------------------------------------------------
            | Penalty Payment
            |--------------------------------------------------------------------------
            */

            $paymentRecords[] = [
                'user_id' => $userId,
                'tenant_id' => $tenancy->tenant_id,
                'tenancy_id' => $tenancy->id,
                'property_id' => $tenancy->property_id,
                'apartment_id' => $tenancy->apartment_id,
                'unit_id' => $tenancy->unit_id,

                'amount' => 3500.00,

                'currency' => Payment::DEFAULT_CURRENCY,

                'payment_type' => Payment::TYPE_PENALTY,

                'payment_method' => Payment::METHOD_CARD,

                'status' => Payment::STATUS_COMPLETED,

                'payment_date' => now()
                    ->subDays(20)
                    ->toDateString(),

                'paid_at' => now()
                    ->subDays(20)
                    ->setTime(15, 20),

                'transaction_reference' =>
                    'PNL-' . strtoupper(
                        substr(
                            md5(
                                'penalty-' .
                                $tenancy->id
                            ),
                            0,
                            12
                        )
                    ),

                'description' =>
                    'Late payment penalty for tenancy '
                    . $tenancy->tenancy_number,

                'notes' =>
                    'Seeded penalty payment for testing.',

                'created_by' => $userId,
                'updated_by' => $userId,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | Create Payments
        |--------------------------------------------------------------------------
        |
        | Payment::create() is intentionally used instead of DB::insert()
        | because the Payment model generates:
        |
        | - payment_number
        | - receipt_number for completed payments
        | - paid_at where required
        |
        */

        foreach ($paymentRecords as $record) {
            Payment::create($record);
        }

        /*
        |--------------------------------------------------------------------------
        | Pending Payment
        |--------------------------------------------------------------------------
        */

        if ($tenancies->isNotEmpty()) {
            $tenancy = $tenancies->last();

            $tenant = $tenancy->tenant;

            $userId = $tenant?->user_id;

            if (! $userId && $users->isNotEmpty()) {
                $userId = $users->last();
            }

            Payment::create([
                'user_id' => $userId,
                'tenant_id' => $tenancy->tenant_id,
                'tenancy_id' => $tenancy->id,
                'property_id' => $tenancy->property_id,
                'apartment_id' => $tenancy->apartment_id,
                'unit_id' => $tenancy->unit_id,

                'amount' => (float) $tenancy->rent_amount,

                'currency' => Payment::DEFAULT_CURRENCY,

                'payment_type' => Payment::TYPE_RENT,

                'payment_method' => Payment::METHOD_MPESA,

                'status' => Payment::STATUS_PENDING,

                'payment_date' => now()->toDateString(),

                'description' =>
                    'Pending monthly rent payment for tenancy '
                    . $tenancy->tenancy_number,

                'notes' =>
                    'Seeded pending payment for testing payment workflows.',

                'created_by' => $userId,
                'updated_by' => $userId,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Seeder Summary
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            'Payment seeding completed successfully.'
        );

        $this->command->info(
            'Created ' . Payment::count() . ' payment records.'
        );
    }
}