<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BookingResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $booking = $this->resource;

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER HELPERS
        |--------------------------------------------------------------------------
        */

        $customer = $booking->relationLoaded('customer')
            ? $booking->customer
            : null;

        $user = $booking->relationLoaded('user')
            ? $booking->user
            : null;

        $tenant = $booking->relationLoaded('tenant')
            ? $booking->tenant
            : null;

        /*
        |--------------------------------------------------------------------------
        | CUSTOMER NAME
        |--------------------------------------------------------------------------
        */

        $customerName = null;

        if ($customer) {
            $customerName = trim(
                collect([
                    $customer->first_name ?? null,
                    $customer->last_name ?? null,
                ])
                    ->filter()
                    ->implode(' ')
            );

            if ($customerName === '') {
                $customerName = $customer->name ?? null;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SNAPSHOT NAME
        |--------------------------------------------------------------------------
        */

        $snapshotName = trim(
            collect([
                $booking->first_name,
                $booking->last_name,
            ])
                ->filter()
                ->implode(' ')
        );

        /*
        |--------------------------------------------------------------------------
        | USER NAME
        |--------------------------------------------------------------------------
        */

        $userName = null;

        if ($user) {
            $userName = trim(
                collect([
                    $user->first_name ?? null,
                    $user->last_name ?? null,
                ])
                    ->filter()
                    ->implode(' ')
            );

            if ($userName === '') {
                $userName = $user->name ?? null;
            }
        }

        return [

            /*
            |--------------------------------------------------------------------------
            | IDENTIFICATION
            |--------------------------------------------------------------------------
            */

            'id' => $booking->id,

            'booking_number' => $booking->booking_number,

            'reference' => $booking->reference,

            'slug' => $booking->slug,

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP IDS
            |--------------------------------------------------------------------------
            |
            | These IDs are the values the frontend should use when editing.
            |
            */

            'user_id' => $booking->user_id,

            'customer_id' => $booking->customer_id,

            'tenant_id' => $booking->tenant_id,

            'property_id' => $booking->property_id,

            'apartment_id' => $booking->apartment_id,

            'unit_id' => $booking->unit_id,

            'tenancy_id' => $booking->tenancy_id,

            /*
            |--------------------------------------------------------------------------
            | BOOKING CLASSIFICATION
            |--------------------------------------------------------------------------
            */

            'booking_type' => $booking->booking_type,

            'status' => $booking->status,

            'payment_status' => $booking->payment_status,

            'source' => $booking->source,

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */

            'booking_date' => $booking->booking_date?->toISOString(),

            'start_date' => $booking->start_date?->toDateString(),

            'end_date' => $booking->end_date?->toDateString(),

            'check_in_date' => $booking->check_in_date?->toDateString(),

            'check_out_date' => $booking->check_out_date?->toDateString(),

            'confirmed_at' => $booking->confirmed_at?->toISOString(),

            'approved_at' => $booking->approved_at?->toISOString(),

            'rejected_at' => $booking->rejected_at?->toISOString(),

            'cancelled_at' => $booking->cancelled_at?->toISOString(),

            'completed_at' => $booking->completed_at?->toISOString(),

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER
            |--------------------------------------------------------------------------
            |
            | IMPORTANT:
            |
            | customer = authoritative customer account.
            |
            | The frontend should use:
            |
            | booking.customer_id
            | booking.customer.id
            |
            | when editing a booking.
            |
            */

            'customer' => $this->whenLoaded(
                'customer',
                function () use (
                    $customer,
                    $customerName
                ) {
                    if (!$customer) {
                        return null;
                    }

                    return [
                        'id' => $customer->id,

                        'first_name' => $customer->first_name,

                        'last_name' => $customer->last_name,

                        'name' => $customerName,

                        'full_name' => $customerName,

                        'email' => $customer->email,

                        'phone' => $customer->phone,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER SNAPSHOT
            |--------------------------------------------------------------------------
            |
            | Historical information captured when the booking was created.
            |
            */

            'customer_snapshot' => [
                'first_name' => $booking->first_name,

                'last_name' => $booking->last_name,

                'full_name' => $snapshotName,

                'email' => $booking->email,

                'phone' => $booking->phone,
            ],

            /*
            |--------------------------------------------------------------------------
            | APPLICATION USER
            |--------------------------------------------------------------------------
            |
            | The authenticated/application user who created the booking.
            |
            */

            'user' => $this->whenLoaded(
                'user',
                function () use (
                    $user,
                    $userName
                ) {
                    if (!$user) {
                        return null;
                    }

                    return [
                        'id' => $user->id,

                        'first_name' => $user->first_name,

                        'last_name' => $user->last_name,

                        'name' => $userName,

                        'full_name' => $userName,

                        'email' => $user->email,

                        'phone' => $user->phone,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER ACCOUNT COMPATIBILITY
            |--------------------------------------------------------------------------
            |
            | Kept so existing frontend code using customer_user does not break.
            |
            */

            'customer_user' => $this->whenLoaded(
                'customer',
                function () use (
                    $customer,
                    $customerName
                ) {
                    if (!$customer) {
                        return null;
                    }

                    return [
                        'id' => $customer->id,

                        'first_name' => $customer->first_name,

                        'last_name' => $customer->last_name,

                        'name' => $customerName,

                        'full_name' => $customerName,

                        'email' => $customer->email,

                        'phone' => $customer->phone,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | TENANT
            |--------------------------------------------------------------------------
            */

            'tenant' => $this->whenLoaded(
                'tenant',
                function () use (
                    $tenant
                ) {
                    if (!$tenant) {
                        return null;
                    }

                    $tenantData = [
                        'id' => $tenant->id,

                        'tenant_number' => $tenant->tenant_number,

                        'user_id' => $tenant->user_id,

                        'status' => $tenant->status,
                    ];

                    /*
                    | Tenant user
                    */

                    if ($tenant->relationLoaded('user')) {
                        $tenantUser = $tenant->user;

                        $tenantData['user'] = $tenantUser
                            ? [
                                'id' => $tenantUser->id,

                                'first_name' =>
                                    $tenantUser->first_name,

                                'last_name' =>
                                    $tenantUser->last_name,

                                'name' => trim(
                                    collect([
                                        $tenantUser->first_name,
                                        $tenantUser->last_name,
                                    ])
                                        ->filter()
                                        ->implode(' ')
                                ) ?: $tenantUser->name,

                                'full_name' => trim(
                                    collect([
                                        $tenantUser->first_name,
                                        $tenantUser->last_name,
                                    ])
                                        ->filter()
                                        ->implode(' ')
                                ) ?: $tenantUser->name,

                                'email' => $tenantUser->email,

                                'phone' => $tenantUser->phone,
                            ]
                            : null;
                    }

                    return $tenantData;
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */

            'property' => $this->whenLoaded(
                'property',
                function () use ($booking) {
                    if (!$booking->property) {
                        return null;
                    }

                    return [
                        'id' => $booking->property->id,

                        'name' =>
                            $booking->property->name ?? null,

                        'slug' =>
                            $booking->property->slug ?? null,

                        'code' =>
                            $booking->property->code ?? null,

                        'status' =>
                            $booking->property->status ?? null,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | APARTMENT
            |--------------------------------------------------------------------------
            */

            'apartment' => $this->whenLoaded(
                'apartment',
                function () use ($booking) {
                    if (!$booking->apartment) {
                        return null;
                    }

                    return [
                        'id' => $booking->apartment->id,

                        'name' =>
                            $booking->apartment->name ?? null,

                        'slug' =>
                            $booking->apartment->slug ?? null,

                        'code' =>
                            $booking->apartment->code ?? null,

                        'status' =>
                            $booking->apartment->status ?? null,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | UNIT
            |--------------------------------------------------------------------------
            */

            'unit' => $this->whenLoaded(
                'unit',
                function () use ($booking) {
                    if (!$booking->unit) {
                        return null;
                    }

                    return [
                        'id' => $booking->unit->id,

                        'unit_number' =>
                            $booking->unit->unit_number ?? null,

                        'name' =>
                            $booking->unit->name ?? null,

                        'code' =>
                            $booking->unit->code ?? null,

                        'status' =>
                            $booking->unit->status ?? null,

                        'price' =>
                            $booking->unit->price ?? null,

                        'deposit' =>
                            $booking->unit->deposit ?? null,

                        'service_charge' =>
                            $booking->unit->service_charge ?? null,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | TENANCY
            |--------------------------------------------------------------------------
            */

            'tenancy' => $this->whenLoaded(
                'tenancy',
                function () use ($booking) {
                    if (!$booking->tenancy) {
                        return null;
                    }

                    return [
                        'id' => $booking->tenancy->id,

                        'tenancy_number' =>
                            $booking->tenancy->tenancy_number,

                        'tenant_id' =>
                            $booking->tenancy->tenant_id,

                        'property_id' =>
                            $booking->tenancy->property_id,

                        'apartment_id' =>
                            $booking->tenancy->apartment_id,

                        'unit_id' =>
                            $booking->tenancy->unit_id,

                        'start_date' =>
                            $booking->tenancy->start_date
                                ?->toDateString(),

                        'end_date' =>
                            $booking->tenancy->end_date
                                ?->toDateString(),

                        'status' =>
                            $booking->tenancy->status,

                        'is_active' =>
                            (bool) $booking->tenancy->is_active,
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL INFORMATION
            |--------------------------------------------------------------------------
            */

            'financials' => [
                'rent_amount' =>
                    $booking->rent_amount,

                'deposit_amount' =>
                    $booking->deposit_amount,

                'service_charge' =>
                    $booking->service_charge,

                'booking_fee' =>
                    $booking->booking_fee,

                'discount_amount' =>
                    $booking->discount_amount,

                'total_amount' =>
                    $booking->total_amount,

                'amount_paid' =>
                    $booking->amount_paid,

                'balance' =>
                    $booking->balance,

                'is_fully_paid' =>
                    (bool) $booking->isFullyPaid(),

                'is_partially_paid' =>
                    (bool) $booking->isPartiallyPaid(),

                'has_balance' =>
                    (bool) $booking->hasBalance(),
            ],

            /*
            |--------------------------------------------------------------------------
            | OCCUPANCY
            |--------------------------------------------------------------------------
            */

            'occupancy' => [
                'number_of_adults' =>
                    (int) $booking->number_of_adults,

                'number_of_children' =>
                    (int) $booking->number_of_children,

                'total_guests' =>
                    (int) $booking->number_of_adults
                    + (int) $booking->number_of_children,
            ],

            /*
            |--------------------------------------------------------------------------
            | REQUESTS / NOTES
            |--------------------------------------------------------------------------
            */

            'special_requests' =>
                $booking->special_requests,

            'notes' =>
                $booking->notes,

            /*
            |--------------------------------------------------------------------------
            | REJECTION / CANCELLATION
            |--------------------------------------------------------------------------
            */

            'rejection_reason' =>
                $booking->rejection_reason,

            'cancellation_reason' =>
                $booking->cancellation_reason,

            /*
            |--------------------------------------------------------------------------
            | PAYMENT
            |--------------------------------------------------------------------------
            */

            'payment' => [
                'method' =>
                    $booking->payment_method,

                'reference' =>
                    $booking->payment_reference,

                'paid_at' =>
                    $booking->paid_at?->toISOString(),
            ],

            /*
            |--------------------------------------------------------------------------
            | SEO / METADATA
            |--------------------------------------------------------------------------
            */

            'meta' => [
                'title' =>
                    $booking->meta_title,

                'description' =>
                    $booking->meta_description,

                'metadata' =>
                    $booking->metadata,
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS INFORMATION
            |--------------------------------------------------------------------------
            */

            'status_info' => [
                'is_pending' =>
                    (bool) $booking->isPending(),

                'is_confirmed' =>
                    (bool) $booking->isConfirmed(),

                'is_approved' =>
                    (bool) $booking->isApproved(),

                'is_rejected' =>
                    (bool) $booking->isRejected(),

                'is_cancelled' =>
                    (bool) $booking->isCancelled(),

                'is_completed' =>
                    (bool) $booking->isCompleted(),

                'is_expired' =>
                    (bool) $booking->isExpired(),

                'is_active' =>
                    (bool) $booking->isActive(),
            ],

            /*
            |--------------------------------------------------------------------------
            | SYSTEM TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' =>
                $booking->created_at?->toISOString(),

            'updated_at' =>
                $booking->updated_at?->toISOString(),

            'deleted_at' =>
                $booking->deleted_at?->toISOString(),
        ];
    }
}