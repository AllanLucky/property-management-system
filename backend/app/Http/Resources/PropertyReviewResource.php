<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyReviewResource extends JsonResource
{
    /**
     * Transform the resource into an array.
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
            'property_id' => $this->property_id,
            'user_id' => $this->user_id,

            /*
            |--------------------------------------------------------------------------
            | REVIEW
            |--------------------------------------------------------------------------
            */
            'rating' => (int) $this->rating,
            'rating_label' => $this->rating_label,
            'title' => $this->title,
            'comment' => $this->comment,
            'would_recommend' => (bool) $this->would_recommend,

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            'is_verified' => (bool) $this->is_verified,
            'is_published' => (bool) $this->is_published,

            /*
            |--------------------------------------------------------------------------
            | ENGAGEMENT
            |--------------------------------------------------------------------------
            */
            'likes_count' => (int) $this->likes_count,

            /*
            |--------------------------------------------------------------------------
            | ANALYTICS
            |--------------------------------------------------------------------------
            */
            'sentiment' => $this->sentiment,
            'is_positive' => (bool) $this->is_positive,
            'is_negative' => (bool) $this->is_negative,

            /*
            |--------------------------------------------------------------------------
            | USER
            |--------------------------------------------------------------------------
            */
            'user' => $this->whenLoaded('user', function () {

                return [
                    'id' => $this->user->id,

                    'name' => trim(
                        ($this->user->first_name ?? '') .
                        ' ' .
                        ($this->user->last_name ?? '')
                    ),

                    'email' => $this->user->email,

                    'image' => $this->user->image
                        ? asset($this->user->image)
                        : null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */
            'property' => $this->whenLoaded('property', function () {

                return [
                    'id' => $this->property->id,
                    'title' => $this->property->title,
                    'slug' => $this->property->slug,

                    'thumbnail' => $this->property->thumbnail
                        ? asset($this->property->thumbnail)
                        : null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */
            'created_at' => optional($this->created_at)->toDateTimeString(),
            'updated_at' => optional($this->updated_at)->toDateTimeString(),
            'published_at' => optional($this->published_at)->toDateTimeString(),
            'edited_at' => optional($this->edited_at)->toDateTimeString(),

            /*
            |--------------------------------------------------------------------------
            | HUMAN DATES
            |--------------------------------------------------------------------------
            */
            'created_at_human' => optional($this->created_at)?->diffForHumans(),
            'updated_at_human' => optional($this->updated_at)?->diffForHumans(),
            'published_at_human' => optional($this->published_at)?->diffForHumans(),
            'edited_at_human' => optional($this->edited_at)?->diffForHumans(),
        ];
    }
}