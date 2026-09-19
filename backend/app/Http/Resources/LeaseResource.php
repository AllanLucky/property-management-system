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
     * LEASE API ARCHITECTURE
     * ==========================================================================
     *
     * Relationship hierarchy:
     *
     * Tenant
     *    ↓
     * Tenancy
     *    ↓
     * Lease
     *
     * A lease belongs to a tenancy. Tenant, property, apartment, unit and
     * user information is therefore resolved through the tenancy relationship.
     *
     * This resource intentionally does not duplicate tenancy-owned data.
     *
     * ==========================================================================
     * RESOURCE RESPONSIBILITY
     * ==========================================================================
     *
     * The service/repository layer is responsible for:
     *
     * - retrieving the lease
     * - applying business rules
     * - loading required relationships
     *
     * This resource is responsible only for API transformation.
     *
     * Relationships are transformed only when they have already been loaded.
     * This prevents accidental N+1 queries from the resource layer.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | Identity
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
            | Lease Lifecycle
            |--------------------------------------------------------------------------
            |
            | These flags are intentionally exposed separately from `status`.
            | This allows the frontend to make decisions without duplicating
            | backend lease-state logic.
            |
            */
            'status' => $this->status,
            'status_label' => $this->status_label,

            'is_active' => $this->is_active,
            'is_expired' => $this->is_expired,
            'is_terminated' => $this->is_terminated,
            'is_cancelled' => $this->is_cancelled,

            /*
            |--------------------------------------------------------------------------
            | Expiration State
            |--------------------------------------------------------------------------
            |
            | `has_ended` indicates that the lease end date has already passed.
            |
            | `should_expire` indicates whether the current lease state meets
            | the application's automatic expiration criteria.
            |
            | These values should come from the Lease model's business logic.
            |
            */
            'has_ended' => $this->has_ended,
            'should_expire' => $this->should_expire,

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
            | TenancyResource is the single source for:
            *
            | - tenant
            | - user
            | - property
            | - apartment
            | - unit
            |
            | `relationLoaded()` is important here because a Resource should
            | never unexpectedly execute another database query.
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
