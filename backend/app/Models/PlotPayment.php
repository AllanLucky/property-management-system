<?php

namespace App\Models;

use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOneThrough;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class PlotPayment extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Configuration
    |--------------------------------------------------------------------------
    */

    protected $table = 'plot_payments';

    /**
     * Attributes that can be mass assigned.
     */
    protected $fillable = [
        'plot_sale_id',
        'payment_number',
        'receipt_number',
        'transaction_reference',
        'amount',
        'currency',
        'payment_type',
        'payment_method',
        'payment_date',
        'payer_name',
        'payer_phone',
        'payer_email',
        'notes',
        'status',
        'is_active',
    ];

    /**
     * Attribute casting.
     */
    protected function casts(): array
    {
        return [
            'plot_sale_id' => 'integer',
            'amount' => 'decimal:2',
            'payment_date' => 'datetime',
            'is_active' => 'boolean',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'deleted_at' => 'datetime',
        ];
    }

    /**
     * Attributes appended to serialized model output.
     */
    protected $appends = [
        'formatted_amount',
    ];

    /**
     * Previous sale ID captured before a payment is reassigned.
     */
    protected ?int $previousPlotSaleId = null;

    /*
    |--------------------------------------------------------------------------
    | Constants
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public const STATUS_REFUNDED = 'refunded';

    public const DEFAULT_CURRENCY = 'KES';

    public const PAYMENT_NUMBER_PREFIX = 'PAY';

    public const PAYMENT_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_COMPLETED,
        self::STATUS_FAILED,
        self::STATUS_REFUNDED,
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the sale associated with this payment.
     */
    public function plotSale(): BelongsTo
    {
        return $this->belongsTo(PlotSale::class, 'plot_sale_id');
    }

    /**
     * Get the plot associated with this payment through its sale.
     */
    public function plot(): HasOneThrough
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
     * Get the buyer associated with this payment through its sale.
     */
    public function buyer(): HasOneThrough
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
     * Get the formatted payment amount.
     */
    public function getFormattedAmountAttribute(): string
    {
        return sprintf(
            '%s %s',
            $this->currency ?: self::DEFAULT_CURRENCY,
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
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope pending payments.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    /**
     * Scope failed payments.
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    /**
     * Scope refunded payments.
     */
    public function scopeRefunded(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REFUNDED);
    }

    /**
     * Scope payments by payment method.
     */
    public function scopePaymentMethod(
        Builder $query,
        string $method
    ): Builder {
        return $query->where('payment_method', $method);
    }

    /**
     * Scope payments by payment type.
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
        DateTimeInterface|string $startDate,
        DateTimeInterface|string $endDate
    ): Builder {
        return $query->whereBetween('payment_date', [
            $startDate,
            $endDate,
        ]);
    }

    /**
     * Search payments and their related sale numbers.
     */
    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        $search = trim($search);

        if ($search === '') {
            return $query;
        }

        $term = "%{$search}%";

        return $query->where(function (Builder $builder) use ($term) {
            $builder
                ->where('payment_number', 'like', $term)
                ->orWhere('receipt_number', 'like', $term)
                ->orWhere('transaction_reference', 'like', $term)
                ->orWhere('payer_name', 'like', $term)
                ->orWhere('payer_phone', 'like', $term)
                ->orWhere('payer_email', 'like', $term)
                ->orWhereHas('plotSale', function (Builder $saleQuery) use ($term) {
                    $saleQuery->where('sale_number', 'like', $term);
                });
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Status Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the payment is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Determine whether the payment is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Determine whether the payment has failed.
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Determine whether the payment has been refunded.
     */
    public function isRefunded(): bool
    {
        return $this->status === self::STATUS_REFUNDED;
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Status Actions
    |--------------------------------------------------------------------------
    */

    /**
     * Mark the payment as completed.
     */
    public function markAsCompleted(): bool
    {
        return $this->update([
            'status' => self::STATUS_COMPLETED,
            'is_active' => true,
        ]);
    }

    /**
     * Mark the payment as failed.
     */
    public function markAsFailed(): bool
    {
        return $this->update([
            'status' => self::STATUS_FAILED,
        ]);
    }

    /**
     * Mark the payment as refunded.
     *
     * The refunded status excludes the payment from completed
     * payment totals. This does not itself transfer money back
     * to the payer or create a separate refund transaction.
     */
    public function markAsRefunded(): bool
    {
        return $this->update([
            'status' => self::STATUS_REFUNDED,
            'is_active' => false,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Model Events
    |--------------------------------------------------------------------------
    */

    /**
     * Register model lifecycle events.
     */
    protected static function booted(): void
    {
        /*
         * Prepare defaults and capture the previous sale before
         * updating the payment.
         */
        static::creating(function (PlotPayment $payment): void {
            if (blank($payment->payment_number)) {
                $payment->payment_number = self::generatePaymentNumber();
            }

            if (blank($payment->currency)) {
                $payment->currency = self::DEFAULT_CURRENCY;
            }

            if (blank($payment->status)) {
                $payment->status = self::STATUS_PENDING;
            }

            if (blank($payment->payment_date)) {
                $payment->payment_date = now();
            }

            if ($payment->is_active === null) {
                $payment->is_active = true;
            }
        });

        static::updating(function (PlotPayment $payment): void {
            $payment->previousPlotSaleId = $payment->isDirty('plot_sale_id')
                ? (int) $payment->getOriginal('plot_sale_id')
                : null;
        });

        /*
         * Completed payments contribute to the sale balance.
         */
        static::created(function (PlotPayment $payment): void {
            if ($payment->isCompleted()) {
                $payment->updatePlotSaleBalance();
            }
        });

        /*
         * Recalculate both sales if a payment is reassigned.
         * Recalculate the current sale after amount or status changes.
         */
        static::updated(function (PlotPayment $payment): void {
            if (! $payment->wasChanged([
                'amount',
                'status',
                'plot_sale_id',
                'is_active',
            ])) {
                return;
            }

            $previousSaleId = $payment->previousPlotSaleId;

            if ($previousSaleId !== null
                && $previousSaleId !== (int) $payment->plot_sale_id) {
                self::recalculateSaleBalanceById($previousSaleId);
            }

            $payment->updatePlotSaleBalance();

            $payment->previousPlotSaleId = null;
        });

        /*
         * Soft deletion and force deletion both remove this payment
         * from the sale's ordinary payment totals.
         */
        static::deleted(function (PlotPayment $payment): void {
            $payment->updatePlotSaleBalance();
        });

        /*
         * Restoring a completed payment adds it back to the totals.
         */
        static::restored(function (PlotPayment $payment): void {
            $payment->updatePlotSaleBalance();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Number Generation
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a payment identifier.
     *
     * A database unique constraint on payment_number is recommended.
     */
    protected static function generatePaymentNumber(): string
    {
        do {
            $number = sprintf(
                '%s-%s-%s',
                self::PAYMENT_NUMBER_PREFIX,
                now()->format('YmdHis'),
                Str::upper(Str::random(6))
            );
        } while (static::withTrashed()
            ->where('payment_number', $number)
            ->exists());

        return $number;
    }

    /*
    |--------------------------------------------------------------------------
    | Financial Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Recalculate the related sale's payment totals.
     *
     * PlotSale must provide a completedPayments() relationship
     * or query returning only completed plot payments.
     */
    public function updatePlotSaleBalance(): void
    {
        $sale = $this->plotSale;

        if (! $sale) {
            return;
        }

        $amountPaid = (float) $sale->completedPayments()->sum('amount');

        $sale->amount_paid = number_format($amountPaid, 2, '.', '');

        $sale->recalculateBalance();

        $sale->saveQuietly();
    }

    /**
     * Recalculate a sale by its ID.
     *
     * Used when a payment moves from one sale to another.
     */
    protected static function recalculateSaleBalanceById(int $saleId): void
    {
        $sale = PlotSale::query()->find($saleId);

        if (! $sale) {
            return;
        }

        $amountPaid = (float) $sale->completedPayments()->sum('amount');

        $sale->amount_paid = number_format($amountPaid, 2, '.', '');

        $sale->recalculateBalance();

        $sale->saveQuietly();
    }
}
