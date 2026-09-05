<?php

namespace App\Http\Resources;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * ==========================================================================
     * TENANT / USER ARCHITECTURE
     * ==========================================================================
     *
     * User
     * --------------------------------------------------------------------------
     * Owns authentication and account identity:
     *
     * - first_name
     * - last_name
     * - email
     * - phone
     * - password
     * - roles / permissions
     *
     * Tenant
     * --------------------------------------------------------------------------
     * Owns tenant-specific profile information:
     *
     * - tenant_number
     * - other_names
     * - nationality
     * - date_of_birth
     * - gender
     * - identification
     * - residential information
     * - employment
     * - emergency contact
     * - documents
     * - verification
     * - tenant status
     *
     * This resource is read-only.
     *
     * It never creates, updates, synchronizes, or deletes a User.
     */
    public function toArray(Request $request): array
    {
        /** @var Tenant $tenant */
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
            | LINKED USER ACCOUNT
            |--------------------------------------------------------------------------
            |
            | The User already exists and owns authentication/account identity.
            |
            | UserResource is responsible for serializing the User.
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
            | TENANT PERSONAL INFORMATION
            |--------------------------------------------------------------------------
            |
            | first_name, last_name, email and phone are intentionally serialized
            | from the linked User where available. The tenant-specific table
            | contains the remaining profile information.
            |
            */

            'first_name' => $tenant->first_name,

            'last_name' => $tenant->last_name,

            'other_names' => $tenant->other_names,

            'full_name' => $tenant->full_name,

            'email' => $tenant->email,

            'phone' => $tenant->phone,

            'date_of_birth' => $tenant->date_of_birth
                ? $tenant->date_of_birth->format('Y-m-d')
                : null,

            'gender' => $tenant->gender,

            'nationality' => $tenant->nationality,

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
            | Retained for frontend form/component compatibility.
            |
            */

            'id_number' => $tenant->id_number,

            'passport_number' => $tenant->passport_number,

            /*
            |--------------------------------------------------------------------------
            | RESIDENTIAL / LOCATION INFORMATION
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
            | Retained for existing frontend forms and filters.
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
            | Retained for frontend compatibility.
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
            | TENANT DOCUMENTS
            |--------------------------------------------------------------------------
            */

            'documents' => [
                'photo' => $tenant->photo,
                'photo_public_id' => $tenant->photo_public_id,

                'id_front' => $tenant->id_front,
                'id_front_public_id' => $tenant->id_front_public_id,

                'id_back' => $tenant->id_back,
                'id_back_public_id' => $tenant->id_back_public_id,
            ],

            /*
            |--------------------------------------------------------------------------
            | DIRECT DOCUMENT FIELDS
            |--------------------------------------------------------------------------
            |
            | Retained for frontend upload/edit components.
            |
            */

            'photo' => $tenant->photo,

            'photo_public_id' => $tenant->photo_public_id,

            'id_front' => $tenant->id_front,

            'id_front_public_id' => $tenant->id_front_public_id,

            'id_back' => $tenant->id_back,

            'id_back_public_id' => $tenant->id_back_public_id,

            /*
            |--------------------------------------------------------------------------
            | VERIFICATION
            |--------------------------------------------------------------------------
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
            | Retained for frontend compatibility.
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
            | There is intentionally no physical `is_active` column on tenants.
            |
            | Activity is derived from the tenant status:
            |
            | active
            | inactive
            | pending
            | blacklisted
            |
            */

            'status' => $tenant->status,

            'status_label' => $tenant->status_label,

            /*
            |--------------------------------------------------------------------------
            | COMPUTED STATUS FLAGS
            |--------------------------------------------------------------------------
            |
            | These are calculated values and must never be queried as database
            | columns.
            |
            */

            'is_active' => $tenant->status === Tenant::STATUS_ACTIVE,

            'is_inactive' => $tenant->status === Tenant::STATUS_INACTIVE,

            'is_pending' => $tenant->status === Tenant::STATUS_PENDING,

            'is_blacklisted' => $tenant->status === Tenant::STATUS_BLACKLISTED,

            /*
            |--------------------------------------------------------------------------
            | ACCOUNT STATE
            |--------------------------------------------------------------------------
            */

            'account_state' => $tenant->account_state,

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
            | Only serialize these relationships when explicitly eager loaded.
            |
            | This prevents accidental N+1 queries from the API resource.
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
            | CURRENT / PRIMARY ACTIVE TENANCY
            |--------------------------------------------------------------------------
            |
            | `activeTenancy` should be defined on the Tenant model as the
            | latest active tenancy relationship.
            |
            */

            'current_tenancy' => $this->whenLoaded(
                'activeTenancy',
                fn () => $tenant->activeTenancy
                    ? new TenancyResource($tenant->activeTenancy)
                    : null
            ),

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
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
