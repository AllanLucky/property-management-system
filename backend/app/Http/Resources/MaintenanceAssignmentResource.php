<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceAssignmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | IDENTIFICATION
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE REQUEST
            |--------------------------------------------------------------------------
            */

            'maintenance_request_id' => $this->maintenance_request_id,

            'maintenance_request' => $this->whenLoaded(
                'maintenanceRequest',
                function () {
                    return $this->maintenanceRequest ? [
                        'id' => $this->maintenanceRequest->id,
                        'reference' => $this->maintenanceRequest->reference,
                        'title' => $this->maintenanceRequest->title,
                        'status' => $this->maintenanceRequest->status,
                        'priority' => $this->maintenanceRequest->priority,
                    ] : null;
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | TECHNICIAN
            |--------------------------------------------------------------------------
            */

            'technician_id' => $this->technician_id,

            'technician' => $this->whenLoaded(
                'technician',
                function () {
                    if (!$this->technician) {
                        return null;
                    }

                    return [
                        'id' => $this->technician->id,

                        'name' => $this->technician->full_name,

                        'first_name' => $this->technician->first_name,

                        'last_name' => $this->technician->last_name,

                        'email' => $this->technician->email,

                        'phone' => $this->technician->phone,

                        'initials' => $this->technician->initials,

                        'image' => $this->technician->image,

                        'image_url' => $this->technician->image_url,

                        'account_status' => $this->technician->account_status,

                        'approval_status' => $this->technician->approval_status,

                        'is_active' => $this->technician->is_active,

                        'is_verified' => $this->technician->is_verified_user,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | ASSIGNER
            |--------------------------------------------------------------------------
            */

            'assigned_by' => $this->assigned_by,

            'assigner' => $this->whenLoaded(
                'assigner',
                function () {
                    if (!$this->assigner) {
                        return null;
                    }

                    return [
                        'id' => $this->assigner->id,

                        'name' => $this->assigner->full_name,

                        'first_name' => $this->assigner->first_name,

                        'last_name' => $this->assigner->last_name,

                        'email' => $this->assigner->email,

                        'phone' => $this->assigner->phone,

                        'initials' => $this->assigner->initials,

                        'image' => $this->assigner->image,

                        'image_url' => $this->assigner->image_url,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | ASSIGNMENT STATUS
            |--------------------------------------------------------------------------
            */

            'status' => $this->status,

            'status_label' => $this->status_label,

            'is_pending' => $this->isPending(),

            'is_accepted' => $this->isAccepted(),

            'is_rejected' => $this->isRejected(),

            'is_in_progress' => $this->isInProgress(),

            'is_on_hold' => $this->isOnHold(),

            'is_completed' => $this->isCompleted(),

            'is_cancelled' => $this->isCancelled(),

            'is_active' => in_array(
                $this->status,
                [
                    'pending',
                    'accepted',
                    'in_progress',
                    'on_hold',
                ],
                true
            ),

            /*
            |--------------------------------------------------------------------------
            | ASSIGNMENT TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'assigned_at' => $this->assigned_at?->toISOString(),

            'accepted_at' => $this->accepted_at?->toISOString(),

            'started_at' => $this->started_at?->toISOString(),

            'completed_at' => $this->completed_at?->toISOString(),

            'rejected_at' => $this->rejected_at?->toISOString(),

            'cancelled_at' => $this->cancelled_at?->toISOString(),

            'scheduled_at' => $this->scheduled_at?->toISOString(),

            /*
            |--------------------------------------------------------------------------
            | REJECTION AND CANCELLATION
            |--------------------------------------------------------------------------
            */

            'rejection_reason' => $this->rejection_reason,

            'cancellation_reason' => $this->cancellation_reason,

            /*
            |--------------------------------------------------------------------------
            | WORK DETAILS
            |--------------------------------------------------------------------------
            */

            'work_notes' => $this->work_notes,

            /*
            |--------------------------------------------------------------------------
            | ESTIMATED AND ACTUAL HOURS
            |--------------------------------------------------------------------------
            */

            'estimated_hours' => $this->estimated_hours !== null
                ? (float) $this->estimated_hours
                : null,

            'actual_hours' => $this->actual_hours !== null
                ? (float) $this->actual_hours
                : null,

            'hours_difference' => (
                $this->estimated_hours !== null &&
                $this->actual_hours !== null
            )
                ? round(
                    (float) $this->actual_hours -
                    (float) $this->estimated_hours,
                    2
                )
                : null,

            /*
            |--------------------------------------------------------------------------
            | ESTIMATED AND ACTUAL COSTS
            |--------------------------------------------------------------------------
            */

            'estimated_cost' => $this->estimated_cost !== null
                ? (float) $this->estimated_cost
                : null,

            'actual_cost' => $this->actual_cost !== null
                ? (float) $this->actual_cost
                : null,

            'cost_difference' => (
                $this->estimated_cost !== null &&
                $this->actual_cost !== null
            )
                ? round(
                    (float) $this->actual_cost -
                    (float) $this->estimated_cost,
                    2
                )
                : null,

            /*
            |--------------------------------------------------------------------------
            | OVERDUE INFORMATION
            |--------------------------------------------------------------------------
            */

            'is_overdue' => $this->isOverdue(),

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP INFORMATION
            |--------------------------------------------------------------------------
            */

            'has_maintenance_request' => $this->maintenance_request_id !== null,

            'has_technician' => $this->technician_id !== null,

            /*
            |--------------------------------------------------------------------------
            | AUDIT TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
