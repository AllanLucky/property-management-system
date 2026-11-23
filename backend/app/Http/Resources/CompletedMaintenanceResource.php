<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompletedMaintenanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | Relationship Loading
        |--------------------------------------------------------------------------
        */

        $assignmentsLoaded = $this->resource->relationLoaded('assignments');
        $checklistsLoaded = $this->resource->relationLoaded('checklists');

        $completedAssignments = $assignmentsLoaded
            ? $this->assignments
                ->where('status', 'completed')
                ->values()
            : collect();

        /*
        |--------------------------------------------------------------------------
        | Checklist Calculations
        |--------------------------------------------------------------------------
        */

        $totalChecklistItems = $checklistsLoaded
            ? $this->checklists->count()
            : null;

        $completedChecklistItems = $checklistsLoaded
            ? $this->checklists
                ->where('is_completed', true)
                ->count()
            : null;

        $requiredChecklistItems = $checklistsLoaded
            ? $this->checklists
                ->where('is_required', true)
                ->count()
            : null;

        $completedRequiredChecklistItems = $checklistsLoaded
            ? $this->checklists
                ->where('is_required', true)
                ->where('is_completed', true)
                ->count()
            : null;

        /*
        |--------------------------------------------------------------------------
        | Duration Calculation
        |--------------------------------------------------------------------------
        */

        $durationMinutes = null;

        if (
            $this->started_at &&
            $this->completed_at &&
            $this->completed_at->greaterThanOrEqualTo($this->started_at)
        ) {
            $durationMinutes = (int) round(
                $this->started_at->diffInSeconds($this->completed_at) / 60
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Return Resource
        |--------------------------------------------------------------------------
        */

        return [

            /*
            |--------------------------------------------------------------------------
            | Basic Maintenance Information
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'reference' => $this->reference,

            'title' => $this->title,

            'description' => $this->description,

            'status' => $this->status,

            'status_label' => 'Completed',

            'priority' => $this->priority,

            'priority_label' => $this->priority
                ? ucfirst(str_replace('_', ' ', $this->priority))
                : null,

            'is_emergency' => (bool) $this->is_emergency,

            /*
            |--------------------------------------------------------------------------
            | Property Information
            |--------------------------------------------------------------------------
            | Property table:
            | - title
            | - property_code
            | - street_address
            |
            | Do not use code or address because those are not the
            | corresponding database column names.
            |--------------------------------------------------------------------------
            */

            'property' => $this->whenLoaded('property', function () {

                if (!$this->property) {
                    return null;
                }

                return [
                    'id' => $this->property->id,

                    'name' => $this->property->title,

                    'title' => $this->property->title,

                    'code' => $this->property->property_code,

                    'address' => $this->property->street_address,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Apartment Information
            |--------------------------------------------------------------------------
            | Apartments table does not have a code column.
            | Expose the existing block column instead.
            |--------------------------------------------------------------------------
            */

            'apartment' => $this->whenLoaded('apartment', function () {

                if (!$this->apartment) {
                    return null;
                }

                return [
                    'id' => $this->apartment->id,

                    'name' => $this->apartment->name,

                    'block' => $this->apartment->block,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Unit Information
            |--------------------------------------------------------------------------
            */

            'unit' => $this->whenLoaded('unit', function () {

                if (!$this->unit) {
                    return null;
                }

                return [
                    'id' => $this->unit->id,

                    'unit_number' => $this->unit->unit_number,

                    'name' => $this->unit->unit_name
                        ?? $this->unit->name
                        ?? $this->unit->unit_number,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Tenant Information
            |--------------------------------------------------------------------------
            | Tenant has its own full_name accessor.
            | User also has a full_name accessor.
            |--------------------------------------------------------------------------
            */

            'tenant' => $this->whenLoaded('tenant', function () {

                if (!$this->tenant) {
                    return null;
                }

                $tenant = $this->tenant;

                $tenantUser = $tenant->relationLoaded('user')
                    ? $tenant->user
                    : null;

                return [
                    'id' => $tenant->id,

                    'user_id' => $tenant->user_id,

                    'name' => $tenant->full_name
                        ?: ($tenantUser?->full_name),

                    'first_name' => $tenant->first_name
                        ?: $tenantUser?->first_name,

                    'last_name' => $tenant->last_name
                        ?: $tenantUser?->last_name,

                    'email' => $tenant->email
                        ?: $tenantUser?->email,

                    'phone' => $tenant->phone
                        ?: $tenantUser?->phone,

                    'tenant_number' => $tenant->tenant_number,

                    'status' => $tenant->status,

                    'status_label' => $tenant->status_label,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Maintenance Category
            |--------------------------------------------------------------------------
            */

            'category' => $this->whenLoaded('category', function () {

                if (!$this->category) {
                    return null;
                }

                return [
                    'id' => $this->category->id,

                    'name' => $this->category->name,

                    'slug' => $this->category->slug,

                    'icon' => $this->category->icon,

                    'color' => $this->category->color,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Completion Information
            |--------------------------------------------------------------------------
            */

            'completion' => [

                'completion_notes' => $this->completion_notes,

                'completed_at' => $this->completed_at,

                'total_cost' => $this->total_cost,

                'estimated_cost' => $this->estimated_cost,

                'cost_difference' => (
                    $this->total_cost !== null &&
                    $this->estimated_cost !== null
                )
                    ? round(
                        (float) $this->total_cost -
                        (float) $this->estimated_cost,
                        2
                    )
                    : null,

                'actual_hours' => $this->actual_hours !== null
                    ? (float) $this->actual_hours
                    : (
                        $assignmentsLoaded
                            ? round(
                                $completedAssignments->sum(
                                    fn ($assignment) => (float) (
                                        $assignment->actual_hours ?? 0
                                    )
                                ),
                                2
                            )
                            : null
                    ),

                'started_at' => $this->started_at,

                'duration_minutes' => $durationMinutes,
            ],

            /*
            |--------------------------------------------------------------------------
            | Latest Assignment
            |--------------------------------------------------------------------------
            | Technician is directly a User model.
            |--------------------------------------------------------------------------
            */

            'latest_assignment' => $this->whenLoaded(
                'latestAssignment',
                function () {

                    $assignment = $this->latestAssignment;

                    if (!$assignment) {
                        return null;
                    }

                    $technician = $assignment->relationLoaded('technician')
                        ? $assignment->technician
                        : null;

                    return [

                        'id' => $assignment->id,

                        'status' => $assignment->status,

                        'technician' => $technician
                            ? [
                                'id' => $technician->id,

                                'name' => $technician->full_name,

                                'first_name' => $technician->first_name,

                                'last_name' => $technician->last_name,

                                'email' => $technician->email,

                                'phone' => $technician->phone,

                                'image_url' => $technician->image_url,
                            ]
                            : null,

                        'assigned_at' => $assignment->assigned_at,

                        'started_at' => $assignment->started_at,

                        'completed_at' => $assignment->completed_at,

                        'estimated_hours' => $assignment->estimated_hours,

                        'actual_hours' => $assignment->actual_hours,

                        'estimated_cost' => $assignment->estimated_cost,

                        'actual_cost' => $assignment->actual_cost,

                        'work_notes' => $assignment->work_notes,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | All Completed Assignments
            |--------------------------------------------------------------------------
            */

            'completed_assignments' => $this->whenLoaded(
                'assignments',
                function () use ($completedAssignments) {

                    return $completedAssignments->map(
                        function ($assignment) {

                            $technician = $assignment->relationLoaded('technician')
                                ? $assignment->technician
                                : null;

                            return [

                                'id' => $assignment->id,

                                'technician' => $technician
                                    ? [
                                        'id' => $technician->id,

                                        'name' => $technician->full_name,

                                        'first_name' => $technician->first_name,

                                        'last_name' => $technician->last_name,

                                        'email' => $technician->email,

                                        'phone' => $technician->phone,

                                        'image_url' => $technician->image_url,
                                    ]
                                    : null,

                                'status' => $assignment->status,

                                'assigned_at' => $assignment->assigned_at,

                                'started_at' => $assignment->started_at,

                                'completed_at' => $assignment->completed_at,

                                'estimated_hours' => $assignment->estimated_hours,

                                'actual_hours' => $assignment->actual_hours,

                                'estimated_cost' => $assignment->estimated_cost,

                                'actual_cost' => $assignment->actual_cost,

                                'work_notes' => $assignment->work_notes,
                            ];
                        }
                    )->values();
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Checklist Summary
            |--------------------------------------------------------------------------
            */

            'checklist_summary' => $this->whenLoaded(
                'checklists',
                function () use (
                    $totalChecklistItems,
                    $completedChecklistItems,
                    $requiredChecklistItems,
                    $completedRequiredChecklistItems
                ) {

                    return [

                        'total_items' => $totalChecklistItems,

                        'completed_items' => $completedChecklistItems,

                        'incomplete_items' => max(
                            0,
                            $totalChecklistItems - $completedChecklistItems
                        ),

                        'required_items' => $requiredChecklistItems,

                        'completed_required_items' => $completedRequiredChecklistItems,

                        'incomplete_required_items' => max(
                            0,
                            $requiredChecklistItems -
                            $completedRequiredChecklistItems
                        ),

                        'completion_percentage' => $totalChecklistItems > 0
                            ? round(
                                (
                                    $completedChecklistItems /
                                    $totalChecklistItems
                                ) * 100,
                                2
                            )
                            : 100,

                        'required_completion_percentage' => $requiredChecklistItems > 0
                            ? round(
                                (
                                    $completedRequiredChecklistItems /
                                    $requiredChecklistItems
                                ) * 100,
                                2
                            )
                            : 100,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Checklist Items
            |--------------------------------------------------------------------------
            */

            'checklists' => $this->whenLoaded(
                'checklists',
                function () {

                    return $this->checklists
                        ->sortBy([
                            ['sort_order', 'asc'],
                            ['id', 'asc'],
                        ])
                        ->map(function ($item) {

                            $completedBy = $item->relationLoaded('completedBy')
                                ? $item->completedBy
                                : null;

                            return [

                                'id' => $item->id,

                                'title' => $item->title,

                                'description' => $item->description,

                                'status' => $item->status,

                                'status_label' => $item->status_label,

                                'is_required' => (bool) $item->is_required,

                                'is_completed' => (bool) $item->is_completed,

                                'completed_at' => $item->completed_at,

                                'completion_notes' => $item->completion_notes,

                                'completed_by' => $item->completed_by,

                                'completed_by_user' => $completedBy
                                    ? [
                                        'id' => $completedBy->id,

                                        'name' => $completedBy->full_name,

                                        'first_name' => $completedBy->first_name,

                                        'last_name' => $completedBy->last_name,

                                        'email' => $completedBy->email,
                                    ]
                                    : null,

                                'sort_order' => $item->sort_order,
                            ];
                        })
                        ->values();
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Maintenance Expenses
            |--------------------------------------------------------------------------
            */

            'expenses' => $this->whenLoaded(
                'expenses',
                function () {

                    return $this->expenses->map(function ($expense) {

                        return [

                            'id' => $expense->id,

                            'description' => $expense->description,

                            'amount' => $expense->amount,

                            'expense_date' => $expense->expense_date,

                            'created_at' => $expense->created_at,
                        ];
                    })->values();
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Attachments
            |--------------------------------------------------------------------------
            | MaintenanceAttachment uses original_name and file_name.
            |--------------------------------------------------------------------------
            */

            'attachments' => $this->whenLoaded(
                'attachments',
                function () {

                    return $this->attachments->map(function ($attachment) {

                        $uploader = $attachment->relationLoaded('uploader')
                            ? $attachment->uploader
                            : null;

                        return [

                            'id' => $attachment->id,

                            'name' => $attachment->original_name
                                ?: $attachment->file_name,

                            'original_name' => $attachment->original_name,

                            'file_name' => $attachment->file_name,

                            'file_path' => $attachment->file_path,

                            'disk' => $attachment->disk,

                            'file_type' => $attachment->file_type,

                            'mime_type' => $attachment->mime_type,

                            'file_extension' => $attachment->file_extension,

                            'file_size' => $attachment->file_size,

                            'formatted_file_size' => $attachment->formatted_file_size,

                            'attachment_type' => $attachment->attachment_type,

                            'description' => $attachment->description,

                            'is_public' => (bool) $attachment->is_public,

                            'uploaded_by' => $attachment->uploaded_by,

                            'uploader' => $uploader
                                ? [
                                    'id' => $uploader->id,

                                    'name' => $uploader->full_name,

                                    'email' => $uploader->email,
                                ]
                                : null,

                            'created_at' => $attachment->created_at,
                        ];
                    })->values();
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Maintenance Updates / History
            |--------------------------------------------------------------------------
            */

            'updates' => $this->whenLoaded(
                'updates',
                function () {

                    return $this->updates->map(function ($update) {

                        $user = $update->relationLoaded('user')
                            ? $update->user
                            : null;

                        return [

                            'id' => $update->id,

                            'type' => $update->type,

                            'title' => $update->title,

                            'description' => $update->description,

                            'previous_status' => $update->previous_status,

                            'new_status' => $update->new_status,

                            'progress_percentage' => $update->progress_percentage,

                            'is_internal' => (bool) $update->is_internal,

                            'is_visible_to_tenant' => (bool) $update->is_visible_to_tenant,

                            'user' => $user
                                ? [
                                    'id' => $user->id,

                                    'name' => $user->full_name,

                                    'first_name' => $user->first_name,

                                    'last_name' => $user->last_name,

                                    'email' => $user->email,

                                    'image_url' => $user->image_url,
                                ]
                                : null,

                            'created_at' => $update->created_at,
                        ];
                    })->values();
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Statistics
            |--------------------------------------------------------------------------
            */

            'statistics' => [

                'completed_assignments_count' => $this->whenLoaded(
                    'assignments',
                    fn () => $completedAssignments->count()
                ),

                'total_assignments_count' => $this->whenLoaded(
                    'assignments',
                    fn () => $this->assignments->count()
                ),

                'expenses_count' => $this->whenLoaded(
                    'expenses',
                    fn () => $this->expenses->count()
                ),

                'attachments_count' => $this->whenLoaded(
                    'attachments',
                    fn () => $this->attachments->count()
                ),

                'updates_count' => $this->whenLoaded(
                    'updates',
                    fn () => $this->updates->count()
                ),

                'checklists_count' => $this->whenLoaded(
                    'checklists',
                    fn () => $this->checklists->count()
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,
        ];
    }
}
