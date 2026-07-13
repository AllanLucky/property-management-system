<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyFeatureResource extends JsonResource
{
    /*
    |--------------------------------------------------------------------------
    | TRANSFORM RESOURCE
    |--------------------------------------------------------------------------
    */
    public function toArray(Request $request): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | IDENTIFIERS
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,

            /*
            |--------------------------------------------------------------------------
            | FEATURE CORE DATA
            |--------------------------------------------------------------------------
            */
            'name' => $this->name,
            'display_name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type,
            'icon' => $this->icon,
            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | STATUS & DISPLAY
            |--------------------------------------------------------------------------
            */
            'is_active' => (bool) $this->is_active,
            'is_highlighted' => (bool) $this->is_highlighted,

            'status_label' => $this->status_label,
            'highlight_label' => $this->highlight_label,

            /*
            |--------------------------------------------------------------------------
            | SORTING & BADGES
            |--------------------------------------------------------------------------
            */
            'sort_order' => (int) $this->sort_order,

            'badges' => [
                'active' => (bool) $this->is_active,
                'highlighted' => (bool) $this->is_highlighted,
            ],

            /*
            |--------------------------------------------------------------------------
            | RELATED PROPERTIES (PIVOT DATA)
            |--------------------------------------------------------------------------
            */
            'properties' => $this->whenLoaded('properties', function () {
                return $this->properties->map(function ($property) {
                    return [
                        'id' => $property->id,
                        'name' => $property->name,
                        'slug' => $property->slug,

                        'feature_data' => [
                            'value' => $property->pivot->value ?? null,
                            'note' => $property->pivot->note ?? null,
                            'is_active' => (bool) ($property->pivot->is_active ?? false),
                            'sort_order' => (int) ($property->pivot->sort_order ?? 0),
                        ],
                    ];
                });
            }),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => optional($this->created_at)?->toISOString(),
            'updated_at' => optional($this->updated_at)?->toISOString(),

            'created_at_human' => optional($this->created_at)?->diffForHumans(),
            'updated_at_human' => optional($this->updated_at)?->diffForHumans(),
        ];
    }
}