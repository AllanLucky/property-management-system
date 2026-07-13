<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyCategoryResource extends JsonResource
{
    /**
     * Transform the resource into an API response.
     */
    public function toArray(Request $request): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | HIERARCHY
            |--------------------------------------------------------------------------
            */
            'parent' => new self($this->whenLoaded('parent')),
            'children' => self::collection($this->whenLoaded('children')),

            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */
            'media' => [
                'icon' => $this->icon,

                'image_url' => $this->getImageUrl(),
                'image_public_id' => $this->image_public_id,

                'banner_url' => $this->getBannerUrl(),
                'banner_public_id' => $this->banner_public_id,
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            'status' => $this->status,

            'flags' => [
                'is_active' => $this->status === 'active',
                'is_featured' => (bool) $this->is_featured,
                'show_in_homepage' => (bool) $this->show_in_homepage,
                'is_popular' => (bool) $this->is_popular,
            ],

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */
            'seo' => [
                'meta_title' => $this->meta_title,
                'meta_description' => $this->meta_description,
                'meta_keywords' => $this->meta_keywords,
            ],

            /*
            |--------------------------------------------------------------------------
            | DISPLAY
            |--------------------------------------------------------------------------
            */
            'display' => [
                'sort_order' => (int) $this->sort_order,
                'color' => $this->color,
            ],

            /*
            |--------------------------------------------------------------------------
            | STATS
            |--------------------------------------------------------------------------
            */
            'stats' => [
                'views_count' => (int) $this->views_count,

                'properties_count' => $this->whenCounted('properties')
                    ?? ($this->relationLoaded('properties')
                        ? $this->properties->count()
                        : 0),
            ],

            /*
            |--------------------------------------------------------------------------
            | SETTINGS
            |--------------------------------------------------------------------------
            */
            'settings' => $this->settings ?? [],

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */
            'properties' => PropertyResource::collection(
                $this->whenLoaded('properties')
            ),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'published_at' => $this->published_at?->toDateTimeString(),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'deleted_at' => $this->deleted_at?->toDateTimeString(),
        ];
    }

    /**
     * Resolve category image URL.
     */
    private function getImageUrl(): ?string
    {
        if (!empty($this->image_url)) {
            return $this->image_url;
        }

        if (!empty($this->image_public_id)) {
            return $this->resolveCloudinaryUrl($this->image_public_id);
        }

        return null;
    }

    /**
     * Resolve banner image URL.
     */
    private function getBannerUrl(): ?string
    {
        if (!empty($this->banner_url)) {
            return $this->banner_url;
        }

        if (!empty($this->banner_public_id)) {
            return $this->resolveCloudinaryUrl($this->banner_public_id);
        }

        return null;
    }

    /**
     * Build Cloudinary URL from public ID.
     */
    private function resolveCloudinaryUrl(?string $publicId): ?string
    {
        if (empty($publicId)) {
            return null;
        }

        return sprintf(
            'https://res.cloudinary.com/%s/image/upload/%s',
            config('services.cloudinary.cloud_name', 'do4cllogr'),
            ltrim($publicId, '/')
        );
    }
}