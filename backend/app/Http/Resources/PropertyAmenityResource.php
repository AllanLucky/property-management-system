<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyAmenityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | Support Multiple Sources
        |--------------------------------------------------------------------------
        |
        | 1. Amenity model loaded via belongsToMany()
        | 2. PropertyAmenity pivot model
        |
        */

        $amenity = $this->amenity ?? $this;
        $pivot = $this->pivot ?? $this;

        return [

            /*
            |--------------------------------------------------------------------------
            | Amenity Details
            |--------------------------------------------------------------------------
            */
            'id' => $amenity->id,
            'name' => $amenity->name,
            'display_name' => $amenity->display_name ?? $amenity->name,
            'slug' => $amenity->slug,
            'icon' => $amenity->icon,
            'color' => $amenity->color,
            'description' => $amenity->description,

            /*
            |--------------------------------------------------------------------------
            | Amenity Status
            |--------------------------------------------------------------------------
            */
            'is_active' => (bool) ($amenity->is_active ?? true),
            'sort_order' => (int) ($amenity->sort_order ?? 0),

            /*
            |--------------------------------------------------------------------------
            | Property Relationship
            |--------------------------------------------------------------------------
            */
            'property_id' => $pivot->property_id ?? null,

            'amenity_id' => $pivot->amenity_id
                ?? $amenity->id,

            /*
            |--------------------------------------------------------------------------
            | Availability
            |--------------------------------------------------------------------------
            */
            'availability' => [
                'is_included' => (bool) ($pivot->is_included ?? true),
                'is_available' => (bool) ($pivot->is_available ?? true),
            ],

            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            */
            'location' => [
                'distance' => $pivot->distance,

                'distance_label' => $pivot->distance
                    ? $pivot->distance . ' km'
                    : null,

                'walking_minutes' => $pivot->walking_minutes,

                'walking_time_label' => $pivot->walking_minutes
                    ? $pivot->walking_minutes . ' min walk'
                    : null,
            ],

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */
            'note' => $pivot->note,

            /*
            |--------------------------------------------------------------------------
            | Property Info
            |--------------------------------------------------------------------------
            */
            'property' => $this->whenLoaded('property', function () {
                return [
                    'id' => $this->property->id,
                    'title' => $this->property->title,
                    'slug' => $this->property->slug,
                    'property_code' => $this->property->property_code,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */
            'created_at' => optional(
                $pivot->created_at ?? $this->created_at
            )?->toISOString(),

            'updated_at' => optional(
                $pivot->updated_at ?? $this->updated_at
            )?->toISOString(),
        ];
    }
}