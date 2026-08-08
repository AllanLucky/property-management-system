<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApartmentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | COUNTS
        |--------------------------------------------------------------------------
        */

        $totalUnits = $this->units_count
            ?? $this->total_units
            ?? 0;

        $totalFloors = $this->total_floors ?? 0;

        $occupiedUnits = $this->occupied_units_count ?? 0;

        $vacantUnits = $this->vacant_units_count ?? 0;

        $maintenanceUnits = $this->maintenance_units_count ?? 0;

        /*
        |--------------------------------------------------------------------------
        | STATISTICS
        |--------------------------------------------------------------------------
        */

        $occupancyRate = $this->occupancy_rate ?? (
            $totalUnits > 0
                ? round(($occupiedUnits / $totalUnits) * 100, 2)
                : 0
        );

        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'property_id' => $this->property_id,

            'name' => $this->name,

            'full_name' => $this->full_name,

            'slug' => $this->slug,

            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | BUILDING INFORMATION
            |--------------------------------------------------------------------------
            */

            'building' => [

                'block' => $this->block,

                // Apartment no longer has a floor field.
                'total_floors' => $totalFloors,

                'total_units' => $totalUnits,

            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' => [

                'value' => $this->status,

                'label' => $this->status_label,

                'is_active' => $this->isActive(),

                'is_inactive' => $this->isInactive(),

                'is_maintenance' => $this->isUnderMaintenance(),

                'is_archived' => $this->isArchived(),

            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */

            'features' => [

                'has_elevator' => (bool) $this->has_elevator,

                'has_backup_generator' => (bool) $this->has_backup_generator,

                'has_security' => (bool) $this->has_security,

                'has_parking' => (bool) $this->has_parking,

            ],

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */

            'property' => $this->whenLoaded('property', function () {

                return [

                    'id' => $this->property->id,

                    'title' => $this->property->title,

                    'slug' => $this->property->slug,

                    'property_code' => $this->property->property_code,

                    'property_title' => $this->property_title,

                ];

            }),

            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */

            'media' => [

                'thumbnail' => $this->thumbnail,

                // Uses Apartment model accessor.
                'thumbnail_url' => $this->thumbnail_url,

                'thumbnail_public_id' => $this->thumbnail_public_id,

            ],

                        /*
            |--------------------------------------------------------------------------
            | COUNTS
            |--------------------------------------------------------------------------
            */

            'counts' => [

                'floors' => $totalFloors,

                'units' => $totalUnits,

                'occupied_units' => $occupiedUnits,

                'vacant_units' => $vacantUnits,

                'maintenance_units' => $maintenanceUnits,

            ],

            /*
            |--------------------------------------------------------------------------
            | STATISTICS
            |--------------------------------------------------------------------------
            */

            'statistics' => [

                'occupancy_rate' => $occupancyRate,

            ],

            /*
            |--------------------------------------------------------------------------
            | INSIGHTS
            |--------------------------------------------------------------------------
            */

            'insights' => [

                'has_vacancy' => $this->hasVacantUnits(),

                'has_occupied_units' => $this->hasOccupiedUnits(),

                'fully_occupied' => $this->isFull(),

                'is_empty' => $totalUnits === 0,

                'needs_attention' => $maintenanceUnits > 0,

            ],

            /*
            |--------------------------------------------------------------------------
            | API LINKS (Optional)
            |--------------------------------------------------------------------------
            |
            | Uncomment these when the corresponding routes exist.
            |
            */

            // 'links' => [
            //
            //     'self' => route('apartments.show', $this->slug),
            //
            //     'property' => route(
            //         'properties.show',
            //         $this->property_id
            //     ),
            //
            //     'units' => route(
            //         'apartments.units.index',
            //         $this->slug
            //     ),
            //
            // ],

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at?->toDateTimeString(),

            'updated_at' => $this->updated_at?->toDateTimeString(),

            'deleted_at' => $this->deleted_at?->toDateTimeString(),

        ];
    }
}