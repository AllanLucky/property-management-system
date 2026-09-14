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
        /*
        |--------------------------------------------------------------------------
        | Resolve the underlying Booking model
        |--------------------------------------------------------------------------
        |
        | JsonResource itself does not contain the Booking model methods such as
        | isFullyPaid(), isPending(), isActive(), etc.
        |
        | Always work with the underlying model through $booking.
        |
        */
        $booking = $this->resource;

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
            | CUSTOMER SNAPSHOT
            |--------------------------------------------------------------------------
            |
            | This represents the customer information stored directly on the
            | booking at the time it was created.
            |
            */
            'customer' => [
                'first_name' => $booking->first_name,
                'last_name' => $booking->last_name,

                'full_name' => trim(
                    collect([
                        $booking->first_name,
                        $booking->last_name,
                    ])
                        ->filter()
                        ->implode(' ')
                ),

                'email' => $booking->email,
                'phone' => $booking->phone,
            ],

            /*
            |--------------------------------------------------------------------------
            | APPLICATION USER
            |--------------------------------------------------------------------------
            */
            'user' => $this->whenLoaded('user', function () use ($booking) {
                if (!$booking->user) {
                    return null;
                }

                return [
                    'id' => $booking->user->id,
                    'first_name' => $booking->user->first_name,
                    'last_name' => $booking->user->last_name,

                    'name' => trim(
                        collect([
                            $booking->user->first_name,
                            $booking->user->last_name,
                        ])
                            ->filter()
                            ->implode(' ')
                    ),

                    'email' => $booking->user->email,
                    'phone' => $booking->user->phone,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER ACCOUNT
            |--------------------------------------------------------------------------
            |
            | Kept separately from the customer snapshot to avoid breaking
            | existing frontend consumers.
            |
            */
            'customer_user' => $this->whenLoaded('customer', function () use ($booking) {
                if (!$booking->customer) {
                    return null;
                }

                return [
                    'id' => $booking->customer->id,
                    'first_name' => $booking->customer->first_name,
                    'last_name' => $booking->customer->last_name,

                    'name' => trim(
                        collect([
                            $booking->customer->first_name,
                            $booking->customer->last_name,
                        ])
                            ->filter()
                            ->implode(' ')
                    ),

                    'email' => $booking->customer->email,
                    'phone' => $booking->customer->phone,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | TENANT
            |--------------------------------------------------------------------------
            */
            'tenant' => $this->whenLoaded('tenant', function () use ($booking) {
                if (!$booking->tenant) {
                    return null;
                }

                $tenant = [
                    'id' => $booking->tenant->id,
                    'tenant_number' => $booking->tenant->tenant_number,
                    'user_id' => $booking->tenant->user_id,
                    'status' => $booking->tenant->status,
                ];

                /*
                |--------------------------------------------------------------------------
                | TENANT USER
                |--------------------------------------------------------------------------
                */
                if ($booking->tenant->relationLoaded('user')) {
                    $tenant['user'] = $booking->tenant->user
                        ? [
                            'id' => $booking->tenant->user->id,
                            'first_name' => $booking->tenant->user->first_name,
                            'last_name' => $booking->tenant->user->last_name,

                            'name' => trim(
                                collect([
                                    $booking->tenant->user->first_name,
                                    $booking->tenant->user->last_name,
                                ])
                                    ->filter()
                                    ->implode(' ')
                            ),

                            'email' => $booking->tenant->user->email,
                            'phone' => $booking->tenant->user->phone,
                        ]
                        : null;
                }

                return $tenant;
            }),

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */
            'property' => $this->whenLoaded('property', function () use ($booking) {
                if (!$booking->property) {
                    return null;
                }

                return [
                    'id' => $booking->property->id,
                    'name' => $booking->property->name ?? null,
                    'slug' => $booking->property->slug ?? null,
                    'code' => $booking->property->code ?? null,
                    'status' => $booking->property->status ?? null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | APARTMENT
            |--------------------------------------------------------------------------
            */
            'apartment' => $this->whenLoaded('apartment', function () use ($booking) {
                if (!$booking->apartment) {
                    return null;
                }

                return [
                    'id' => $booking->apartment->id,
                    'name' => $booking->apartment->name ?? null,
                    'slug' => $booking->apartment->slug ?? null,
                    'code' => $booking->apartment->code ?? null,
                    'status' => $booking->apartment->status ?? null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | UNIT
            |--------------------------------------------------------------------------
            */
            'unit' => $this->whenLoaded('unit', function () use ($booking) {
                if (!$booking->unit) {
                    return null;
                }

                return [
                    'id' => $booking->unit->id,
                    'unit_number' => $booking->unit->unit_number ?? null,
                    'name' => $booking->unit->name ?? null,
                    'code' => $booking->unit->code ?? null,
                    'status' => $booking->unit->status ?? null,

                    'price' => $booking->unit->price ?? null,
                    'deposit' => $booking->unit->deposit ?? null,
                    'service_charge' => $booking->unit->service_charge ?? null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | TENANCY
            |--------------------------------------------------------------------------
            */
            'tenancy' => $this->whenLoaded('tenancy', function () use ($booking) {
                if (!$booking->tenancy) {
                    return null;
                }

                return [
                    'id' => $booking->tenancy->id,
                    'tenancy_number' => $booking->tenancy->tenancy_number,

                    'tenant_id' => $booking->tenancy->tenant_id,
                    'property_id' => $booking->tenancy->property_id,
                    'apartment_id' => $booking->tenancy->apartment_id,
                    'unit_id' => $booking->tenancy->unit_id,

                    'start_date' => $booking->tenancy->start_date?->toDateString(),
                    'end_date' => $booking->tenancy->end_date?->toDateString(),

                    'status' => $booking->tenancy->status,
                    'is_active' => (bool) $booking->tenancy->is_active,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL INFORMATION
            |--------------------------------------------------------------------------
            */
            'financials' => [
                'rent_amount' => $booking->rent_amount,
                'deposit_amount' => $booking->deposit_amount,
                'service_charge' => $booking->service_charge,
                'booking_fee' => $booking->booking_fee,
                'discount_amount' => $booking->discount_amount,

                'total_amount' => $booking->total_amount,
                'amount_paid' => $booking->amount_paid,
                'balance' => $booking->balance,

                /*
                |--------------------------------------------------------------------------
                | Payment State
                |--------------------------------------------------------------------------
                |
                | These methods belong to Booking model, not BookingResource.
                |
                */
                'is_fully_paid' => (bool) $booking->isFullyPaid(),
                'is_partially_paid' => (bool) $booking->isPartiallyPaid(),
                'has_balance' => (bool) $booking->hasBalance(),
            ],

            /*
            |--------------------------------------------------------------------------
            | OCCUPANCY
            |--------------------------------------------------------------------------
            */
            'occupancy' => [
                'number_of_adults' => (int) $booking->number_of_adults,
                'number_of_children' => (int) $booking->number_of_children,

                'total_guests' =>
                    (int) $booking->number_of_adults +
                    (int) $booking->number_of_children,
            ],

            /*
            |--------------------------------------------------------------------------
            | REQUESTS / NOTES
            |--------------------------------------------------------------------------
            */
            'special_requests' => $booking->special_requests,
            'notes' => $booking->notes,

            /*
            |--------------------------------------------------------------------------
            | REJECTION / CANCELLATION
            |--------------------------------------------------------------------------
            */
            'rejection_reason' => $booking->rejection_reason,
            'cancellation_reason' => $booking->cancellation_reason,

            /*
            |--------------------------------------------------------------------------
            | PAYMENT
            |--------------------------------------------------------------------------
            */
            'payment' => [
                'method' => $booking->payment_method,
                'reference' => $booking->payment_reference,
                'paid_at' => $booking->paid_at?->toISOString(),
            ],

            /*
            |--------------------------------------------------------------------------
            | SEO / METADATA
            |--------------------------------------------------------------------------
            */
            'meta' => [
                'title' => $booking->meta_title,
                'description' => $booking->meta_description,
                'metadata' => $booking->metadata,
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS INFORMATION
            |--------------------------------------------------------------------------
            |
            | All status helper methods belong to the Booking model.
            |
            */
            'status_info' => [
                'is_pending' => (bool) $booking->isPending(),
                'is_confirmed' => (bool) $booking->isConfirmed(),
                'is_approved' => (bool) $booking->isApproved(),
                'is_rejected' => (bool) $booking->isRejected(),
                'is_cancelled' => (bool) $booking->isCancelled(),
                'is_completed' => (bool) $booking->isCompleted(),
                'is_expired' => (bool) $booking->isExpired(),
                'is_active' => (bool) $booking->isActive(),
            ],

            /*
            |--------------------------------------------------------------------------
            | SYSTEM TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => $booking->created_at?->toISOString(),
            'updated_at' => $booking->updated_at?->toISOString(),
            'deleted_at' => $booking->deleted_at?->toISOString(),
        ];
    }
}