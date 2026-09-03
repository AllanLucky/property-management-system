<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeaseResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * ==========================================================================
     * LEASE ARCHITECTURE
     * ==========================================================================
     *
     * The application follows this relationship:
     *
     * Tenant
     *    ↓
     * Tenancy
     *    ↓
     * Lease
     *
     * A lease belongs to a tenancy and must not duplicate tenancy-owned
     * information such as:
     *
     * - tenant
     * - user
     * - property
     * - apartment
     * - unit
     *
     * Those relationships are resolved through the tenancy relationship.
     *
     * ==========================================================================
     * RESOURCE RESPONSIBILITY
     * ==========================================================================
     *
     * This resource is the detailed representation of a lease.
     *
     * The repository/service layer is responsible for retrieving and
     * preparing the model. This resource is responsible only for transforming
     * the model into the API response.
     *
     * Relationships are included only when they have already been loaded.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | Primary Lease Information
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'lease_number' => $this->lease_number,
            'tenancy_id' => $this->tenancy_id,

            /*
            |--------------------------------------------------------------------------
            | Lease Type
            |--------------------------------------------------------------------------
            */
            'lease_type' => $this->lease_type,
            'lease_type_label' => $this->lease_type_label,

            /*
            |--------------------------------------------------------------------------
            | Lease Period
            |--------------------------------------------------------------------------
            */
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),

            /*
            |--------------------------------------------------------------------------
            | Financial Terms
            |--------------------------------------------------------------------------
            */
            'rent_amount' => $this->rent_amount,
            'deposit_amount' => $this->deposit_amount,
            'service_charge' => $this->service_charge,
            'late_fee' => $this->late_fee,

            /*
            |--------------------------------------------------------------------------
            | Payment Terms
            |--------------------------------------------------------------------------
            */
            'payment_frequency' => $this->payment_frequency,
            'due_day' => $this->due_day,
            'notice_period_days' => $this->notice_period_days,

            /*
            |--------------------------------------------------------------------------
            | Lease Status
            |--------------------------------------------------------------------------
            */
            'status' => $this->status,
            'status_label' => $this->status_label,
            'is_active' => $this->is_active,
            'is_expired' => $this->is_expired,
            'is_terminated' => $this->is_terminated,

            /*
            |--------------------------------------------------------------------------
            | Signing / Termination
            |--------------------------------------------------------------------------
            */
            'signed_at' => $this->signed_at?->toISOString(),
            'terminated_at' => $this->terminated_at?->toISOString(),
            'termination_reason' => $this->termination_reason,

            /*
            |--------------------------------------------------------------------------
            | Documents / Notes
            |--------------------------------------------------------------------------
            */
            'document_path' => $this->document_path,
            'notes' => $this->notes,

            /*
            |--------------------------------------------------------------------------
            | Tenancy
            |--------------------------------------------------------------------------
            |
            | The tenancy relationship is the source of:
            |
            | - tenant
            | - user
            | - property
            | - apartment
            | - unit
            |
            | TenancyResource handles those relationships.
            |
            | `relationLoaded()` prevents the resource from accidentally
            | triggering additional database queries.
            |
            */
            'tenancy' => $this->when(
                $this->relationLoaded('tenancy'),
                fn () => $this->tenancy
                    ? new TenancyResource($this->tenancy)
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}