<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PlotPaymentResource extends JsonResource
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
            | Payment Identification
            |--------------------------------------------------------------------------
            */
            'id' => $this->id,
            'payment_number' => $this->payment_number ?? null,
            'reference_number' => $this->reference_number ?? null,

            /*
            |--------------------------------------------------------------------------
            | Related Sale
            |--------------------------------------------------------------------------
            */
            'plot_sale_id' => $this->plot_sale_id ?? null,

            /*
            |--------------------------------------------------------------------------
            | Payment Information
            |--------------------------------------------------------------------------
            */
            'amount' => $this->amount ?? null,
            'currency' => $this->currency ?? 'KES',
            'payment_method' => $this->payment_method ?? null,
            'payment_type' => $this->payment_type ?? null,
            'transaction_reference' => $this->transaction_reference ?? null,

            /*
            |--------------------------------------------------------------------------
            | Payment Status
            |--------------------------------------------------------------------------
            */
            'status' => $this->status ?? null,

            /*
            |--------------------------------------------------------------------------
            | Payment Dates
            |--------------------------------------------------------------------------
            */
            'payment_date' => $this->payment_date?->toDateString(),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
