<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MpesaTransaction extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Status Constants
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REVERSED = 'reversed';

    /*
    |--------------------------------------------------------------------------
    | Transaction Type Constants
    |--------------------------------------------------------------------------
    |
    | Common Safaricom M-Pesa transaction types can be stored here when
    | required by the integration.
    |
    */

    public const TYPE_C2B = 'C2B';

    public const TYPE_STK_PUSH = 'STK_PUSH';

    public const TYPE_B2C = 'B2C';

    public const TYPE_REVERSAL = 'REVERSAL';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'payment_id',

        'merchant_request_id',

        'checkout_request_id',

        'mpesa_receipt_number',

        'transaction_type',

        'account_reference',

        'phone_number',

        'amount',

        'transaction_date',

        'result_code',

        'result_description',

        'callback_payload',

        'status',
    ];

    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',

            'transaction_date' => 'datetime',

            'result_code' => 'integer',

            'callback_payload' => 'array',

            'created_at' => 'datetime',

            'updated_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the payment associated with this M-Pesa transaction.
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(
            Payment::class,
            'payment_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Status Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the transaction is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Determine whether the transaction was completed successfully.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Determine whether the transaction failed.
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Determine whether the transaction was cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Determine whether the transaction was reversed.
     */
    public function isReversed(): bool
    {
        return $this->status === self::STATUS_REVERSED;
    }

    /**
     * Determine whether the transaction was successful.
     */
    public function isSuccessful(): bool
    {
        return $this->status === self::STATUS_COMPLETED
            && (
                $this->result_code === null
                || $this->result_code === 0
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Transaction Type Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether this is an STK Push transaction.
     */
    public function isStkPush(): bool
    {
        return $this->transaction_type === self::TYPE_STK_PUSH;
    }

    /**
     * Determine whether this is a C2B transaction.
     */
    public function isC2b(): bool
    {
        return $this->transaction_type === self::TYPE_C2B;
    }

    /**
     * Determine whether this is a B2C transaction.
     */
    public function isB2c(): bool
    {
        return $this->transaction_type === self::TYPE_B2C;
    }

    /**
     * Determine whether this is a reversal transaction.
     */
    public function isReversal(): bool
    {
        return $this->transaction_type === self::TYPE_REVERSAL;
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope completed transactions.
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_COMPLETED
        );
    }

    /**
     * Scope pending transactions.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }

    /**
     * Scope failed transactions.
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_FAILED
        );
    }

    /**
     * Scope cancelled transactions.
     */
    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_CANCELLED
        );
    }

    /**
     * Scope reversed transactions.
     */
    public function scopeReversed(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_REVERSED
        );
    }

    /**
     * Scope successful transactions.
     */
    public function scopeSuccessful(Builder $query): Builder
    {
        return $query
            ->where('status', self::STATUS_COMPLETED)
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('result_code')
                    ->orWhere('result_code', 0);
            });
    }

    /**
     * Scope transactions for a specific payment.
     */
    public function scopeForPayment(
        Builder $query,
        int $paymentId
    ): Builder {
        return $query->where(
            'payment_id',
            $paymentId
        );
    }

    /**
     * Scope transactions for a specific phone number.
     */
    public function scopeForPhone(
        Builder $query,
        string $phoneNumber
    ): Builder {
        return $query->where(
            'phone_number',
            $phoneNumber
        );
    }

    /**
     * Scope transactions for a specific account reference.
     */
    public function scopeForAccountReference(
        Builder $query,
        string $accountReference
    ): Builder {
        return $query->where(
            'account_reference',
            $accountReference
        );
    }

    /**
     * Scope transactions for a specific M-Pesa receipt.
     */
    public function scopeForReceipt(
        Builder $query,
        string $receiptNumber
    ): Builder {
        return $query->where(
            'mpesa_receipt_number',
            $receiptNumber
        );
    }

    /**
     * Scope STK Push transactions.
     */
    public function scopeStkPush(Builder $query): Builder
    {
        return $query->where(
            'transaction_type',
            self::TYPE_STK_PUSH
        );
    }

    /**
     * Scope C2B transactions.
     */
    public function scopeC2b(Builder $query): Builder
    {
        return $query->where(
            'transaction_type',
            self::TYPE_C2B
        );
    }

    /**
     * Scope B2C transactions.
     */
    public function scopeB2c(Builder $query): Builder
    {
        return $query->where(
            'transaction_type',
            self::TYPE_B2C
        );
    }

    /**
     * Scope transactions within a date range.
     */
    public function scopeForPeriod(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query->whereBetween(
            'transaction_date',
            [
                $startDate,
                $endDate,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get a human-readable status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',

            self::STATUS_COMPLETED => 'Completed',

            self::STATUS_FAILED => 'Failed',

            self::STATUS_CANCELLED => 'Cancelled',

            self::STATUS_REVERSED => 'Reversed',

            default => ucfirst(
                str_replace(
                    '_',
                    ' ',
                    (string) $this->status
                )
            ),
        };
    }

    /**
     * Get a human-readable transaction type label.
     */
    public function getTransactionTypeLabelAttribute(): ?string
    {
        if (! $this->transaction_type) {
            return null;
        }

        return match ($this->transaction_type) {
            self::TYPE_C2B => 'C2B',

            self::TYPE_STK_PUSH => 'STK Push',

            self::TYPE_B2C => 'B2C',

            self::TYPE_REVERSAL => 'Reversal',

            default => ucfirst(
                str_replace(
                    '_',
                    ' ',
                    (string) $this->transaction_type
                )
            ),
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Static Options
    |--------------------------------------------------------------------------
    */

    /**
     * Get all supported transaction statuses.
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_COMPLETED,
            self::STATUS_FAILED,
            self::STATUS_CANCELLED,
            self::STATUS_REVERSED,
        ];
    }

    /**
     * Get transaction status options for forms/API responses.
     */
    public static function statusOptions(): array
    {
        return [
            self::STATUS_PENDING => 'Pending',

            self::STATUS_COMPLETED => 'Completed',

            self::STATUS_FAILED => 'Failed',

            self::STATUS_CANCELLED => 'Cancelled',

            self::STATUS_REVERSED => 'Reversed',
        ];
    }

    /**
     * Get supported M-Pesa transaction types.
     */
    public static function transactionTypes(): array
    {
        return [
            self::TYPE_C2B,
            self::TYPE_STK_PUSH,
            self::TYPE_B2C,
            self::TYPE_REVERSAL,
        ];
    }

    /**
     * Get transaction type options for forms/API responses.
     */
    public static function transactionTypeOptions(): array
    {
        return [
            self::TYPE_C2B => 'C2B',

            self::TYPE_STK_PUSH => 'STK Push',

            self::TYPE_B2C => 'B2C',

            self::TYPE_REVERSAL => 'Reversal',
        ];
    }
}