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
            | Primary Information
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,

            'name' => $this->name,

            'slug' => $this->slug,

            /*
            |--------------------------------------------------------------------------
            | Country Identification
            |--------------------------------------------------------------------------
            */
            'code' => $this->code,

            'phone_code' => $this->phone_code,

            /*
            |--------------------------------------------------------------------------
            | Currency Information
            |--------------------------------------------------------------------------
            */
            'currency' => $this->currency,

            /*
            |--------------------------------------------------------------------------
            | Status Information
            |--------------------------------------------------------------------------
            */
            'is_active' => (bool) $this->is_active,

            'status' => $this->is_active
                ? 'active'
                : 'inactive',

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */
            'regions_count' => $this->whenCounted('regions'),

            'counties_count' => $this->whenCounted('counties'),

            'cities_count' => $this->whenCounted('cities'),

            'areas_count' => $this->whenCounted('areas'),

            'properties_count' => $this->whenCounted('properties'),

            /*
            |--------------------------------------------------------------------------
            | Relationships Data
            |--------------------------------------------------------------------------
            */
            'regions' => RegionResource::collection(
                $this->whenLoaded('regions')
            ),

            'counties' => CountyResource::collection(
                $this->whenLoaded('counties')
            ),

            'cities' => CityResource::collection(
                $this->whenLoaded('cities')
            ),

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toISOString(),

            'updated_at' => $this->updated_at?->toISOString(),

            /*
            |--------------------------------------------------------------------------
            | Soft Delete Information
            |--------------------------------------------------------------------------
            */
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}