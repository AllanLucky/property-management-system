<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenancyResource extends JsonResource
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
            | Identification
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,

            'tenancy_number' => $this->tenancy_number,

            /*
            |--------------------------------------------------------------------------
            | Foreign Keys
            |--------------------------------------------------------------------------
            */
            'property_id' => $this->property_id,
            'apartment_id' => $this->apartment_id,
            'unit_id' => $this->unit_id,
            'tenant_id' => $this->tenant_id,

            /*
            |--------------------------------------------------------------------------
            | Property
            |--------------------------------------------------------------------------
            */
            'property' => $this->whenLoaded(
                'property',
                fn () => new PropertyResource($this->property)
            ),

            /*
            |--------------------------------------------------------------------------
            | Apartment
            |--------------------------------------------------------------------------
            */
            'apartment' => $this->whenLoaded(
                'apartment',
                fn () => new ApartmentResource($this->apartment)
            ),

            /*
            |--------------------------------------------------------------------------
            | Unit
            |--------------------------------------------------------------------------
            */
            'unit' => $this->whenLoaded(
                'unit',
                fn () => new UnitResource($this->unit)
            ),

            /*
            |--------------------------------------------------------------------------
            | Tenant
            |--------------------------------------------------------------------------
            */
            'tenant' => $this->whenLoaded(
                'tenant',
                fn () => new TenantResource($this->tenant)
            ),

            /*
            |--------------------------------------------------------------------------
            | Tenancy Period
            |--------------------------------------------------------------------------
            */
            'start_date' => $this->start_date?->format('Y-m-d'),

            'end_date' => $this->end_date?->format('Y-m-d'),

            'move_in_date' => $this->move_in_date?->format('Y-m-d'),

            'move_out_date' => $this->move_out_date?->format('Y-m-d'),

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */
            'rent_amount' => $this->rent_amount,

            'deposit_amount' => $this->deposit_amount,

            'service_charge' => $this->service_charge,

            'late_fee' => $this->late_fee,

            /*
            |--------------------------------------------------------------------------
            | Payment Configuration
            |--------------------------------------------------------------------------
            */
            'payment_frequency' => $this->payment_frequency,

            'due_day' => $this->due_day,

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            'status' => $this->status,

            'is_active' => (bool) $this->is_active,

            'is_expired' => (bool) $this->is_expired,

            'is_currently_active' => (bool) $this->is_currently_active,

            'has_moved_in' => (bool) $this->has_moved_in,

            'has_moved_out' => (bool) $this->has_moved_out,

            /*
            |--------------------------------------------------------------------------
            | Agreement
            |--------------------------------------------------------------------------
            */
            'agreement_file' => $this->agreement_file,

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */
            'notes' => $this->notes,

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}