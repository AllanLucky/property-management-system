<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CityResource extends JsonResource
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
            | LOCATION IDS
            |--------------------------------------------------------------------------
            */

            'country_id' => $this->country_id,

            'region_id' => $this->region_id,

            'county_id' => $this->county_id,

            /*
            |--------------------------------------------------------------------------
            | COUNTRY INFORMATION
            |--------------------------------------------------------------------------
            */

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
            | REGION INFORMATION
            |--------------------------------------------------------------------------
            */

            'region' => $this->whenLoaded(
                'region',
                fn () => $this->region ? [
                    'id' => $this->region->id,

                    'country_id' => $this->region->country_id,

                    'name' => $this->region->name,

                    'slug' => $this->region->slug,

                    'code' => $this->region->code,

                    'is_active' => (bool) $this->region->is_active,

                    'is_active_label' => $this->region->is_active
                        ? 'Active'
                        : 'Inactive',
                ] : null
            ),

            /*
            |--------------------------------------------------------------------------
            | COUNTY INFORMATION
            |--------------------------------------------------------------------------
            */

            'county' => $this->whenLoaded(
                'county',
                fn () => $this->county ? [
                    'id' => $this->county->id,

                    'country_id' => $this->county->country_id,

                    'region_id' => $this->county->region_id,

                    'name' => $this->county->name,

                    'slug' => $this->county->slug,

                    'code' => $this->county->code,

                    'is_active' => (bool) $this->county->is_active,

                    'status_label' => $this->county->is_active
                        ? 'Active'
                        : 'Inactive',
                ] : null
            ),

            /*
            |--------------------------------------------------------------------------
            | FULL LOCATION
            |--------------------------------------------------------------------------
            */

            'full_location' => $this->when(
                $this->relationLoaded('country')
                && $this->relationLoaded('region')
                && $this->relationLoaded('county'),

                fn () => collect([
                    $this->name,
                    $this->county?->name,
                    $this->region?->name,
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
            | RELATED RECORD COUNTS
            |--------------------------------------------------------------------------
            */

            'areas_count' => $this->whenCounted(
                'areas'
            ),

            'properties_count' => $this->whenCounted(
                'properties'
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
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),

            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}
