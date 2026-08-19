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

            /*
            |--------------------------------------------------------------------------
            | Tenant
            |--------------------------------------------------------------------------
            */

            'tenant_id' => $this->tenant_id,

            /*
            | Return the complete tenant relationship only when loaded.
            | This avoids unnecessary database queries.
            */

            'tenant' => $this->whenLoaded(
                'tenant',
                function () {
                    return [
                        'id' => $this->tenant->id,
                        'tenant_number' => $this->tenant->tenant_number,

                        'user_id' => $this->tenant->user_id,

                        'first_name' => $this->tenant->first_name,
                        'last_name' => $this->tenant->last_name,
                        'other_names' => $this->tenant->other_names,

                        'full_name' => $this->tenant->full_name,

                        'email' => $this->tenant->email,
                        'phone' => $this->tenant->phone,

                        'date_of_birth' => $this->tenant->date_of_birth?->format('Y-m-d'),
                        'gender' => $this->tenant->gender,

                        'id_number' => $this->tenant->id_number,
                        'passport_number' => $this->tenant->passport_number,

                        'country' => $this->tenant->country,
                        'county' => $this->tenant->county,
                        'city' => $this->tenant->city,
                        'postal_code' => $this->tenant->postal_code,
                        'address' => $this->tenant->address,

                        'occupation' => $this->tenant->occupation,
                        'employer' => $this->tenant->employer,
                        'monthly_income' => $this->tenant->monthly_income,

                        'emergency_contact' => [
                            'name' => $this->tenant->emergency_contact_name,
                            'phone' => $this->tenant->emergency_contact_phone,
                            'relationship' => $this->tenant->emergency_contact_relationship,
                        ],

                        'documents' => [
                            'photo' => $this->tenant->photo,
                            'id_front' => $this->tenant->id_front,
                            'id_back' => $this->tenant->id_back,
                        ],

                        'is_verified' => (bool) $this->tenant->is_verified,

                        'verification_status' =>
                            $this->tenant->verification_status,

                        'verified_at' => $this->tenant->verified_at?->toISOString(),

                        'status' => $this->tenant->status,

                        'status_label' => $this->tenant->status_label,

                        'is_active' => (bool) $this->tenant->is_active,

                        'notes' => $this->tenant->notes,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Tenant User Account
            |--------------------------------------------------------------------------
            |
            | This is important for your current issue where user_id was null.
            |
            | If the tenant has a linked User record, this will return the
            | actual user account information.
            |
            */

            'user' => $this->when(
                $this->relationLoaded('tenant') &&
                $this->tenant &&
                $this->tenant->relationLoaded('user'),
                function () {
                    if (!$this->tenant->user) {
                        return null;
                    }

                    $user = $this->tenant->user;

                    return [
                        'id' => $user->id,
                        'slug' => $user->slug ?? null,

                        'first_name' => $user->first_name,
                        'last_name' => $user->last_name,

                        'full_name' => $user->full_name
                            ?? trim(
                                collect([
                                    $user->first_name,
                                    $user->last_name,
                                ])
                                    ->filter()
                                    ->implode(' ')
                            ),

                        'email' => $user->email,
                        'phone' => $user->phone,

                        'is_verified' => (bool) ($user->is_verified ?? false),

                        'email_verified_at' =>
                            $user->email_verified_at?->toISOString(),

                        'profile' => [
                            'image' => $user->profile?->image ?? null,
                            'image_url' => $user->profile?->image_url
                                ?? null,
                            'image_public_id' =>
                                $user->profile?->image_public_id ?? null,
                            'gender' => $user->profile?->gender ?? null,
                            'nationality' =>
                                $user->profile?->nationality ?? null,
                            'address' =>
                                $user->profile?->address ?? null,
                            'date_of_birth' =>
                                $user->profile?->date_of_birth?->format('Y-m-d'),
                            'bio' => $user->profile?->bio ?? null,
                        ],

                        'roles' => method_exists($user, 'roles')
                            ? $user->roles->map(function ($role) {
                                return [
                                    'id' => $role->id,
                                    'name' => $role->name,
                                    'guard_name' => $role->guard_name,
                                ];
                            })->values()
                            : [],

                        'role_names' => method_exists($user, 'roles')
                            ? $user->roles
                                ->pluck('name')
                                ->values()
                                ->toArray()
                            : [],

                        'permissions' => method_exists($user, 'permissions')
                            ? $user->permissions
                                ->map(function ($permission) {
                                    return [
                                        'id' => $permission->id,
                                        'name' => $permission->name,
                                        'guard_name' =>
                                            $permission->guard_name,
                                    ];
                                })
                                ->values()
                            : [],

                        'permission_names' =>
                            method_exists($user, 'permissions')
                                ? $user->permissions
                                    ->pluck('name')
                                    ->values()
                                    ->toArray()
                                : [],

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

            'property' => $this->whenLoaded(
                'property',
                function () {
                    if (!$this->property) {
                        return null;
                    }

                    return [
                        'id' => $this->property->id,

                        'name' => $this->property->name ?? null,

                        'slug' => $this->property->slug ?? null,

                        'property_number' =>
                            $this->property->property_number ?? null,

                        'address' =>
                            $this->property->address ?? null,

                        'county' =>
                            $this->property->county ?? null,

                        'city' =>
                            $this->property->city ?? null,

                        'status' =>
                            $this->property->status ?? null,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Apartment
            |--------------------------------------------------------------------------
            */

            'apartment' => $this->whenLoaded(
                'apartment',
                function () {
                    if (!$this->apartment) {
                        return null;
                    }

                    return [
                        'id' => $this->apartment->id,

                        'name' =>
                            $this->apartment->name ?? null,

                        'slug' =>
                            $this->apartment->slug ?? null,

                        'apartment_number' =>
                            $this->apartment->apartment_number ?? null,

                        'property_id' =>
                            $this->apartment->property_id ?? null,

                        'status' =>
                            $this->apartment->status ?? null,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Unit
            |--------------------------------------------------------------------------
            */

            'unit' => $this->whenLoaded(
                'unit',
                function () {
                    if (!$this->unit) {
                        return null;
                    }

                    return [
                        'id' => $this->unit->id,

                        'unit_number' =>
                            $this->unit->unit_number ?? null,

                        'name' =>
                            $this->unit->name ?? null,

                        'slug' =>
                            $this->unit->slug ?? null,

                        'property_id' =>
                            $this->unit->property_id ?? null,

                        'apartment_id' =>
                            $this->unit->apartment_id ?? null,

                        'status' =>
                            $this->unit->status ?? null,

                        'price' =>
                            $this->unit->price ?? null,

                        'deposit' =>
                            $this->unit->deposit ?? null,

                        'service_charge' =>
                            $this->unit->service_charge ?? null,

                        'size' =>
                            $this->unit->size ?? null,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Tenancy Dates
            |--------------------------------------------------------------------------
            */

            'start_date' =>
                $this->start_date?->format('Y-m-d'),

            'end_date' =>
                $this->end_date?->format('Y-m-d'),

            'move_in_date' =>
                $this->move_in_date?->format('Y-m-d'),

            'move_out_date' =>
                $this->move_out_date?->format('Y-m-d'),

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */

            'rent_amount' => $this->rent_amount,

            'deposit_amount' => $this->deposit_amount,

            'service_charge' => $this->service_charge,

            'late_fee' => $this->late_fee,

            /*
            |--------------------------------------------------------------------------
            | Payment Configuration
            |--------------------------------------------------------------------------
            */

            'payment_frequency' => $this->payment_frequency,

            'due_day' => $this->due_day,

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            'status' => $this->status,

            'status_label' => $this->status_label,

            'is_active' => (bool) $this->is_active,

            'is_expired' => (bool) $this->is_expired,

            'is_currently_active' =>
                (bool) $this->is_currently_active,

            'has_moved_in' =>
                (bool) $this->has_moved_in,

            'has_moved_out' =>
                (bool) $this->has_moved_out,

            /*
            |--------------------------------------------------------------------------
            | Agreement
            |--------------------------------------------------------------------------
            */

            'agreement' => [
                'file' => $this->agreement_file,

                'has_agreement' =>
                    !empty($this->agreement_file),
            ],

            /*
            |--------------------------------------------------------------------------
            | Notes
            |--------------------------------------------------------------------------
            */

            'notes' => $this->notes,

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