<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AreaResource extends JsonResource
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
            | IDENTIFICATION
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'code' => $this->code,

            /*
            |--------------------------------------------------------------------------
            | LOCATION HIERARCHY
            |--------------------------------------------------------------------------
            */

            'country_id' => $this->country_id,
            'region_id' => $this->region_id,
            'county_id' => $this->county_id,
            'city_id' => $this->city_id,

            /*
            |--------------------------------------------------------------------------
            | COUNTRY
            |--------------------------------------------------------------------------
            */

            'country' => $this->whenLoaded(
                'country',
                fn () => $this->country ? [
                    'id' => $this->country->id,
                    'name' => $this->country->name,
                    'code' => $this->country->code,
                    'is_active' => (bool) $this->country->is_active,
                    'status_label' => $this->country->is_active
                        ? 'Active'
                        : 'Inactive',
                ] : null
            ),

            /*
            |--------------------------------------------------------------------------
            | REGION
            |--------------------------------------------------------------------------
            */

            'region' => $this->whenLoaded(
                'region',
                fn () => $this->region ? [
                    'id' => $this->region->id,
                    'country_id' => $this->region->country_id,
                    'name' => $this->region->name,
                    'code' => $this->region->code,
                    'is_active' => (bool) $this->region->is_active,
                    'is_active_label' => $this->region->is_active
                        ? 'Active'
                        : 'Inactive',
                ] : null
            ),

            /*
            |--------------------------------------------------------------------------
            | COUNTY
            |--------------------------------------------------------------------------
            */

            'county' => $this->whenLoaded(
                'county',
                fn () => $this->county ? [
                    'id' => $this->county->id,
                    'country_id' => $this->county->country_id,
                    'region_id' => $this->county->region_id,
                    'name' => $this->county->name,
                    'code' => $this->county->code,
                    'is_active' => (bool) $this->county->is_active,
                    'status_label' => $this->county->is_active
                        ? 'Active'
                        : 'Inactive',
                ] : null
            ),

            /*
            |--------------------------------------------------------------------------
            | CITY
            |--------------------------------------------------------------------------
            */

            'city' => $this->whenLoaded(
                'city',
                fn () => $this->city ? [
                    'id' => $this->city->id,
                    'country_id' => $this->city->country_id,
                    'region_id' => $this->city->region_id,
                    'county_id' => $this->city->county_id,
                    'name' => $this->city->name,
                    'slug' => $this->city->slug,
                    'code' => $this->city->code,
                    'is_active' => (bool) $this->city->is_active,
                    'status_label' => $this->city->is_active
                        ? 'Active'
                        : 'Inactive',
                ] : null
            ),

            /*
            |--------------------------------------------------------------------------
            | GEOGRAPHIC COORDINATES
            |--------------------------------------------------------------------------
            */

            'latitude' => $this->latitude !== null
                ? (float) $this->latitude
                : null,

            'longitude' => $this->longitude !== null
                ? (float) $this->longitude
                : null,

            'coordinates' => [
                'latitude' => $this->latitude !== null
                    ? (float) $this->latitude
                    : null,

                'longitude' => $this->longitude !== null
                    ? (float) $this->longitude
                    : null,
            ],

            /*
            |--------------------------------------------------------------------------
            | AREA STATUS
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
            | LOCATION DISPLAY
            |--------------------------------------------------------------------------
            */

            'full_location' => $this->when(
                $this->relationLoaded('city') &&
                $this->relationLoaded('county') &&
                $this->relationLoaded('region') &&
                $this->relationLoaded('country'),

                function () {
                    return collect([
                        $this->name,
                        $this->city?->name,
                        $this->county?->name,
                        $this->region?->name,
                        $this->country?->name,
                    ])
                        ->filter()
                        ->unique()
                        ->implode(', ');
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | PROPERTY INFORMATION
            |--------------------------------------------------------------------------
            */

            'properties_count' => $this->whenCounted('properties'),

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
