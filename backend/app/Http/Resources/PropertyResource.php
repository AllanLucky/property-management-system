<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\DateHelper;

class PropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | UNITS AGGREGATION (SAFE FIX)
        |--------------------------------------------------------------------------
        */
        $apartments = $this->relationLoaded('apartments')
            ? collect($this->apartments)
            : collect();

        $units = $apartments->flatMap(function ($apartment) {
            return $apartment->relationLoaded('units')
                ? $apartment->units
                : collect();
        });

        $units = collect($units);

        $totalUnits = $units->count();
        $occupiedUnits = $units->where('status', 'occupied')->count();
        $vacantUnits = $units->where('status', 'vacant')->count();
        $maintenanceUnits = $units->where('status', 'maintenance')->count();
        $reservedUnits = $units->where('status', 'reserved')->count();

        $occupancyRate = $totalUnits > 0
            ? round(($occupiedUnits / $totalUnits) * 100, 2)
            : 0;

        /*
        |--------------------------------------------------------------------------
        | MAP LINKS
        |--------------------------------------------------------------------------
        */
        $mapUrl = ($this->latitude && $this->longitude)
            ? "https://www.google.com/maps?q={$this->latitude},{$this->longitude}"
            : null;

        $embedMapUrl = ($this->latitude && $this->longitude)
            ? "https://www.google.com/maps?q={$this->latitude},{$this->longitude}&output=embed"
            : null;

        /*
        |--------------------------------------------------------------------------
        | MEDIA (FIXED IMAGE SYSTEM)
        |--------------------------------------------------------------------------
        */

        // NEW FIELD (preferred)
        $imageUrl = $this->image
            ? (str_starts_with($this->image, 'http')
                ? $this->image
                : asset('storage/' . $this->image))
            : null;

        // BACKWARD COMPATIBILITY (existing system)
        $thumbnailUrl = $this->thumbnail
            ? (str_starts_with($this->thumbnail, 'http')
                ? $this->thumbnail
                : asset('storage/' . $this->thumbnail))
            : asset('images/default-property.jpg');

        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'property_code' => $this->property_code,
            'description' => $this->description,
            'listing_type' => $this->listing_type,
            'status' => $this->status,

            /*
            |--------------------------------------------------------------------------
            | TYPE & CATEGORY
            |--------------------------------------------------------------------------
            */
            'property_type' => $this->whenLoaded('propertyType', function () {
                return [
                    'id' => $this->propertyType?->id,
                    'name' => $this->propertyType?->name,
                    'slug' => $this->propertyType?->slug,
                ];
            }),

            'property_category' => $this->whenLoaded('propertyCategory', function () {
                return [
                    'id' => $this->propertyCategory?->id,
                    'name' => $this->propertyCategory?->name,
                    'slug' => $this->propertyCategory?->slug,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | USER
            |--------------------------------------------------------------------------
            */
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'phone' => $this->user?->phone,
                'avatar' => $this->user?->avatar,
            ]),

            /*
            |--------------------------------------------------------------------------
            | LOCATION
            |--------------------------------------------------------------------------
            */
            'location' => [
                'country_name' => $this->country_name,
                'region_name' => $this->region_name,
                'county_name' => $this->county_name,
                'city_name' => $this->city_name,
                'area_name' => $this->area_name,
                'street_address' => $this->street_address,
                'full_location' => $this->full_location,
                'latitude' => $this->latitude,
                'longitude' => $this->longitude,
                'map_url' => $mapUrl,
                'embed_map_url' => $embedMapUrl,
            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */
            'features' => [
                'bedrooms' => (int) $this->bedrooms,
                'bathrooms' => (int) $this->bathrooms,
                'toilets' => (int) $this->toilets,
                'floors' => $this->floors,
                'size' => $this->size,
                'size_unit' => $this->size_unit,
            ],

            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */
            'pricing' => [
                'price' => $this->price,
                'monthly_rent' => $this->monthly_rent,
                'service_charge' => $this->service_charge,
                'formatted_price' => $this->formatted_price,
                'currency' => 'KES',
            ],

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */
            'flags' => [
                'is_featured' => (bool) $this->is_featured,
                'is_verified' => (bool) $this->is_verified,
                'is_published' => (bool) $this->is_published,
            ],

            /*
            |--------------------------------------------------------------------------
            | MEDIA (UPDATED SAFE)
            |--------------------------------------------------------------------------
            */
            'media' => [
                'image_url' => $imageUrl,
                'thumbnail_url' => $thumbnailUrl,
                'video_url' => $this->video_url,
                'virtual_tour_url' => $this->virtual_tour_url,
            ],

            /*
            |--------------------------------------------------------------------------
            | APARTMENTS
            |--------------------------------------------------------------------------
            */
            'apartments' => $this->whenLoaded('apartments', fn () =>
                $apartments->map(fn ($apartment) => [
                    'id' => $apartment->id,
                    'name' => $apartment->name,
                    'slug' => $apartment->slug,
                    'floor' => $apartment->floor,
                    'status' => $apartment->status,
                    'units_count' => $apartment->relationLoaded('units')
                        ? $apartment->units->count()
                        : 0,
                ])
            ),

            /*
            |--------------------------------------------------------------------------
            | UNITS
            |--------------------------------------------------------------------------
            */
            'units' => $this->whenLoaded('apartments', fn () =>
                $units->map(fn ($unit) => [
                    'id' => $unit->id,
                    'name' => $unit->name,
                    'unit_number' => $unit->unit_number,
                    'status' => $unit->status,
                    'floor' => $unit->floor,
                    'bedrooms' => $unit->bedrooms,
                    'bathrooms' => $unit->bathrooms,
                    'rent' => $unit->rent_amount,
                ])
            ),

            /*
            |--------------------------------------------------------------------------
            | STATS
            |--------------------------------------------------------------------------
            */
            'stats' => [
                'views_count' => (int) ($this->views_count ?? 0),
                'favorites_count' => (int) ($this->favorites_count ?? 0),

                'total_units' => $totalUnits,
                'occupied_units' => $occupiedUnits,
                'vacant_units' => $vacantUnits,
                'maintenance_units' => $maintenanceUnits,
                'reserved_units' => $reservedUnits,

                'occupancy_rate' => $occupancyRate,
            ],

            /*
            |--------------------------------------------------------------------------
            | INSIGHTS
            |--------------------------------------------------------------------------
            */
            'insights' => [
                'has_vacancy' => $vacantUnits > 0,
                'fully_occupied' => $vacantUnits === 0 && $totalUnits > 0,
                'is_empty' => $totalUnits === 0,
                'needs_attention' => $maintenanceUnits > 0,
            ],

            /*
            |--------------------------------------------------------------------------
            | COUNTS
            |--------------------------------------------------------------------------
            */
            'counts' => [
                'images' => $this->relationLoaded('images') ? $this->images->count() : 0,
                'reviews' => $this->relationLoaded('reviews') ? $this->reviews->count() : 0,
                'favorites' => $this->relationLoaded('favorites') ? $this->favorites->count() : 0,
                'apartments' => $this->relationLoaded('apartments') ? $this->apartments->count() : 0,
            ],

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at ? DateHelper::format($this->created_at) : null,
            'updated_at' => $this->updated_at ? DateHelper::format($this->updated_at) : null,
        ];
    }
}