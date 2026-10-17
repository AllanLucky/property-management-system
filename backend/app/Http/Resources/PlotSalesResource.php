<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlotSalesResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $balance = (float) ($this->balance ?? 0);
        $amountPaid = (float) ($this->amount_paid ?? 0);

        /*
        |--------------------------------------------------------------------------
        | Derived Payment Status
        |--------------------------------------------------------------------------
        |
        | This is computed from existing financial fields. It is not a
        | database column on the PlotSale model.
        |
        */
        $paymentStatus = match (true) {
            $balance <= 0 => 'paid',
            $amountPaid > 0 => 'partial',
            default => 'pending',
        };

        return [
            /*
            |--------------------------------------------------------------------------
            | Sale Identification
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'sale_number' => $this->sale_number,

            /*
            |--------------------------------------------------------------------------
            | Plot Information
            |--------------------------------------------------------------------------
            */
            'plot_id' => $this->plot_id,

            'plot' => $this->whenLoaded('plot', function () {
                if (! $this->plot) {
                    return null;
                }

                return [
                    'id' => $this->plot->id,
                    'code' => $this->plot->code,
                    'title' => $this->plot->title,
                    'plot_number' => $this->plot->plot_number,
                    'title_number' => $this->plot->title_number,
                    'size' => $this->plot->size,
                    'size_unit' => $this->plot->size_unit,
                    'address' => $this->plot->address,
                    'asking_price' => $this->plot->asking_price,
                    'currency' => $this->plot->currency ?? 'KES',
                    'status' => $this->plot->status,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Buyer Information
            |--------------------------------------------------------------------------
            */
            'buyer_id' => $this->buyer_id,

            'buyer' => $this->whenLoaded('buyer', function () {
                if (! $this->buyer) {
                    return null;
                }

                $name = trim(
                    ($this->buyer->first_name ?? '')
                    . ' '
                    . ($this->buyer->last_name ?? '')
                );

                return [
                    'id' => $this->buyer->id,
                    'name' => $name !== ''
                        ? $name
                        : ($this->buyer->name ?? null),
                    'first_name' => $this->buyer->first_name ?? null,
                    'last_name' => $this->buyer->last_name ?? null,
                    'email' => $this->buyer->email,
                    'phone' => $this->buyer->phone ?? null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Agent Information
            |--------------------------------------------------------------------------
            */
            'agent_id' => $this->agent_id,

            'agent' => $this->whenLoaded('agent', function () {
                if (! $this->agent) {
                    return null;
                }

                $name = trim(
                    ($this->agent->first_name ?? '')
                    . ' '
                    . ($this->agent->last_name ?? '')
                );

                return [
                    'id' => $this->agent->id,
                    'name' => $name !== ''
                        ? $name
                        : ($this->agent->name ?? null),
                    'first_name' => $this->agent->first_name ?? null,
                    'last_name' => $this->agent->last_name ?? null,
                    'email' => $this->agent->email,
                    'phone' => $this->agent->phone ?? null,
                ];
            }),

            /*
            |--------------------------------------------------------------------------
            | Financial Information
            |--------------------------------------------------------------------------
            */
            'sale_price' => $this->sale_price,
            'deposit_amount' => $this->deposit_amount,
            'discount_amount' => $this->discount_amount,
            'net_sale_price' => $this->net_sale_price,
            'amount_paid' => $this->amount_paid,
            'balance' => $this->balance,
            'currency' => $this->currency ?? 'KES',

            /*
            |--------------------------------------------------------------------------
            | Computed Financial Information
            |--------------------------------------------------------------------------
            */
            'payment_percentage' => $this->payment_percentage,
            'payment_status' => $paymentStatus,
            'formatted_sale_price' => $this->formatted_sale_price,
            'formatted_amount_paid' => $this->formatted_amount_paid,
            'formatted_balance' => $this->formatted_balance,
            'is_fully_paid' => $this->is_fully_paid,
            'has_outstanding_balance' => $this->has_outstanding_balance,

            /*
            |--------------------------------------------------------------------------
            | Agreement Information
            |--------------------------------------------------------------------------
            */
            'agreement_number' => $this->agreement_number,
            'agreement_date' => $this->agreement_date?->toDateString(),

            /*
            |--------------------------------------------------------------------------
            | Payment Terms
            |--------------------------------------------------------------------------
            */
            'payment_frequency' => $this->payment_frequency,
            'due_date' => $this->due_date?->toDateString(),

            /*
            |--------------------------------------------------------------------------
            | Sale Status
            |--------------------------------------------------------------------------
            */
            'status' => $this->status,
            'is_active' => $this->is_active,

            /*
            |--------------------------------------------------------------------------
            | Completion Information
            |--------------------------------------------------------------------------
            */
            'completion_date' => $this->completion_date?->toDateString(),

            /*
            |--------------------------------------------------------------------------
            | Cancellation and Notes
            |--------------------------------------------------------------------------
            */
            'cancellation_reason' => $this->cancellation_reason,
            'notes' => $this->notes,

            /*
            |--------------------------------------------------------------------------
            | Payments
            |--------------------------------------------------------------------------
            */
            'payments' => $this->whenLoaded(
                'payments',
                fn () => PlotPaymentResource::collection(
                    $this->payments
                )
            ),

            /*
            |--------------------------------------------------------------------------
            | Audit Information
            |--------------------------------------------------------------------------
            */
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}