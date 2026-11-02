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
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_REFUNDED = 'refunded';

    public const DEFAULT_CURRENCY = 'KES';

    public const PAYMENT_NUMBER_PREFIX = 'PAY';
    public const RECEIPT_NUMBER_PREFIX = 'RCP';

    public const PAYMENT_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_COMPLETED,
        self::STATUS_FAILED,
        self::STATUS_CANCELLED,
        self::STATUS_REFUNDED,
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function plotSale(): BelongsTo
    {
        return $this->belongsTo(PlotSale::class, 'plot_sale_id');
    }

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

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    public function scopeStatus(
        Builder $query,
        string $status
    ): Builder {
        return $query->where('status', $status);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    public function scopeRefunded(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REFUNDED);
    }

    public function scopePaymentMethod(
        Builder $query,
        string $method
    ): Builder {
        return $query->where('payment_method', $method);
    }

    public function scopePaymentType(
        Builder $query,
        string $type
    ): Builder {
        return $query->where('payment_type', $type);
    }

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

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isRefunded(): bool
    {
        return $this->status === self::STATUS_REFUNDED;
    }

    public function contributesToSaleBalance(): bool
    {
        return $this->exists
            && ! $this->trashed()
            && $this->is_active
            && $this->isCompleted();
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Status Actions
    |--------------------------------------------------------------------------
    */

    public function markAsPending(): bool
    {
        return $this->update([
            'status' => self::STATUS_PENDING,
        ]);
    }

    public function markAsCompleted(): bool
    {
        return $this->update([
            'status' => self::STATUS_COMPLETED,
            'is_active' => true,
        ]);
    }

    public function markAsFailed(): bool
    {
        return $this->update([
            'status' => self::STATUS_FAILED,
        ]);
    }

    public function markAsCancelled(): bool
    {
        return $this->update([
            'status' => self::STATUS_CANCELLED,
        ]);
    }

    public function markAsRefunded(): bool
    {
        return $this->update([
            'status' => self::STATUS_REFUNDED,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Model Events
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        /*
         * Generate identifiers and set defaults.
         */
        static::creating(function (PlotPayment $payment): void {

            if (blank($payment->payment_number)) {
                $payment->payment_number = self::generatePaymentNumber();
            }

            if (blank($payment->receipt_number)) {
                $payment->receipt_number = self::generateReceiptNumber();
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

        /*
         * Capture previous sale before updating.
         */
        static::updating(function (PlotPayment $payment): void {
            $payment->previousPlotSaleId = $payment->isDirty('plot_sale_id')
                ? (int) $payment->getOriginal('plot_sale_id')
                : null;
        });

        /*
         * Recalculate sale after payment creation.
         */
        static::created(function (PlotPayment $payment): void {
            if ($payment->isCompleted()) {
                $payment->updatePlotSaleBalance();
            }
        });

        /*
         * Recalculate sale balances after payment changes.
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

            if (
                $previousSaleId !== null
                && $previousSaleId !== (int) $payment->plot_sale_id
            ) {
                self::recalculateSaleBalanceById($previousSaleId);
            }

            $payment->updatePlotSaleBalance();

            $payment->previousPlotSaleId = null;
        });

        /*
         * Recalculate after deletion.
         */
        static::deleted(function (PlotPayment $payment): void {
            $payment->updatePlotSaleBalance();
        });

        /*
         * Recalculate after restoration.
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
     * Generate a unique payment number.
     *
     * Example: PAY-20261102194530-RTI8ML
     */
    public static function generatePaymentNumber(): string
    {
        do {
            $number = sprintf(
                '%s-%s-%s',
                self::PAYMENT_NUMBER_PREFIX,
                now()->format('YmdHis'),
                Str::upper(Str::random(6))
            );
        } while (
            static::withTrashed()
                ->where('payment_number', $number)
                ->exists()
        );

        return $number;
    }

    /*
    |--------------------------------------------------------------------------
    | Receipt Number Generation
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique payment receipt number.
     *
     * Example: RCP-20261102-K8M4XP
     */
    public static function generateReceiptNumber(): string
    {
        do {
            $number = sprintf(
                '%s-%s-%s',
                self::RECEIPT_NUMBER_PREFIX,
                now()->format('Ymd'),
                Str::upper(Str::random(6))
            );
        } while (
            static::withTrashed()
                ->where('receipt_number', $number)
                ->exists()
        );

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
     * Only active, non-deleted, completed payments contribute.
     */
    public function updatePlotSaleBalance(): void
    {
        if (! $this->plot_sale_id) {
            return;
        }

        $sale = $this->plotSale;

        if (! $sale) {
            return;
        }

        $amountPaid = (float) $sale->completedPayments()
            ->where('is_active', true)
            ->sum('amount');

        $sale->amount_paid = number_format(
            $amountPaid,
            2,
            '.',
            ''
        );

        $sale->recalculateBalance();

        $sale->saveQuietly();
    }

    /**
     * Recalculate a sale by its ID.
     */
    protected static function recalculateSaleBalanceById(int $saleId): void
    {
        $sale = PlotSale::query()->find($saleId);

        if (! $sale) {
            return;
        }

        $amountPaid = (float) $sale->completedPayments()
            ->where('is_active', true)
            ->sum('amount');

        $sale->amount_paid = number_format(
            $amountPaid,
            2,
            '.',
            ''
        );

        $sale->recalculateBalance();

        $sale->saveQuietly();
    }
}
