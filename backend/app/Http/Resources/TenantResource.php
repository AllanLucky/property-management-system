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
     * The application uses a two-layer architecture:
     *
     * USERS
     * --------------------------------------------------------------------------
     * The User model owns authentication and account identity:
     *
     * - first_name
     * - last_name
     * - email
     * - phone
     * - password
     * - roles / permissions
     *
     * TENANTS
     * --------------------------------------------------------------------------
     * The Tenant model owns tenant-specific profile information:
     *
     * - tenant_number
     * - other_names
     * - nationality
     * - date_of_birth
     * - gender
     * - identification
     * - location
     * - employment
     * - emergency contact
     * - documents
     * - verification
     * - tenant status
     *
     * TenantResource never creates or modifies a User.
     *
     * UserResource remains responsible for serializing the linked User
     * account.
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
            | LINKED USER
            |--------------------------------------------------------------------------
            |
            | The User account already exists.
            |
            | TenantResource never creates a User.
            |
            | UserResource remains responsible for User serialization.
            |
            */

            'user_id' => $tenant->user_id,

            'user' => $this->whenLoaded(
                'user',
                function () use ($tenant) {
                    if (!$tenant->user) {
                        return null;
                    }

                    return new UserResource($tenant->user);
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | TENANT PERSONAL PROFILE
            |--------------------------------------------------------------------------
            */

            'other_names' => $tenant->other_names,

            /*
            |--------------------------------------------------------------------------
            | NATIONALITY
            |--------------------------------------------------------------------------
            |
            | Nationality represents the tenant's citizenship / national identity.
            |
            | This is different from `country`, which belongs to the tenant's
            | residential/location information.
            |
            */

            'nationality' => $tenant->nationality,

            'date_of_birth' => $tenant->date_of_birth
                ? $tenant->date_of_birth->format('Y-m-d')
                : null,

            'gender' => $tenant->gender,

            /*
            |--------------------------------------------------------------------------
            | IDENTIFICATION
            |--------------------------------------------------------------------------
            |
            | These fields belong to the tenant profile.
            |
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
            |
            | `country` here represents the tenant's residential/location country,
            | not nationality.
            |
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
            | Kept for existing frontend forms and components.
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
            | TENANT DOCUMENTS
            |--------------------------------------------------------------------------
            */

            'documents' => [
                'photo' => $tenant->photo,
                'id_front' => $tenant->id_front,
                'id_back' => $tenant->id_back,
            ],

            /*
            |--------------------------------------------------------------------------
            | DIRECT DOCUMENT FIELDS
            |--------------------------------------------------------------------------
            |
            | Kept for frontend compatibility.
            |
            */

            'photo' => $tenant->photo,

            'id_front' => $tenant->id_front,

            'id_back' => $tenant->id_back,

            /*
            |--------------------------------------------------------------------------
            | TENANT VERIFICATION
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
            | Tenant activity is determined by `status`.
            |
            | There is intentionally no physical `is_active` column required
            | on the tenants table.
            |
            */

            'status' => $tenant->status,

            'status_label' => $tenant->status_label,

            /*
            |--------------------------------------------------------------------------
            | COMPUTED STATUS FLAGS
            |--------------------------------------------------------------------------
            |
            | These values are derived from the tenant status.
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
            | Tenancy records are separate from the tenant profile.
            |
            */

            'tenancies' => $this->whenLoaded(
                'tenancies',
                function () use ($tenant) {
                    return TenancyResource::collection(
                        $tenant->tenancies
                    );
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | TENANCY COUNT
            |--------------------------------------------------------------------------
            */

            'tenancy_count' => $this->whenLoaded(
                'tenancies',
                function () use ($tenant) {
                    return $tenant->tenancies->count();
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | ACTIVE TENANCIES
            |--------------------------------------------------------------------------
            */

            'active_tenancies' => $this->whenLoaded(
                'activeTenancies',
                function () use ($tenant) {
                    return TenancyResource::collection(
                        $tenant->activeTenancies
                    );
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | ACTIVE TENANCY COUNT
            |--------------------------------------------------------------------------
            */

            'active_tenancy_count' => $this->whenLoaded(
                'activeTenancies',
                function () use ($tenant) {
                    return $tenant->activeTenancies->count();
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | CURRENT TENANCY
            |--------------------------------------------------------------------------
            |
            | Returned only when the `activeTenancy` relationship has explicitly
            | been loaded.
            |
            */

            'current_tenancy' => $this->whenLoaded(
                'activeTenancy',
                function () use ($tenant) {
                    return $tenant->activeTenancy
                        ? new TenancyResource($tenant->activeTenancy)
                        : null;
                }
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