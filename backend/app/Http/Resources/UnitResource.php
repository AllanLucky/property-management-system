<?php

namespace App\Http\Resources;

use App\Helpers\DateHelper;
use App\Models\Unit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnitResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | SAFE RELATIONSHIPS
        |--------------------------------------------------------------------------
        */

        $property = $this->whenLoaded('property');

        $apartment = $this->whenLoaded('apartment');

        /*
        |--------------------------------------------------------------------------
        | TENANCY
        |--------------------------------------------------------------------------
        */

        $activeTenancy = null;
        $tenant = null;

        if ($this->relationLoaded('tenancies')) {

            $activeTenancy = $this->tenancies
                ->firstWhere('status', 'active');

            $tenant = $activeTenancy?->tenant;
        }

        /*
        |--------------------------------------------------------------------------
        | MAINTENANCE STATISTICS
        |--------------------------------------------------------------------------
        */

        $maintenanceTotal = 0;
        $maintenancePending = 0;
        $maintenanceInProgress = 0;
        $maintenanceCompleted = 0;

        if ($this->relationLoaded('maintenances')) {

            $maintenanceTotal = $this->maintenances->count();

            $maintenancePending = $this->maintenances
                ->where('status', 'pending')
                ->count();

            $maintenanceInProgress = $this->maintenances
                ->where('status', 'in_progress')
                ->count();

            $maintenanceCompleted = $this->maintenances
                ->where('status', 'completed')
                ->count();
        }

        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'property_id' => $this->property_id,

            'apartment_id' => $this->apartment_id,

            'unit_number' => $this->unit_number,

            'unit_name' => $this->unit_name,

            'full_unit_name' => $this->full_unit_name,

            'slug' => $this->slug,

            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */

            'property' => $property ? [

                'id' => $property->id,

                'title' => $property->title,

                'slug' => $property->slug,

                'property_code' => $property->property_code,

            ] : null,

            /*
            |--------------------------------------------------------------------------
            | APARTMENT
            |--------------------------------------------------------------------------
            */

            'apartment' => $apartment ? [

                'id' => $apartment->id,

                'name' => $apartment->name,

                'block' => $apartment->block,

                'total_floors' => $apartment->total_floors,

            ] : null,

            /*
            |--------------------------------------------------------------------------
            | UNIT DETAILS
            |--------------------------------------------------------------------------
            */

            'details' => [

                'type' => $this->type,

                'floor' => (int) ($this->floor ?? 0),

                'bedrooms' => (int) ($this->bedrooms ?? 0),

                'bathrooms' => (int) ($this->bathrooms ?? 0),

                'toilets' => (int) ($this->toilets ?? 0),

                'size' => (float) ($this->size ?? 0),

                'size_unit' => $this->size_unit,

            ],

            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */

            'pricing' => [

                'price' => (float) ($this->price ?? 0),

                'formatted_price' => $this->formatted_price,

                'deposit' => (float) ($this->deposit ?? 0),

                'service_charge' => (float) ($this->service_charge ?? 0),

            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */

            'features' => [

                'has_balcony' => (bool) $this->has_balcony,

                'has_wifi' => (bool) $this->has_wifi,

                'has_furnished' => (bool) $this->has_furnished,

                'has_air_conditioning' => (bool) $this->has_air_conditioning,

            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' => [

                'value' => $this->status,

                'label' => $this->status_label,

                'badge' => $this->status_badge,

                'is_vacant' => $this->isVacant(),

                'is_occupied' => $this->isOccupied(),

                'is_reserved' => $this->isReserved(),

                'is_maintenance' => $this->isUnderMaintenance(),

                'is_available' => $this->isAvailable(),

            ],

            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */

            'media' => [

                'thumbnail' => $this->thumbnail,

                'thumbnail_url' => $this->thumbnail_url,

            ],
                        /*
            |--------------------------------------------------------------------------
            | TENANT
            |--------------------------------------------------------------------------
            */

            'tenant' => $tenant ? [

                'id' => $tenant->id,

                'full_name' => trim(
                    ($tenant->first_name ?? '') . ' ' .
                    ($tenant->last_name ?? '')
                ),

                'email' => $tenant->email,

                'phone' => $tenant->phone,

            ] : null,

            /*
            |--------------------------------------------------------------------------
            | ACTIVE TENANCY
            |--------------------------------------------------------------------------
            */

            'tenancy' => $activeTenancy ? [

                'id' => $activeTenancy->id,

                'status' => $activeTenancy->status,

                'start_date' => $activeTenancy->start_date,

                'end_date' => $activeTenancy->end_date,

                'monthly_rent' => (float) (
                    $activeTenancy->monthly_rent ?? 0
                ),

            ] : null,

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE
            |--------------------------------------------------------------------------
            */

            'maintenance' => [

                'total' => $maintenanceTotal,

                'pending' => $maintenancePending,

                'in_progress' => $maintenanceInProgress,

                'completed' => $maintenanceCompleted,

            ],

            /*
            |--------------------------------------------------------------------------
            | INSIGHTS
            |--------------------------------------------------------------------------
            */

            'insights' => [

                'has_tenant' => $tenant !== null,

                'has_active_tenancy' => $activeTenancy !== null,

                'is_vacant' => $this->isVacant(),

                'is_occupied' => $this->isOccupied(),

                'is_reserved' => $this->isReserved(),

                'needs_maintenance' => $this->isUnderMaintenance(),

                'maintenance_requests' => $maintenanceTotal,

            ],

            /*
            |--------------------------------------------------------------------------
            | AVAILABILITY
            |--------------------------------------------------------------------------
            */

            'availability' => [

                'available_from' => optional(
                    $this->available_from
                )->toDateString(),

                'status' => $this->status,

            ],

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => DateHelper::format(
                $this->created_at
            ),

            'updated_at' => DateHelper::format(
                $this->updated_at
            ),

            'deleted_at' => DateHelper::format(
                $this->deleted_at
            ),

        ];
    }
}