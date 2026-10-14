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
            'payment_number' => $this->payment_number,
            'receipt_number' => $this->receipt_number,
            'transaction_reference' => $this->transaction_reference,

            /*
            |--------------------------------------------------------------------------
            | Related Plot Sale
            |--------------------------------------------------------------------------
            */

            'plot_sale_id' => $this->plot_sale_id,

            'plot_sale' => $this->whenLoaded(
                'plotSale',
                function () {
                    $sale = $this->plotSale;

                    if (! $sale) {
                        return null;
                    }

                    // Serialize the buyer only when the relationship
                    // has been loaded by the service or controller.
                    $buyer = $sale->relationLoaded('buyer')
                        ? $sale->getRelation('buyer')
                        : null;

                    return [
                        'id' => $sale->id,
                        'sale_number' => $sale->sale_number,
                        'status' => $sale->status,

                        'sale_price' => $sale->sale_price !== null
                            ? number_format(
                                (float) $sale->sale_price,
                                2,
                                '.',
                                ''
                            )
                            : null,

                        'currency' => $sale->currency ?? 'KES',
                        'buyer' => $this->formatBuyer($buyer),
                    ];
                }
            ),

            /*
            |--------------------------------------------------------------------------
            | Payment Information
            |--------------------------------------------------------------------------
            */

            'amount' => $this->amount !== null
                ? (float) $this->amount
                : null,

            'formatted_amount' => $this->amount !== null
                ? number_format(
                    (float) $this->amount,
                    2,
                    '.',
                    ','
                )
                : null,

            'currency' => $this->currency ?? 'KES',
            'payment_type' => $this->payment_type,
            'payment_method' => $this->payment_method,

            /*
            |--------------------------------------------------------------------------
            | Payer Information
            |--------------------------------------------------------------------------
            */

            'payer_name' => $this->resolvePayerName(),
            'payer_phone' => $this->resolvePayerPhone(),
            'payer_email' => $this->resolvePayerEmail(),

            /*
            |--------------------------------------------------------------------------
            | Payment Status
            |--------------------------------------------------------------------------
            */

            'status' => $this->status,

            'is_active' => $this->is_active !== null
                ? (bool) $this->is_active
                : null,

            /*
            |--------------------------------------------------------------------------
            | Additional Information
            |--------------------------------------------------------------------------
            */

            'notes' => $this->notes,

            /*
            |--------------------------------------------------------------------------
            | Payment Dates
            |--------------------------------------------------------------------------
            */

            'payment_date' => $this->payment_date?->toDateString(),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'deleted_at' => $this->deleted_at?->toDateTimeString(),
        ];
    }

    /**
     * Resolve payer name from the payment or its loaded buyer.
     */
    private function resolvePayerName(): ?string
    {
        $payerName = $this->payer_name;

        if (is_string($payerName) && trim($payerName) !== '') {
            return trim($payerName);
        }

        return $this->formatBuyerName($this->getLoadedBuyer());
    }

    /**
     * Resolve payer phone from the payment or loaded buyer.
     */
    private function resolvePayerPhone(): ?string
    {
        $payerPhone = $this->payer_phone;

        if (is_string($payerPhone) && trim($payerPhone) !== '') {
            return trim($payerPhone);
        }

        $buyer = $this->getLoadedBuyer();

        if (! $buyer) {
            return null;
        }

        $phone = $buyer->getAttribute('phone');

        return is_string($phone) && trim($phone) !== ''
            ? trim($phone)
            : null;
    }

    /**
     * Resolve payer email from the payment or loaded buyer.
     */
    private function resolvePayerEmail(): ?string
    {
        $payerEmail = $this->payer_email;

        if (is_string($payerEmail) && trim($payerEmail) !== '') {
            return trim($payerEmail);
        }

        $buyer = $this->getLoadedBuyer();

        if (! $buyer) {
            return null;
        }

        $email = $buyer->getAttribute('email');

        return is_string($email) && trim($email) !== ''
            ? trim($email)
            : null;
    }

    /**
     * Get the buyer only when both relationships are loaded.
     *
     * Avoids implicit database queries during resource serialization.
     */
    private function getLoadedBuyer()
    {
        if (! $this->resource->relationLoaded('plotSale')) {
            return null;
        }

        $sale = $this->resource->getRelation('plotSale');

        if (! $sale || ! $sale->relationLoaded('buyer')) {
            return null;
        }

        return $sale->getRelation('buyer');
    }

    /**
     * Format buyer details for the nested plot-sale response.
     */
    private function formatBuyer($buyer): ?array
    {
        if (! $buyer) {
            return null;
        }

        return [
            'id' => $buyer->getKey(),
            'name' => $this->formatBuyerName($buyer),
            'first_name' => $buyer->getAttribute('first_name'),
            'last_name' => $buyer->getAttribute('last_name'),
            'email' => $buyer->getAttribute('email'),
            'phone' => $buyer->getAttribute('phone'),
        ];
    }

    /**
     * Build the buyer's display name.
     */
    private function formatBuyerName($buyer): ?string
    {
        if (! $buyer) {
            return null;
        }

        $firstName = trim((string) ($buyer->getAttribute('first_name') ?? ''));
        $lastName = trim((string) ($buyer->getAttribute('last_name') ?? ''));

        $name = trim($firstName . ' ' . $lastName);

        if ($name !== '') {
            return $name;
        }

        foreach (['name', 'full_name'] as $attribute) {
            $value = $buyer->getAttribute($attribute);

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }
}