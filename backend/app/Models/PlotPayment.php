<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlotPayment extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Table
    |--------------------------------------------------------------------------
    */

    protected $table = 'plot_payments';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'plot_sale_id',

        // Payment identification
        'payment_number',
        'receipt_number',
        'transaction_reference',

        // Payment information
        'amount',
        'currency',
        'payment_type',
        'payment_method',
        'payment_date',

        // Payment details
        'payer_name',
        'payer_phone',
        'payer_email',
        'notes',

        // Status
        'status',
        'is_active',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'amount' => 'decimal:2',

        'payment_date' => 'datetime',

        'is_active' => 'boolean',

        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Appended Attributes
    |--------------------------------------------------------------------------
    */

    protected $appends = [
        'formatted_amount',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the plot sale associated with this payment.
     */
    public function plotSale(): BelongsTo
    {
        return $this->belongsTo(PlotSale::class);
    }

    /**
     * Get the plot through the plot sale.
     */
    public function plot()
    {
        return $this->hasOneThrough(
            Plot::class,
            PlotSale::class,
            'id',
            'id',
            'plot_sale_id',
            'plot_id'
        );
    }

    /**
     * Get the buyer through the plot sale.
     */
    public function buyer()
    {
        return $this->hasOneThrough(
            User::class,
            PlotSale::class,
            'id',
            'id',
            'plot_sale_id',
            'buyer_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get formatted payment amount.
     */
    public function getFormattedAmountAttribute(): string
    {
        $currency = $this->currency ?: 'KES';

        return sprintf(
            '%s %s',
            $currency,
            number_format((float) $this->amount, 2)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope active payments.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope inactive payments.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope payments by status.
     */
    public function scopeStatus(
        Builder $query,
        string $status
    ): Builder {
        return $query->where('status', $status);
    }

    /**
     * Scope completed payments.
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope pending payments.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope failed payments.
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', 'failed');
    }

    /**
     * Scope refunded payments.
     */
    public function scopeRefunded(Builder $query): Builder
    {
        return $query->where('status', 'refunded');
    }

    /**
     * Scope payments by method.
     */
    public function scopePaymentMethod(
        Builder $query,
        string $method
    ): Builder {
        return $query->where('payment_method', $method);
    }

    /**
     * Scope payments by type.
     */
    public function scopePaymentType(
        Builder $query,
        string $type
    ): Builder {
        return $query->where('payment_type', $type);
    }

    /**
     * Scope payments within a date range.
     */
    public function scopeBetweenDates(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query->whereBetween('payment_date', [
            $startDate,
            $endDate,
        ]);
    }

    /**
     * Search payments.
     */
    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        return $query->where(function (Builder $builder) use ($search) {
            $builder
                ->where('payment_number', 'like', "%{$search}%")
                ->orWhere('receipt_number', 'like', "%{$search}%")
                ->orWhere(
                    'transaction_reference',
                    'like',
                    "%{$search}%"
                )
                ->orWhere('payer_name', 'like', "%{$search}%")
                ->orWhere('payer_phone', 'like', "%{$search}%")
                ->orWhere('payer_email', 'like', "%{$search}%")
                ->orWhereHas('plotSale', function (Builder $saleQuery) use ($search) {
                    $saleQuery->where(
                        'sale_number',
                        'like',
                        "%{$search}%"
                    );
                });
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the payment is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Determine whether the payment is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Determine whether the payment failed.
     */
    public function isFailed(): bool
    {
        return $this->status === 'failed';
    }

    /**
     * Determine whether the payment was refunded.
     */
    public function isRefunded(): bool
    {
        return $this->status === 'refunded';
    }

    /**
     * Mark the payment as completed.
     */
    public function markAsCompleted(): bool
    {
        return $this->update([
            'status' => 'completed',
            'is_active' => true,
        ]);
    }

    /**
     * Mark the payment as failed.
     */
    public function markAsFailed(): bool
    {
        return $this->update([
            'status' => 'failed',
        ]);
    }

    /**
     * Mark the payment as refunded.
     */
    public function markAsRefunded(): bool
    {
        return $this->update([
            'status' => 'refunded',
            'is_active' => false,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Model Events
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        static::creating(function (PlotPayment $payment) {
            /*
             * Generate a payment number when one is not supplied.
             */
            if (empty($payment->payment_number)) {
                $payment->payment_number = 'PAY-' . now()->format('YmdHis');
            }

            /*
             * Default currency.
             */
            if (empty($payment->currency)) {
                $payment->currency = 'KES';
            }

            /*
             * Default status.
             */
            if (empty($payment->status)) {
                $payment->status = 'pending';
            }

            /*
             * Default payment date.
             */
            if (empty($payment->payment_date)) {
                $payment->payment_date = now();
            }

            /*
             * Default active state.
             */
            if ($payment->is_active === null) {
                $payment->is_active = true;
            }
        });

        static::created(function (PlotPayment $payment) {
            /*
             * Only completed payments should affect
             * the plot sale's amount paid and balance.
             */
            if ($payment->status === 'completed') {
                $payment->updatePlotSaleBalance();
            }
        });

        static::updated(function (PlotPayment $payment) {
            /*
             * Recalculate the sale whenever the payment amount
             * or status changes.
             */
            if (
                $payment->wasChanged([
                    'amount',
                    'status',
                    'plot_sale_id',
                ])
            ) {
                $payment->updatePlotSaleBalance();
            }
        });

        static::deleted(function (PlotPayment $payment) {
            /*
             * Recalculate the sale after a payment is deleted.
             */
            $payment->updatePlotSaleBalance();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Financial Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Update the related plot sale's payment totals.
     */
    public function updatePlotSaleBalance(): void
    {
        $sale = $this->plotSale;

        if (!$sale) {
            return;
        }

        $amountPaid = $sale->completedPayments()
            ->sum('amount');

        $sale->amount_paid = $amountPaid;

        $sale->recalculateBalance();

        $sale->saveQuietly();
    }
}
