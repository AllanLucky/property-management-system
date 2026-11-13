<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CountryResource extends JsonResource
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
            | PRIMARY INFORMATION
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'name' => $this->name,

            'slug' => $this->slug,

            /*
            |--------------------------------------------------------------------------
            | COUNTRY IDENTIFICATION
            |--------------------------------------------------------------------------
            */

            'code' => $this->code,

            'phone_code' => $this->phone_code,

            /*
            |--------------------------------------------------------------------------
            | CURRENCY INFORMATION
            |--------------------------------------------------------------------------
            */

            'currency' => $this->currency,

            /*
            |--------------------------------------------------------------------------
            | DISPLAY INFORMATION
            |--------------------------------------------------------------------------
            */

            'display_name' => $this->display_name,

            'name_with_code' => $this->name_with_code,

            /*
            |--------------------------------------------------------------------------
            | STATUS INFORMATION
            |--------------------------------------------------------------------------
            */

            'is_active' => (bool) $this->is_active,

            'status' => $this->is_active
                ? 'active'
                : 'inactive',

            'status_label' => $this->is_active
                ? 'Active'
                : 'Inactive',

            /*
            |--------------------------------------------------------------------------
            | RELATED RECORD COUNTS
            |--------------------------------------------------------------------------
            */

            'regions_count' => $this->whenCounted(
                'regions'
            ),

            'counties_count' => $this->whenCounted(
                'counties'
            ),

            'cities_count' => $this->whenCounted(
                'cities'
            ),

            'areas_count' => $this->whenCounted(
                'areas'
            ),

            'properties_count' => $this->whenCounted(
                'properties'
            ),

            /*
            |--------------------------------------------------------------------------
            | RELATED RECORD AVAILABILITY
            |--------------------------------------------------------------------------
            */

            'has_regions' => $this->whenCounted(
                'regions',
                fn () => (int) $this->regions_count > 0
            ),

            'has_counties' => $this->whenCounted(
                'counties',
                fn () => (int) $this->counties_count > 0
            ),

            'has_cities' => $this->whenCounted(
                'cities',
                fn () => (int) $this->cities_count > 0
            ),

            'has_areas' => $this->whenCounted(
                'areas',
                fn () => (int) $this->areas_count > 0
            ),

            'has_properties' => $this->whenCounted(
                'properties',
                fn () => (int) $this->properties_count > 0
            ),

            /*
            |--------------------------------------------------------------------------
            | REGIONS
            |--------------------------------------------------------------------------
            */

            'regions' => RegionResource::collection(
                $this->whenLoaded('regions')
            ),

            /*
            |--------------------------------------------------------------------------
            | COUNTIES
            |--------------------------------------------------------------------------
            */

            'counties' => CountyResource::collection(
                $this->whenLoaded('counties')
            ),

            /*
            |--------------------------------------------------------------------------
            | CITIES
            |--------------------------------------------------------------------------
            */

            'cities' => CityResource::collection(
                $this->whenLoaded('cities')
            ),

            /*
            |--------------------------------------------------------------------------
            | AREAS
            |--------------------------------------------------------------------------
            */

            'areas' => AreaResource::collection(
                $this->whenLoaded('areas')
            ),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),

            /*
            |--------------------------------------------------------------------------
            | SOFT DELETE INFORMATION
            |--------------------------------------------------------------------------
            */

            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}
