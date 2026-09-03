<?php

namespace Database\Seeders;

use App\Models\Apartment;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\Tenancy;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TenancySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | FETCH EXISTING RECORDS
        |--------------------------------------------------------------------------
        */

        $properties = Property::query()
            ->get();

        $apartments = Apartment::query()
            ->get();

        $units = Unit::query()
            ->get();

        $tenants = Tenant::query()
            ->get();

        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        if ($properties->isEmpty()) {
            $this->command->warn(
                'No properties found. Please run PropertiesSeeder first.'
            );

            return;
        }

        if ($apartments->isEmpty()) {
            $this->command->warn(
                'No apartments found. Please run ApartmentsSeeder first.'
            );

            return;
        }

        if ($units->isEmpty()) {
            $this->command->warn(
                'No units found. Please run UnitsSeeder first.'
            );

            return;
        }

        if ($tenants->isEmpty()) {
            $this->command->warn(
                'No tenants found. Please run TenantSeeder first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | TENANCY TEMPLATES
        |--------------------------------------------------------------------------
        */

        $templates = [
            [
                'status' => Tenancy::STATUS_ACTIVE,
                'payment_frequency' => 'monthly',
                'rent_amount' => 45000,
                'deposit_amount' => 45000,
                'service_charge' => 3500,
                'late_fee' => 2500,
                'due_day' => 5,
                'duration_months' => 12,
                'move_in' => true,
                'move_out' => false,
                'notes' => 'Active residential tenancy. Tenant is currently occupying the unit.',
            ],

            [
                'status' => Tenancy::STATUS_ACTIVE,
                'payment_frequency' => 'monthly',
                'rent_amount' => 55000,
                'deposit_amount' => 55000,
                'service_charge' => 4500,
                'late_fee' => 3000,
                'due_day' => 1,
                'duration_months' => 12,
                'move_in' => true,
                'move_out' => false,
                'notes' => 'Active tenancy with standard residential lease terms.',
            ],

            [
                'status' => Tenancy::STATUS_ACTIVE,
                'payment_frequency' => 'monthly',
                'rent_amount' => 65000,
                'deposit_amount' => 65000,
                'service_charge' => 5000,
                'late_fee' => 3500,
                'due_day' => 5,
                'duration_months' => 24,
                'move_in' => true,
                'move_out' => false,
                'notes' => 'Two-year residential tenancy agreement.',
            ],

            [
                'status' => Tenancy::STATUS_PENDING,
                'payment_frequency' => 'monthly',
                'rent_amount' => 50000,
                'deposit_amount' => 50000,
                'service_charge' => 4000,
                'late_fee' => 2500,
                'due_day' => 5,
                'duration_months' => 12,
                'move_in' => false,
                'move_out' => false,
                'notes' => 'Tenancy awaiting final approval and move-in.',
            ],

            [
                'status' => Tenancy::STATUS_PENDING,
                'payment_frequency' => 'monthly',
                'rent_amount' => 35000,
                'deposit_amount' => 35000,
                'service_charge' => 3000,
                'late_fee' => 2000,
                'due_day' => 10,
                'duration_months' => 12,
                'move_in' => false,
                'move_out' => false,
                'notes' => 'Pending tenancy application awaiting documentation.',
            ],

            [
                'status' => Tenancy::STATUS_EXPIRED,
                'payment_frequency' => 'monthly',
                'rent_amount' => 40000,
                'deposit_amount' => 40000,
                'service_charge' => 3000,
                'late_fee' => 2000,
                'due_day' => 5,
                'duration_months' => 12,
                'move_in' => true,
                'move_out' => true,
                'notes' => 'Tenancy completed its contractual period and expired.',
            ],

            [
                'status' => Tenancy::STATUS_EXPIRED,
                'payment_frequency' => 'monthly',
                'rent_amount' => 60000,
                'deposit_amount' => 60000,
                'service_charge' => 5000,
                'late_fee' => 3000,
                'due_day' => 1,
                'duration_months' => 12,
                'move_in' => true,
                'move_out' => true,
                'notes' => 'Previous tenancy that expired after the lease period.',
            ],

            [
                'status' => Tenancy::STATUS_TERMINATED,
                'payment_frequency' => 'monthly',
                'rent_amount' => 48000,
                'deposit_amount' => 48000,
                'service_charge' => 3500,
                'late_fee' => 2500,
                'due_day' => 5,
                'duration_months' => 12,
                'move_in' => true,
                'move_out' => true,
                'notes' => 'Tenancy terminated before the original contract end date.',
            ],

            [
                'status' => Tenancy::STATUS_TERMINATED,
                'payment_frequency' => 'monthly',
                'rent_amount' => 70000,
                'deposit_amount' => 70000,
                'service_charge' => 6000,
                'late_fee' => 3500,
                'due_day' => 1,
                'duration_months' => 24,
                'move_in' => true,
                'move_out' => true,
                'notes' => 'Tenancy terminated following an early move-out request.',
            ],

            [
                'status' => Tenancy::STATUS_CANCELLED,
                'payment_frequency' => 'monthly',
                'rent_amount' => 45000,
                'deposit_amount' => 45000,
                'service_charge' => 3500,
                'late_fee' => 2000,
                'due_day' => 5,
                'duration_months' => 12,
                'move_in' => false,
                'move_out' => false,
                'notes' => 'Tenancy cancelled before the tenant moved into the unit.',
            ],

            [
                'status' => Tenancy::STATUS_CANCELLED,
                'payment_frequency' => 'monthly',
                'rent_amount' => 38000,
                'deposit_amount' => 38000,
                'service_charge' => 3000,
                'late_fee' => 2000,
                'due_day' => 10,
                'duration_months' => 12,
                'move_in' => false,
                'move_out' => false,
                'notes' => 'Tenancy application cancelled by the prospective tenant.',
            ],

            [
                'status' => Tenancy::STATUS_ACTIVE,
                'payment_frequency' => 'quarterly',
                'rent_amount' => 85000,
                'deposit_amount' => 85000,
                'service_charge' => 7500,
                'late_fee' => 5000,
                'due_day' => 1,
                'duration_months' => 24,
                'move_in' => true,
                'move_out' => false,
                'notes' => 'Active tenancy with quarterly payment arrangement.',
            ],

            [
                'status' => Tenancy::STATUS_ACTIVE,
                'payment_frequency' => 'monthly',
                'rent_amount' => 75000,
                'deposit_amount' => 75000,
                'service_charge' => 6500,
                'late_fee' => 4000,
                'due_day' => 5,
                'duration_months' => 12,
                'move_in' => true,
                'move_out' => false,
                'notes' => 'Premium apartment tenancy currently active.',
            ],

            [
                'status' => Tenancy::STATUS_EXPIRED,
                'payment_frequency' => 'monthly',
                'rent_amount' => 52000,
                'deposit_amount' => 52000,
                'service_charge' => 4000,
                'late_fee' => 2500,
                'due_day' => 5,
                'duration_months' => 12,
                'move_in' => true,
                'move_out' => true,
                'notes' => 'Former tenancy that has reached its expiry date.',
            ],

            [
                'status' => Tenancy::STATUS_ACTIVE,
                'payment_frequency' => 'monthly',
                'rent_amount' => 30000,
                'deposit_amount' => 30000,
                'service_charge' => 2500,
                'late_fee' => 1500,
                'due_day' => 10,
                'duration_months' => 12,
                'move_in' => true,
                'move_out' => false,
                'notes' => 'Affordable residential unit with active tenancy.',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | TRACK BLOCKING ASSIGNMENTS
        |--------------------------------------------------------------------------
        |
        | Active and pending tenancies are considered blocking.
        |
        | A tenant cannot have another active/pending tenancy.
        | A unit cannot have another active/pending tenancy.
        |
        */

        $blockingTenantIds = Tenancy::query()
            ->whereIn('status', [
                Tenancy::STATUS_ACTIVE,
                Tenancy::STATUS_PENDING,
            ])
            ->where('is_active', true)
            ->pluck('tenant_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        $blockingUnitIds = Tenancy::query()
            ->whereIn('status', [
                Tenancy::STATUS_ACTIVE,
                Tenancy::STATUS_PENDING,
            ])
            ->where('is_active', true)
            ->pluck('unit_id')
            ->filter()
            ->unique()
            ->values()
            ->all();

        /*
        |--------------------------------------------------------------------------
        | TRACK COUNTS
        |--------------------------------------------------------------------------
        */

        $createdCount = 0;
        $skippedCount = 0;

        $statusCounts = [
            Tenancy::STATUS_ACTIVE => 0,
            Tenancy::STATUS_PENDING => 0,
            Tenancy::STATUS_EXPIRED => 0,
            Tenancy::STATUS_TERMINATED => 0,
            Tenancy::STATUS_CANCELLED => 0,
        ];

        /*
        |--------------------------------------------------------------------------
        | CREATE TENANCIES
        |--------------------------------------------------------------------------
        */

        foreach ($templates as $index => $template) {

            $status = $template['status'];

            $isBlocking = in_array(
                $status,
                [
                    Tenancy::STATUS_ACTIVE,
                    Tenancy::STATUS_PENDING,
                ],
                true
            );

            /*
            |--------------------------------------------------------------------------
            | SELECT TENANT
            |--------------------------------------------------------------------------
            */

            $tenant = null;

            if ($isBlocking) {

                /*
                | Only tenants without an existing blocking tenancy.
                */

                $availableTenants = $tenants
                    ->filter(
                        fn ($item) =>
                            !in_array(
                                $item->id,
                                $blockingTenantIds,
                                true
                            )
                    )
                    ->values();

                if ($availableTenants->isEmpty()) {
                    $this->command->warn(
                        "Skipping template {$index}: no tenant available for an {$status} tenancy."
                    );

                    $skippedCount++;

                    continue;
                }

                $tenant = $availableTenants->first();

            } else {

                /*
                | Historical/cancelled tenancies may reuse tenants.
                */

                $tenant = $tenants[
                    $index % $tenants->count()
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | SELECT UNIT
            |--------------------------------------------------------------------------
            */

            $unit = null;

            if ($isBlocking) {

                /*
                | Only units without an existing blocking tenancy.
                */

                $availableUnits = $units
                    ->filter(
                        fn ($item) =>
                            !in_array(
                                $item->id,
                                $blockingUnitIds,
                                true
                            )
                    )
                    ->values();

                if ($availableUnits->isEmpty()) {
                    $this->command->warn(
                        "Skipping template {$index}: no unit available for an {$status} tenancy."
                    );

                    $skippedCount++;

                    continue;
                }

                /*
                | Prefer a vacant unit.
                */

                $vacantUnits = $availableUnits
                    ->filter(
                        fn ($item) =>
                            $item->status === Unit::STATUS_VACANT
                    )
                    ->values();

                $unit = $vacantUnits->isNotEmpty()
                    ? $vacantUnits->random()
                    : $availableUnits->random();

            } else {

                /*
                | Historical tenancies can reuse any unit.
                */

                $unit = $units[
                    $index % $units->count()
                ];
            }

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            |
            | Always derive the property from the selected unit.
            |
            | This prevents:
            |
            | property_id != unit.property_id
            |
            */

            $property = $properties->firstWhere(
                'id',
                $unit->property_id
            );

            if (!$property) {
                $this->command->warn(
                    "Skipping template {$index}: property not found for unit {$unit->id}."
                );

                $skippedCount++;

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | APARTMENT
            |--------------------------------------------------------------------------
            */

            $apartment = null;

            if ($unit->apartment_id) {
                $apartment = $apartments->firstWhere(
                    'id',
                    $unit->apartment_id
                );
            }

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */

            $dates = $this->generateDates(
                $status,
                $template['duration_months']
            );

            $startDate = $dates['start_date'];
            $endDate = $dates['end_date'];
            $moveInDate = $dates['move_in_date'];
            $moveOutDate = $dates['move_out_date'];

            /*
            |--------------------------------------------------------------------------
            | AGREEMENT
            |--------------------------------------------------------------------------
            */

            $agreementFile = null;
            $agreementPublicId = null;

            /*
            |--------------------------------------------------------------------------
            | ACTIVE FLAG
            |--------------------------------------------------------------------------
            |
            | Both ACTIVE and PENDING are blocking states.
            |
            */

            $isActive = $isBlocking;

            /*
            |--------------------------------------------------------------------------
            | TENANCY NUMBER
            |--------------------------------------------------------------------------
            */

            $tenancyNumber = $this->generateTenancyNumber();

            /*
            |--------------------------------------------------------------------------
            | CREATE TENANCY + SYNCHRONIZE UNIT
            |--------------------------------------------------------------------------
            */

            DB::transaction(function () use (
                $property,
                $apartment,
                $unit,
                $tenant,
                $template,
                $tenancyNumber,
                $startDate,
                $endDate,
                $moveInDate,
                $moveOutDate,
                $agreementFile,
                $agreementPublicId,
                $isActive,
                $status
            ) {

                /*
                |--------------------------------------------------------------------------
                | CREATE TENANCY
                |--------------------------------------------------------------------------
                */

                Tenancy::create([
                    /*
                    |--------------------------------------------------------------------------
                    | RELATIONSHIPS
                    |--------------------------------------------------------------------------
                    */

                    'property_id' =>
                        $property->id,

                    'apartment_id' =>
                        $apartment?->id,

                    'unit_id' =>
                        $unit->id,

                    'tenant_id' =>
                        $tenant->id,

                    /*
                    |--------------------------------------------------------------------------
                    | IDENTIFICATION
                    |--------------------------------------------------------------------------
                    */

                    'tenancy_number' =>
                        $tenancyNumber,

                    /*
                    |--------------------------------------------------------------------------
                    | DATES
                    |--------------------------------------------------------------------------
                    */

                    'start_date' =>
                        $startDate,

                    'end_date' =>
                        $endDate,

                    'move_in_date' =>
                        $moveInDate,

                    'move_out_date' =>
                        $moveOutDate,

                    /*
                    |--------------------------------------------------------------------------
                    | FINANCIAL
                    |--------------------------------------------------------------------------
                    */

                    'rent_amount' =>
                        $template['rent_amount'],

                    'deposit_amount' =>
                        $template['deposit_amount'],

                    'service_charge' =>
                        $template['service_charge'],

                    'late_fee' =>
                        $template['late_fee'],

                    /*
                    |--------------------------------------------------------------------------
                    | PAYMENT TERMS
                    |--------------------------------------------------------------------------
                    */

                    'payment_frequency' =>
                        $template['payment_frequency'],

                    'due_day' =>
                        $template['due_day'],

                    /*
                    |--------------------------------------------------------------------------
                    | STATUS
                    |--------------------------------------------------------------------------
                    */

                    'status' =>
                        $status,

                    'is_active' =>
                        $isActive,

                    /*
                    |--------------------------------------------------------------------------
                    | AGREEMENT
                    |--------------------------------------------------------------------------
                    */

                    'agreement_file' =>
                        $agreementFile,

                    'agreement_public_id' =>
                        $agreementPublicId,

                    /*
                    |--------------------------------------------------------------------------
                    | NOTES
                    |--------------------------------------------------------------------------
                    */

                    'notes' =>
                        $template['notes'],
                ]);

                /*
                |--------------------------------------------------------------------------
                | SYNCHRONIZE UNIT STATUS
                |--------------------------------------------------------------------------
                |
                | ACTIVE  -> OCCUPIED
                | PENDING -> RESERVED
                |
                | Historical/cancelled tenancies do not automatically overwrite
                | the unit status because the unit may already have another
                | active tenancy.
                |
                */

                if ($status === Tenancy::STATUS_ACTIVE) {

                    $unit->update([
                        'status' =>
                            Unit::STATUS_OCCUPIED,

                        'is_active' =>
                            true,

                        'available_from' =>
                            null,
                    ]);

                } elseif ($status === Tenancy::STATUS_PENDING) {

                    $unit->update([
                        'status' =>
                            Unit::STATUS_RESERVED,

                        'is_active' =>
                            true,
                    ]);
                }
            });

            /*
            |--------------------------------------------------------------------------
            | UPDATE BLOCKING TRACKERS
            |--------------------------------------------------------------------------
            */

            if ($isBlocking) {
                $blockingTenantIds[] = $tenant->id;
                $blockingUnitIds[] = $unit->id;
            }

            /*
            |--------------------------------------------------------------------------
            | UPDATE COUNTERS
            |--------------------------------------------------------------------------
            */

            $createdCount++;

            $statusCounts[$status]++;

            /*
            |--------------------------------------------------------------------------
            | OUTPUT
            |--------------------------------------------------------------------------
            */

            $tenantName = trim(
                implode(
                    ' ',
                    array_filter([
                        $tenant->first_name ?? null,
                        $tenant->last_name ?? null,
                    ])
                )
            );

            $this->command->line(
                "Created {$tenancyNumber} | " .
                "Tenant: " . ($tenantName ?: "Tenant #{$tenant->id}") . " | " .
                "Unit: {$unit->unit_number} | " .
                "Type: " . $this->getUnitTypeLabel($unit->type) . " | " .
                "Status: " . Str::headline($status)
            );
        }

        /*
        |--------------------------------------------------------------------------
        | FINAL SUMMARY
        |--------------------------------------------------------------------------
        */

        $this->command->newLine();

        $this->command->info(
            "{$createdCount} tenancy records seeded successfully."
        );

        if ($skippedCount > 0) {
            $this->command->warn(
                "{$skippedCount} tenancy templates were skipped."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | TENANCY STATUS SUMMARY
        |--------------------------------------------------------------------------
        */

        $this->command->newLine();

        $this->command->info('Tenancy status summary:');

        $this->command->line(
            'Active: ' .
            $statusCounts[Tenancy::STATUS_ACTIVE]
        );

        $this->command->line(
            'Pending: ' .
            $statusCounts[Tenancy::STATUS_PENDING]
        );

        $this->command->line(
            'Expired: ' .
            $statusCounts[Tenancy::STATUS_EXPIRED]
        );

        $this->command->line(
            'Terminated: ' .
            $statusCounts[Tenancy::STATUS_TERMINATED]
        );

        $this->command->line(
            'Cancelled: ' .
            $statusCounts[Tenancy::STATUS_CANCELLED]
        );

        /*
        |--------------------------------------------------------------------------
        | DATABASE SUMMARY
        |--------------------------------------------------------------------------
        */

        $totalTenancies = Tenancy::query()
            ->count();

        $activeTenancies = Tenancy::query()
            ->where('status', Tenancy::STATUS_ACTIVE)
            ->where('is_active', true)
            ->count();

        $pendingTenancies = Tenancy::query()
            ->where('status', Tenancy::STATUS_PENDING)
            ->where('is_active', true)
            ->count();

        $expiredTenancies = Tenancy::query()
            ->where('status', Tenancy::STATUS_EXPIRED)
            ->count();

        $terminatedTenancies = Tenancy::query()
            ->where('status', Tenancy::STATUS_TERMINATED)
            ->count();

        $cancelledTenancies = Tenancy::query()
            ->where('status', Tenancy::STATUS_CANCELLED)
            ->count();

        $this->command->newLine();

        $this->command->info(
            "Total tenancies in database: {$totalTenancies}"
        );

        $this->command->line(
            "Active: {$activeTenancies}"
        );

        $this->command->line(
            "Pending: {$pendingTenancies}"
        );

        $this->command->line(
            "Expired: {$expiredTenancies}"
        );

        $this->command->line(
            "Terminated: {$terminatedTenancies}"
        );

        $this->command->line(
            "Cancelled: {$cancelledTenancies}"
        );
    }

    /**
     * Generate realistic tenancy dates based on status.
     */
    private function generateDates(
        string $status,
        int $durationMonths
    ): array {
        /*
        |--------------------------------------------------------------------------
        | ACTIVE
        |--------------------------------------------------------------------------
        */

        if ($status === Tenancy::STATUS_ACTIVE) {

            $startDate = Carbon::now()
                ->subMonths(rand(1, 10))
                ->startOfDay();

            $endDate = $startDate
                ->copy()
                ->addMonths($durationMonths);

            /*
            | Move-in shortly after lease commencement.
            */

            $moveInDate = $startDate
                ->copy()
                ->addDays(rand(0, 5));

            /*
            | Never create a move-in date beyond today.
            */

            if ($moveInDate->greaterThan(Carbon::now())) {
                $moveInDate = $startDate->copy();
            }

            $moveOutDate = null;

            return [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'move_in_date' => $moveInDate,
                'move_out_date' => $moveOutDate,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | PENDING
        |--------------------------------------------------------------------------
        */

        if ($status === Tenancy::STATUS_PENDING) {

            $startDate = Carbon::now()
                ->addDays(rand(7, 30))
                ->startOfDay();

            $endDate = $startDate
                ->copy()
                ->addMonths($durationMonths);

            return [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'move_in_date' => null,
                'move_out_date' => null,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | EXPIRED
        |--------------------------------------------------------------------------
        */

        if ($status === Tenancy::STATUS_EXPIRED) {

            $endDate = Carbon::now()
                ->subDays(rand(30, 365))
                ->startOfDay();

            $startDate = $endDate
                ->copy()
                ->subMonths($durationMonths);

            $moveInDate = $startDate
                ->copy()
                ->addDays(rand(0, 5));

            /*
            | Move-out should be on or before the contractual end date.
            */

            $moveOutDate = $endDate
                ->copy()
                ->subDays(rand(0, 3));

            if ($moveOutDate->lessThan($moveInDate)) {
                $moveOutDate = $endDate->copy();
            }

            return [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'move_in_date' => $moveInDate,
                'move_out_date' => $moveOutDate,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | TERMINATED
        |--------------------------------------------------------------------------
        */

        if ($status === Tenancy::STATUS_TERMINATED) {

            /*
            | Start far enough in the past to make termination historical.
            */

            $startDate = Carbon::now()
                ->subMonths(rand(12, 24))
                ->startOfDay();

            $contractEndDate = $startDate
                ->copy()
                ->addMonths($durationMonths);

            /*
            | Termination should happen after move-in and before now.
            */

            $moveInDate = $startDate
                ->copy()
                ->addDays(rand(0, 5));

            $latestMoveOut = Carbon::now()
                ->subDays(30)
                ->startOfDay();

            /*
            | Keep move-out before the contractual end.
            */

            $possibleMoveOut = $contractEndDate
                ->copy()
                ->subDays(rand(30, 120));

            $moveOutDate = $possibleMoveOut->lessThan($latestMoveOut)
                ? $possibleMoveOut
                : $latestMoveOut;

            /*
            | Safety check.
            */

            if ($moveOutDate->lessThanOrEqualTo($moveInDate)) {
                $moveOutDate = $moveInDate
                    ->copy()
                    ->addMonths(3);
            }

            /*
            | Make sure move-out remains in the past.
            */

            if ($moveOutDate->greaterThanOrEqualTo(Carbon::now())) {
                $moveOutDate = Carbon::now()
                    ->subDays(30)
                    ->startOfDay();
            }

            /*
            | The contractual end date must remain after the start date.
            */

            if ($contractEndDate->lessThanOrEqualTo($startDate)) {
                $contractEndDate = $startDate
                    ->copy()
                    ->addMonths(max(1, $durationMonths));
            }

            return [
                'start_date' => $startDate,
                'end_date' => $contractEndDate,
                'move_in_date' => $moveInDate,
                'move_out_date' => $moveOutDate,
            ];
        }

        /*
        |--------------------------------------------------------------------------
        | CANCELLED
        |--------------------------------------------------------------------------
        */

        $startDate = Carbon::now()
            ->addDays(rand(7, 30))
            ->startOfDay();

        $endDate = $startDate
            ->copy()
            ->addMonths($durationMonths);

        return [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'move_in_date' => null,
            'move_out_date' => null,
        ];
    }

    /**
     * Generate a unique tenancy number.
     */
    private function generateTenancyNumber(): string
    {
        do {
            $number = 'TEN-' . strtoupper(
                Str::random(8)
            );
        } while (
            Tenancy::withTrashed()
                ->where(
                    'tenancy_number',
                    $number
                )
                ->exists()
        );

        return $number;
    }

    /**
     * Get a human-readable unit type label.
     */
    private function getUnitTypeLabel(?string $type): string
    {
        if (!$type) {
            return '—';
        }

        /*
        |--------------------------------------------------------------------------
        | UNIT MODEL LABEL
        |--------------------------------------------------------------------------
        */

        $unitTypeLabels = [
            'bedsitter' => 'Bedsitter',
            'studio' => 'Studio',
            'single_room' => 'Single Room',
            'double_room' => 'Double Room',
            'one_bedroom' => 'One Bedroom',
            'two_bedroom' => 'Two Bedroom',
            'three_bedroom' => 'Three Bedroom',
            'penthouse' => 'Penthouse',
            'office' => 'Office',
            'shop' => 'Shop',
            'warehouse' => 'Warehouse',
            'villa' => 'Villa',
            'airbnb' => 'Airbnb',
        ];

        return $unitTypeLabels[$type]
            ?? Str::headline($type);
    }
}