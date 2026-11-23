<?php

namespace Database\Seeders;

use App\Models\MaintenanceChecklist;
use App\Models\MaintenanceRequest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MaintenanceChecklistSeeder extends Seeder
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
        | Load Users
        |--------------------------------------------------------------------------
        */

        $userIds = User::query()
            ->pluck('id')
            ->toArray();

        if (empty($userIds)) {
            $this->command->warn(
                'No users found. Maintenance checklists were not seeded.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Checklist Templates
        |--------------------------------------------------------------------------
        */

        $checklistTemplates = [
            [
                'title' => 'Inspect the reported problem',
                'description' => 'Inspect the affected area and confirm the reported maintenance issue.',
                'is_required' => true,
            ],
            [
                'title' => 'Identify the cause of the problem',
                'description' => 'Determine the root cause of the maintenance issue.',
                'is_required' => true,
            ],
            [
                'title' => 'Prepare tools and materials',
                'description' => 'Gather all required tools, spare parts and materials.',
                'is_required' => true,
            ],
            [
                'title' => 'Perform the required repairs',
                'description' => 'Carry out the approved maintenance and repair work.',
                'is_required' => true,
            ],
            [
                'title' => 'Test the repaired system',
                'description' => 'Test the repaired equipment or system to ensure proper operation.',
                'is_required' => true,
            ],
            [
                'title' => 'Clean the work area',
                'description' => 'Remove debris, unused materials and equipment from the work area.',
                'is_required' => false,
            ],
            [
                'title' => 'Take completion photographs',
                'description' => 'Capture photographs showing the completed maintenance work.',
                'is_required' => false,
            ],
            [
                'title' => 'Submit completion report',
                'description' => 'Document the work performed and submit the maintenance completion report.',
                'is_required' => true,
            ],
            [
                'title' => 'Final inspection and approval',
                'description' => 'Verify that all required maintenance work has been completed satisfactorily.',
                'is_required' => true,
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Create Checklist Items
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use (
            $requests,
            $userIds,
            $checklistTemplates
        ) {
            $created = 0;

            foreach ($requests as $requestIndex => $request) {
                /*
                |--------------------------------------------------------------------------
                | Determine Checklist Completion
                |--------------------------------------------------------------------------
                |
                | Completed requests receive completed checklist items.
                | Other requests receive a mixture of completed and pending items.
                |
                */

                $requestIsCompleted = $request->status === 'completed';

                foreach ($checklistTemplates as $index => $item) {
                    $isCompleted = $requestIsCompleted
                        || (
                            $requestIndex % 3 === 0
                            && $index < 3
                        )
                        || (
                            $requestIndex % 3 === 1
                            && $index < 2
                        );

                    $completedBy = $isCompleted
                        ? $userIds[
                            ($requestIndex + $index) % count($userIds)
                        ]
                        : null;

                    $completedAt = $isCompleted
                        ? now()->subDays(
                            max(0, ($requestIndex % 5) + 1)
                        )
                        : null;

                    /*
                    |--------------------------------------------------------------------------
                    | Insert or Update Checklist Item
                    |--------------------------------------------------------------------------
                    */

                    MaintenanceChecklist::updateOrCreate(
                        [
                            'maintenance_request_id' => $request->id,
                            'title' => $item['title'],
                        ],
                        [
                            'completed_by' => $completedBy,
                            'description' => $item['description'],
                            'is_completed' => $isCompleted,
                            'completed_at' => $completedAt,

                            'completion_notes' => $isCompleted
                                ? 'Checklist item completed successfully.'
                                : null,

                            'sort_order' => $index + 1,
                            'is_required' => $item['is_required'],
                        ]
                    );

                    $created++;
                }
            }

            $this->command->info(
                "{$created} maintenance checklist items seeded successfully."
            );
        });
    }
}
