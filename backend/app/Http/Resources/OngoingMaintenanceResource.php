<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OngoingMaintenanceResource extends JsonResource
{
    /**
     * Transform the maintenance request into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $latestAssignment = $this->whenLoaded('latestAssignment');

        $technician = $this->whenLoaded('assignments');

        $updates = $this->whenLoaded('updates');

        $attachments = $this->whenLoaded('attachments');

        $expenses = $this->whenLoaded('expenses');

        $checklists = $this->whenLoaded('checklists');

        return [
            /*
            |--------------------------------------------------------------------------
            | Basic Information
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,
            'reference' => $this->reference,
            'title' => $this->title,
            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | Status and Priority
            |--------------------------------------------------------------------------
            */

            'status' => $this->status,
            'status_label' => $this->status_label,
            'priority' => $this->priority,
            'priority_label' => $this->priority_label,
            'is_emergency' => (bool) $this->is_emergency,

            /*
            |--------------------------------------------------------------------------
            | Location Information
            |--------------------------------------------------------------------------
            */

            'property' => $this->whenLoaded('property', function () {
                return [
                    'id' => $this->property?->id,
                    'name' => $this->property?->name,
                    'code' => $this->property?->code,
                ];
            }),

            'apartment' => $this->whenLoaded('apartment', function () {
                return [
                    'id' => $this->apartment?->id,
                    'name' => $this->apartment?->name,
                ];
            }),

            'unit' => $this->whenLoaded('unit', function () {
                return [
                    'id' => $this->unit?->id,
                    'unit_number' => $this->unit?->unit_number,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Tenant and Category
            |--------------------------------------------------------------------------
            */

            'tenant' => $this->whenLoaded('tenant', function () {
                return [
                    'id' => $this->tenant?->id,
                    'name' => $this->tenant?->name,
                    'email' => $this->tenant?->email,
                    'phone' => $this->tenant?->phone,
                ];
            }),

            'category' => $this->whenLoaded('category', function () {
                return [
                    'id' => $this->category?->id,
                    'name' => $this->category?->name,
                    'slug' => $this->category?->slug,
                    'icon' => $this->category?->icon,
                    'color' => $this->category?->color,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Assignment Information
            |--------------------------------------------------------------------------
            */

            'latest_assignment' => $this->whenLoaded(
                'latestAssignment',
                function () {
                    $assignment = $this->latestAssignment;

                    if (!$assignment) {
                        return null;
                    }

                    return [
                        'id' => $assignment->id,
                        'status' => $assignment->status,
                        'assigned_at' => $assignment->assigned_at,
                        'accepted_at' => $assignment->accepted_at,
                        'started_at' => $assignment->started_at,
                        'scheduled_at' => $assignment->scheduled_at,

                        'technician' => $assignment->technician
                            ? [
                                'id' => $assignment->technician->id,
                                'name' => $assignment->technician->name,
                                'email' => $assignment->technician->email,
                                'phone' => $assignment->technician->phone,
                            ]
                            : null,
                    ];
                }
            ),

            'assignments' => $this->whenLoaded(
                'assignments',
                function () {
                    return $this->assignments->map(function ($assignment) {
                        return [
                            'id' => $assignment->id,
                            'status' => $assignment->status,
                            'assigned_at' => $assignment->assigned_at,
                            'accepted_at' => $assignment->accepted_at,
                            'started_at' => $assignment->started_at,
                            'completed_at' => $assignment->completed_at,

                            'technician' => $assignment->technician
                                ? [
                                    'id' => $assignment->technician->id,
                                    'name' => $assignment->technician->name,
                                    'email' => $assignment->technician->email,
                                    'phone' => $assignment->technician->phone,
                                ]
                                : null,
                        ];
                    });
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Progress Information
            |--------------------------------------------------------------------------
            */

            'progress' => [
                'percentage' => $this->progress_percentage ?? 0,
                'is_completed' => $this->status === 'completed',
            ],

            /*
            |--------------------------------------------------------------------------
            | Maintenance Schedule
            |--------------------------------------------------------------------------
            */

            'scheduled_at' => $this->scheduled_at,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,

            /*
            |--------------------------------------------------------------------------
            | Cost Information
            |--------------------------------------------------------------------------
            */

            'estimated_cost' => $this->estimated_cost,
            'total_cost' => $this->total_cost,

            /*
            |--------------------------------------------------------------------------
            | Completion Information
            |--------------------------------------------------------------------------
            */

            'completion_notes' => $this->completion_notes,

            /*
            |--------------------------------------------------------------------------
            | Maintenance Records
            |--------------------------------------------------------------------------
            */

            'updates' => $this->whenLoaded('updates', function () {
                return $this->updates->map(function ($update) {
                    return [
                        'id' => $update->id,
                        'description' => $update->description ?? null,
                        'notes' => $update->notes ?? null,
                        'created_at' => $update->created_at,
                    ];
                });
            }),

            'attachments' => $this->whenLoaded('attachments'),

            'expenses' => $this->whenLoaded('expenses'),

            'checklists' => $this->whenLoaded('checklists'),

            /*
            |--------------------------------------------------------------------------
            | Record Timestamps
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
