<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenancyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | Tenancy Identification
            |--------------------------------------------------------------------------
            */

            'id' => $this->id,

            'tenancy_number' => $this->tenancy_number,

            /*
            |--------------------------------------------------------------------------
            | Property Hierarchy
            |--------------------------------------------------------------------------
            */

            'property_id' => $this->property_id,

            'apartment_id' => $this->apartment_id,

            'unit_id' => $this->unit_id,

            'tenant_id' => $this->tenant_id,

            /*
            |--------------------------------------------------------------------------
            | Tenant
            |--------------------------------------------------------------------------
            */

            'tenant' => $this->whenLoaded('tenant', function () {

                if (!$this->tenant) {
                    return null;
                }

                $tenant = $this->tenant;

                $fullName = $tenant->full_name
                    ?? trim(
                        collect([
                            $tenant->first_name,
                            $tenant->last_name,
                            $tenant->other_names,
                        ])
                            ->filter(
                                fn ($value) =>
                                    filled($value)
                            )
                            ->implode(' ')
                    );

                return [

                    'id' => $tenant->id,

                    'tenant_number' =>
                        $tenant->tenant_number,

                    'user_id' =>
                        $tenant->user_id,

                    /*
                    |--------------------------------------------------------------------------
                    | Identity
                    |--------------------------------------------------------------------------
                    */

                    'first_name' =>
                        $tenant->first_name,

                    'last_name' =>
                        $tenant->last_name,

                    'other_names' =>
                        $tenant->other_names,

                    'full_name' =>
                        $fullName,

                    'email' =>
                        $tenant->email,

                    'phone' =>
                        $tenant->phone,

                    'date_of_birth' =>
                        $tenant->date_of_birth?->toISOString(),

                    'gender' =>
                        $tenant->gender,

                    'nationality' =>
                        $tenant->nationality ?? null,

                    'id_number' =>
                        $tenant->id_number,

                    'passport_number' =>
                        $tenant->passport_number,

                    /*
                    |--------------------------------------------------------------------------
                    | Emergency Contact
                    |--------------------------------------------------------------------------
                    */

                    'emergency_contact_name' =>
                        $tenant->emergency_contact_name,

                    'emergency_contact_phone' =>
                        $tenant->emergency_contact_phone,

                    'emergency_contact_relationship' =>
                        $tenant->emergency_contact_relationship,

                    'emergency_contact' => [
                        'name' =>
                            $tenant->emergency_contact_name,

                        'phone' =>
                            $tenant->emergency_contact_phone,

                        'relationship' =>
                            $tenant->emergency_contact_relationship,
                    ],

                    /*
                    |--------------------------------------------------------------------------
                    | Location
                    |--------------------------------------------------------------------------
                    */

                    'country' =>
                        $tenant->country,

                    'county' =>
                        $tenant->county,

                    'city' =>
                        $tenant->city,

                    'postal_code' =>
                        $tenant->postal_code,

                    'address' =>
                        $tenant->address,

                    /*
                    |--------------------------------------------------------------------------
                    | Employment / Financial
                    |--------------------------------------------------------------------------
                    */

                    'occupation' =>
                        $tenant->occupation,

                    'employer' =>
                        $tenant->employer,

                    'monthly_income' =>
                        $tenant->monthly_income,

                    /*
                    |--------------------------------------------------------------------------
                    | Documents
                    |--------------------------------------------------------------------------
                    */

                    'photo' =>
                        $tenant->photo,

                    'id_front' =>
                        $tenant->id_front,

                    'id_back' =>
                        $tenant->id_back,

                    'documents' => [
                        'photo' =>
                            $tenant->photo,

                        'id_front' =>
                            $tenant->id_front,

                        'id_back' =>
                            $tenant->id_back,
                    ],

                    /*
                    |--------------------------------------------------------------------------
                    | Verification
                    |--------------------------------------------------------------------------
                    */

                    'is_verified' =>
                        (bool) $tenant->is_verified,

                    'verified_at' =>
                        $tenant->verified_at?->toISOString(),

                    'verification_status' =>
                        $tenant->verification_status ?? null,

                    /*
                    |--------------------------------------------------------------------------
                    | Tenant Status
                    |--------------------------------------------------------------------------
                    */

                    'status' =>
                        $tenant->status,

                    'status_label' =>
                        $tenant->status_label ?? null,

                    'is_active' =>
                        (bool) $tenant->is_active,

                    /*
                    |--------------------------------------------------------------------------
                    | Tenant Assignment
                    |--------------------------------------------------------------------------
                    |
                    | This information is useful to the frontend when deciding
                    | whether this tenant can be assigned to another tenancy.
                    |
                    */

                    'has_tenancies' =>
                        $tenant->relationLoaded('tenancies')
                            ? $tenant->tenancies->isNotEmpty()
                            : null,

                    'active_tenancy_count' =>
                        $tenant->relationLoaded('tenancies')
                            ? $tenant->tenancies
                                ->where('status', 'active')
                                ->where('is_active', true)
                                ->count()
                            : null,

                    'pending_tenancy_count' =>
                        $tenant->relationLoaded('tenancies')
                            ? $tenant->tenancies
                                ->where('status', 'pending')
                                ->where('is_active', true)
                                ->count()
                            : null,

                    /*
                    |--------------------------------------------------------------------------
                    | Notes / Timestamps
                    |--------------------------------------------------------------------------
                    */

                    'notes' =>
                        $tenant->notes,

                    'created_at' =>
                        $tenant->created_at?->toISOString(),

                    'updated_at' =>
                        $tenant->updated_at?->toISOString(),
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Tenant User Account
            |--------------------------------------------------------------------------
            */

            'user' => $this->when(
                $this->relationLoaded('tenant') &&
                $this->tenant &&
                $this->tenant->relationLoaded('user'),
                function () {

                    $user = $this->tenant->user;

                    if (!$user) {
                        return null;
                    }

                    $fullName = $user->full_name
                        ?? trim(
                            collect([
                                $user->first_name,
                                $user->last_name,
                            ])
                                ->filter(
                                    fn ($value) =>
                                        filled($value)
                                )
                                ->implode(' ')
                        );

                    $initials = $user->initials
                        ?? strtoupper(
                            collect([
                                $user->first_name,
                                $user->last_name,
                            ])
                                ->filter(
                                    fn ($value) =>
                                        filled($value)
                                )
                                ->map(
                                    fn ($name) =>
                                        mb_substr(
                                            $name,
                                            0,
                                            1
                                        )
                                )
                                ->implode('')
                        );

                    return [

                        'id' =>
                            $user->id,

                        'first_name' =>
                            $user->first_name,

                        'last_name' =>
                            $user->last_name,

                        'full_name' =>
                            $fullName,

                        'slug' =>
                            $user->slug ?? null,

                        'email' =>
                            $user->email,

                        'phone' =>
                            $user->phone,

                        /*
                        |--------------------------------------------------------------------------
                        | Verification
                        |--------------------------------------------------------------------------
                        */

                        'email_verified_at' =>
                            $user->email_verified_at?->toISOString(),

                        'is_verified' =>
                            (bool) ($user->is_verified ?? false),

                        /*
                        |--------------------------------------------------------------------------
                        | Profile
                        |--------------------------------------------------------------------------
                        */

                        'image' =>
                            $user->image ?? null,

                        'image_url' =>
                            $user->image_url ?? null,

                        'gender' =>
                            $user->gender ?? null,

                        'nationality' =>
                            $user->nationality ?? null,

                        'address' =>
                            $user->address ?? null,

                        'date_of_birth' =>
                            $user->date_of_birth?->toISOString(),

                        'bio' =>
                            $user->bio ?? null,

                        /*
                        |--------------------------------------------------------------------------
                        | Account Status
                        |--------------------------------------------------------------------------
                        */

                        'account_status' =>
                            $user->account_status ?? null,

                        'approval_status' =>
                            $user->approval_status ?? null,

                        'is_active' =>
                            (bool) ($user->is_active ?? false),

                        'is_banner' =>
                            (bool) ($user->is_banner ?? false),

                        'last_login_at' =>
                            $user->last_login_at?->toISOString(),

                        /*
                        |--------------------------------------------------------------------------
                        | Computed Information
                        |--------------------------------------------------------------------------
                        */

                        'initials' =>
                            $initials,

                        'is_verified_user' =>
                            (bool) ($user->is_verified_user ?? false),

                        'is_super_admin' =>
                            (bool) ($user->is_super_admin ?? false),

                        /*
                        |--------------------------------------------------------------------------
                        | Roles
                        |--------------------------------------------------------------------------
                        */

                        'roles' =>
                            $user->relationLoaded('roles')
                                ? $user->roles
                                    ->map(function ($role) {

                                        return [

                                            'id' =>
                                                $role->id,

                                            'name' =>
                                                $role->name,

                                            'guard_name' =>
                                                $role->guard_name,

                                            'created_at' =>
                                                $role->created_at?->toISOString(),

                                            'updated_at' =>
                                                $role->updated_at?->toISOString(),
                                        ];
                                    })
                                    ->values()
                                    ->toArray()
                                : [],

                        'role_names' =>
                            $user->relationLoaded('roles')
                                ? $user->roles
                                    ->pluck('name')
                                    ->values()
                                    ->toArray()
                                : [],

                        /*
                        |--------------------------------------------------------------------------
                        | Permissions
                        |--------------------------------------------------------------------------
                        */

                        'permissions' =>
                            $user->relationLoaded('permissions')
                                ? $user->permissions
                                    ->map(function ($permission) {

                                        return [

                                            'id' =>
                                                $permission->id,

                                            'name' =>
                                                $permission->name,

                                            'guard_name' =>
                                                $permission->guard_name,
                                        ];
                                    })
                                    ->values()
                                    ->toArray()
                                : [],

                        'permission_names' =>
                            $user->relationLoaded('permissions')
                                ? $user->permissions
                                    ->pluck('name')
                                    ->values()
                                    ->toArray()
                                : [],

                        /*
                        |--------------------------------------------------------------------------
                        | Timestamps
                        |--------------------------------------------------------------------------
                        */

                        'created_at' =>
                            $user->created_at?->toISOString(),

                        'updated_at' =>
                            $user->updated_at?->toISOString(),
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Property
            |--------------------------------------------------------------------------
            */

            'property' => $this->whenLoaded('property', function () {

                if (!$this->property) {
                    return null;
                }

                $property = $this->property;

                return [

                    'id' =>
                        $property->id,

                    'user_id' =>
                        $property->user_id,

                    'property_type_id' =>
                        $property->property_type_id,

                    'property_category_id' =>
                        $property->property_category_id,

                    'country_id' =>
                        $property->country_id,

                    'region_id' =>
                        $property->region_id,

                    'county_id' =>
                        $property->county_id,

                    'city_id' =>
                        $property->city_id,

                    'area_id' =>
                        $property->area_id,

                    /*
                    |--------------------------------------------------------------------------
                    | Identification
                    |--------------------------------------------------------------------------
                    */

                    'title' =>
                        $property->title,

                    'name' =>
                        $property->title
                        ?? $property->name
                        ?? null,

                    'slug' =>
                        $property->slug,

                    'property_code' =>
                        $property->property_code,

                    'property_number' =>
                        $property->property_number ?? null,

                    /*
                    |--------------------------------------------------------------------------
                    | Description / Listing
                    |--------------------------------------------------------------------------
                    */

                    'description' =>
                        $property->description,

                    'listing_type' =>
                        $property->listing_type,

                    'status' =>
                        $property->status,

                    /*
                    |--------------------------------------------------------------------------
                    | Location
                    |--------------------------------------------------------------------------
                    */

                    'country_name' =>
                        $property->country_name,

                    'region_name' =>
                        $property->region_name,

                    'county_name' =>
                        $property->county_name,

                    'city_name' =>
                        $property->city_name,

                    'area_name' =>
                        $property->area_name,

                    'street_address' =>
                        $property->street_address,

                    'address' =>
                        $property->address
                        ?? $property->street_address,

                    'latitude' =>
                        $property->latitude,

                    'longitude' =>
                        $property->longitude,

                    'full_location' =>
                        $property->full_location ?? null,

                    /*
                    |--------------------------------------------------------------------------
                    | Specifications
                    |--------------------------------------------------------------------------
                    */

                    'bedrooms' =>
                        $property->bedrooms,

                    'bathrooms' =>
                        $property->bathrooms,

                    'toilets' =>
                        $property->toilets,

                    'garages' =>
                        $property->garages,

                    'parking_spaces' =>
                        $property->parking_spaces,

                    'floors' =>
                        $property->floors,

                    'size' =>
                        $property->size,

                    'size_unit' =>
                        $property->size_unit,

                    /*
                    |--------------------------------------------------------------------------
                    | Pricing
                    |--------------------------------------------------------------------------
                    */

                    'price' =>
                        $property->price,

                    'discount_price' =>
                        $property->discount_price,

                    'monthly_rent' =>
                        $property->monthly_rent,

                    'service_charge' =>
                        $property->service_charge,

                    'formatted_price' =>
                        $property->formatted_price ?? null,

                    'display_price' =>
                        $property->display_price ?? null,

                    /*
                    |--------------------------------------------------------------------------
                    | Features
                    |--------------------------------------------------------------------------
                    */

                    'is_featured' =>
                        (bool) $property->is_featured,

                    'is_verified' =>
                        (bool) $property->is_verified,

                    'is_published' =>
                        (bool) $property->is_published,

                    'has_balcony' =>
                        (bool) $property->has_balcony,

                    'has_swimming_pool' =>
                        (bool) $property->has_swimming_pool,

                    'has_garden' =>
                        (bool) $property->has_garden,

                    'has_wifi' =>
                        (bool) $property->has_wifi,

                    'has_security' =>
                        (bool) $property->has_security,

                    /*
                    |--------------------------------------------------------------------------
                    | Media
                    |--------------------------------------------------------------------------
                    */

                    'image' =>
                        $property->image,

                    'thumbnail' =>
                        $property->thumbnail,

                    'thumbnail_url' =>
                        $property->thumbnail_url ?? null,

                    'video_url' =>
                        $property->video_url,

                    'virtual_tour_url' =>
                        $property->virtual_tour_url,

                    /*
                    |--------------------------------------------------------------------------
                    | SEO
                    |--------------------------------------------------------------------------
                    */

                    'meta_title' =>
                        $property->meta_title,

                    'meta_description' =>
                        $property->meta_description,

                    'meta_keywords' =>
                        $property->meta_keywords,

                    /*
                    |--------------------------------------------------------------------------
                    | Statistics
                    |--------------------------------------------------------------------------
                    */

                    'views_count' =>
                        $property->views_count,

                    'favorites_count' =>
                        $property->favorites_count,

                    'published_at' =>
                        $property->published_at?->toISOString(),

                    'vacant_units_count' =>
                        $property->vacant_units_count ?? 0,

                    'occupied_units_count' =>
                        $property->occupied_units_count ?? 0,

                    'average_rating' =>
                        $property->average_rating ?? 0,

                    'reviews_count' =>
                        $property->reviews_count ?? 0,

                    'rating_breakdown' =>
                        $property->rating_breakdown ?? [],

                    'visits_count' =>
                        $property->visits_count ?? 0,

                    'unique_visits_count' =>
                        $property->unique_visits_count ?? 0,

                    /*
                    |--------------------------------------------------------------------------
                    | Property Type
                    |--------------------------------------------------------------------------
                    */

                    'property_type' =>
                        $property->relationLoaded('propertyType') &&
                        $property->propertyType
                            ? [

                                'id' =>
                                    $property->propertyType->id,

                                'name' =>
                                    $property->propertyType->name,

                                'slug' =>
                                    $property->propertyType->slug,

                                'description' =>
                                    $property->propertyType->description,

                                'icon' =>
                                    $property->propertyType->icon,

                                'color' =>
                                    $property->propertyType->color,

                                'status' =>
                                    $property->propertyType->status,

                                'is_active' =>
                                    (bool) $property->propertyType->is_active,

                                'is_featured' =>
                                    (bool) $property->propertyType->is_featured,

                                'sort_order' =>
                                    $property->propertyType->sort_order,

                                'display_name' =>
                                    $property->propertyType->display_name
                                    ?? $property->propertyType->name,

                                'status_label' =>
                                    $property->propertyType->status_label
                                    ?? null,
                            ]
                            : null,

                    /*
                    |--------------------------------------------------------------------------
                    | Property Category
                    |--------------------------------------------------------------------------
                    */

                    'property_category' =>
                        $property->relationLoaded('propertyCategory') &&
                        $property->propertyCategory
                            ? [

                                'id' =>
                                    $property->propertyCategory->id,

                                'parent_id' =>
                                    $property->propertyCategory->parent_id,

                                'name' =>
                                    $property->propertyCategory->name,

                                'slug' =>
                                    $property->propertyCategory->slug,

                                'description' =>
                                    $property->propertyCategory->description,

                                'icon' =>
                                    $property->propertyCategory->icon,

                                'image_url' =>
                                    $property->propertyCategory->image_url,

                                'banner_url' =>
                                    $property->propertyCategory->banner_url,

                                'status' =>
                                    $property->propertyCategory->status,

                                'is_featured' =>
                                    (bool) $property->propertyCategory->is_featured,

                                'show_in_homepage' =>
                                    (bool) $property->propertyCategory->show_in_homepage,

                                'is_popular' =>
                                    (bool) $property->propertyCategory->is_popular,

                                'sort_order' =>
                                    $property->propertyCategory->sort_order,

                                'color' =>
                                    $property->propertyCategory->color,

                                'views_count' =>
                                    $property->propertyCategory->views_count,

                                'settings' =>
                                    $property->propertyCategory->settings,

                                'published_at' =>
                                    $property->propertyCategory->published_at?->toISOString(),

                                'properties_count' =>
                                    $property->propertyCategory->properties_count ?? 0,
                            ]
                            : null,

                    /*
                    |--------------------------------------------------------------------------
                    | Timestamps
                    |--------------------------------------------------------------------------
                    */

                    'deleted_at' =>
                        $property->deleted_at?->toISOString(),

                    'created_at' =>
                        $property->created_at?->toISOString(),

                    'updated_at' =>
                        $property->updated_at?->toISOString(),
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Apartment
            |--------------------------------------------------------------------------
            */

            'apartment' => $this->whenLoaded('apartment', function () {

                if (!$this->apartment) {
                    return null;
                }

                $apartment = $this->apartment;

                return [

                    'id' =>
                        $apartment->id,

                    'property_id' =>
                        $apartment->property_id,

                    'name' =>
                        $apartment->name,

                    'slug' =>
                        $apartment->slug,

                    'description' =>
                        $apartment->description,

                    'block' =>
                        $apartment->block,

                    'apartment_number' =>
                        $apartment->apartment_number ?? null,

                    'total_floors' =>
                        $apartment->total_floors,

                    'total_units' =>
                        $apartment->total_units,

                    'status' =>
                        $apartment->status,

                    'has_elevator' =>
                        (bool) $apartment->has_elevator,

                    'has_backup_generator' =>
                        (bool) $apartment->has_backup_generator,

                    'has_security' =>
                        (bool) $apartment->has_security,

                    'has_parking' =>
                        (bool) $apartment->has_parking,

                    'thumbnail' =>
                        $apartment->thumbnail,

                    'thumbnail_public_id' =>
                        $apartment->thumbnail_public_id,

                    'thumbnail_url' =>
                        $apartment->thumbnail_url ?? null,

                    'meta_title' =>
                        $apartment->meta_title,

                    'meta_description' =>
                        $apartment->meta_description,

                    'meta_keywords' =>
                        $apartment->meta_keywords,

                    'units_count' =>
                        $apartment->units_count ?? 0,

                    'status_label' =>
                        $apartment->status_label ?? null,

                    'property_title' =>
                        $apartment->property_title
                        ?? $apartment->property?->title
                        ?? null,

                    'full_name' =>
                        $apartment->full_name
                        ?? $apartment->name,

                    'occupied_units_count' =>
                        $apartment->occupied_units_count ?? 0,

                    'vacant_units_count' =>
                        $apartment->vacant_units_count ?? 0,

                    'maintenance_units_count' =>
                        $apartment->maintenance_units_count ?? 0,

                    'occupancy_rate' =>
                        $apartment->occupancy_rate ?? 0,

                    /*
                    |--------------------------------------------------------------------------
                    | Nested Property
                    |--------------------------------------------------------------------------
                    */

                    'property' =>
                        $apartment->relationLoaded('property') &&
                        $apartment->property
                            ? [

                                'id' =>
                                    $apartment->property->id,

                                'title' =>
                                    $apartment->property->title,

                                'slug' =>
                                    $apartment->property->slug,

                                'property_code' =>
                                    $apartment->property->property_code,

                                'status' =>
                                    $apartment->property->status,

                                'country_name' =>
                                    $apartment->property->country_name,

                                'region_name' =>
                                    $apartment->property->region_name,

                                'county_name' =>
                                    $apartment->property->county_name,

                                'city_name' =>
                                    $apartment->property->city_name,

                                'area_name' =>
                                    $apartment->property->area_name,

                                'street_address' =>
                                    $apartment->property->street_address,

                                'full_location' =>
                                    $apartment->property->full_location ?? null,
                            ]
                            : null,

                    /*
                    |--------------------------------------------------------------------------
                    | Timestamps
                    |--------------------------------------------------------------------------
                    */

                    'deleted_at' =>
                        $apartment->deleted_at?->toISOString(),

                    'created_at' =>
                        $apartment->created_at?->toISOString(),

                    'updated_at' =>
                        $apartment->updated_at?->toISOString(),
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Unit
            |--------------------------------------------------------------------------
            */

            'unit' => $this->whenLoaded('unit', function () {

                if (!$this->unit) {
                    return null;
                }

                $unit = $this->unit;

                return [

                    'id' =>
                        $unit->id,

                    'property_id' =>
                        $unit->property_id,

                    'apartment_id' =>
                        $unit->apartment_id,

                    'unit_number' =>
                        $unit->unit_number,

                    'name' =>
                        $unit->name ?? null,

                    'slug' =>
                        $unit->slug ?? null,

                    'status' =>
                        $unit->status,

                    'price' =>
                        $unit->price,

                    'deposit' =>
                        $unit->deposit,

                    'service_charge' =>
                        $unit->service_charge,

                    'size' =>
                        $unit->size,

                    'size_unit' =>
                        $unit->size_unit ?? null,

                    'status_label' =>
                        $unit->status_label ?? null,

                    'is_vacant' =>
                        isset($unit->is_vacant)
                            ? (bool) $unit->is_vacant
                            : null,

                    'is_occupied' =>
                        isset($unit->is_occupied)
                            ? (bool) $unit->is_occupied
                            : null,

                    'is_reserved' =>
                        isset($unit->is_reserved)
                            ? (bool) $unit->is_reserved
                            : null,

                    'created_at' =>
                        $unit->created_at?->toISOString(),

                    'updated_at' =>
                        $unit->updated_at?->toISOString(),
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Tenancy Dates
            |--------------------------------------------------------------------------
            */

            'start_date' =>
                $this->start_date?->toISOString(),

            'end_date' =>
                $this->end_date?->toISOString(),

            'move_in_date' =>
                $this->move_in_date?->toISOString(),

            'move_out_date' =>
                $this->move_out_date?->toISOString(),

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */

            'rent_amount' =>
                $this->rent_amount,

            'deposit_amount' =>
                $this->deposit_amount,

            'service_charge' =>
                $this->service_charge,

            'late_fee' =>
                $this->late_fee,

            /*
            |--------------------------------------------------------------------------
            | Payment Configuration
            |--------------------------------------------------------------------------
            */

            'payment_frequency' =>
                $this->payment_frequency,

            'due_day' =>
                $this->due_day,

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            'status' =>
                $this->status,

            'status_label' =>
                $this->status_label,

            'is_active' =>
                (bool) $this->is_active,

            'is_expired' =>
                (bool) $this->is_expired,

            'is_currently_active' =>
                (bool) $this->is_currently_active,

            'has_moved_in' =>
                (bool) $this->has_moved_in,

            'has_moved_out' =>
                (bool) $this->has_moved_out,

            /*
            |--------------------------------------------------------------------------
            | Tenant Assignment State
            |--------------------------------------------------------------------------
            |
            | Active and pending tenancies block the tenant from being assigned
            | to another tenancy. Historical/ended tenancies do not.
            |
            */

            'blocks_tenant_assignment' =>
                method_exists($this->resource, 'blocksTenantAssignment')
                    ? $this->blocksTenantAssignment()
                    : (
                        in_array(
                            $this->status,
                            [
                                'active',
                                'pending',
                            ],
                            true
                        )
                        && (bool) $this->is_active
                    ),

            'tenant_assignment_status' =>
                method_exists($this->resource, 'blocksTenantAssignment')
                    ? (
                        $this->blocksTenantAssignment()
                            ? 'blocked'
                            : 'available'
                    )
                    : (
                        in_array(
                            $this->status,
                            [
                                'active',
                                'pending',
                            ],
                            true
                        )
                        && (bool) $this->is_active
                            ? 'blocked'
                            : 'available'
                    ),

            /*
            |--------------------------------------------------------------------------
            | Agreement
            |--------------------------------------------------------------------------
            */

            'agreement_file' =>
                $this->agreement_file,

            'agreement_public_id' =>
                $this->agreement_public_id ?? null,

            'agreement' => [

                'file' =>
                    $this->agreement_file,

                'public_id' =>
                    $this->agreement_public_id ?? null,

                'has_agreement' =>
                    !empty($this->agreement_file),
            ],

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

            'notes' =>
                $this->notes,

            /*
            |--------------------------------------------------------------------------
            | Timestamps
            |--------------------------------------------------------------------------
            */

            'created_at' =>
                $this->created_at?->toISOString(),

            'updated_at' =>
                $this->updated_at?->toISOString(),
        ];
    }
}