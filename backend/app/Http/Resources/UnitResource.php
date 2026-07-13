<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Helpers\DateHelper;

class UnitResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | SAFE RELATIONS
        |--------------------------------------------------------------------------
        */
        $property = $this->whenLoaded('property');

        $apartment = $this->whenLoaded('apartment');

        /*
        |--------------------------------------------------------------------------
        | ONLY LOAD TENANCY IF RELATION EXISTS
        |--------------------------------------------------------------------------
        */
        $activeTenancy = null;
        $tenant = null;

        if ($this->relationLoaded('tenancies')) {

            $activeTenancy = $this->tenancies
                ->firstWhere('status', 'active');

            $tenant = $activeTenancy?->tenant;
        }

        /*
        |--------------------------------------------------------------------------
        | MAINTENANCE COUNTS
        |--------------------------------------------------------------------------
        */
        $maintenanceTotal = 0;
        $maintenancePending = 0;
        $maintenanceInProgress = 0;
        $maintenanceCompleted = 0;

        if ($this->relationLoaded('maintenances')) {

            $maintenanceTotal = $this->maintenances->count();

            $maintenancePending = $this->maintenances
                ->where('status', 'pending')
                ->count();

            $maintenanceInProgress = $this->maintenances
                ->where('status', 'in_progress')
                ->count();

            $maintenanceCompleted = $this->maintenances
                ->where('status', 'completed')
                ->count();
        }

        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,

            'name' => $this->name,

            'unit_number' => $this->unit_number,

            'type' => $this->type,

            'description' => $this->description,

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */
            'property' => $property ? [
                'id' => $property->id,

                'name' => $property->name,

                'type' => $property->type,

                /*
                |----------------------------------------------------------------------
                | LIGHTWEIGHT LOCATION
                |----------------------------------------------------------------------
                */
                'location' => $property->location,

                /*
                |----------------------------------------------------------------------
                | LIGHTWEIGHT IMAGE
                |----------------------------------------------------------------------
                */
                'cover_image' => $property->cover_image ?? null,
            ] : null,

            /*
            |--------------------------------------------------------------------------
            | APARTMENT
            |--------------------------------------------------------------------------
            */
            'apartment' => $apartment ? [
                'id' => $apartment->id,

                'name' => $apartment->name,

                'code' => $apartment->code,
            ] : null,

            /*
            |--------------------------------------------------------------------------
            | DETAILS
            |--------------------------------------------------------------------------
            */
            'details' => [
                'floor' => (int) ($this->floor ?? 0),

                'bedrooms' => (int) ($this->bedrooms ?? 0),

                'bathrooms' => (int) ($this->bathrooms ?? 0),

                'size' => (float) ($this->size ?? 0),
            ],

            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */
            'pricing' => [
                'rent_amount' => (float) ($this->rent_amount ?? 0),

                'deposit_amount' => (float) ($this->deposit_amount ?? 0),

                'rent_label' => number_format(
                    $this->rent_amount ?? 0
                ),

                'deposit_label' => number_format(
                    $this->deposit_amount ?? 0
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */
            'features' => is_array($this->features)
                ? $this->features
                : [],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            'status' => [
                'current' => $this->status,

                'is_vacant' =>
                    $this->status === 'vacant',

                'is_occupied' =>
                    $this->status === 'occupied',

                'is_reserved' =>
                    $this->status === 'reserved',

                'is_maintenance' =>
                    $this->status === 'maintenance',

                'is_active' =>
                    $this->status !== 'inactive',
            ],

            /*
            |--------------------------------------------------------------------------
            | TENANT
            |--------------------------------------------------------------------------
            */
            'tenant' => $tenant ? [
                'id' => $tenant->id,

                'full_name' => trim(
                    ($tenant->first_name ?? '') .
                    ' ' .
                    ($tenant->last_name ?? '')
                ),

                'email' => $tenant->email,

                'phone' => $tenant->phone,
            ] : null,

            /*
            |--------------------------------------------------------------------------
            | TENANCY
            |--------------------------------------------------------------------------
            */
            'tenancy' => $activeTenancy ? [
                'id' => $activeTenancy->id,

                'status' => $activeTenancy->status,

                'start_date' =>
                    $activeTenancy->start_date,

                'end_date' =>
                    $activeTenancy->end_date,

                'rent' => (float)
                    ($activeTenancy->monthly_rent ?? 0),
            ] : null,

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE
            |--------------------------------------------------------------------------
            */
            'maintenance' => [
                'total' => $maintenanceTotal,

                'pending' => $maintenancePending,

                'in_progress' => $maintenanceInProgress,

                'completed' => $maintenanceCompleted,
            ],

            /*
            |--------------------------------------------------------------------------
            | INSIGHTS
            |--------------------------------------------------------------------------
            */
            'insights' => [
                'is_vacant' =>
                    $this->status === 'vacant',

                'is_occupied' =>
                    $this->status === 'occupied',

                'has_tenant' =>
                    $tenant !== null,

                'has_active_tenancy' =>
                    $activeTenancy !== null,
            ],

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => DateHelper::format(
                $this->created_at
            ),

            'updated_at' => DateHelper::format(
                $this->updated_at
            ),
        ];
    }
}