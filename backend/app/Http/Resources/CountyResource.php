<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CountyResource extends JsonResource
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
                fn () => [
                    'id' => $this->country?->id,
                    'name' => $this->country?->name,
                    'code' => $this->country?->code,
                    'slug' => $this->country?->slug,
                ]
            ),

            /*
            |--------------------------------------------------------------------------
            | REGION INFORMATION
            |--------------------------------------------------------------------------
            */

            'region_id' => $this->region_id,

            'region' => $this->whenLoaded(
                'region',
                fn () => [
                    'id' => $this->region?->id,
                    'name' => $this->region?->name,
                    'slug' => $this->region?->slug,
                    'code' => $this->region?->code,
                ]
            ),

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP COUNTS
            |--------------------------------------------------------------------------
            */

            'cities_count' => $this->whenCounted('cities'),

            'areas_count' => $this->whenCounted('areas'),

            'properties_count' => $this->whenCounted('properties'),

            /*
            |--------------------------------------------------------------------------
            | STATUS INFORMATION
            |--------------------------------------------------------------------------
            */

            'is_active' => (bool) $this->is_active,

            'status' => $this->is_active
                ? 'active'
                : 'inactive',

            'status_label' => $this->status_label,

            /*
            |--------------------------------------------------------------------------
            | DEPENDENCIES
            |--------------------------------------------------------------------------
            */

            'has_cities' => $this->whenCounted(
                'cities',
                fn () => $this->cities_count > 0
            ),

            'has_areas' => $this->whenCounted(
                'areas',
                fn () => $this->areas_count > 0
            ),

            'has_properties' => $this->whenCounted(
                'properties',
                fn () => $this->properties_count > 0
            ),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),

            'deleted_at' => $this->when(
                $this->resource->trashed(),
                fn () => $this->deleted_at?->toISOString()
            ),
        ];
    }
}
