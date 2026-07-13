<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyTypeResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $propertiesCount = (int) ($this->properties_count ?? 0);
        $activePropertiesCount = (int) ($this->active_properties_count ?? 0);

        return [

            /*
            |--------------------------------------------------------------------------
            | IDENTIFIERS
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'name' => $this->name,
            'display_name' => $this->display_name,
            'slug' => $this->slug,


            /*
            |--------------------------------------------------------------------------
            | DETAILS
            |--------------------------------------------------------------------------
            */
            'description' => $this->description,


            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */
            'media' => [
                'icon' => $this->icon,
                'image' => $this->image,
                'image_url' => $this->image
                    ? (
                        str_starts_with($this->image, 'http')
                            ? $this->image
                            : asset('storage/' . ltrim($this->image, '/'))
                    )
                    : null,
            ],


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            'status' => [
                'value' => $this->status,
                'label' => $this->status_label,
                'is_active' => (bool) $this->is_active,
                'is_featured' => (bool) $this->is_featured,
                'featured_label' => $this->featured_label,
            ],


            /*
            |--------------------------------------------------------------------------
            | DISPLAY SETTINGS
            |--------------------------------------------------------------------------
            */
            'display' => [
                'sort_order' => (int) $this->sort_order,
            ],


            /*
            |--------------------------------------------------------------------------
            | PROPERTY STATISTICS
            |--------------------------------------------------------------------------
            */
            'statistics' => [
                'total_properties' => $propertiesCount,
                'published_properties' => $activePropertiesCount,
            ],


            /*
            |--------------------------------------------------------------------------
            | INSIGHTS
            |--------------------------------------------------------------------------
            */
            'insights' => [
                'has_properties' => $propertiesCount > 0,
                'is_empty' => $propertiesCount === 0,
                'is_popular' => $propertiesCount >= 10,
                'popularity_level' => match (true) {
                    $propertiesCount >= 50 => 'Highly Popular',
                    $propertiesCount >= 20 => 'Popular',
                    $propertiesCount >= 5 => 'Growing',
                    default => 'New',
                },
            ],


            /*
            |--------------------------------------------------------------------------
            | API ROUTES
            |--------------------------------------------------------------------------
            */
            'routes' => [
                'web' => [
                    'show' => "/property-types/{$this->slug}",
                ],

                'api' => [
                    'show' => "/api/property-types/{$this->slug}",
                    'update' => "/api/property-types/{$this->slug}",
                    'delete' => "/api/property-types/{$this->slug}",
                ],
            ],


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),


            /*
            |--------------------------------------------------------------------------
            | HUMAN READABLE DATES
            |--------------------------------------------------------------------------
            */
            'human_dates' => [
                'created' => $this->created_at?->diffForHumans(),
                'updated' => $this->updated_at?->diffForHumans(),
            ],
        ];
    }
}