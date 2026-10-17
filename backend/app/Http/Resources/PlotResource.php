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
            */
            'location' => [
                'country' => $this->whenLoaded(
                    'country',
                    fn () => $this->country
                        ? [
                            'id' => $this->country->id,
                            'name' => $this->country->name,
                            'code' => $this->country->code ?? null,
                            'currency' => $this->country->currency ?? null,
                        ]
                        : null
                ),

                'region' => $this->whenLoaded(
                    'region',
                    fn () => $this->region
                        ? [
                            'id' => $this->region->id,
                            'name' => $this->region->name,
                            'code' => $this->region->code ?? null,
                        ]
                        : null
                ),

                'county' => $this->whenLoaded(
                    'county',
                    fn () => $this->county
                        ? [
                            'id' => $this->county->id,
                            'name' => $this->county->name,
                            'code' => $this->county->code ?? null,
                        ]
                        : null
                ),

                'city' => $this->whenLoaded(
                    'city',
                    fn () => $this->city
                        ? [
                            'id' => $this->city->id,
                            'name' => $this->city->name,
                            'code' => $this->city->code ?? null,
                        ]
                        : null
                ),

                'area' => $this->whenLoaded(
                    'area',
                    fn () => $this->area
                        ? [
                            'id' => $this->area->id,
                            'name' => $this->area->name,
                            'code' => $this->area->code ?? null,
                        ]
                        : null
                ),

                'address' => $this->address,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
                'full_location' => $this->buildFullLocation(),
            ],

            /*
            |--------------------------------------------------------------------------
            | Pricing
            |--------------------------------------------------------------------------
            */
            'asking_price' => $this->asking_price,
            'currency' => $this->currency ?: 'KES',
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
            'is_unavailable' => $this->isUnavailable(),

            /*
            |--------------------------------------------------------------------------
            | Related Property
            |--------------------------------------------------------------------------
            */
            'property' => $this->whenLoaded(
                'property',
                fn () => $this->property
                    ? [
                        'id' => $this->property->id,
                        'name' => $this->property->name ?? null,
                        'code' => $this->property->code ?? null,
                    ]
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Active Sale
            |--------------------------------------------------------------------------
            */
            'active_sale' => $this->whenLoaded(
                'activeSale',
                fn () => $this->activeSale
                    ? [
                        'id' => $this->activeSale->id,
                        'sale_number' => $this->activeSale->sale_number,
                        'status' => $this->activeSale->status,
                        'sale_date' => $this->activeSale->sale_date?->toDateString(),
                        'sale_price' => $this->activeSale->sale_price,
                        'currency' => $this->activeSale->currency ?: 'KES',
                        'balance' => $this->activeSale->balance,
                        'is_fully_paid' => (bool) $this->activeSale->is_fully_paid,
                    ]
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Completed Sale
            |--------------------------------------------------------------------------
            */
            'completed_sale' => $this->whenLoaded(
                'completedSale',
                fn () => $this->completedSale
                    ? [
                        'id' => $this->completedSale->id,
                        'sale_number' => $this->completedSale->sale_number,
                        'status' => $this->completedSale->status,
                        'sale_date' => $this->completedSale->sale_date?->toDateString(),
                        'completion_date' => $this->completedSale->completion_date?->toDateString(),
                        'sale_price' => $this->completedSale->sale_price,
                        'discount_amount' => $this->completedSale->discount_amount,
                        'net_sale_price' => $this->completedSale->net_sale_price,
                        'amount_paid' => $this->completedSale->amount_paid,
                        'balance' => $this->completedSale->balance,
                        'currency' => $this->completedSale->currency ?: 'KES',
                        'is_fully_paid' => (bool) $this->completedSale->is_fully_paid,
                    ]
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | Sales Summary
            |--------------------------------------------------------------------------
            |
            | These counts are only included when the sales relationship
            | has been loaded or explicitly counted by the query.
            |
            */
            'sales_count' => $this->whenCounted('sales'),

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Location Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Build a compact human-readable location string.
     */
    private function buildFullLocation(): ?string
    {
        $parts = [];

        foreach ([
            'area',
            'city',
            'county',
            'region',
            'country',
        ] as $relation) {
            if (! $this->resource->relationLoaded($relation)) {
                continue;
            }

            $location = $this->resource->getRelation($relation);

            $name = $location?->name;

            if (is_string($name) && trim($name) !== '') {
                $parts[] = trim($name);
            }
        }

        $parts = array_values(array_unique($parts));

        if ($parts !== []) {
            return implode(', ', $parts);
        }

        $address = trim((string) $this->address);

        return $address !== '' ? $address : null;
    }
}
