<?php

namespace App\Http\Resources;

use App\Helpers\DateHelper;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | UNIT COUNTS
        |--------------------------------------------------------------------------
        */

        $totalUnits = (int) (
            $this->units_count
            ?? $this->unitsCount
            ?? 0
        );

        $occupiedUnits = (int) (
            $this->occupied_units_count
            ?? 0
        );

        $vacantUnits = (int) (
            $this->vacant_units_count
            ?? 0
        );

        $maintenanceUnits = (int) (
            $this->maintenance_units_count
            ?? 0
        );

        $reservedUnits = (int) (
            $this->reserved_units_count
            ?? 0
        );

        $apartmentsCount = (int) (
            $this->apartments_count
            ?? 0
        );

        /*
        |--------------------------------------------------------------------------
        | OCCUPANCY RATE
        |--------------------------------------------------------------------------
        */

        $occupancyRate = $totalUnits > 0
            ? round(($occupiedUnits / $totalUnits) * 100, 2)
            : 0;

        /*
        |--------------------------------------------------------------------------
        | LOCATION / MAP
        |--------------------------------------------------------------------------
        */

        $mapUrl = null;
        $embedMapUrl = null;

        if (
            $this->latitude !== null &&
            $this->longitude !== null &&
            $this->latitude !== '' &&
            $this->longitude !== ''
        ) {
            $mapUrl = sprintf(
                'https://www.google.com/maps?q=%s,%s',
                $this->latitude,
                $this->longitude
            );

            $embedMapUrl = $mapUrl . '&output=embed';
        }

        /*
        |--------------------------------------------------------------------------
        | MEDIA
        |--------------------------------------------------------------------------
        */

        $imageUrl = $this->buildMediaUrl(
            $this->image
        );

        $thumbnailUrl = $this->thumbnail
            ? $this->buildMediaUrl($this->thumbnail)
            : asset('images/default-property.jpg');

        /*
        |--------------------------------------------------------------------------
        | RETURN RESPONSE
        |--------------------------------------------------------------------------
        */

        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
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
            | PROPERTY TYPE
            |--------------------------------------------------------------------------
            */

            'property_type' => $this->whenLoaded(
                'propertyType',
                function () {
                    return $this->propertyType
                        ? [
                            'id' => $this->propertyType->id,
                            'name' => $this->propertyType->name,
                            'slug' => $this->propertyType->slug,
                        ]
                        : null;
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | PROPERTY CATEGORY
            |--------------------------------------------------------------------------
            */

            'property_category' => $this->whenLoaded(
                'propertyCategory',
                function () {
                    return $this->propertyCategory
                        ? [
                            'id' => $this->propertyCategory->id,
                            'name' => $this->propertyCategory->name,
                            'slug' => $this->propertyCategory->slug,
                        ]
                        : null;
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | OWNER
            |--------------------------------------------------------------------------
            */

            'user' => $this->whenLoaded(
                'user',
                function () {
                    return $this->user
                        ? [
                            'id' => $this->user->id,
                            'name' => $this->user->name,
                            'email' => $this->user->email,
                            'phone' => $this->user->phone,
                            'avatar' => $this->user->avatar,
                        ]
                        : null;
                }
            ),

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
            | PROPERTY FEATURES
            |--------------------------------------------------------------------------
            */

            'features' => [
                'bedrooms' => (int) (
                    $this->bedrooms ?? 0
                ),

                'bathrooms' => (int) (
                    $this->bathrooms ?? 0
                ),

                'toilets' => (int) (
                    $this->toilets ?? 0
                ),

                'floors' => (int) (
                    $this->floors ?? 0
                ),

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
                'is_featured' => (bool) (
                    $this->is_featured ?? false
                ),

                'is_verified' => (bool) (
                    $this->is_verified ?? false
                ),

                'is_published' => (bool) (
                    $this->is_published ?? false
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | MEDIA
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
            |
            | Apartments are only returned when explicitly eager loaded.
            |
            | units_count is preferred because Apartment::withCount('units')
            | avoids loading all units just to calculate the count.
            |
            */

            'apartments' => $this->whenLoaded(
                'apartments',
                function () {
                    return $this->apartments
                        ->map(function ($apartment) {
                            return [
                                'id' => $apartment->id,

                                'name' => $apartment->name,

                                'slug' => $apartment->slug,

                                'block' => $apartment->block,

                                'floor' => $apartment->floor,

                                'status' => $apartment->status,

                                'units_count' => isset(
                                    $apartment->units_count
                                )
                                    ? (int) $apartment->units_count
                                    : (
                                        $apartment->relationLoaded('units')
                                            ? $apartment->units->count()
                                            : 0
                                    ),
                            ];
                        })
                        ->values();
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | UNITS
            |--------------------------------------------------------------------------
            |
            | Units are only returned when explicitly eager loaded.
            |
            | IMPORTANT:
            | The Unit model uses `price` as the database/model field.
            | The API exposes this value as `rent`.
            |
            */

            'units' => $this->whenLoaded(
                'units',
                function () {
                    return $this->units
                        ->map(function ($unit) {
                            return [
                                'id' => $unit->id,

                                'name' => $unit->name,

                                'unit_number' => $unit->unit_number,

                                'status' => $unit->status,

                                'floor' => $unit->floor,

                                'bedrooms' => $unit->bedrooms,

                                'bathrooms' => $unit->bathrooms,

                                /*
                                |--------------------------------------------------------------------------
                                | UNIT RENT
                                |--------------------------------------------------------------------------
                                |
                                | Database / Unit model:
                                |     price
                                |
                                | API:
                                |     rent
                                |
                                */

                                'rent' => $unit->price,
                            ];
                        })
                        ->values();
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | STATISTICS
            |--------------------------------------------------------------------------
            */

            'stats' => [
                'apartments' => $apartmentsCount,

                'total_units' => $totalUnits,

                'occupied_units' => $occupiedUnits,

                'vacant_units' => $vacantUnits,

                'maintenance_units' => $maintenanceUnits,

                'reserved_units' => $reservedUnits,

                'occupancy_rate' => $occupancyRate,

                'views_count' => (int) (
                    $this->views_count ?? 0
                ),

                'favorites_count' => (int) (
                    $this->favorites_count ?? 0
                ),

                'images_count' => $this->relationLoaded('images')
                    ? $this->images->count()
                    : 0,

                'reviews_count' => $this->relationLoaded('reviews')
                    ? $this->reviews->count()
                    : 0,

                'favorites_total' => $this->relationLoaded('favorites')
                    ? $this->favorites->count()
                    : 0,
            ],

            /*
            |--------------------------------------------------------------------------
            | INSIGHTS
            |--------------------------------------------------------------------------
            */

            'insights' => [
                'has_vacancy' => $vacantUnits > 0,

                'has_occupied_units' => $occupiedUnits > 0,

                'fully_occupied' =>
                    $totalUnits > 0 &&
                    $occupiedUnits === $totalUnits,

                'is_empty' => $totalUnits === 0,

                'needs_attention' =>
                    $maintenanceUnits > 0,
            ],

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at
                ? DateHelper::format($this->created_at)
                : null,

            'updated_at' => $this->updated_at
                ? DateHelper::format($this->updated_at)
                : null,

            'deleted_at' => $this->deleted_at
                ? DateHelper::format($this->deleted_at)
                : null,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | BUILD MEDIA URL
    |--------------------------------------------------------------------------
    |
    | Converts stored relative paths into public URLs while preserving
    | absolute URLs.
    |
    */

    protected function buildMediaUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }

        if (
            str_starts_with($path, 'http://') ||
            str_starts_with($path, 'https://')
        ) {
            return $path;
        }

        return asset(
            'storage/' . ltrim($path, '/')
        );
    }
}
