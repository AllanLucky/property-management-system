<?php

namespace Database\Seeders;

use App\Models\Lease;
use App\Models\Tenancy;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class LeaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * ==========================================================================
     * LEASE SEEDER
     * ==========================================================================
     *
     * Lease records are attached to existing tenancy records.
     *
     * Architecture:
     *
     * Tenant
     *    └── Tenancy
     *          └── Lease
     *
     * This seeder intentionally does not create duplicate tenants, properties,
     * apartments, units, or tenancies.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Find Existing Tenancies
        |--------------------------------------------------------------------------
        |
        | Leases must always belong to an existing tenancy.
        |
        */
        $tenancies = Tenancy::query()
            ->orderBy('id')
            ->get();

        if ($tenancies->isEmpty()) {
            $this->command?->warn(
                'No tenancies found. Lease seeding skipped.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Seed Lease Data
        |--------------------------------------------------------------------------
        |
        | The data below is intentionally based on tenancy IDs rather than
        | hard-coded tenant/property/apartment/unit IDs.
        |
        */
        $leaseData = [
            [
                'lease_type' => Lease::TYPE_FIXED_TERM,
                'start_date' => '2026-01-01',
                'end_date' => '2026-12-31',
                'rent_amount' => 60000.00,
                'deposit_amount' => 60000.00,
                'service_charge' => 5000.00,
                'late_fee' => 3500.00,
                'payment_frequency' => 'monthly',
                'due_day' => 1,
                'notice_period_days' => 30,
                'status' => Lease::STATUS_ACTIVE,
                'signed_at' => '2025-12-20 10:00:00',
                'terminated_at' => null,
                'termination_reason' => null,
                'document_path' => null,
                'notes' => 'Standard fixed-term residential lease.',
            ],

            [
                'lease_type' => Lease::TYPE_FIXED_TERM,
                'start_date' => '2026-03-01',
                'end_date' => '2027-02-28',
                'rent_amount' => 45000.00,
                'deposit_amount' => 45000.00,
                'service_charge' => 3500.00,
                'late_fee' => 2500.00,
                'payment_frequency' => 'monthly',
                'due_day' => 5,
                'notice_period_days' => 30,
                'status' => Lease::STATUS_ACTIVE,
                'signed_at' => '2026-02-20 14:30:00',
                'terminated_at' => null,
                'termination_reason' => null,
                'document_path' => null,
                'notes' => 'Residential fixed-term lease.',
            ],

            [
                'lease_type' => Lease::TYPE_MONTH_TO_MONTH,
                'start_date' => '2026-06-01',
                'end_date' => null,
                'rent_amount' => 35000.00,
                'deposit_amount' => 35000.00,
                'service_charge' => 2500.00,
                'late_fee' => 2000.00,
                'payment_frequency' => 'monthly',
                'due_day' => 1,
                'notice_period_days' => 30,
                'status' => Lease::STATUS_ACTIVE,
                'signed_at' => '2026-05-25 09:00:00',
                'terminated_at' => null,
                'termination_reason' => null,
                'document_path' => null,
                'notes' => 'Month-to-month residential lease.',
            ],

            [
                'lease_type' => Lease::TYPE_RENEWAL,
                'start_date' => '2026-07-01',
                'end_date' => '2027-06-30',
                'rent_amount' => 75000.00,
                'deposit_amount' => 75000.00,
                'service_charge' => 6000.00,
                'late_fee' => 4000.00,
                'payment_frequency' => 'monthly',
                'due_day' => 1,
                'notice_period_days' => 60,
                'status' => Lease::STATUS_PENDING,
                'signed_at' => null,
                'terminated_at' => null,
                'termination_reason' => null,
                'document_path' => null,
                'notes' => 'Lease renewal awaiting final execution.',
            ],

            [
                'lease_type' => Lease::TYPE_SHORT_TERM,
                'start_date' => '2026-09-01',
                'end_date' => '2026-11-30',
                'rent_amount' => 90000.00,
                'deposit_amount' => 90000.00,
                'service_charge' => 7000.00,
                'late_fee' => 5000.00,
                'payment_frequency' => 'monthly',
                'due_day' => 1,
                'notice_period_days' => 14,
                'status' => Lease::STATUS_DRAFT,
                'signed_at' => null,
                'terminated_at' => null,
                'termination_reason' => null,
                'document_path' => null,
                'notes' => 'Short-term lease prepared for review.',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Create Leases
        |--------------------------------------------------------------------------
        |
        | Do not create more leases than there are tenancies.
        |
        */
        foreach ($leaseData as $index => $data) {
            $tenancy = $tenancies->get($index);

            if (!$tenancy) {
                break;
            }

            /*
            |--------------------------------------------------------------------------
            | Prevent Duplicate Lease For The Same Tenancy
            |--------------------------------------------------------------------------
            |
            | This makes the seeder safe to run repeatedly.
            |
            */
            $lease = Lease::withTrashed()
                ->where('tenancy_id', $tenancy->id)
                ->first();

            if ($lease) {
                if ($lease->trashed()) {
                    $lease->restore();
                }

                $lease->update($data);
            } else {
                $lease = new Lease();

                $lease->tenancy_id = $tenancy->id;

                foreach ($data as $field => $value) {
                    $lease->{$field} = $value;
                }

                $lease->save();
            }

            $this->command?->info(
                "Lease {$lease->lease_number} seeded for tenancy #{$tenancy->id}."
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Summary
        |--------------------------------------------------------------------------
        */
        $this->command?->newLine();

        $this->command?->info(
            'Lease seeding completed successfully.'
        );

        $this->command?->info(
            'Total leases: ' . Lease::count()
        );
    }
}