<?php

namespace App\Http\Resources;

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
     * The users table is the source of truth for the person's account and
     * identity information:
     *
     * - first_name
     * - last_name
     * - email
     * - phone
     * - gender
     * - nationality
     * - address
     * - date_of_birth
     * - profile image
     * - account_status
     * - approval_status
     * - verification
     * - roles
     * - permissions
     * - authentication/security
     *
     *
     * TENANTS
     * --------------------------------------------------------------------------
     * The tenants table represents the person's tenant profile.
     *
     * It contains tenant-specific information:
     *
     * - tenant_number
     * - user_id
     * - identification
     * - tenant location
     * - employment
     * - emergency contact
     * - tenant documents
     * - tenant verification
     * - tenant status
     * - notes
     *
     *
     * IMPORTANT
     * ==========================================================================
     *
     * A Tenant is NOT another User.
     *
     * A tenant profile is attached to an existing User account through:
     *
     *     tenants.user_id -> users.id
     *
     * Therefore TenantResource must NOT duplicate User identity data as if it
     * belongs to the tenants table.
     *
     * Example:
     *
     * users
     * --------------------------------------------------------------------------
     * id           = 19
     * first_name   = Esther
     * last_name    = Atieno
     * email        = esther.atieno@example.com
     * phone        = +254711000012
     * role         = tenant
     *
     * tenants
     * --------------------------------------------------------------------------
     * id             = 12
     * tenant_number  = TNT-000012
     * user_id        = 19
     *
     * The API therefore exposes:
     *
     *     tenant.user
     *
     * for User information.
     *
     *
     * RELATIONSHIPS
     * ==========================================================================
     *
     * Tenant
     *     belongsTo User
     *
     * Tenant
     *     hasMany Tenancies
     *
     * Tenant
     *     hasMany ActiveTenancies
     *
     * ==========================================================================
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
            | TENANT PROFILE
            |--------------------------------------------------------------------------
            */

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
            |
            | Public document paths/URLs are exposed.
            |
            | Cloud storage internal identifiers such as:
            |
            | - photo_public_id
            | - id_front_public_id
            | - id_back_public_id
            |
            | remain hidden.
            |
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
            | Kept for existing frontend compatibility.
            |
            */

            'photo' => $tenant->photo,

            'id_front' => $tenant->id_front,

            'id_back' => $tenant->id_back,

            /*
            |--------------------------------------------------------------------------
            | TENANT VERIFICATION
            |--------------------------------------------------------------------------
            |
            | This is tenant-profile verification.
            |
            | It is separate from the User account verification.
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
            | Tenant status belongs to the tenants table.
            |
            | It is independent from:
            |
            |     user.account_status
            |
            |     user.approval_status
            |
            | Supported tenant statuses:
            |
            |     pending
            |     active
            |     inactive
            |     blacklisted
            |
            */

            'status' => $tenant->status,

            'status_label' => $tenant->status_label,

            /*
            |--------------------------------------------------------------------------
            | COMPUTED STATUS FLAGS
            |--------------------------------------------------------------------------
            |
            | These are calculated values.
            |
            | There is intentionally NO `is_active` database column.
            |
            */

            'is_active' => $tenant->status === TenantResource::STATUS_ACTIVE,

            'is_inactive' => $tenant->status === TenantResource::STATUS_INACTIVE,

            'is_pending' => $tenant->status === TenantResource::STATUS_PENDING,

            'is_blacklisted' => $tenant->status === TenantResource::STATUS_BLACKLISTED,

            /*
            |--------------------------------------------------------------------------
            | ACCOUNT STATE
            |--------------------------------------------------------------------------
            |
            | The Tenant model exposes account_state as a computed attribute.
            |
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
            | Only returned when the relationship was explicitly loaded.
            |
            | TenancyResource is responsible for:
            |
            | - property
            | - apartment
            | - unit
            | - rent
            | - deposit
            | - dates
            | - payment frequency
            | - tenancy status
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
            | Returned only when activeTenancy has been explicitly loaded.
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

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    |
    | These mirror Tenant model statuses.
    |
    | Keeping them here prevents hard-coded strings in the resource.
    |
    */

    private const STATUS_PENDING = 'pending';

    private const STATUS_ACTIVE = 'active';

    private const STATUS_INACTIVE = 'inactive';

    private const STATUS_BLACKLISTED = 'blacklisted';
}

