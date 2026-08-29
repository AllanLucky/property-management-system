<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
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
            | Identification
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'tenant_number' => $this->tenant_number,


            /*
            |--------------------------------------------------------------------------
            | User Account
            |--------------------------------------------------------------------------
            |
            | user_id is returned directly from the tenants table.
            |
            | user is returned when the relationship has been loaded.
            |
            | TenantService loads the user relationship using:
            |
            |     ->with('user')
            |
            */

            'user_id' => $this->user_id,

            'user' => $this->whenLoaded(
                'user',
                function () {
                    return $this->user
                        ? new UserResource($this->user)
                        : null;
                }
            ),


            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            */

            'first_name' => $this->first_name,

            'last_name' => $this->last_name,

            'other_names' => $this->other_names,

            'full_name' => $this->full_name,

            'email' => $this->email,

            'phone' => $this->phone,

            'date_of_birth' => $this->date_of_birth
                ? $this->date_of_birth->format('Y-m-d')
                : null,

            'gender' => $this->gender,


            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            */

            'id_number' => $this->id_number,

            'passport_number' => $this->passport_number,


            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            |
            | Full tenant location hierarchy:
            |
            | Country
            | Region
            | County
            | City
            | Area
            | Postal Code
            | Address
            |
            */

            'country' => $this->country,

            'region' => $this->region,

            'county' => $this->county,

            'city' => $this->city,

            'area' => $this->area,

            'postal_code' => $this->postal_code,

            'address' => $this->address,

            /*
            |--------------------------------------------------------------------------
            | Location Object
            |--------------------------------------------------------------------------
            |
            | Convenient nested representation for frontend applications.
            |
            */

            'location' => [
                'country' => $this->country,
                'region' => $this->region,
                'county' => $this->county,
                'city' => $this->city,
                'area' => $this->area,
                'postal_code' => $this->postal_code,
                'address' => $this->address,
            ],


            /*
            |--------------------------------------------------------------------------
            | Employment Information
            |--------------------------------------------------------------------------
            */

            'occupation' => $this->occupation,

            'employer' => $this->employer,

            'monthly_income' => $this->monthly_income,


            /*
            |--------------------------------------------------------------------------
            | Emergency Contact
            |--------------------------------------------------------------------------
            */

            'emergency_contact' => [

                'name' => $this->emergency_contact_name,

                'phone' => $this->emergency_contact_phone,

                'relationship' => $this->emergency_contact_relationship,

            ],


            /*
            |--------------------------------------------------------------------------
            | Tenant Documents
            |--------------------------------------------------------------------------
            */

            'documents' => [

                'photo' => $this->photo,

                'id_front' => $this->id_front,

                'id_back' => $this->id_back,

            ],


            /*
            |--------------------------------------------------------------------------
            | Verification
            |--------------------------------------------------------------------------
            */

            'is_verified' => (bool) $this->is_verified,

            'verification_status' => $this->verification_status,

            'verified_at' => $this->verified_at
                ? $this->verified_at->toISOString()
                : null,


            /*
            |--------------------------------------------------------------------------
            | Tenant Status
            |--------------------------------------------------------------------------
            */

            'status' => $this->status,

            'status_label' => $this->status_label,


            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

            'notes' => $this->notes,


            /*
            |--------------------------------------------------------------------------
            | Tenancies
            |--------------------------------------------------------------------------
            |
            | Every tenancy can contain:
            |
            | - Property
            | - Apartment
            | - Unit
            |
            | These relationships are loaded by TenantService.
            |
            */

            'tenancies' => $this->when(
                $this->relationLoaded('tenancies'),
                function () {
                    return TenancyResource::collection(
                        $this->tenancies
                    );
                }
            ),

            'tenancy_count' => $this->when(
                $this->relationLoaded('tenancies'),
                function () {
                    return $this->tenancies->count();
                }
            ),


            /*
            |--------------------------------------------------------------------------
            | Active Tenancies
            |--------------------------------------------------------------------------
            */

            'active_tenancies' => $this->when(
                $this->relationLoaded('activeTenancies'),
                function () {
                    return TenancyResource::collection(
                        $this->activeTenancies
                    );
                }
            ),

            'active_tenancy_count' => $this->when(
                $this->relationLoaded('activeTenancies'),
                function () {
                    return $this->activeTenancies->count();
                }
            ),


            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            'created_at' => $this->created_at
                ? $this->created_at->toISOString()
                : null,

            'updated_at' => $this->updated_at
                ? $this->updated_at->toISOString()
                : null,

        ];
    }
}
