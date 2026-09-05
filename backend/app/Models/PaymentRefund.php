<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentRefund extends Model
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

    /*
    |--------------------------------------------------------------------------
    | Refund Method Constants
    |--------------------------------------------------------------------------
    */

    public const METHOD_MPESA = 'mpesa';

    public const METHOD_BANK_TRANSFER = 'bank_transfer';

    public const METHOD_CASH = 'cash';

    public const METHOD_CARD = 'card';

    public const METHOD_OTHER = 'other';

    /*
    |--------------------------------------------------------------------------
    | Default Currency
    |--------------------------------------------------------------------------
    */

    public const DEFAULT_CURRENCY = 'KES';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'payment_id',

        'refund_number',

        'amount',

        'currency',

        'refund_method',

        'status',

        'refund_reference',

        'refund_date',

        'refunded_at',

        'reason',

        'notes',

        'created_by',

        'updated_by',
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

            'refund_date' => 'date',

            'refunded_at' => 'datetime',

            'created_at' => 'datetime',

            'updated_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Model Events
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Creating
        |--------------------------------------------------------------------------
        */

        static::creating(function (PaymentRefund $refund): void {
            /*
            |--------------------------------------------------------------------------
            | Generate Refund Number
            |--------------------------------------------------------------------------
            */

            if (empty($refund->refund_number)) {
                $refund->refund_number = self::generateRefundNumber();
            }

            /*
            |--------------------------------------------------------------------------
            | Default Currency
            |--------------------------------------------------------------------------
            */

            if (empty($refund->currency)) {
                $refund->currency = self::DEFAULT_CURRENCY;
            }

            /*
            |--------------------------------------------------------------------------
            | Default Refund Date
            |--------------------------------------------------------------------------
            */

            if (empty($refund->refund_date)) {
                $refund->refund_date = now()->toDateString();
            }

            /*
            |--------------------------------------------------------------------------
            | Completed Refund
            |--------------------------------------------------------------------------
            |
            | If a refund is created already completed, automatically record
            | the completion timestamp.
            |
            */

            if ($refund->status === self::STATUS_COMPLETED) {
                if (empty($refund->refunded_at)) {
                    $refund->refunded_at = now();
                }
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Updating
        |--------------------------------------------------------------------------
        */

        static::updating(function (PaymentRefund $refund): void {
            /*
            |--------------------------------------------------------------------------
            | Mark Refund Completion
            |--------------------------------------------------------------------------
            |
            | When an existing refund changes to completed, automatically
            | record the exact completion timestamp.
            |
            */

            if (
                $refund->isDirty('status') &&
                $refund->status === self::STATUS_COMPLETED
            ) {
                if (empty($refund->refunded_at)) {
                    $refund->refunded_at = now();
                }
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Number Generation
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a unique internal refund number.
     *
     * Example:
     *
     * REF-20260905-482731
     */
    public static function generateRefundNumber(): string
    {
        do {
            $number = 'REF-'
                . now()->format('Ymd')
                . '-'
                . str_pad(
                    (string) random_int(1, 999999),
                    6,
                    '0',
                    STR_PAD_LEFT
                );
        } while (
            static::query()
                ->where('refund_number', $number)
                ->exists()
        );

        return $number;
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the original payment associated with this refund.
     */
    public function payment(): BelongsTo
    {
        return $this->belongsTo(
            Payment::class,
            'payment_id'
        );
    }

    /**
     * Get the user who created the refund.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    /**
     * Get the user who last updated the refund.
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'updated_by'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Status Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the refund is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Determine whether the refund was completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Determine whether the refund failed.
     */
    public function isFailed(): bool
    {
        return $this->status === self::STATUS_FAILED;
    }

    /**
     * Determine whether the refund was cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /*
    |--------------------------------------------------------------------------
    | Refund Method Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the refund was processed through M-Pesa.
     */
    public function isMpesa(): bool
    {
        return $this->refund_method === self::METHOD_MPESA;
    }

    /**
     * Determine whether the refund was processed through bank transfer.
     */
    public function isBankTransfer(): bool
    {
        return $this->refund_method === self::METHOD_BANK_TRANSFER;
    }

    /**
     * Determine whether the refund was processed in cash.
     */
    public function isCash(): bool
    {
        return $this->refund_method === self::METHOD_CASH;
    }

    /**
     * Determine whether the refund was processed through card.
     */
    public function isCard(): bool
    {
        return $this->refund_method === self::METHOD_CARD;
    }

    /**
     * Determine whether the refund used another method.
     */
    public function isOtherMethod(): bool
    {
        return $this->refund_method === self::METHOD_OTHER;
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope completed refunds.
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_COMPLETED
        );
    }

    /**
     * Scope pending refunds.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }

    /**
     * Scope failed refunds.
     */
    public function scopeFailed(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_FAILED
        );
    }

    /**
     * Scope cancelled refunds.
     */
    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_CANCELLED
        );
    }

    /**
     * Scope refunds for a specific payment.
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
     * Scope refunds by refund method.
     */
    public function scopeForMethod(
        Builder $query,
        string $method
    ): Builder {
        return $query->where(
            'refund_method',
            $method
        );
    }

    /**
     * Scope refunds processed through M-Pesa.
     */
    public function scopeMpesa(Builder $query): Builder
    {
        return $query->where(
            'refund_method',
            self::METHOD_MPESA
        );
    }

    /**
     * Scope refunds processed through bank transfer.
     */
    public function scopeBankTransfers(Builder $query): Builder
    {
        return $query->where(
            'refund_method',
            self::METHOD_BANK_TRANSFER
        );
    }

    /**
     * Scope cash refunds.
     */
    public function scopeCash(Builder $query): Builder
    {
        return $query->where(
            'refund_method',
            self::METHOD_CASH
        );
    }

    /**
     * Scope card refunds.
     */
    public function scopeCards(Builder $query): Builder
    {
        return $query->where(
            'refund_method',
            self::METHOD_CARD
        );
    }

    /**
     * Scope refunds within a date range.
     */
    public function scopeForPeriod(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query->whereBetween(
            'refund_date',
            [
                $startDate,
                $endDate,
            ]
        );
    }

    /**
     * Scope refunds completed within a date range.
     */
    public function scopeCompletedBetween(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query
            ->completed()
            ->whereBetween(
                'refund_date',
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
     * Get a human-readable refund status label.
     */
    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',

            self::STATUS_COMPLETED => 'Completed',

            self::STATUS_FAILED => 'Failed',

            self::STATUS_CANCELLED => 'Cancelled',

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
     * Get a human-readable refund method label.
     */
    public function getRefundMethodLabelAttribute(): ?string
    {
        if (! $this->refund_method) {
            return null;
        }

        return match ($this->refund_method) {
            self::METHOD_MPESA => 'M-Pesa',

            self::METHOD_BANK_TRANSFER => 'Bank Transfer',

            self::METHOD_CASH => 'Cash',

            self::METHOD_CARD => 'Card',

            self::METHOD_OTHER => 'Other',

            default => ucfirst(
                str_replace(
                    '_',
                    ' ',
                    (string) $this->refund_method
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
     * Get all supported refund statuses.
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,

            self::STATUS_COMPLETED,

            self::STATUS_FAILED,

            self::STATUS_CANCELLED,
        ];
    }

    /**
     * Get refund status options for forms/API responses.
     */
    public static function statusOptions(): array
    {
        return [
            self::STATUS_PENDING => 'Pending',

            self::STATUS_COMPLETED => 'Completed',

            self::STATUS_FAILED => 'Failed',

            self::STATUS_CANCELLED => 'Cancelled',
        ];
    }

    /**
     * Get all supported refund methods.
     */
    public static function refundMethods(): array
    {
        return [
            self::METHOD_MPESA,

            self::METHOD_BANK_TRANSFER,

            self::METHOD_CASH,

            self::METHOD_CARD,

            self::METHOD_OTHER,
        ];
    }

    /**
     * Get refund method options for forms/API responses.
     */
    public static function refundMethodOptions(): array
    {
        return [
            self::METHOD_MPESA => 'M-Pesa',

            self::METHOD_BANK_TRANSFER => 'Bank Transfer',

            self::METHOD_CASH => 'Cash',

            self::METHOD_CARD => 'Card',

            self::METHOD_OTHER => 'Other',
        ];
    }
}