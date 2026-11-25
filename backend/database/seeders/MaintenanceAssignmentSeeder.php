<?php

namespace Database\Seeders;

use App\Models\MaintenanceAssignment;
use App\Models\MaintenanceRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MaintenanceAssignmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Load Maintenance Requests
        |--------------------------------------------------------------------------
        */

        $requests = MaintenanceRequest::query()
            ->orderBy('id')
            ->get();

        if ($requests->isEmpty()) {
            $this->command->warn(
                'No maintenance requests found. Run MaintenanceRequestSeeder first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Load Active and Approved Technicians
        |--------------------------------------------------------------------------
        */

        $technicians = User::role('technician', 'web')
            ->where('account_status', 'active')
            ->where('approval_status', 'approved')
            ->orderBy('id')
            ->pluck('id')
            ->values();

        if ($technicians->isEmpty()) {
            $this->command->warn(
                'No active and approved users with the technician role were found.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Load Assigners
        |--------------------------------------------------------------------------
        */

        $assigners = User::query()
            ->orderBy('id')
            ->pluck('id')
            ->values();

        if ($assigners->isEmpty()) {
            $this->command->warn(
                'No users found to assign maintenance requests.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Read Allowed Assignment Statuses
        |--------------------------------------------------------------------------
        */

        $statusColumn = DB::selectOne(
            "SHOW COLUMNS FROM maintenance_assignments LIKE 'status'"
        );

        if (!$statusColumn || empty($statusColumn->Type)) {
            $this->command->error(
                'Unable to determine maintenance assignment status values.'
            );

            return;
        }

        if (preg_match('/^enum\((.*)\)$/i', $statusColumn->Type, $matches)) {
            $allowedStatuses = array_map(
                fn ($value) => trim($value),
                str_getcsv($matches[1], ',', "'")
            );
        } else {
            $allowedStatuses = [
                MaintenanceAssignment::STATUS_PENDING,
                MaintenanceAssignment::STATUS_ACCEPTED,
                MaintenanceAssignment::STATUS_REJECTED,
                MaintenanceAssignment::STATUS_IN_PROGRESS,
                MaintenanceAssignment::STATUS_ON_HOLD,
                MaintenanceAssignment::STATUS_COMPLETED,
                MaintenanceAssignment::STATUS_CANCELLED,
            ];
        }

        $this->command->info(
            'Allowed assignment statuses: ' . implode(', ', $allowedStatuses)
        );

        /*
        |--------------------------------------------------------------------------
        | Maintenance Request to Assignment Status Mapping
        |--------------------------------------------------------------------------
        */

        $statusMapping = [
            MaintenanceRequest::STATUS_PENDING =>
                MaintenanceAssignment::STATUS_PENDING,

            MaintenanceRequest::STATUS_APPROVED =>
                MaintenanceAssignment::STATUS_ACCEPTED,

            MaintenanceRequest::STATUS_ASSIGNED =>
                MaintenanceAssignment::STATUS_ACCEPTED,

            MaintenanceRequest::STATUS_IN_PROGRESS =>
                MaintenanceAssignment::STATUS_IN_PROGRESS,

            MaintenanceRequest::STATUS_ON_HOLD =>
                MaintenanceAssignment::STATUS_ON_HOLD,

            MaintenanceRequest::STATUS_COMPLETED =>
                MaintenanceAssignment::STATUS_COMPLETED,

            MaintenanceRequest::STATUS_REJECTED =>
                MaintenanceAssignment::STATUS_REJECTED,

            MaintenanceRequest::STATUS_CANCELLED =>
                MaintenanceAssignment::STATUS_CANCELLED,
        ];

        /*
        |--------------------------------------------------------------------------
        | Assignment Scenario Data
        |--------------------------------------------------------------------------
        |
        | actual_cost:
        | - null = Actual expenditure has not been recorded.
        | - 0    = Actual expenditure was recorded as zero.
        | - > 0  = Actual expenditure has been recorded.
        |
        */

        $scenarios = [

            /*
            |--------------------------------------------------------------------------
            | Pending
            |--------------------------------------------------------------------------
            */

            MaintenanceAssignment::STATUS_PENDING => [
                'days_ago' => 1,
                'accepted_days' => null,
                'rejected_days' => null,
                'scheduled_days' => 3,
                'schedule_future' => true,
                'started_days' => null,
                'completed_days' => null,
                'cancelled_days' => null,

                'estimated_hours' => 4,
                'actual_hours' => null,

                'estimated_cost' => 3000,
                'actual_cost' => null,

                'rejection_reason' => null,
                'cancellation_reason' => null,

                'work_notes' => 'Awaiting technician acceptance.',
            ],

            /*
            |--------------------------------------------------------------------------
            | Accepted
            |--------------------------------------------------------------------------
            */

            MaintenanceAssignment::STATUS_ACCEPTED => [
                'days_ago' => 2,
                'accepted_days' => 1,
                'rejected_days' => null,
                'scheduled_days' => 1,
                'schedule_future' => true,
                'started_days' => null,
                'completed_days' => null,
                'cancelled_days' => null,

                'estimated_hours' => 3,
                'actual_hours' => null,

                'estimated_cost' => 4500,
                'actual_cost' => null,

                'rejection_reason' => null,
                'cancellation_reason' => null,

                'work_notes' => 'Technician accepted the assignment.',
            ],

            /*
            |--------------------------------------------------------------------------
            | Rejected
            |--------------------------------------------------------------------------
            */

            MaintenanceAssignment::STATUS_REJECTED => [
                'days_ago' => 4,
                'accepted_days' => null,
                'rejected_days' => 3,
                'scheduled_days' => null,
                'schedule_future' => false,
                'started_days' => null,
                'completed_days' => null,
                'cancelled_days' => null,

                'estimated_hours' => 2,
                'actual_hours' => null,

                'estimated_cost' => 2500,
                'actual_cost' => null,

                'rejection_reason' =>
                    'Technician unavailable due to another scheduled job.',

                'cancellation_reason' => null,

                'work_notes' => 'Assignment rejected by technician.',
            ],

            /*
            |--------------------------------------------------------------------------
            | In Progress
            |--------------------------------------------------------------------------
            */

            MaintenanceAssignment::STATUS_IN_PROGRESS => [
                'days_ago' => 5,
                'accepted_days' => 4,
                'rejected_days' => null,
                'scheduled_days' => 3,
                'schedule_future' => false,
                'started_days' => 2,
                'completed_days' => null,
                'cancelled_days' => null,

                'estimated_hours' => 6,
                'actual_hours' => 3,

                'estimated_cost' => 8000,
                'actual_cost' => 3500,

                'rejection_reason' => null,
                'cancellation_reason' => null,

                'work_notes' =>
                    'Inspection completed. Repair work is ongoing.',
            ],

            /*
            |--------------------------------------------------------------------------
            | On Hold
            |--------------------------------------------------------------------------
            */

            MaintenanceAssignment::STATUS_ON_HOLD => [
                'days_ago' => 6,
                'accepted_days' => 5,
                'rejected_days' => null,
                'scheduled_days' => 4,
                'schedule_future' => false,
                'started_days' => 3,
                'completed_days' => null,
                'cancelled_days' => null,

                'estimated_hours' => 5,
                'actual_hours' => 2,

                'estimated_cost' => 6000,
                'actual_cost' => 2000,

                'rejection_reason' => null,
                'cancellation_reason' => null,

                'work_notes' =>
                    'Work temporarily on hold pending spare parts.',
            ],

            /*
            |--------------------------------------------------------------------------
            | Completed
            |--------------------------------------------------------------------------
            */

            MaintenanceAssignment::STATUS_COMPLETED => [
                'days_ago' => 10,
                'accepted_days' => 9,
                'rejected_days' => null,
                'scheduled_days' => 8,
                'schedule_future' => false,
                'started_days' => 7,
                'completed_days' => 5,
                'cancelled_days' => null,

                'estimated_hours' => 4,
                'actual_hours' => 5,

                'estimated_cost' => 7000,
                'actual_cost' => 6500,

                'rejection_reason' => null,
                'cancellation_reason' => null,

                'work_notes' =>
                    'All maintenance work completed and inspected successfully.',
            ],

            /*
            |--------------------------------------------------------------------------
            | Cancelled
            |--------------------------------------------------------------------------
            */

            MaintenanceAssignment::STATUS_CANCELLED => [
                'days_ago' => 8,
                'accepted_days' => 7,
                'rejected_days' => null,
                'scheduled_days' => 6,
                'schedule_future' => false,
                'started_days' => null,
                'completed_days' => null,
                'cancelled_days' => 5,

                'estimated_hours' => 3,
                'actual_hours' => null,

                'estimated_cost' => 3500,
                'actual_cost' => null,

                'rejection_reason' => null,

                'cancellation_reason' =>
                    'Maintenance request cancelled by property management.',

                'work_notes' =>
                    'Assignment cancelled before work commenced.',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Keep Only Supported Scenarios
        |--------------------------------------------------------------------------
        */

        $scenarios = array_filter(
            $scenarios,
            fn ($scenario, $status) => in_array(
                $status,
                $allowedStatuses,
                true
            ),
            ARRAY_FILTER_USE_BOTH
        );

        if (empty($scenarios)) {
            $this->command->error(
                'No assignment scenarios match the database status values.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Create or Update Seeded Assignments
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use (
            $requests,
            $technicians,
            $assigners,
            $statusMapping,
            $scenarios
        ) {
            $created = 0;
            $updated = 0;
            $skipped = 0;

            $now = now();

            foreach ($requests as $index => $request) {

                /*
                |--------------------------------------------------------------------------
                | Determine Assignment Status
                |--------------------------------------------------------------------------
                */

                $requestStatus = $request->status;

                $assignmentStatus = $statusMapping[$requestStatus] ?? null;

                if (
                    !$assignmentStatus ||
                    !isset($scenarios[$assignmentStatus])
                ) {
                    $this->command->warn(
                        "Skipped request {$request->id}: unsupported request status {$requestStatus}."
                    );

                    $skipped++;

                    continue;
                }

                $scenario = $scenarios[$assignmentStatus];

                /*
                |--------------------------------------------------------------------------
                | Select Technician
                |--------------------------------------------------------------------------
                */

                // Prefer technician ID 4 for request 3, if available.
                $technicianId = (
                    (int) $request->id === 3 &&
                    $technicians->contains(4)
                )
                    ? 4
                    : $technicians[$index % $technicians->count()];

                /*
                |--------------------------------------------------------------------------
                | Select Assigner
                |--------------------------------------------------------------------------
                */

                $assignerId = $request->assigned_by
                    && $assigners->contains($request->assigned_by)
                        ? $request->assigned_by
                        : $assigners[$index % $assigners->count()];

                /*
                |--------------------------------------------------------------------------
                | Assignment Dates
                |--------------------------------------------------------------------------
                */

                $assignedAt = $now->copy()->subDays(
                    $scenario['days_ago']
                );

                $acceptedAt = $scenario['accepted_days'] !== null
                    ? $now->copy()->subDays($scenario['accepted_days'])
                    : null;

                $rejectedAt = $scenario['rejected_days'] !== null
                    ? $now->copy()->subDays($scenario['rejected_days'])
                    : null;

                $scheduledAt = null;

                if ($scenario['scheduled_days'] !== null) {
                    $scheduledAt = $scenario['schedule_future']
                        ? $now->copy()->addDays($scenario['scheduled_days'])
                        : $now->copy()->subDays($scenario['scheduled_days']);
                }

                $startedAt = $scenario['started_days'] !== null
                    ? $now->copy()->subDays($scenario['started_days'])
                    : null;

                $completedAt = $scenario['completed_days'] !== null
                    ? $now->copy()->subDays($scenario['completed_days'])
                    : null;

                $cancelledAt = $scenario['cancelled_days'] !== null
                    ? $now->copy()->subDays($scenario['cancelled_days'])
                    : null;

                /*
                |--------------------------------------------------------------------------
                | Seeder Marker
                |--------------------------------------------------------------------------
                */

                $marker = "[SEED:maintenance-assignment:request-{$request->id}]";

                $workNotes = $marker . ' ' . $scenario['work_notes'];

                /*
                |--------------------------------------------------------------------------
                | Prepare Assignment Data
                |--------------------------------------------------------------------------
                */

                $assignmentData = [
                    'maintenance_request_id' => $request->id,

                    'technician_id' => $technicianId,

                    'assigned_by' => $assignerId,

                    'status' => $assignmentStatus,

                    'assigned_at' => $assignedAt,
                    'accepted_at' => $acceptedAt,
                    'rejected_at' => $rejectedAt,
                    'scheduled_at' => $scheduledAt,
                    'started_at' => $startedAt,
                    'completed_at' => $completedAt,
                    'cancelled_at' => $cancelledAt,

                    'rejection_reason' => $scenario['rejection_reason'],
                    'cancellation_reason' => $scenario['cancellation_reason'],

                    'work_notes' => $workNotes,

                    'estimated_hours' => $scenario['estimated_hours'],
                    'actual_hours' => $scenario['actual_hours'],

                    'estimated_cost' => $scenario['estimated_cost'],
                    'actual_cost' => $scenario['actual_cost'],
                ];

                /*
                |--------------------------------------------------------------------------
                | Find Existing Seeder Assignment
                |--------------------------------------------------------------------------
                */

                $existingAssignment = MaintenanceAssignment::query()
                    ->where('maintenance_request_id', $request->id)
                    ->where('technician_id', $technicianId)
                    ->where('work_notes', 'like', $marker . '%')
                    ->first();

                if ($existingAssignment) {
                    $existingAssignment->update($assignmentData);

                    $updated++;
                } else {
                    MaintenanceAssignment::create($assignmentData);

                    $created++;
                }

                /*
                |--------------------------------------------------------------------------
                | Request 3 Debug Information
                |--------------------------------------------------------------------------
                */

                if ((int) $request->id === 3) {
                    $this->command->info(
                        "Request 3 seeded with technician ID {$technicianId} and assignment status {$assignmentStatus}."
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Seeder Summary
            |--------------------------------------------------------------------------
            */

            $this->command->newLine();

            $this->command->info(
                "{$created} maintenance assignments created successfully."
            );

            $this->command->info(
                "{$updated} seeded maintenance assignments updated successfully."
            );

            $this->command->info(
                "{$skipped} maintenance assignments skipped."
            );

            $this->command->info(
                'Total processed: ' . ($created + $updated + $skipped)
            );
        });
    }
}
