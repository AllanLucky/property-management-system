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
        return [
            /*
            |--------------------------------------------------------------------------
            | IDENTIFICATION
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'booking_number' => $this->booking_number,
            'reference' => $this->reference,
            'slug' => $this->slug,

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP IDS
            |--------------------------------------------------------------------------
            */
            'user_id' => $this->user_id,
            'customer_id' => $this->customer_id,
            'tenant_id' => $this->tenant_id,
            'property_id' => $this->property_id,
            'apartment_id' => $this->apartment_id,
            'unit_id' => $this->unit_id,
            'tenancy_id' => $this->tenancy_id,

            /*
            |--------------------------------------------------------------------------
            | BOOKING CLASSIFICATION
            |--------------------------------------------------------------------------
            */
            'booking_type' => $this->booking_type,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'source' => $this->source,

            /*
            |--------------------------------------------------------------------------
            | DATES
            |--------------------------------------------------------------------------
            */
            'booking_date' => $this->booking_date?->toISOString(),
            'start_date' => $this->start_date?->toDateString(),
            'end_date' => $this->end_date?->toDateString(),

            'check_in_date' => $this->check_in_date?->toDateString(),
            'check_out_date' => $this->check_out_date?->toDateString(),

            'confirmed_at' => $this->confirmed_at?->toISOString(),
            'approved_at' => $this->approved_at?->toISOString(),
            'rejected_at' => $this->rejected_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'completed_at' => $this->completed_at?->toISOString(),

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER SNAPSHOT
            |--------------------------------------------------------------------------
            */
            'customer' => [
                'first_name' => $this->first_name,
                'last_name' => $this->last_name,
                'full_name' => trim(
                    collect([
                        $this->first_name,
                        $this->last_name,
                    ])->filter()->implode(' ')
                ),
                'email' => $this->email,
                'phone' => $this->phone,
            ],

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER USER
            |--------------------------------------------------------------------------
            |
            | The authenticated/application user who owns or created
            | the booking is different from the customer snapshot.
            |
            */
            'user' => $this->whenLoaded('user', function () {
                return $this->user ? [
                    'id' => $this->user->id,
                    'first_name' => $this->user->first_name,
                    'last_name' => $this->user->last_name,
                    'name' => trim(
                        collect([
                            $this->user->first_name,
                            $this->user->last_name,
                        ])->filter()->implode(' ')
                    ),
                    'email' => $this->user->email,
                    'phone' => $this->user->phone,
                ] : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER ACCOUNT
            |--------------------------------------------------------------------------
            */
            'customer_user' => $this->whenLoaded('customer', function () {
                return $this->customer ? [
                    'id' => $this->customer->id,
                    'first_name' => $this->customer->first_name,
                    'last_name' => $this->customer->last_name,
                    'name' => trim(
                        collect([
                            $this->customer->first_name,
                            $this->customer->last_name,
                        ])->filter()->implode(' ')
                    ),
                    'email' => $this->customer->email,
                    'phone' => $this->customer->phone,
                ] : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | TENANT
            |--------------------------------------------------------------------------
            */
            'tenant' => $this->whenLoaded('tenant', function () {
                return $this->tenant ? [
                    'id' => $this->tenant->id,
                    'tenant_number' => $this->tenant->tenant_number,
                    'user_id' => $this->tenant->user_id,
                    'status' => $this->tenant->status,

                    'user' => $this->when(
                        $this->tenant->relationLoaded('user'),
                        function () {
                            return $this->tenant->user ? [
                                'id' => $this->tenant->user->id,
                                'first_name' => $this->tenant->user->first_name,
                                'last_name' => $this->tenant->user->last_name,
                                'name' => trim(
                                    collect([
                                        $this->tenant->user->first_name,
                                        $this->tenant->user->last_name,
                                    ])->filter()->implode(' ')
                                ),
                                'email' => $this->tenant->user->email,
                                'phone' => $this->tenant->user->phone,
                            ] : null;
                        }
                    ),
                ] : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */
            'property' => $this->whenLoaded('property', function () {
                return $this->property ? [
                    'id' => $this->property->id,
                    'name' => $this->property->name,
                    'slug' => $this->property->slug,
                    'code' => $this->property->code ?? null,
                    'status' => $this->property->status ?? null,
                ] : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | APARTMENT
            |--------------------------------------------------------------------------
            */
            'apartment' => $this->whenLoaded('apartment', function () {
                return $this->apartment ? [
                    'id' => $this->apartment->id,
                    'name' => $this->apartment->name,
                    'slug' => $this->apartment->slug ?? null,
                    'code' => $this->apartment->code ?? null,
                    'status' => $this->apartment->status ?? null,
                ] : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | UNIT
            |--------------------------------------------------------------------------
            */
            'unit' => $this->whenLoaded('unit', function () {
                return $this->unit ? [
                    'id' => $this->unit->id,
                    'unit_number' => $this->unit->unit_number ?? null,
                    'name' => $this->unit->name ?? null,
                    'code' => $this->unit->code ?? null,
                    'status' => $this->unit->status ?? null,
                    'price' => $this->unit->price ?? null,
                    'deposit' => $this->unit->deposit ?? null,
                    'service_charge' => $this->unit->service_charge ?? null,
                ] : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | TENANCY
            |--------------------------------------------------------------------------
            */
            'tenancy' => $this->whenLoaded('tenancy', function () {
                return $this->tenancy ? [
                    'id' => $this->tenancy->id,
                    'tenancy_number' => $this->tenancy->tenancy_number,
                    'tenant_id' => $this->tenancy->tenant_id,
                    'property_id' => $this->tenancy->property_id,
                    'apartment_id' => $this->tenancy->apartment_id,
                    'unit_id' => $this->tenancy->unit_id,
                    'start_date' => $this->tenancy->start_date?->toDateString(),
                    'end_date' => $this->tenancy->end_date?->toDateString(),
                    'status' => $this->tenancy->status,
                    'is_active' => (bool) $this->tenancy->is_active,
                ] : null;
            }),

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL INFORMATION
            |--------------------------------------------------------------------------
            */
            'financials' => [
                'rent_amount' => $this->rent_amount,
                'deposit_amount' => $this->deposit_amount,
                'service_charge' => $this->service_charge,
                'booking_fee' => $this->booking_fee,
                'discount_amount' => $this->discount_amount,
                'total_amount' => $this->total_amount,
                'amount_paid' => $this->amount_paid,
                'balance' => $this->balance,

                'is_fully_paid' => (bool) $this->isFullyPaid(),
                'is_partially_paid' => (bool) $this->isPartiallyPaid(),
                'has_balance' => (bool) $this->hasBalance(),
            ],

            /*
            |--------------------------------------------------------------------------
            | OCCUPANCY
            |--------------------------------------------------------------------------
            */
            'occupancy' => [
                'number_of_adults' => $this->number_of_adults,
                'number_of_children' => $this->number_of_children,
                'total_guests' => (int) $this->number_of_adults
                    + (int) $this->number_of_children,
            ],

            /*
            |--------------------------------------------------------------------------
            | REQUESTS / NOTES
            |--------------------------------------------------------------------------
            */
            'special_requests' => $this->special_requests,
            'notes' => $this->notes,

            /*
            |--------------------------------------------------------------------------
            | REJECTION / CANCELLATION
            |--------------------------------------------------------------------------
            */
            'rejection_reason' => $this->rejection_reason,
            'cancellation_reason' => $this->cancellation_reason,

            /*
            |--------------------------------------------------------------------------
            | PAYMENT
            |--------------------------------------------------------------------------
            */
            'payment' => [
                'method' => $this->payment_method,
                'reference' => $this->payment_reference,
                'paid_at' => $this->paid_at?->toISOString(),
            ],

            /*
            |--------------------------------------------------------------------------
            | SEO / METADATA
            |--------------------------------------------------------------------------
            */
            'meta' => [
                'title' => $this->meta_title,
                'description' => $this->meta_description,
                'metadata' => $this->metadata,
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS HELPERS
            |--------------------------------------------------------------------------
            */
            'status_info' => [
                'is_pending' => (bool) $this->isPending(),
                'is_confirmed' => (bool) $this->isConfirmed(),
                'is_approved' => (bool) $this->isApproved(),
                'is_rejected' => (bool) $this->isRejected(),
                'is_cancelled' => (bool) $this->isCancelled(),
                'is_completed' => (bool) $this->isCompleted(),
                'is_expired' => (bool) $this->isExpired(),
                'is_active' => (bool) $this->isActive(),
            ],

            /*
            |--------------------------------------------------------------------------
            | SYSTEM TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
        ];
    }
}