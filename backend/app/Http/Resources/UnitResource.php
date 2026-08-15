<?php

namespace App\Http\Resources;

use App\Helpers\DateHelper;
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

        $property = $this->relationLoaded('property')
            ? $this->property
            : null;

        $apartment = $this->relationLoaded('apartment')
            ? $this->apartment
            : null;

        /*
        |--------------------------------------------------------------------------
        | ACTIVE TENANCY
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
        | TENANCY STATISTICS
        |--------------------------------------------------------------------------
        */

        $tenancyTotal = 0;
        $activeTenancyCount = 0;
        $pendingTenancyCount = 0;
        $expiredTenancyCount = 0;
        $terminatedTenancyCount = 0;
        $cancelledTenancyCount = 0;

        if ($this->relationLoaded('tenancies')) {
            $tenancyTotal = $this->tenancies->count();

            $activeTenancyCount = $this->tenancies
                ->where('status', 'active')
                ->count();

            $pendingTenancyCount = $this->tenancies
                ->where('status', 'pending')
                ->count();

            $expiredTenancyCount = $this->tenancies
                ->where('status', 'expired')
                ->count();

            $terminatedTenancyCount = $this->tenancies
                ->where('status', 'terminated')
                ->count();

            $cancelledTenancyCount = $this->tenancies
                ->where('status', 'cancelled')
                ->count();
        }

        /*
        |--------------------------------------------------------------------------
        | MAINTENANCE STATISTICS
        |--------------------------------------------------------------------------
        */

        $maintenanceTotal = 0;
        $maintenancePending = 0;
        $maintenanceAssigned = 0;
        $maintenanceInProgress = 0;
        $maintenanceOnHold = 0;
        $maintenanceCompleted = 0;
        $maintenanceCancelled = 0;
        $maintenanceRejected = 0;

        if ($this->relationLoaded('maintenances')) {
            $maintenanceTotal = $this->maintenances->count();

            $maintenancePending = $this->maintenances
                ->where('status', 'pending')
                ->count();

            $maintenanceAssigned = $this->maintenances
                ->where('status', 'assigned')
                ->count();

            $maintenanceInProgress = $this->maintenances
                ->where('status', 'in_progress')
                ->count();

            $maintenanceOnHold = $this->maintenances
                ->where('status', 'on_hold')
                ->count();

            $maintenanceCompleted = $this->maintenances
                ->where('status', 'completed')
                ->count();

            $maintenanceCancelled = $this->maintenances
                ->where('status', 'cancelled')
                ->count();

            $maintenanceRejected = $this->maintenances
                ->where('status', 'rejected')
                ->count();
        }

        /*
        |--------------------------------------------------------------------------
        | OPEN MAINTENANCE
        |--------------------------------------------------------------------------
        */

        $openMaintenance =
            $maintenancePending +
            $maintenanceAssigned +
            $maintenanceInProgress +
            $maintenanceOnHold;

        /*
        |--------------------------------------------------------------------------
        | MAINTENANCE COSTS
        |--------------------------------------------------------------------------
        */

        $maintenanceEstimatedCost = 0;
        $maintenanceActualCost = 0;

        if ($this->relationLoaded('maintenances')) {
            $maintenanceEstimatedCost = (float) $this->maintenances
                ->sum(
                    fn ($maintenance) =>
                        (float) ($maintenance->estimated_cost ?? 0)
                );

            $maintenanceActualCost = (float) $this->maintenances
                ->sum(
                    fn ($maintenance) =>
                        (float) ($maintenance->actual_cost ?? 0)
                );
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS FLAGS
        |--------------------------------------------------------------------------
        */

        $isVacant = method_exists($this->resource, 'isVacant')
            ? $this->isVacant()
            : $this->status === 'vacant';

        $isOccupied = method_exists($this->resource, 'isOccupied')
            ? $this->isOccupied()
            : $this->status === 'occupied';

        $isReserved = method_exists($this->resource, 'isReserved')
            ? $this->isReserved()
            : $this->status === 'reserved';

        $isMaintenance = method_exists(
            $this->resource,
            'isUnderMaintenance'
        )
            ? $this->isUnderMaintenance()
            : $this->status === 'maintenance';

        $isAvailable = method_exists($this->resource, 'isAvailable')
            ? $this->isAvailable()
            : $this->status === 'vacant';

        /*
        |--------------------------------------------------------------------------
        | STATUS LABEL
        |--------------------------------------------------------------------------
        */

        $statusLabel = $this->status_label
            ?? ucwords(
                str_replace(
                    '_',
                    ' ',
                    $this->status ?? 'unknown'
                )
            );

        /*
        |--------------------------------------------------------------------------
        | STATUS BADGE
        |--------------------------------------------------------------------------
        */

        $statusBadge = $this->status_badge
            ?? $this->status;

        /*
        |--------------------------------------------------------------------------
        | TENANT NAME
        |--------------------------------------------------------------------------
        */

        $tenantName = null;

        if ($tenant) {
            $tenantName = trim(
                ($tenant->first_name ?? '') . ' ' .
                ($tenant->last_name ?? '') . ' ' .
                ($tenant->other_names ?? '')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UNIT FLOOR
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | Floor belongs to the UNIT, not the APARTMENT.
        |
        */

        $unitFloor = $this->floor !== null
            ? (int) $this->floor
            : null;

        /*
        |--------------------------------------------------------------------------
        | RETURN RESOURCE
        |--------------------------------------------------------------------------
        */

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
            | UNIT FLOOR
            |--------------------------------------------------------------------------
            |
            | Expose floor at the top level so the frontend can simply use:
            |
            | unit.floor
            |
            */

            'floor' => $unitFloor,

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */

            'property' => $property
                ? [
                    'id' => $property->id,
                    'title' => $property->title,
                    'slug' => $property->slug,
                    'property_code' => $property->property_code,
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | APARTMENT
            |--------------------------------------------------------------------------
            |
            | NOTE:
            | Apartment does NOT contain floor.
            |
            */

            'apartment' => $apartment
                ? [
                    'id' => $apartment->id,
                    'name' => $apartment->name,
                    'slug' => $apartment->slug,
                    'block' => $apartment->block,
                    'total_floors' => $apartment->total_floors,
                    'total_units' => $apartment->total_units,
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | UNIT DETAILS
            |--------------------------------------------------------------------------
            */

            'details' => [
                'type' => $this->type,

                'floor' => $unitFloor,

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

                'service_charge' => (float) (
                    $this->service_charge ?? 0
                ),

                'currency' => $this->currency ?? 'KES',
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

                'has_air_conditioning' =>
                    (bool) $this->has_air_conditioning,

                'has_parking' =>
                    (bool) ($this->has_parking ?? false),

                'has_security' =>
                    (bool) ($this->has_security ?? false),

                'has_backup_generator' =>
                    (bool) ($this->has_backup_generator ?? false),
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' => [
                'value' => $this->status,

                'label' => $statusLabel,

                'badge' => $statusBadge,

                'is_vacant' => $isVacant,

                'is_occupied' => $isOccupied,

                'is_reserved' => $isReserved,

                'is_maintenance' => $isMaintenance,

                'is_available' => $isAvailable,
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

            'tenant' => $tenant
                ? [
                    'id' => $tenant->id,

                    'tenant_number' =>
                        $tenant->tenant_number,

                    'full_name' => $tenantName,

                    'first_name' =>
                        $tenant->first_name,

                    'last_name' =>
                        $tenant->last_name,

                    'other_names' =>
                        $tenant->other_names,

                    'email' =>
                        $tenant->email,

                    'phone' =>
                        $tenant->phone,

                    'status' =>
                        $tenant->status,

                    'is_active' =>
                        (bool) $tenant->is_active,
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | ACTIVE TENANCY
            |--------------------------------------------------------------------------
            */

            'tenancy' => $activeTenancy
                ? [
                    'id' => $activeTenancy->id,

                    'tenancy_number' =>
                        $activeTenancy->tenancy_number,

                    'status' =>
                        $activeTenancy->status,

                    'start_date' =>
                        optional(
                            $activeTenancy->start_date
                        )->toDateString(),

                    'end_date' =>
                        optional(
                            $activeTenancy->end_date
                        )->toDateString(),

                    'move_in_date' =>
                        optional(
                            $activeTenancy->move_in_date
                        )->toDateString(),

                    'move_out_date' =>
                        optional(
                            $activeTenancy->move_out_date
                        )->toDateString(),

                    'rent_amount' => (float) (
                        $activeTenancy->rent_amount ?? 0
                    ),

                    'deposit_amount' => (float) (
                        $activeTenancy->deposit_amount ?? 0
                    ),

                    'service_charge' => (float) (
                        $activeTenancy->service_charge ?? 0
                    ),

                    'late_fee' => (float) (
                        $activeTenancy->late_fee ?? 0
                    ),

                    'payment_frequency' =>
                        $activeTenancy->payment_frequency,

                    'due_day' =>
                        $activeTenancy->due_day,

                    'is_active' =>
                        (bool) $activeTenancy->is_active,

                    'is_expired' =>
                        (bool) $activeTenancy->is_expired,

                    'is_currently_active' =>
                        (bool) $activeTenancy->is_currently_active,

                    'has_moved_in' =>
                        (bool) $activeTenancy->has_moved_in,

                    'has_moved_out' =>
                        (bool) $activeTenancy->has_moved_out,
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | TENANCY STATISTICS
            |--------------------------------------------------------------------------
            */

            'tenancy_statistics' => [
                'total' =>
                    $tenancyTotal,

                'active' =>
                    $activeTenancyCount,

                'pending' =>
                    $pendingTenancyCount,

                'expired' =>
                    $expiredTenancyCount,

                'terminated' =>
                    $terminatedTenancyCount,

                'cancelled' =>
                    $cancelledTenancyCount,
            ],

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE
            |--------------------------------------------------------------------------
            */

            'maintenance' => [
                'total' =>
                    $maintenanceTotal,

                'open' =>
                    $openMaintenance,

                'pending' =>
                    $maintenancePending,

                'assigned' =>
                    $maintenanceAssigned,

                'in_progress' =>
                    $maintenanceInProgress,

                'on_hold' =>
                    $maintenanceOnHold,

                'completed' =>
                    $maintenanceCompleted,

                'cancelled' =>
                    $maintenanceCancelled,

                'rejected' =>
                    $maintenanceRejected,

                'estimated_cost' =>
                    $maintenanceEstimatedCost,

                'actual_cost' =>
                    $maintenanceActualCost,
            ],

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE SUMMARY
            |--------------------------------------------------------------------------
            */

            'maintenance_summary' => [
                'has_maintenance' =>
                    $maintenanceTotal > 0,

                'has_open_maintenance' =>
                    $openMaintenance > 0,

                'needs_attention' =>
                    $openMaintenance > 0,

                'completion_rate' =>
                    $maintenanceTotal > 0
                        ? round(
                            (
                                $maintenanceCompleted /
                                $maintenanceTotal
                            ) * 100,
                            2
                        )
                        : 0,
            ],

            /*
            |--------------------------------------------------------------------------
            | INSIGHTS
            |--------------------------------------------------------------------------
            */

            'insights' => [
                'has_tenant' =>
                    $tenant !== null,

                'has_active_tenancy' =>
                    $activeTenancy !== null,

                'is_vacant' =>
                    $isVacant,

                'is_occupied' =>
                    $isOccupied,

                'is_reserved' =>
                    $isReserved,

                'needs_maintenance' =>
                    $isMaintenance,

                'has_open_maintenance' =>
                    $openMaintenance > 0,

                'maintenance_requests' =>
                    $maintenanceTotal,

                'has_rental_income' =>
                    $activeTenancy !== null &&
                    (float) (
                        $activeTenancy->rent_amount ?? 0
                    ) > 0,
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

                'status' =>
                    $this->status,

                'is_available' =>
                    $isAvailable,

                'is_vacant' =>
                    $isVacant,

                'is_occupied' =>
                    $isOccupied,

                'is_reserved' =>
                    $isReserved,
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
