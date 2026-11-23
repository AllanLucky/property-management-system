<?php

namespace Database\Seeders;

use App\Models\MaintenanceAssignment;
use App\Models\MaintenanceExpense;
use App\Models\MaintenanceRequest;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MaintenanceRequestSeeder extends Seeder
{
    /**
     * Seed maintenance requests using actual tenancy relationships.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Load Existing Dependencies
        |--------------------------------------------------------------------------
        */

        $propertyIds = DB::table('properties')
            ->pluck('id')
            ->toArray();

        $apartmentIds = DB::table('apartments')
            ->get()
            ->keyBy('id');

        $unitIds = DB::table('units')
            ->get()
            ->keyBy('id');

        $categoryIds = DB::table('maintenance_categories')
            ->pluck('id')
            ->toArray();

        $userIds = DB::table('users')
            ->pluck('id')
            ->toArray();

        /*
        |--------------------------------------------------------------------------
        | Validate Dependencies
        |--------------------------------------------------------------------------
        */

        if (empty($propertyIds)) {
            $this->command->warn(
                'No properties found. Maintenance requests were not seeded.'
            );

            return;
        }

        if (empty($userIds)) {
            $this->command->warn(
                'No users found. Maintenance requests were not seeded.'
            );

            return;
        }

        if (!Schema::hasTable('tenancies')) {
            $this->command->error(
                'Tenancies table does not exist.'
            );

            return;
        }

        if (!Schema::hasTable('tenants')) {
            $this->command->error(
                'Tenants table does not exist.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Load Tenancies
        |--------------------------------------------------------------------------
        */

        $tenancyColumns = Schema::getColumnListing('tenancies');

        if (
            !in_array('tenant_id', $tenancyColumns, true) ||
            !in_array('unit_id', $tenancyColumns, true)
        ) {
            $this->command->error(
                'Tenancies table must contain tenant_id and unit_id columns.'
            );

            return;
        }

        $tenancies = DB::table('tenancies')
            ->whereNotNull('tenant_id')
            ->whereNotNull('unit_id')
            ->get();

        /*
        |--------------------------------------------------------------------------
        | Resolve Valid Tenancy Relationships
        |--------------------------------------------------------------------------
        */

        $validTenancies = collect();

        foreach ($tenancies as $tenancy) {
            $unit = $unitIds->get($tenancy->unit_id);

            if (!$unit) {
                continue;
            }

            // Resolve apartment from tenancy or unit.
            $apartmentId = (
                in_array('apartment_id', $tenancyColumns, true) &&
                !empty($tenancy->apartment_id)
            )
                ? $tenancy->apartment_id
                : $unit->apartment_id;

            $apartment = $apartmentIds->get($apartmentId);

            if (!$apartment) {
                continue;
            }

            // Resolve property from tenancy or apartment.
            $propertyId = (
                in_array('property_id', $tenancyColumns, true) &&
                !empty($tenancy->property_id)
            )
                ? $tenancy->property_id
                : $apartment->property_id;

            // Validate the complete relationship hierarchy.
            if (
                (int) $unit->apartment_id !== (int) $apartmentId ||
                (int) $apartment->property_id !== (int) $propertyId
            ) {
                continue;
            }

            if (!in_array($propertyId, $propertyIds)) {
                continue;
            }

            // Validate tenant exists.
            $tenantExists = DB::table('tenants')
                ->where('id', $tenancy->tenant_id)
                ->exists();

            if (!$tenantExists) {
                continue;
            }

            $validTenancies->push([
                'tenant_id' => $tenancy->tenant_id,
                'property_id' => $propertyId,
                'apartment_id' => $apartmentId,
                'unit_id' => $unit->id,
            ]);
        }

        if ($validTenancies->isEmpty()) {
            $this->command->warn(
                'No valid tenant-unit tenancies found. '
                . 'Please seed tenants, apartments, units and tenancies first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Sample Maintenance Requests
        |--------------------------------------------------------------------------
        */

        $requests = [
            [
                'title' => 'Water leakage in bathroom',
                'description' => 'Water is leaking from the bathroom plumbing system and requires urgent inspection.',
                'priority' => 'high',
                'status' => 'pending',
                'is_emergency' => false,
                'days_ago' => 1,
                'estimated_cost' => 5000,
            ],
            [
                'title' => 'Electrical wiring problem',
                'description' => 'Electrical sockets are not functioning properly. An electrician is required.',
                'priority' => 'urgent',
                'status' => 'approved',
                'is_emergency' => true,
                'days_ago' => 2,
                'estimated_cost' => 8500,
            ],
            [
                'title' => 'Broken kitchen cabinet',
                'description' => 'The kitchen cabinet door is broken and needs repair.',
                'priority' => 'low',
                'status' => 'assigned',
                'is_emergency' => false,
                'days_ago' => 3,
                'estimated_cost' => 3000,
            ],
            [
                'title' => 'Air conditioning not working',
                'description' => 'The air conditioning system is not cooling properly.',
                'priority' => 'medium',
                'status' => 'in_progress',
                'is_emergency' => false,
                'days_ago' => 4,
                'estimated_cost' => 12000,
            ],
            [
                'title' => 'Damaged water pipes',
                'description' => 'A damaged water pipe requires replacement.',
                'priority' => 'high',
                'status' => 'completed',
                'is_emergency' => false,
                'days_ago' => 8,
                'estimated_cost' => 10000,
            ],
            [
                'title' => 'Painting required',
                'description' => 'Interior wall painting is required due to peeling paint.',
                'priority' => 'low',
                'status' => 'on_hold',
                'is_emergency' => false,
                'days_ago' => 5,
                'estimated_cost' => 15000,
            ],
            [
                'title' => 'Broken main entrance lock',
                'description' => 'The main entrance door lock is damaged and requires replacement.',
                'priority' => 'urgent',
                'status' => 'rejected',
                'is_emergency' => true,
                'days_ago' => 6,
                'estimated_cost' => 2500,
            ],
            [
                'title' => 'Roof drainage blockage',
                'description' => 'The roof drainage system is blocked and needs cleaning.',
                'priority' => 'medium',
                'status' => 'cancelled',
                'is_emergency' => false,
                'days_ago' => 7,
                'estimated_cost' => 4000,
            ],
            [
                'title' => 'Damaged floor tiles',
                'description' => 'Several floor tiles are damaged and need replacement.',
                'priority' => 'medium',
                'status' => 'approved',
                'is_emergency' => false,
                'days_ago' => 2,
                'estimated_cost' => 7000,
            ],
            [
                'title' => 'Common area lighting repair',
                'description' => 'Lighting fixtures in the common area need inspection and repair.',
                'priority' => 'high',
                'status' => 'pending',
                'is_emergency' => false,
                'days_ago' => 1,
                'estimated_cost' => 6000,
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Create Maintenance Requests
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use (
            $requests,
            $validTenancies,
            $categoryIds,
            $userIds
        ) {
            foreach ($requests as $index => $request) {

                // Select a real tenancy instead of independently selecting IDs.
                $tenancy = $validTenancies[$index % $validTenancies->count()];

                $tenantId = $tenancy['tenant_id'];
                $propertyId = $tenancy['property_id'];
                $apartmentId = $tenancy['apartment_id'];
                $unitId = $tenancy['unit_id'];

                $categoryId = !empty($categoryIds)
                    ? $categoryIds[$index % count($categoryIds)]
                    : null;

                $reportedBy = $userIds[$index % count($userIds)];

                $reportedAt = now()->subDays($request['days_ago']);

                /*
                |--------------------------------------------------------------------------
                | Status Timestamps
                |--------------------------------------------------------------------------
                */

                $startedAt = in_array($request['status'], [
                    'in_progress',
                    'completed',
                    'on_hold',
                ], true)
                    ? $reportedAt->copy()->addDay()
                    : null;

                $completedAt = $request['status'] === 'completed'
                    ? $reportedAt->copy()->addDays(2)
                    : null;

                $rejectedAt = $request['status'] === 'rejected'
                    ? $reportedAt->copy()->addDay()
                    : null;

                $cancelledAt = $request['status'] === 'cancelled'
                    ? $reportedAt->copy()->addDay()
                    : null;

                /*
                |--------------------------------------------------------------------------
                | Reference
                |--------------------------------------------------------------------------
                */

                $reference = sprintf(
                    'MR-SEED-%04d',
                    $index + 1
                );

                /*
                |--------------------------------------------------------------------------
                | Save Maintenance Request
                |--------------------------------------------------------------------------
                */

                $maintenanceRequest = MaintenanceRequest::updateOrCreate(
                    [
                        'reference' => $reference,
                    ],
                    [
                        'property_id' => $propertyId,
                        'apartment_id' => $apartmentId,
                        'unit_id' => $unitId,
                        'tenant_id' => $tenantId,
                        'category_id' => $categoryId,

                        'title' => $request['title'],
                        'description' => $request['description'],

                        'priority' => $request['priority'],
                        'status' => $request['status'],
                        'is_emergency' => $request['is_emergency'],

                        'reported_by' => $reportedBy,

                        'approved_by' => in_array(
                            $request['status'],
                            [
                                'approved',
                                'assigned',
                                'in_progress',
                                'on_hold',
                                'completed',
                            ],
                            true
                        ) ? $reportedBy : null,

                        'assigned_by' => in_array(
                            $request['status'],
                            [
                                'assigned',
                                'in_progress',
                                'on_hold',
                                'completed',
                            ],
                            true
                        ) ? $reportedBy : null,

                        'scheduled_at' => in_array(
                            $request['status'],
                            [
                                'approved',
                                'assigned',
                                'in_progress',
                                'on_hold',
                                'completed',
                            ],
                            true
                        )
                            ? $reportedAt->copy()->addDays(2)
                            : null,

                        'started_at' => $startedAt,
                        'completed_at' => $completedAt,

                        'rejected_at' => $rejectedAt,
                        'rejection_reason' => $rejectedAt
                            ? 'Request rejected after administrative review.'
                            : null,

                        'cancelled_at' => $cancelledAt,
                        'cancellation_reason' => $cancelledAt
                            ? 'Request cancelled after review.'
                            : null,

                        'completion_notes' => $completedAt
                            ? 'Maintenance work completed successfully.'
                            : null,

                        'estimated_cost' => $request['estimated_cost'],

                        // Non-completed requests must not have a final cost.
                        'total_cost' => 0,
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | Calculate Completed Maintenance Cost
                |--------------------------------------------------------------------------
                |
                | The final cost is calculated from:
                |
                | 1. Actual cost of completed assignments.
                | 2. Approved eligible maintenance expenses.
                |
                | Approved labour expenses linked to assignments are excluded
                | because their cost is already included in assignment actual_cost.
                |
                */

                if ($maintenanceRequest->status === 'completed') {

                    $assignmentCost = $maintenanceRequest
                        ->assignments()
                        ->where(
                            'status',
                            MaintenanceAssignment::STATUS_COMPLETED
                        )
                        ->sum('actual_cost');

                    $expenseCost = $maintenanceRequest
                        ->expenses()
                        ->where(
                            'status',
                            MaintenanceExpense::STATUS_APPROVED
                        )
                        ->where(function ($query) {
                            $query
                                ->where(
                                    'category',
                                    '!=',
                                    MaintenanceExpense::CATEGORY_LABOUR
                                )
                                ->orWhereNull('maintenance_assignment_id');
                        })
                        ->sum('amount');

                    $totalCost = round(
                        (float) $assignmentCost + (float) $expenseCost,
                        2
                    );

                    $maintenanceRequest->update([
                        'total_cost' => $totalCost,
                    ]);
                }
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Completion Message
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            '10 maintenance requests seeded successfully using valid tenant-unit tenancies.'
        );
    }
}
