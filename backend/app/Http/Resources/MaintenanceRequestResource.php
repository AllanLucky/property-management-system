<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceRequestResource extends JsonResource
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
            'reference' => $this->reference,

            /*
            |--------------------------------------------------------------------------
            | PROPERTY INFORMATION
            |--------------------------------------------------------------------------
            */

            'property_id' => $this->property_id,
            'apartment_id' => $this->apartment_id,
            'unit_id' => $this->unit_id,

            'property' => $this->whenLoaded('property', function () {
                $property = $this->property;

                if (!$property) {
                    return null;
                }

                return [
                    'id' => $property->id,
                    'name' => $property->title,
                    'property_code' => $property->property_code,
                    'slug' => $property->slug,
                    'status' => $property->status,
                    'listing_type' => $property->listing_type,

                    'location' => [
                        'country' => $property->country_name,
                        'region' => $property->region_name,
                        'county' => $property->county_name,
                        'city' => $property->city_name,
                        'area' => $property->area_name,
                        'street_address' => $property->street_address,
                    ],
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | APARTMENT INFORMATION
            |--------------------------------------------------------------------------
            */

            'apartment' => $this->whenLoaded('apartment', function () {
                $apartment = $this->apartment;

                if (!$apartment) {
                    return null;
                }

                return [
                    'id' => $apartment->id,
                    'name' => $apartment->name ?? null,
                    'apartment_name' => $apartment->apartment_name ?? null,
                    'apartment_code' => $apartment->apartment_code ?? null,
                    'property_id' => $apartment->property_id ?? null,
                    'status' => $apartment->status ?? null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | UNIT INFORMATION
            |--------------------------------------------------------------------------
            */

            'unit' => $this->whenLoaded('unit', function () {
                $unit = $this->unit;

                if (!$unit) {
                    return null;
                }

                return [
                    'id' => $unit->id,
                    'unit_number' => $unit->unit_number ?? null,
                    'unit_name' => $unit->unit_name ?? null,
                    'unit_code' => $unit->unit_code ?? null,
                    'property_id' => $unit->property_id ?? null,
                    'apartment_id' => $unit->apartment_id ?? null,
                    'status' => $unit->status ?? null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | TENANT INFORMATION
            |--------------------------------------------------------------------------
            */

            'tenant_id' => $this->tenant_id,

            'tenant' => $this->whenLoaded('tenant', function () {
                $tenant = $this->tenant;

                if (!$tenant) {
                    return null;
                }

                $user = $tenant->user ?? null;

                return [
                    'id' => $tenant->id,
                    'user_id' => $tenant->user_id ?? null,
                    'name' => $user?->name,
                    'email' => $user?->email,
                    'phone' => $user?->phone ?? null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | CATEGORY INFORMATION
            |--------------------------------------------------------------------------
            */

            'category_id' => $this->category_id,

            'category' => $this->whenLoaded('category', function () {
                $category = $this->category;

                if (!$category) {
                    return null;
                }

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | REQUEST DETAILS
            |--------------------------------------------------------------------------
            */

            'title' => $this->title,
            'description' => $this->description,

            'priority' => $this->priority,

            'priority_label' => $this->priority
                ? ucfirst($this->priority)
                : null,

            'priority_color' => match ($this->priority) {
                'low' => 'success',
                'medium' => 'info',
                'high' => 'warning',
                'urgent' => 'danger',
                default => 'secondary',
            },

            'is_emergency' => (bool) $this->is_emergency,

            /*
            |--------------------------------------------------------------------------
            | STATUS INFORMATION
            |--------------------------------------------------------------------------
            */

            'status' => $this->status,

            'status_label' => $this->status
                ? ucfirst(str_replace('_', ' ', $this->status))
                : null,

            'status_color' => match ($this->status) {
                'pending' => 'warning',
                'approved' => 'info',
                'rejected' => 'danger',
                'assigned' => 'primary',
                'in_progress' => 'info',
                'on_hold' => 'secondary',
                'completed' => 'success',
                'cancelled' => 'dark',
                default => 'secondary',
            },

            /*
            |--------------------------------------------------------------------------
            | REPORTING INFORMATION
            |--------------------------------------------------------------------------
            */

            'reported_by' => $this->reported_by,

            'reporter' => $this->whenLoaded('reporter', function () {
                $reporter = $this->reporter;

                if (!$reporter) {
                    return null;
                }

                return [
                    'id' => $reporter->id,
                    'name' => $reporter->name,
                    'email' => $reporter->email,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | APPROVAL INFORMATION
            |--------------------------------------------------------------------------
            */

            'approved_by' => $this->approved_by,

            'approver' => $this->whenLoaded('approver', function () {
                $approver = $this->approver;

                if (!$approver) {
                    return null;
                }

                return [
                    'id' => $approver->id,
                    'name' => $approver->name,
                    'email' => $approver->email,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | ASSIGNMENT INFORMATION
            |--------------------------------------------------------------------------
            */

            'assigned_by' => $this->assigned_by,

            'assigner' => $this->whenLoaded('assigner', function () {
                $assigner = $this->assigner;

                if (!$assigner) {
                    return null;
                }

                return [
                    'id' => $assigner->id,
                    'name' => $assigner->name,
                    'email' => $assigner->email,
                ];
            }),

            'assignments' => MaintenanceAssignmentResource::collection(
                $this->whenLoaded('assignments')
            ),

            'latest_assignment' => $this->whenLoaded(
                'latestAssignment',
                function () {
                    return $this->latestAssignment;
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | CURRENT TECHNICIAN
            |--------------------------------------------------------------------------
            */

            'current_technician' => $this->when(
                $this->relationLoaded('latestAssignment'),
                function () {
                    $technician = $this->current_technician;

                    if (!$technician) {
                        return null;
                    }

                    return [
                        'id' => $technician->id,
                        'name' => $technician->name,
                        'email' => $technician->email,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE SCHEDULE
            |--------------------------------------------------------------------------
            */

            'scheduled_at' => $this->scheduled_at,
            'started_at' => $this->started_at,
            'completed_at' => $this->completed_at,
            'rejected_at' => $this->rejected_at,
            'cancelled_at' => $this->cancelled_at,

            'formatted_scheduled_at' => $this->scheduled_at
                ? $this->scheduled_at->format('Y-m-d H:i:s')
                : null,

            'formatted_completed_at' => $this->completed_at
                ? $this->completed_at->format('Y-m-d H:i:s')
                : null,

            /*
            |--------------------------------------------------------------------------
            | WORKFLOW NOTES
            |--------------------------------------------------------------------------
            */

            'rejection_reason' => $this->rejection_reason,
            'cancellation_reason' => $this->cancellation_reason,
            'completion_notes' => $this->completion_notes,

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL INFORMATION
            |--------------------------------------------------------------------------
            */

            'estimated_cost' => $this->estimated_cost,
            'total_cost' => $this->total_cost,

            'formatted_estimated_cost' => $this->estimated_cost !== null
                ? number_format((float) $this->estimated_cost, 2, '.', '')
                : null,

            'formatted_total_cost' => $this->total_cost !== null
                ? number_format((float) $this->total_cost, 2, '.', '')
                : null,

            'expenses_total' => $this->when(
                $this->relationLoaded('expenses'),
                fn () => (float) $this->expenses->sum('amount')
            ),

            'expenses_approved_total' => $this->when(
                $this->relationLoaded('expenses'),
                fn () => (float) $this->expenses
                    ->where('status', 'approved')
                    ->sum('amount')
            ),

            'expenses_paid_total' => $this->when(
                $this->relationLoaded('expenses'),
                fn () => (float) $this->expenses->sum('paid_amount')
            ),

            /*
            |--------------------------------------------------------------------------
            | ATTACHMENTS
            |--------------------------------------------------------------------------
            */

            'attachments_count' => $this->when(
                $this->relationLoaded('attachments'),
                fn () => $this->attachments->count()
            ),

            'attachments' => MaintenanceAttachmentResource::collection(
                $this->whenLoaded('attachments')
            ),

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE ACTIVITIES
            |--------------------------------------------------------------------------
            */

            'activities' => $this->whenLoaded('activities'),

            'updates' => MaintenanceUpdateResource::collection(
                $this->whenLoaded('updates')
            ),

            /*
            |--------------------------------------------------------------------------
            | CHECKLISTS
            |--------------------------------------------------------------------------
            */

            'checklist_total' => $this->when(
                $this->relationLoaded('checklists'),
                fn () => $this->checklists->count()
            ),

            'checklist_completed' => $this->when(
                $this->relationLoaded('checklists'),
                fn () => $this->checklists
                    ->where('is_completed', true)
                    ->count()
            ),

            'checklist_progress' => $this->when(
                $this->relationLoaded('checklists'),
                function () {
                    $total = $this->checklists->count();

                    if ($total === 0) {
                        return 0;
                    }

                    $completed = $this->checklists
                        ->where('is_completed', true)
                        ->count();

                    return (int) round(($completed / $total) * 100);
                }
            ),

            'checklists' => MaintenanceChecklistResource::collection(
                $this->whenLoaded('checklists')
            ),

            /*
            |--------------------------------------------------------------------------
            | EXPENSE RECORDS
            |--------------------------------------------------------------------------
            */

            'expenses' => MaintenanceExpenseResource::collection(
                $this->whenLoaded('expenses')
            ),

            /*
            |--------------------------------------------------------------------------
            | WORKFLOW HELPERS
            |--------------------------------------------------------------------------
            */

            'is_pending' => $this->status === 'pending',
            'is_approved' => $this->status === 'approved',
            'is_rejected' => $this->status === 'rejected',
            'is_assigned' => $this->status === 'assigned',
            'is_in_progress' => $this->status === 'in_progress',
            'is_on_hold' => $this->status === 'on_hold',
            'is_completed' => $this->status === 'completed',
            'is_cancelled' => $this->status === 'cancelled',

            'is_ongoing' => in_array(
                $this->status,
                ['assigned', 'in_progress', 'on_hold'],
                true
            ),

            'is_open' => in_array(
                $this->status,
                [
                    'pending',
                    'approved',
                    'assigned',
                    'in_progress',
                    'on_hold',
                ],
                true
            ),

            'is_overdue' => $this->scheduled_at !== null
                && $this->scheduled_at->isPast()
                && !in_array(
                    $this->status,
                    ['completed', 'cancelled', 'rejected'],
                    true
                ),

            'is_urgent' => in_array(
                $this->priority,
                ['high', 'urgent'],
                true
            ),

            'age_in_days' => $this->created_at
                ? (int) $this->created_at->diffInDays(now())
                : null,

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
