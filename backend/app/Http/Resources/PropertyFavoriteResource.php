<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyFavoriteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | FAVORITE
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,

            'is_active' => (bool) $this->is_active,

            'source' => $this->source,

            'notes' => $this->notes,

            /*
            |--------------------------------------------------------------------------
            | USER
            |--------------------------------------------------------------------------
            */
            'user' => $this->when($this->user, function () {

                return [

                    'id' => $this->user->id,

                    'name' => trim(
                        ($this->user->first_name ?? '') . ' ' .
                        ($this->user->last_name ?? '')
                    ),

                    'email' => $this->user->email,

                    'phone' => $this->user->phone,

                    'avatar' => $this->user->image_url,

                    'role' => optional(
                        $this->user->roles->first()
                    )->name,

                ];

            }),

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */
            'property' => $this->when($this->property, function () {

                return [

                    /*
                    |--------------------------------------------------------------------------
                    | BASIC INFORMATION
                    |--------------------------------------------------------------------------
                    */

                    'id' => $this->property->id,

                    'title' => $this->property->title,

                    'slug' => $this->property->slug,

                    'property_code' => $this->property->property_code,

                    'reference_no' => $this->property->reference_no,

                    'listing_type' => $this->property->listing_type,

                    'status' => $this->property->status,

                    /*
                    |--------------------------------------------------------------------------
                    | MEDIA
                    |--------------------------------------------------------------------------
                    */

                    'media' => [

                        'image' => $this->property->image_url,

                        'thumbnail' => $this->property->thumbnail_url,

                    ],

                    /*
                    |--------------------------------------------------------------------------
                    | PRICING
                    |--------------------------------------------------------------------------
                    */

                    'pricing' => [

                        'price' => $this->property->price,

                        'formatted_price' => $this->property->formatted_price,

                        'display_price' => $this->property->display_price,

                        'currency' => $this->property->currency ?? 'KES',

                    ],

                    /*
                    |--------------------------------------------------------------------------
                    | CATEGORY
                    |--------------------------------------------------------------------------
                    */

                    'category' => $this->when(
                        $this->property->propertyCategory,
                        function () {

                            return [

                                'id' => $this->property->propertyCategory->id,

                                'name' => $this->property->propertyCategory->name,

                                'slug' => $this->property->propertyCategory->slug,

                            ];

                        }
                    ),

                    /*
                    |--------------------------------------------------------------------------
                    | TYPE
                    |--------------------------------------------------------------------------
                    */

                    'type' => $this->when(
                        $this->property->propertyType,
                        function () {

                            return [

                                'id' => $this->property->propertyType->id,

                                'name' => $this->property->propertyType->name,

                                'slug' => $this->property->propertyType->slug,

                            ];

                        }
                    ),

                    /*
                    |--------------------------------------------------------------------------
                    | LOCATION
                    |--------------------------------------------------------------------------
                    */

                    'location' => [

                        'address' => $this->property->street_address,

                        'city' => $this->property->city?->name,

                        'county' => $this->property->county?->name,

                        'country' => $this->property->country?->name,

                        'full_location' => $this->property->full_location,

                        'latitude' => $this->property->latitude,

                        'longitude' => $this->property->longitude,

                    ],

                    /*
                    |--------------------------------------------------------------------------
                    | STATISTICS
                    |--------------------------------------------------------------------------
                    */

                    'statistics' => [

                        'favorites' => $this->property->favorites_count,

                        'reviews' => $this->property->reviews_count,

                        'average_rating' => $this->property->average_rating,

                        'visits' => $this->property->visits_count,

                    ],

                    /*
                    |--------------------------------------------------------------------------
                    | FLAGS
                    |--------------------------------------------------------------------------
                    */

                    'flags' => [

                        'featured' => (bool) $this->property->is_featured,

                        'verified' => (bool) $this->property->is_verified,

                        'published' => (bool) $this->property->is_published,

                    ],

                ];

            }),

            /*
            |--------------------------------------------------------------------------
            | APARTMENT
            |--------------------------------------------------------------------------
            */
            'apartment' => $this->when(
                $this->apartment,
                function () {

                    return [

                        'id' => $this->apartment->id,

                        'name' => $this->apartment->name,

                        'code' => $this->apartment->code,

                    ];

                }
            ),

            /*
            |--------------------------------------------------------------------------
            | UNIT
            |--------------------------------------------------------------------------
            */
            'unit' => $this->when(
                $this->unit,
                function () {

                    return [

                        'id' => $this->unit->id,

                        'name' => $this->unit->name,

                        'unit_number' => $this->unit->unit_number,

                    ];

                }
            ),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at,

            'updated_at' => $this->updated_at,

            'created_at_human' => $this->created_at?->diffForHumans(),

            'updated_at_human' => $this->updated_at?->diffForHumans(),

        ];
    }
}