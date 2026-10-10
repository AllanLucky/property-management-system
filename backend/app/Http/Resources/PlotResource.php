<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlotResource extends JsonResource
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
            | Plot Identification
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'property_id' => $this->property_id,
            'code' => $this->code,
            'title' => $this->title,
            'title_number' => $this->title_number,
            'plot_number' => $this->plot_number,

            /*
            |--------------------------------------------------------------------------
            | Plot Size
            |--------------------------------------------------------------------------
            */
            'size' => $this->size,
            'size_unit' => $this->size_unit,
            'formatted_size' => $this->formatted_size,

            /*
            |--------------------------------------------------------------------------
            | Description
            |--------------------------------------------------------------------------
            */
            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | Location IDs
            |--------------------------------------------------------------------------
            |
            | Keep the foreign keys available for filtering, editing and
            | frontend selection components.
            |
            */
            'country_id' => $this->country_id,
            'region_id' => $this->region_id,
            'county_id' => $this->county_id,
            'city_id' => $this->city_id,
            'area_id' => $this->area_id,

            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            |
            | Keep this intentionally flat.
            |
            | Do not return nested:
            | area -> city -> county -> region -> country
            |
            | This keeps the Plot API response lightweight and avoids
            | duplicating the same location data several times.
            |
            */
            'location' => [
                'country' => $this->whenLoaded('country', function () {
                    return $this->country
                        ? [
                            'id' => $this->country->id,
                            'name' => $this->country->name,
                            'code' => $this->country->code ?? null,
                            'currency' => $this->country->currency ?? null,
                        ]
                        : null;
                }),

                'region' => $this->whenLoaded('region', function () {
                    return $this->region
                        ? [
                            'id' => $this->region->id,
                            'name' => $this->region->name,
                            'code' => $this->region->code ?? null,
                        ]
                        : null;
                }),

                'county' => $this->whenLoaded('county', function () {
                    return $this->county
                        ? [
                            'id' => $this->county->id,
                            'name' => $this->county->name,
                            'code' => $this->county->code ?? null,
                        ]
                        : null;
                }),

                'city' => $this->whenLoaded('city', function () {
                    return $this->city
                        ? [
                            'id' => $this->city->id,
                            'name' => $this->city->name,
                            'code' => $this->city->code ?? null,
                        ]
                        : null;
                }),

                'area' => $this->whenLoaded('area', function () {
                    return $this->area
                        ? [
                            'id' => $this->area->id,
                            'name' => $this->area->name,
                            'code' => $this->area->code ?? null,
                        ]
                        : null;
                }),

                'address' => $this->address,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,

                /*
                |--------------------------------------------------------------------------
                | Human-readable Location
                |--------------------------------------------------------------------------
                */
                'full_location' => $this->buildFullLocation(),
            ],

            /*
            |--------------------------------------------------------------------------
            | Pricing
            |--------------------------------------------------------------------------
            */
            'asking_price' => $this->asking_price,
            'currency' => $this->currency ?? 'KES',
            'formatted_price' => $this->formatted_price,

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            'status' => $this->status,
            'is_active' => (bool) $this->is_active,
            'is_available' => $this->isAvailable(),
            'is_reserved' => $this->isReserved(),
            'is_sold' => $this->isSold(),

            /*
            |--------------------------------------------------------------------------
            | Related Property
            |--------------------------------------------------------------------------
            */
            'property' => $this->whenLoaded('property', function () {
                return $this->property
                    ? [
                        'id' => $this->property->id,
                        'name' => $this->property->name ?? null,
                        'code' => $this->property->code ?? null,
                    ]
                    : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | Active Sale
            |--------------------------------------------------------------------------
            */
            'active_sale' => $this->whenLoaded('activeSale', function () {
                return $this->activeSale
                    ? [
                        'id' => $this->activeSale->id,
                        'sale_number' => $this->activeSale->sale_number ?? null,
                        'status' => $this->activeSale->status ?? null,
                    ]
                    : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /**
     * Build a compact human-readable location string.
     */
    private function buildFullLocation(): ?string
    {
        $parts = array_filter([
            $this->whenLoaded(
                'area',
                fn () => $this->area?->name
            ),
            $this->whenLoaded(
                'city',
                fn () => $this->city?->name
            ),
            $this->whenLoaded(
                'county',
                fn () => $this->county?->name
            ),
            $this->whenLoaded(
                'region',
                fn () => $this->region?->name
            ),
            $this->whenLoaded(
                'country',
                fn () => $this->country?->name
            ),
        ], fn ($value) => is_string($value) && trim($value) !== '');

        return !empty($parts)
            ? implode(', ', array_values(array_unique($parts)))
            : ($this->address ?: null);
    }
}
