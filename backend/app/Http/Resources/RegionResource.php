<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RegionResource extends JsonResource
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
            | COUNTRY RELATIONSHIP
            |--------------------------------------------------------------------------
            */

            'country_id' => $this->country_id,

            'country' => $this->whenLoaded('country', function () {
                return [
                    'id' => $this->country->id,
                    'name' => $this->country->name,
                    'code' => $this->country->code,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | STATUS INFORMATION
            |--------------------------------------------------------------------------
            */

            'is_active' => (bool) $this->is_active,

            'status' => $this->is_active
                ? 'active'
                : 'inactive',

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP COUNTS
            |--------------------------------------------------------------------------
            */

            'counties_count' => $this->whenCounted('counties'),

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
