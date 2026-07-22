<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\PropertyResource;

class PropertyAnalyticsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | CORE INFO
            |--------------------------------------------------------------------------
            */
            'id'                   => $this->id,
            'property_id'          => $this->property_id,
            'property'             => new PropertyResource($this->whenLoaded('property')),

            /*
            |--------------------------------------------------------------------------
            | ANALYTICS METRICS
            |--------------------------------------------------------------------------
            */
            'views_count'          => $this->views_count,
            'favorites_count'      => $this->favorites_count,
            'inquiries_count'      => $this->inquiries_count,
            'average_rating'       => $this->average_rating,

            /*
            |--------------------------------------------------------------------------
            | OCCUPANCY DATA
            |--------------------------------------------------------------------------
            */
            'vacant_units_count'   => $this->vacant_units_count,
            'occupied_units_count' => $this->occupied_units_count,

            /*
            |--------------------------------------------------------------------------
            | SNAPSHOT
            |--------------------------------------------------------------------------
            */
            'snapshot_date'        => $this->snapshot_date,

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at'           => $this->created_at,
            'updated_at'           => $this->updated_at,
        ];
    }
}
