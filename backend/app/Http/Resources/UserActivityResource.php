<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserActivityResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            /*
            |--------------------------------------------------------------------------
            | USER (SAFE + FRONTEND READY)
            |--------------------------------------------------------------------------
            */
            'user' => $this->whenLoaded('user', function () {
                return $this->user ? [
                    'id' => $this->user->id,
                    'name' => trim(
                        ($this->user->first_name ?? '') . ' ' . ($this->user->last_name ?? '')
                    ) ?: $this->user->name,
                    'email' => $this->user->email,
                ] : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | ACTION DETAILS
            |--------------------------------------------------------------------------
            */
            'action' => $this->action,
            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | SUBJECT (WHAT WAS AFFECTED)
            |--------------------------------------------------------------------------
            */
            'subject_type' => $this->subject_type,
            'subject_id' => $this->subject_id,

            /*
            |--------------------------------------------------------------------------
            | CONTEXT DATA
            |--------------------------------------------------------------------------
            */
            'meta' => $this->meta ?? (object) [],
            'ip_address' => $this->ip_address,
            'user_agent' => $this->user_agent,

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),

            /*
            |--------------------------------------------------------------------------
            | UI HELPER FIELDS
            |--------------------------------------------------------------------------
            */
            'time_ago' => $this->created_at?->diffForHumans(),

            'meta_ui' => [
                'is_recent' => $this->created_at
                    ? $this->created_at->gt(now()->subDays(7))
                    : false,

                'has_meta' => !empty($this->meta),
            ],
        ];
    }
}