<?php

namespace Database\Seeders;

use App\Models\Lease;
use App\Models\Tenancy;
use Illuminate\Database\Seeder;

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
     * This seeder intentionally does not create duplicate:
     *
     * - Tenants
     * - Users
     * - Properties
     * - Apartments
     * - Units
     * - Tenancies
     *
     * It only creates or updates leases for existing tenancies.
     *
     * ==========================================================================
     * LEASE LIFECYCLE TEST DATA
     * ==========================================================================
     *
     * The dataset intentionally includes:
     *
     * 1. Active fixed-term lease
     * 2. Already-ended ACTIVE lease
     * 3. Active month-to-month lease
     * 4. Pending renewal lease
     * 5. Draft short-term lease
     *
     * Lease #2 is intentionally seeded as:
     *
     *     status    = active
     *     end_date  = 2026-08-31
     *
     * This allows the expiration service to transition:
     *
     *     active -> expired
     *
     * through:
     *
     *     POST /api/leases/expire-ended
     *
     * After expiration:
     *
     *     status        = expired
     *     is_expired    = true
     *     has_ended     = true
     *     should_expire = false
     *
     * ==========================================================================
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Find Existing Tenancies
        |--------------------------------------------------------------------------
        |
        | A lease must always belong to an existing tenancy.
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
        | Lease Definitions
        |--------------------------------------------------------------------------
        |
        | Each item is assigned to the tenancy at the same array index.
        |
        */
        $leaseData = [

            /*
            |--------------------------------------------------------------------------
            | Lease 1 — Active Fixed-Term Lease
            |--------------------------------------------------------------------------
            |
            | Normal active lease whose expiration is still in the future.
            |
            */
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

            /*
            |--------------------------------------------------------------------------
            | Lease 2 — Expiration Test Lease
            |--------------------------------------------------------------------------
            |
            | IMPORTANT:
            |
            | This lease is deliberately ACTIVE even though its end date has
            | already passed.
            |
            | This allows the expiration service to detect and transition it:
            |
            |     active -> expired
            |
            | Do NOT change the status below to STATUS_EXPIRED.
            |
            */
            [
                'lease_type' => Lease::TYPE_FIXED_TERM,

                'start_date' => '2026-03-01',
                'end_date' => '2026-08-31',

                'rent_amount' => 45000.00,
                'deposit_amount' => 45000.00,
                'service_charge' => 3500.00,
                'late_fee' => 2500.00,

                'payment_frequency' => 'monthly',
                'due_day' => 5,
                'notice_period_days' => 30,

                /*
                 * Intentionally ACTIVE.
                 */
                'status' => Lease::STATUS_ACTIVE,

                'signed_at' => '2026-02-20 14:30:00',

                'terminated_at' => null,
                'termination_reason' => null,

                'document_path' => null,

                'notes' => 'Ended fixed-term lease intentionally seeded as active to test automatic expiration.',
            ],

            /*
            |--------------------------------------------------------------------------
            | Lease 3 — Month-to-Month
            |--------------------------------------------------------------------------
            |
            | Month-to-month leases do not require a fixed end date.
            |
            */
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

                'notes' => 'Month-to-month residential lease without a fixed expiration date.',
            ],

            /*
            |--------------------------------------------------------------------------
            | Lease 4 — Pending Renewal
            |--------------------------------------------------------------------------
            |
            | A pending lease should not be automatically expired merely because
            | its dates change. Expiration processing only targets ACTIVE leases.
            |
            */
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

            /*
            |--------------------------------------------------------------------------
            | Lease 5 — Draft Short-Term Lease
            |--------------------------------------------------------------------------
            |
            | Draft leases are not included in automatic expiration processing.
            |
            */
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
        | Create Or Update Leases
        |--------------------------------------------------------------------------
        |
        | Only one lease is maintained per seeded tenancy.
        |
        | This makes the seeder safe to run repeatedly.
        |
        */
        foreach ($leaseData as $index => $data) {
            $tenancy = $tenancies->get($index);

            if (!$tenancy) {
                $this->command?->warn(
                    'Not enough tenancies available. Remaining leases were skipped.'
                );

                break;
            }

            /*
            |--------------------------------------------------------------------------
            | Locate Existing Lease
            |--------------------------------------------------------------------------
            |
            | withTrashed() prevents duplicate leases if a previous seeded lease
            | was soft deleted.
            |
            */
            $lease = Lease::withTrashed()
                ->where('tenancy_id', $tenancy->id)
                ->first();

            if ($lease) {
                /*
                |--------------------------------------------------------------------------
                | Restore Soft-Deleted Lease
                |--------------------------------------------------------------------------
                */
                if ($lease->trashed()) {
                    $lease->restore();
                }

                /*
                |--------------------------------------------------------------------------
                | Update Existing Lease
                |--------------------------------------------------------------------------
                */
                $lease->update($data);

                $action = 'updated';
            } else {
                /*
                |--------------------------------------------------------------------------
                | Create New Lease
                |--------------------------------------------------------------------------
                */
                $lease = new Lease();

                $lease->tenancy_id = $tenancy->id;

                foreach ($data as $field => $value) {
                    $lease->{$field} = $value;
                }

                $lease->save();

                $action = 'created';
            }

            /*
            |--------------------------------------------------------------------------
            | Console Output
            |--------------------------------------------------------------------------
            */
            $this->command?->info(
                "Lease {$lease->lease_number} {$action} for tenancy #{$tenancy->id}."
            );

            /*
            |--------------------------------------------------------------------------
            | Identify Expiration Candidate
            |--------------------------------------------------------------------------
            |
            | This is deliberately checked without changing the status.
            |
            */
            if (
                $lease->status === Lease::STATUS_ACTIVE
                && $lease->end_date !== null
                && $lease->end_date->isBefore(today())
            ) {
                $this->command?->warn(
                    "  ↳ {$lease->lease_number} has passed its end date and requires expiration."
                );
            }
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

        /*
        |--------------------------------------------------------------------------
        | Expiration Candidates
        |--------------------------------------------------------------------------
        |
        | This count identifies ACTIVE leases whose end date has already passed.
        |
        | These are the leases that:
        |
        |     POST /api/leases/expire-ended
        |
        | should process.
        |
        */
        $expirationCandidates = Lease::query()
            ->where('status', Lease::STATUS_ACTIVE)
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', today())
            ->count();

        $this->command?->newLine();

        $this->command?->info(
            "Active leases requiring expiration: {$expirationCandidates}"
        );

        if ($expirationCandidates > 0) {
            $this->command?->info(
                'Expiration lifecycle test is ready.'
            );

            $this->command?->info(
                'Run: POST /api/leases/expire-ended'
            );
        } else {
            $this->command?->warn(
                'No active leases currently require expiration.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Expired Lease Summary
        |--------------------------------------------------------------------------
        |
        | This shows leases that have already completed the expiration lifecycle.
        |
        */
        $expiredCount = Lease::query()
            ->where('status', Lease::STATUS_EXPIRED)
            ->count();

        $this->command?->info(
            "Already expired leases: {$expiredCount}"
        );
    }
}