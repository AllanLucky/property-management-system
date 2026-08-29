<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * The User account is the source of truth for:
     *
     * - first name
     * - last name
     * - other names
     * - email
     * - phone
     * - account status
     * - roles / permissions
     *
     * Tenant-specific information remains on the tenants table.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /*
        |--------------------------------------------------------------------------
        | Linked User
        |--------------------------------------------------------------------------
        |
        | The Tenant model should have:
        |
        |     user_id
        |
        | and:
        |
        |     user()
        |
        | relationship.
        |
        | TenantService should preferably load:
        |
        |     ->with('user')
        |
        */

        $user = $this->relationLoaded('user')
            ? $this->user
            : null;

        /*
        |--------------------------------------------------------------------------
        | User Identity
        |--------------------------------------------------------------------------
        |
        | Prefer values from users table.
        |
        | Tenant table values are used as fallback so existing tenant records
        | do not immediately break if the user relationship is unavailable.
        |
        */

        $firstName = $user?->first_name ?? $this->first_name;

        $lastName = $user?->last_name ?? $this->last_name;

        $otherNames = $user?->other_names ?? $this->other_names;

        $email = $user?->email ?? $this->email;

        $phone = $user?->phone ?? $this->phone;

        $fullName = trim(
            collect([
                $firstName,
                $otherNames,
                $lastName,
            ])
                ->filter(fn ($value) => filled($value))
                ->implode(' ')
        );

        return [

            /*
            |--------------------------------------------------------------------------
            | Tenant Identification
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'tenant_number' => $this->tenant_number,


            /*
            |--------------------------------------------------------------------------
            | Linked User Account
            |--------------------------------------------------------------------------
            */

            'user_id' => $this->user_id,

            'user' => $this->whenLoaded(
                'user',
                function () use ($user) {
                    return $user
                        ? new UserResource($user)
                        : null;
                }
            ),


            /*
            |--------------------------------------------------------------------------
            | User Identity
            |--------------------------------------------------------------------------
            |
            | These values are primarily taken from the users table.
            |
            */

            'first_name' => $firstName,

            'last_name' => $lastName,

            'other_names' => $otherNames,

            'full_name' => $fullName,

            'email' => $email,

            'phone' => $phone,


            /*
            |--------------------------------------------------------------------------
            | Account Information
            |--------------------------------------------------------------------------
            |
            | These values come from the linked user when the relationship is
            | loaded. This is useful for the Admin Users / Tenant interface.
            |
            */

            'account' => $this->when(
                $this->relationLoaded('user'),
                function () use ($user) {

                    if (!$user) {
                        return null;
                    }

                    return [
                        'id' => $user->id,

                        'name' => $user->name
                            ?? trim(
                                collect([
                                    $user->first_name ?? null,
                                    $user->other_names ?? null,
                                    $user->last_name ?? null,
                                ])
                                    ->filter(fn ($value) => filled($value))
                                    ->implode(' ')
                            ),

                        'email' => $user->email,

                        'phone' => $user->phone,

                        'status' => $user->status ?? null,

                        'is_active' => isset($user->is_active)
                            ? (bool) $user->is_active
                            : null,

                        'email_verified_at' => $user->email_verified_at
                            ? $user->email_verified_at->toISOString()
                            : null,

                        'roles' => method_exists($user, 'getRoleNames')
                            ? $user->getRoleNames()->values()->all()
                            : [],

                    ];
                }
            ),


            /*
            |--------------------------------------------------------------------------
            | Personal Information
            |--------------------------------------------------------------------------
            |
            | Date of birth and gender remain tenant-specific unless you have
            | deliberately moved them to users.
            |
            */

            'date_of_birth' => $this->date_of_birth
                ? $this->date_of_birth->format('Y-m-d')
                : null,

            'gender' => $this->gender,


            /*
            |--------------------------------------------------------------------------
            | Identification
            |--------------------------------------------------------------------------
            |
            | These belong to the tenant profile, not the authentication user.
            |
            */

            'id_number' => $this->id_number,

            'passport_number' => $this->passport_number,


            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
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
            | A tenant can have multiple tenancies.
            |
            | Each tenancy may contain:
            |
            | - property
            | - apartment
            | - unit
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
