<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegionResource extends JsonResource
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
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'name' => $this->name,

            'slug' => $this->slug,

            'code' => $this->code,

            /*
            |--------------------------------------------------------------------------
            | COUNTRY INFORMATION
            |--------------------------------------------------------------------------
            */

            'country_id' => $this->country_id,

            'country' => $this->whenLoaded(
                'country',
                fn () => $this->country ? [
                    'id' => $this->country->id,

                    'name' => $this->country->name,

                    'slug' => $this->country->slug,

                    'code' => $this->country->code,

                    'phone_code' => $this->country->phone_code,

                    'currency' => $this->country->currency,

                    'is_active' => (bool) $this->country->is_active,

                    'status_label' => $this->country->is_active
                        ? 'Active'
                        : 'Inactive',

                    'display_name' => $this->country->display_name,

                    'name_with_code' => $this->country->name_with_code,
                ] : null
            ),

            /*
            |--------------------------------------------------------------------------
            | FULL LOCATION
            |--------------------------------------------------------------------------
            */

            'full_location' => $this->when(
                $this->relationLoaded('country'),

                fn () => collect([
                    $this->name,
                    $this->country?->name,
                ])
                    ->filter()
                    ->unique()
                    ->implode(', ')
            ),

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
            | RELATIONSHIP COUNTS
            |--------------------------------------------------------------------------
            */

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
            | DEPENDENCY INFORMATION
            |--------------------------------------------------------------------------
            */

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
            | RELATED RECORDS
            |--------------------------------------------------------------------------
            */

            'counties' => CountyResource::collection(
                $this->whenLoaded('counties')
            ),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
