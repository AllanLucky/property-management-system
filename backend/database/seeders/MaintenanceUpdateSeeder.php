<?php

namespace Database\Seeders;

use App\Models\MaintenanceRequest;
use App\Models\MaintenanceAssignment;
use App\Models\MaintenanceUpdate;
use App\Models\User;
use Illuminate\Database\Seeder;

class MaintenanceUpdateSeeder extends Seeder
{
    /**
     * Seed maintenance request updates.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | LOAD EXISTING RECORDS
        |--------------------------------------------------------------------------
        */

        $requests = MaintenanceRequest::with('assignments')
            ->orderBy('id')
            ->get();

        $users = User::pluck('id')->toArray();

        if ($requests->isEmpty()) {
            $this->command->warn(
                'No maintenance requests found. Run MaintenanceRequestSeeder first.'
            );

            return;
        }

        if (empty($users)) {
            $this->command->warn(
                'No users found. Run UsersSeeder first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE TEMPLATES
        |--------------------------------------------------------------------------
        */

        $updates = [
            [
                'type' => 'created',
                'title' => 'Maintenance request submitted',
                'description' => 'A new maintenance request has been submitted and is awaiting review.',
                'previous_status' => null,
                'new_status' => 'pending',
                'progress_percentage' => 0,
                'is_internal' => false,
                'is_visible_to_tenant' => true,
            ],
            [
                'type' => 'status_changed',
                'title' => 'Maintenance request approved',
                'description' => 'The maintenance request has been reviewed and approved.',
                'previous_status' => 'pending',
                'new_status' => 'approved',
                'progress_percentage' => 10,
                'is_internal' => false,
                'is_visible_to_tenant' => true,
            ],
            [
                'type' => 'assigned',
                'title' => 'Technician assigned',
                'description' => 'A maintenance technician has been assigned to handle this request.',
                'previous_status' => 'approved',
                'new_status' => 'assigned',
                'progress_percentage' => 20,
                'is_internal' => false,
                'is_visible_to_tenant' => true,
            ],
            [
                'type' => 'started',
                'title' => 'Maintenance work started',
                'description' => 'The assigned technician has started working on the reported issue.',
                'previous_status' => 'assigned',
                'new_status' => 'in_progress',
                'progress_percentage' => 40,
                'is_internal' => false,
                'is_visible_to_tenant' => true,
            ],
            [
                'type' => 'progress',
                'title' => 'Maintenance work in progress',
                'description' => 'The technician has completed the initial inspection and is proceeding with the repair.',
                'previous_status' => 'in_progress',
                'new_status' => 'in_progress',
                'progress_percentage' => 70,
                'is_internal' => false,
                'is_visible_to_tenant' => true,
            ],
            [
                'type' => 'completed',
                'title' => 'Maintenance work completed',
                'description' => 'The maintenance work has been completed successfully.',
                'previous_status' => 'in_progress',
                'new_status' => 'completed',
                'progress_percentage' => 100,
                'is_internal' => false,
                'is_visible_to_tenant' => true,
            ],
            [
                'type' => 'note',
                'title' => 'Internal maintenance note',
                'description' => 'Additional technical observations recorded for administrative review.',
                'previous_status' => null,
                'new_status' => null,
                'progress_percentage' => 40,
                'is_internal' => true,
                'is_visible_to_tenant' => false,
            ],
            [
                'type' => 'on_hold',
                'title' => 'Maintenance temporarily on hold',
                'description' => 'Work has been temporarily paused while awaiting the required materials.',
                'previous_status' => 'in_progress',
                'new_status' => 'on_hold',
                'progress_percentage' => 50,
                'is_internal' => false,
                'is_visible_to_tenant' => true,
            ],
            [
                'type' => 'rejected',
                'title' => 'Maintenance request rejected',
                'description' => 'The maintenance request was reviewed and rejected.',
                'previous_status' => 'pending',
                'new_status' => 'rejected',
                'progress_percentage' => 0,
                'is_internal' => false,
                'is_visible_to_tenant' => true,
            ],
            [
                'type' => 'cancelled',
                'title' => 'Maintenance request cancelled',
                'description' => 'The maintenance request has been cancelled.',
                'previous_status' => 'pending',
                'new_status' => 'cancelled',
                'progress_percentage' => 0,
                'is_internal' => false,
                'is_visible_to_tenant' => true,
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | CREATE UPDATES
        |--------------------------------------------------------------------------
        */

        foreach ($requests as $index => $request) {

            /*
            |--------------------------------------------------------------------------
            | SELECT UPDATE SCENARIOS
            |--------------------------------------------------------------------------
            */

            $selectedUpdates = [
                $updates[0],
                $updates[1],
            ];

            switch ($request->status) {
                case 'pending':
                    break;

                case 'approved':
                    $selectedUpdates[] = $updates[1];
                    break;

                case 'assigned':
                    $selectedUpdates[] = $updates[1];
                    $selectedUpdates[] = $updates[2];
                    break;

                case 'in_progress':
                    $selectedUpdates[] = $updates[1];
                    $selectedUpdates[] = $updates[2];
                    $selectedUpdates[] = $updates[3];
                    $selectedUpdates[] = $updates[4];
                    break;

                case 'on_hold':
                    $selectedUpdates[] = $updates[1];
                    $selectedUpdates[] = $updates[2];
                    $selectedUpdates[] = $updates[3];
                    $selectedUpdates[] = $updates[7];
                    break;

                case 'completed':
                    $selectedUpdates[] = $updates[1];
                    $selectedUpdates[] = $updates[2];
                    $selectedUpdates[] = $updates[3];
                    $selectedUpdates[] = $updates[4];
                    $selectedUpdates[] = $updates[5];
                    break;

                case 'rejected':
                    $selectedUpdates = [
                        $updates[0],
                        $updates[8],
                    ];
                    break;

                case 'cancelled':
                    $selectedUpdates = [
                        $updates[0],
                        $updates[9],
                    ];
                    break;
            }

            /*
            |--------------------------------------------------------------------------
            | FIND RELATED ASSIGNMENT
            |--------------------------------------------------------------------------
            */

            $assignment = MaintenanceAssignment::where(
                'maintenance_request_id',
                $request->id
            )->first();

            /*
            |--------------------------------------------------------------------------
            | CREATE EACH UPDATE
            |--------------------------------------------------------------------------
            */

            foreach ($selectedUpdates as $updateIndex => $update) {

                $userId = $users[
                    ($index + $updateIndex) % count($users)
                ];

                $updateDate = now()->subDays(
                    count($selectedUpdates) - $updateIndex
                );

                $uniqueTitle = $update['title'];

                /*
                |--------------------------------------------------------------------------
                | SAVE UPDATE
                |--------------------------------------------------------------------------
                |
                | The combination of request, title and type prevents
                | duplicate sample records when this seeder is rerun.
                |
                */

                MaintenanceUpdate::updateOrCreate(
                    [
                        'maintenance_request_id' => $request->id,
                        'type' => $update['type'],
                        'title' => $uniqueTitle,
                    ],
                    [
                        'maintenance_assignment_id' => $assignment?->id,

                        'user_id' => $userId,

                        'type' => $update['type'],

                        'title' => $uniqueTitle,

                        'description' => $update['description'],

                        'previous_status' => $update['previous_status'],

                        'new_status' => $update['new_status'],

                        'progress_percentage' => $update['progress_percentage'],

                        'is_internal' => $update['is_internal'],

                        'is_visible_to_tenant' => $update['is_visible_to_tenant'],

                        'metadata' => [
                            'source' => 'database_seeder',
                            'sample' => true,
                            'request_reference' => $request->reference,
                        ],

                        'created_at' => $updateDate,

                        'updated_at' => $updateDate,
                    ]
                );
            }
        }

        $this->command->info(
            'Maintenance updates seeded successfully.'
        );

        $this->command->info(
            'Maintenance requests processed: ' . $requests->count()
        );
    }
}
