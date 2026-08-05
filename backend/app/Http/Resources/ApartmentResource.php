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

        $totalFloors = $this->floors_count
            ?? $this->total_floors
            ?? 0;

        $occupiedUnits = $this->occupied_units_count ?? 0;
        $vacantUnits = $this->vacant_units_count ?? 0;
        $maintenanceUnits = $this->maintenance_units_count ?? 0;


        /*
        |--------------------------------------------------------------------------
        | STATISTICS
        |--------------------------------------------------------------------------
        */
        $occupancyRate = $totalUnits > 0
            ? round(($occupiedUnits / $totalUnits) * 100, 2)
            : 0;


        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'property_id' => $this->property_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,


            /*
            |--------------------------------------------------------------------------
            | BUILDING INFORMATION
            |--------------------------------------------------------------------------
            */
            'building' => [
                'block' => $this->block,
                'floor' => $this->floor,
                'total_floors' => $totalFloors,
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
                ];

            }),


            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */
            'media' => [
                'thumbnail' => $this->thumbnail,

                'thumbnail_url' => $this->thumbnail
                    ? asset('storage/' . ltrim($this->thumbnail, '/'))
                    : null,

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

                'has_vacancy' => $vacantUnits > 0,

                'fully_occupied' =>
                    $totalUnits > 0 && $vacantUnits === 0,

                'is_empty' =>
                    $totalUnits === 0,

                'needs_attention' =>
                    $maintenanceUnits > 0,

            ],


            /*
            |--------------------------------------------------------------------------
            | API LINKS
            |--------------------------------------------------------------------------
            // */
            // 'links' => [

            //     'self' => route(
            //         'apartments.show',
            //         $this->id
            //     ),

            //     'property' => $this->property_id
            //         ? route(
            //             'properties.show',
            //             $this->property_id
            //         )
            //         : null,


            //     'units' => route(
            //         'apartments.units.index',
            //         $this->id
            //     ),


            //     'occupied_units' => route(
            //         'apartments.units.index',
            //         [
            //             'apartment' => $this->id,
            //             'status' => 'occupied'
            //         ]
            //     ),


            //     'vacant_units' => route(
            //         'apartments.units.index',
            //         [
            //             'apartment' => $this->id,
            //             'status' => 'vacant'
            //         ]
            //     ),


            //     'maintenance_units' => route(
            //         'apartments.units.index',
            //         [
            //             'apartment' => $this->id,
            //             'status' => 'maintenance'
            //         ]
            //     ),


            //     'analytics' => route(
            //         'apartments.analytics',
            //         $this->id
            //     ),


            //     'reviews' => $this->property_id
            //         ? route(
            //             'properties.reviews.index',
            //             $this->property_id
            //         )
            //         : null,


            //     'visits' => $this->property_id
            //         ? route(
            //             'properties.visits.index',
            //             $this->property_id
            //         )
            //         : null,


            //     'favorites' => $this->property_id
            //         ? route(
            //             'properties.favorites.index',
            //             $this->property_id
            //         )
            //         : null,

            // ],


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toDateTimeString(),

            'updated_at' => $this->updated_at?->toDateTimeString(),

        ];
    }
}