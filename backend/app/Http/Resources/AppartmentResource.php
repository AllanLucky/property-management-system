<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ApartmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | UNITS (SAFE COLLECTION)
        |--------------------------------------------------------------------------
        */
        $units = $this->relationLoaded('units')
            ? collect($this->units)
            : collect();

        $totalUnits = $units->count();
        $occupiedUnits = $units->where('status', 'occupied')->count();
        $vacantUnits = $units->where('status', 'vacant')->count();
        $maintenanceUnits = $units->where('status', 'maintenance')->count();

        $occupancyRate = $totalUnits > 0
            ? round(($occupiedUnits / $totalUnits) * 100, 2)
            : 0;

        /*
        |--------------------------------------------------------------------------
        | BASIC INFO
        |--------------------------------------------------------------------------
        */
        return [

            'id'          => $this->id,
            'name'        => $this->name,
            'slug'        => $this->slug,
            'code'        => $this->code,
            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | STRUCTURE
            |--------------------------------------------------------------------------
            */
            'structure' => [
                'total_floors' => $this->total_floors,
                'total_units'  => $this->total_units,
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            'status' => [
                'current' => $this->status,

                'is_active'      => $this->status === 'active',
                'is_maintenance' => $this->status === 'maintenance',
                'is_inactive'    => $this->status === 'inactive',
            ],

            /*
            |--------------------------------------------------------------------------
            | PROPERTY (RELATION)
            |--------------------------------------------------------------------------
            */
            'property' => $this->whenLoaded('property', function () {
                return [
                    'id'   => $this->property->id,
                    'name' => $this->property->name,

                    'location' => [
                        'full' => $this->property->full_location,
                        'lat'  => $this->property->latitude,
                        'lng'  => $this->property->longitude,
                    ],

                    'type' => $this->property->type,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */
            'media' => [
                'image'     => $this->image,
                'public_id' => $this->image_public_id,
                'url'       => $this->image
                    ? $this->image
                    : asset('images/default-apartment.png'),
            ],

            /*
            |--------------------------------------------------------------------------
            | UNITS
            |--------------------------------------------------------------------------
            */
            'units' => $this->whenLoaded('units', function () use ($units) {
                return $units->map(function ($unit) {

                    return [
                        'id'          => $unit->id,
                        'name'        => $unit->name,
                        'unit_number' => $unit->unit_number,
                        'type'        => $unit->type,

                        'status' => $unit->status,

                        'details' => [
                            'floor'     => $unit->floor,
                            'bedrooms'  => $unit->bedrooms,
                            'bathrooms' => $unit->bathrooms,
                            'size'      => $unit->size,
                        ],

                        'pricing' => [
                            'rent_amount' => (float) $unit->rent_amount,
                            'rent_label'  => number_format($unit->rent_amount, 2),
                        ],

                        'flags' => [
                            'is_occupied'          => $unit->status === 'occupied',
                            'is_vacant'            => $unit->status === 'vacant',
                            'is_reserved'          => $unit->status === 'reserved',
                            'is_under_maintenance' => $unit->status === 'maintenance',
                        ],
                    ];
                });
            }),

            /*
            |--------------------------------------------------------------------------
            | STATISTICS
            |--------------------------------------------------------------------------
            */
            'stats' => [
                'total_units'       => $totalUnits,
                'occupied_units'    => $occupiedUnits,
                'vacant_units'      => $vacantUnits,
                'maintenance_units' => $maintenanceUnits,
                'occupancy_rate'    => $occupancyRate,
            ],

            /*
            |--------------------------------------------------------------------------
            | INSIGHTS
            |--------------------------------------------------------------------------
            */
            'insights' => [
                'has_vacancy'    => $vacantUnits > 0,
                'fully_occupied' => $vacantUnits === 0 && $totalUnits > 0,
                'is_empty'       => $totalUnits === 0,
            ],

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