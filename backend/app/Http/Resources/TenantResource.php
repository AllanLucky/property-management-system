<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * Architecture:
     *
     * users table
     * --------------------------------------------------------------------------
     * User identity, profile, authentication, account and authorization data
     * belongs to the User model.
     *
     * tenants table
     * --------------------------------------------------------------------------
     * Tenant-specific profile, identification, location, employment,
     * emergency contact, documents, verification and tenant status data
     * belongs to the Tenant model.
     *
     * Relationships:
     *
     * Tenant belongsTo User
     * Tenant hasMany Tenancies
     *
     * IMPORTANT:
     *
     * UserResource is the single source of truth for User data.
     * TenantResource must not duplicate User serialization logic.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $tenant = $this->resource;

        return [

            /*
            |--------------------------------------------------------------------------
            | TENANT IDENTIFICATION
            |--------------------------------------------------------------------------
            */

            'id' => $tenant->id,

            'tenant_number' => $tenant->tenant_number,

            /*
            |--------------------------------------------------------------------------
            | LINKED USER
            |--------------------------------------------------------------------------
            |
            | UserResource owns:
            |
            | - Identity
            | - Profile
            | - Account status
            | - Approval status
            | - Verification
            | - Roles
            | - Permissions
            | - Security
            | - Tracking
            |
            | Do not duplicate those fields here.
            |
            */

            'user_id' => $tenant->user_id,

            'user' => $this->whenLoaded(
                'user',
                fn () => $tenant->user
                    ? new UserResource($tenant->user)
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | TENANT PROFILE
            |--------------------------------------------------------------------------
            |
            | These fields belong specifically to the Tenant record.
            |
            */

            'date_of_birth' => $tenant->date_of_birth
                ? $tenant->date_of_birth->format('Y-m-d')
                : null,

            'gender' => $tenant->gender,

            /*
            |--------------------------------------------------------------------------
            | IDENTIFICATION
            |--------------------------------------------------------------------------
            */

            'identification' => [
                'id_number' => $tenant->id_number,
                'passport_number' => $tenant->passport_number,
            ],

            /*
            |--------------------------------------------------------------------------
            | DIRECT IDENTIFICATION FIELDS
            |--------------------------------------------------------------------------
            |
            | Kept for frontend compatibility.
            |
            */

            'id_number' => $tenant->id_number,

            'passport_number' => $tenant->passport_number,

            /*
            |--------------------------------------------------------------------------
            | LOCATION
            |--------------------------------------------------------------------------
            */

            'location' => [
                'country' => $tenant->country,
                'region' => $tenant->region,
                'county' => $tenant->county,
                'city' => $tenant->city,
                'area' => $tenant->area,
                'postal_code' => $tenant->postal_code,
                'address' => $tenant->address,
            ],

            /*
            |--------------------------------------------------------------------------
            | DIRECT LOCATION FIELDS
            |--------------------------------------------------------------------------
            |
            | Kept for frontend compatibility.
            |
            */

            'country' => $tenant->country,

            'region' => $tenant->region,

            'county' => $tenant->county,

            'city' => $tenant->city,

            'area' => $tenant->area,

            'postal_code' => $tenant->postal_code,

            'address' => $tenant->address,

            /*
            |--------------------------------------------------------------------------
            | EMPLOYMENT
            |--------------------------------------------------------------------------
            */

            'employment' => [
                'occupation' => $tenant->occupation,
                'employer' => $tenant->employer,
                'monthly_income' => $tenant->monthly_income,
            ],

            /*
            |--------------------------------------------------------------------------
            | DIRECT EMPLOYMENT FIELDS
            |--------------------------------------------------------------------------
            |
            | Kept for frontend compatibility.
            |
            */

            'occupation' => $tenant->occupation,

            'employer' => $tenant->employer,

            'monthly_income' => $tenant->monthly_income,

            /*
            |--------------------------------------------------------------------------
            | EMERGENCY CONTACT
            |--------------------------------------------------------------------------
            */

            'emergency_contact' => [
                'name' => $tenant->emergency_contact_name,
                'phone' => $tenant->emergency_contact_phone,
                'relationship' => $tenant->emergency_contact_relationship,
            ],

            /*
            |--------------------------------------------------------------------------
            | DOCUMENTS
            |--------------------------------------------------------------------------
            |
            | Only public document paths/URLs are exposed.
            |
            | Internal storage metadata such as public IDs should remain
            | internal and must not be exposed by this resource.
            |
            */

            'documents' => [
                'photo' => $tenant->photo,
                'id_front' => $tenant->id_front,
                'id_back' => $tenant->id_back,
            ],

            /*
            |--------------------------------------------------------------------------
            | TENANT VERIFICATION
            |--------------------------------------------------------------------------
            |
            | This represents verification of the TENANT PROFILE.
            |
            | It is intentionally different from:
            |
            |     user.verification
            |
            | which represents User/email verification.
            |
            */

            'verification' => [
                'is_verified' => (bool) $tenant->is_verified,

                'verified_at' => $tenant->verified_at
                    ? $tenant->verified_at->toISOString()
                    : null,
            ],

            /*
            |--------------------------------------------------------------------------
            | DIRECT VERIFICATION FIELDS
            |--------------------------------------------------------------------------
            |
            | Kept for frontend compatibility.
            |
            */

            'is_verified' => (bool) $tenant->is_verified,

            'verified_at' => $tenant->verified_at
                ? $tenant->verified_at->toISOString()
                : null,

            /*
            |--------------------------------------------------------------------------
            | TENANT STATUS
            |--------------------------------------------------------------------------
            |
            | Tenant status is independent from User account status.
            |
            | Tenant status:
            |
            |     pending
            |     active
            |     inactive
            |     blacklisted
            |
            | User account status:
            |
            |     approval_status
            |     account_status
            |
            */

            'status' => $tenant->status,

            'status_label' => $tenant->status_label,

            /*
            |--------------------------------------------------------------------------
            | NOTES
            |--------------------------------------------------------------------------
            */

            'notes' => $tenant->notes,

            /*
            |--------------------------------------------------------------------------
            | TENANCIES
            |--------------------------------------------------------------------------
            |
            | A tenant can have multiple tenancy records.
            |
            | TenancyResource is responsible for:
            |
            | - Property
            | - Apartment
            | - Unit
            | - Rent
            | - Deposit
            | - Dates
            | - Tenancy status
            |
            */

            'tenancies' => $this->whenLoaded(
                'tenancies',
                fn () => TenancyResource::collection(
                    $tenant->tenancies
                )
            ),

            /*
            |--------------------------------------------------------------------------
            | TENANCY COUNT
            |--------------------------------------------------------------------------
            */

            'tenancy_count' => $this->whenLoaded(
                'tenancies',
                fn () => $tenant->tenancies->count()
            ),

            /*
            |--------------------------------------------------------------------------
            | ACTIVE TENANCIES
            |--------------------------------------------------------------------------
            |
            | Returned only when the activeTenancies relationship has been
            | explicitly loaded by the controller/service.
            |
            */

            'active_tenancies' => $this->whenLoaded(
                'activeTenancies',
                fn () => TenancyResource::collection(
                    $tenant->activeTenancies
                )
            ),

            /*
            |--------------------------------------------------------------------------
            | ACTIVE TENANCY COUNT
            |--------------------------------------------------------------------------
            */

            'active_tenancy_count' => $this->whenLoaded(
                'activeTenancies',
                fn () => $tenant->activeTenancies->count()
            ),

            /*
            |--------------------------------------------------------------------------
            | TENANT TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' => $tenant->created_at
                ? $tenant->created_at->toISOString()
                : null,

            'updated_at' => $tenant->updated_at
                ? $tenant->updated_at->toISOString()
                : null,

            'deleted_at' => $tenant->deleted_at
                ? $tenant->deleted_at->toISOString()
                : null,
        ];
    }
}
