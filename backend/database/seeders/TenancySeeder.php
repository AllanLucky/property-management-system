<?php

namespace Database\Seeders;

use App\Models\Unit;
use App\Models\Tenant;
use App\Models\Tenancy;
use App\Models\Apartment;
use App\Models\Property;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
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
        | CREATE TENANCIES
        |--------------------------------------------------------------------------
        */

        foreach ($templates as $index => $template) {
            /*
            |--------------------------------------------------------------------------
            | Select tenant
            |--------------------------------------------------------------------------
            */

            $tenant = $tenants[$index % $tenants->count()];

            /*
            |--------------------------------------------------------------------------
            | Select property
            |--------------------------------------------------------------------------
            */

            $property = $properties[$index % $properties->count()];

            /*
            |--------------------------------------------------------------------------
            | Find units belonging to property
            |--------------------------------------------------------------------------
            */

            $propertyUnits = $units->where(
                'property_id',
                $property->id
            );

            if ($propertyUnits->isEmpty()) {
                /*
                | Fall back to any available unit.
                */
                $unit = $units[$index % $units->count()];
            } else {
                $unit = $propertyUnits->random();
            }

            /*
            |--------------------------------------------------------------------------
            | Apartment
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
            | Dates
            |--------------------------------------------------------------------------
            */

            if ($template['status'] === Tenancy::STATUS_ACTIVE) {
                /*
                | Current active tenancy.
                */
                $startDate = Carbon::now()
                    ->subMonths(rand(1, 10))
                    ->startOfDay();

                $endDate = $startDate
                    ->copy()
                    ->addMonths(
                        $template['duration_months']
                    );

                $moveInDate = $startDate
                    ->copy()
                    ->addDays(rand(0, 5));

                $moveOutDate = null;
            } elseif ($template['status'] === Tenancy::STATUS_PENDING) {
                /*
                | Future tenancy.
                */
                $startDate = Carbon::now()
                    ->addDays(rand(7, 30))
                    ->startOfDay();

                $endDate = $startDate
                    ->copy()
                    ->addMonths(
                        $template['duration_months']
                    );

                $moveInDate = null;

                $moveOutDate = null;
            } elseif ($template['status'] === Tenancy::STATUS_EXPIRED) {
                /*
                | Historical expired tenancy.
                */
                $endDate = Carbon::now()
                    ->subDays(rand(30, 365))
                    ->startOfDay();

                $startDate = $endDate
                    ->copy()
                    ->subMonths(
                        $template['duration_months']
                    );

                $moveInDate = $startDate
                    ->copy()
                    ->addDays(rand(0, 5));

                $moveOutDate = $endDate
                    ->copy()
                    ->addDays(rand(0, 3));
            } elseif (
                $template['status'] === Tenancy::STATUS_TERMINATED
            ) {
                /*
                | Historical terminated tenancy.
                */
                $startDate = Carbon::now()
                    ->subMonths(rand(6, 18))
                    ->startOfDay();

                $endDate = $startDate
                    ->copy()
                    ->addMonths(
                        $template['duration_months']
                    );

                $moveInDate = $startDate
                    ->copy()
                    ->addDays(rand(0, 5));

                $moveOutDate = Carbon::now()
                    ->subDays(rand(30, 180))
                    ->startOfDay();

                /*
                | Make sure move-out occurs after move-in.
                */
                if ($moveOutDate->lessThanOrEqualTo($moveInDate)) {
                    $moveOutDate = $moveInDate
                        ->copy()
                        ->addMonths(3);
                }
            } else {
                /*
                | Cancelled tenancy.
                */
                $startDate = Carbon::now()
                    ->addDays(rand(7, 30))
                    ->startOfDay();

                $endDate = $startDate
                    ->copy()
                    ->addMonths(
                        $template['duration_months']
                    );

                $moveInDate = null;

                $moveOutDate = null;
            }

            /*
            |--------------------------------------------------------------------------
            | Agreement file
            |--------------------------------------------------------------------------
            */

            $agreementFile = null;

            $agreementPublicId = null;

            /*
            |--------------------------------------------------------------------------
            | Active flag
            |--------------------------------------------------------------------------
            */

            $isActive =
                $template['status'] === Tenancy::STATUS_ACTIVE;

            /*
            |--------------------------------------------------------------------------
            | Create tenancy
            |--------------------------------------------------------------------------
            */

            Tenancy::create([
                /*
                |--------------------------------------------------------------------------
                | Relationships
                |--------------------------------------------------------------------------
                */

                'property_id' => $property->id,

                'apartment_id' => $apartment?->id,

                'unit_id' => $unit->id,

                'tenant_id' => $tenant->id,

                /*
                |--------------------------------------------------------------------------
                | Identification
                |--------------------------------------------------------------------------
                */

                'tenancy_number' =>
                    'TEN-' .
                    strtoupper(
                        Str::random(8)
                    ),

                /*
                |--------------------------------------------------------------------------
                | Dates
                |--------------------------------------------------------------------------
                */

                'start_date' => $startDate,

                'end_date' => $endDate,

                'move_in_date' => $moveInDate,

                'move_out_date' => $moveOutDate,

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

                'late_fee' =>
                    $template['late_fee'],

                /*
                |--------------------------------------------------------------------------
                | Payment terms
                |--------------------------------------------------------------------------
                */

                'payment_frequency' =>
                    $template['payment_frequency'],

                'due_day' =>
                    $template['due_day'],

                /*
                |--------------------------------------------------------------------------
                | Status
                |--------------------------------------------------------------------------
                */

                'status' =>
                    $template['status'],

                /*
                |--------------------------------------------------------------------------
                | Agreement
                |--------------------------------------------------------------------------
                */

                'agreement_file' =>
                    $agreementFile,

                'agreement_public_id' =>
                    $agreementPublicId,

                /*
                |--------------------------------------------------------------------------
                | Notes
                |--------------------------------------------------------------------------
                */

                'notes' =>
                    $template['notes'],

                /*
                |--------------------------------------------------------------------------
                | Active flag
                |--------------------------------------------------------------------------
                */

                'is_active' =>
                    $isActive,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | SUCCESS MESSAGE
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            count($templates) .
            ' tenancy records seeded successfully.'
        );
    }
}
