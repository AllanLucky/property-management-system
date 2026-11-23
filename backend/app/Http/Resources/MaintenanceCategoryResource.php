<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaintenanceCategoryResource extends JsonResource
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
            | Basic Information
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | Appearance
            |--------------------------------------------------------------------------
            */
            'icon' => $this->icon,
            'color' => $this->color,

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            'is_active' => (bool) $this->is_active,
            'status' => $this->is_active ? 'active' : 'inactive',
            'status_label' => $this->status_label,

            /*
            |--------------------------------------------------------------------------
            | Maintenance Requests
            |--------------------------------------------------------------------------
            */
            'maintenance_requests_count' => $this->whenCounted(
                'maintenanceRequests'
            ),

            'requests_count' => $this->when(
                isset($this->maintenance_requests_count),
                fn () => (int) $this->maintenance_requests_count,
                fn () => $this->when(
                    $this->relationLoaded('maintenanceRequests'),
                    fn () => $this->maintenanceRequests->count()
                )
            ),

            /*
            |--------------------------------------------------------------------------
            | Relationships
            |--------------------------------------------------------------------------
            */
            'maintenance_requests' => MaintenanceRequestResource::collection(
                $this->whenLoaded('maintenanceRequests')
            ),

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
