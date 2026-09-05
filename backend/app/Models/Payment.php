<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Payment Statuses
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    public const STATUS_CANCELLED = 'cancelled';

    public const STATUS_REFUNDED = 'refunded';

    /*
    |--------------------------------------------------------------------------
    | Payment Types
    |--------------------------------------------------------------------------
    */

    public const TYPE_RENT = 'rent';

    public const TYPE_DEPOSIT = 'deposit';

    public const TYPE_SERVICE_CHARGE = 'service_charge';

    public const TYPE_UTILITY = 'utility';

    public const TYPE_PENALTY = 'penalty';

    public const TYPE_OTHER = 'other';

    /*
    |--------------------------------------------------------------------------
    | Payment Methods
    |--------------------------------------------------------------------------
    */

    public const METHOD_MPESA = 'mpesa';

    public const METHOD_BANK_TRANSFER = 'bank_transfer';

    public const METHOD_CASH = 'cash';

    public const METHOD_CARD = 'card';

    public const METHOD_CHEQUE = 'cheque';

    public const METHOD_ONLINE = 'online';

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
        'payment_number',

        'user_id',
        'tenant_id',
        'tenancy_id',
        'property_id',
        'apartment_id',
        'unit_id',

        'amount',
        'currency',

        'payment_type',
        'payment_method',
        'status',

        'payment_date',
        'paid_at',

        'transaction_reference',
        'receipt_number',

        'description',
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

            'payment_date' => 'date',

            'paid_at' => 'datetime',

            'created_at' => 'datetime',

            'updated_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Model Boot
    |--------------------------------------------------------------------------
    |
    | Handles automatic generation of payment references, receipt numbers,
    | payment dates and completion timestamps.
    |
    */

    protected static function booted(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Creating
        |--------------------------------------------------------------------------
        */

        static::creating(function (Payment $payment): void {
            /*
            |--------------------------------------------------------------------------
            | Payment Number
            |--------------------------------------------------------------------------
            |
            | Example:
            | PAY-20260905-123456
            |
            */

            if (empty($payment->payment_number)) {
                $payment->payment_number = self::generatePaymentNumber();
            }

            /*
            |--------------------------------------------------------------------------
            | Currency
            |--------------------------------------------------------------------------
            */

            if (empty($payment->currency)) {
                $payment->currency = self::DEFAULT_CURRENCY;
            }

            /*
            |--------------------------------------------------------------------------
            | Payment Date
            |--------------------------------------------------------------------------
            */

            if (empty($payment->payment_date)) {
                $payment->payment_date = now()->toDateString();
            }

            /*
            |--------------------------------------------------------------------------
            | Completed Payment
            |--------------------------------------------------------------------------
            |
            | A completed payment must have both a receipt number and
            | completion timestamp.
            |
            */

            if ($payment->status === self::STATUS_COMPLETED) {
                if (empty($payment->paid_at)) {
                    $payment->paid_at = now();
                }

                if (empty($payment->receipt_number)) {
                    $payment->receipt_number = self::generateReceiptNumber();
                }
            }
        });

        /*
        |--------------------------------------------------------------------------
        | Updating
        |--------------------------------------------------------------------------
        */

        static::updating(function (Payment $payment): void {
            /*
            |--------------------------------------------------------------------------
            | Payment Becomes Completed
            |--------------------------------------------------------------------------
            */

            if (
                $payment->isDirty('status') &&
                $payment->status === self::STATUS_COMPLETED
            ) {
                if (empty($payment->paid_at)) {
                    $payment->paid_at = now();
                }

                if (empty($payment->receipt_number)) {
                    $payment->receipt_number = self::generateReceiptNumber();
                }
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Number Generator
    |--------------------------------------------------------------------------
    |
    | Generates a unique internal payment reference.
    |
    | Example:
    | PAY-20260905-123456
    |
    */

    public static function generatePaymentNumber(): string
    {
        do {
            $number = 'PAY-'
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
                ->where('payment_number', $number)
                ->exists()
        );

        return $number;
    }

    /*
    |--------------------------------------------------------------------------
    | Receipt Number Generator
    |--------------------------------------------------------------------------
    |
    | Generates a unique receipt reference.
    |
    | Example:
    | RCP-20260905-123456
    |
    */

    public static function generateReceiptNumber(): string
    {
        do {
            $number = 'RCP-'
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
                ->where('receipt_number', $number)
                ->exists()
        );

        return $number;
    }

    /*
    |--------------------------------------------------------------------------
    | User Relationship
    |--------------------------------------------------------------------------
    */

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Tenant Relationship
    |--------------------------------------------------------------------------
    */

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Tenancy Relationship
    |--------------------------------------------------------------------------
    */

    public function tenancy(): BelongsTo
    {
        return $this->belongsTo(Tenancy::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Property Relationship
    |--------------------------------------------------------------------------
    */

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Apartment Relationship
    |--------------------------------------------------------------------------
    */

    public function apartment(): BelongsTo
    {
        return $this->belongsTo(Apartment::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Unit Relationship
    |--------------------------------------------------------------------------
    */

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /*
    |--------------------------------------------------------------------------
    | M-Pesa Transactions
    |--------------------------------------------------------------------------
    |
    | A payment may have multiple M-Pesa transaction records because of:
    |
    | - STK Push attempts
    | - Callback records
    | - Retries
    | - Reconciliation
    | - Reversals
    |
    */

    public function mpesaTransactions(): HasMany
    {
        return $this->hasMany(MpesaTransaction::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Allocations
    |--------------------------------------------------------------------------
    |
    | A single payment may be allocated to multiple charges.
    |
    | Example:
    |
    | KES 70,000
    | ├── Rent            60,000
    | ├── Service Charge   5,000
    | └── Penalty          5,000
    |
    */

    public function allocations(): HasMany
    {
        return $this->hasMany(PaymentAllocation::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Refunds
    |--------------------------------------------------------------------------
    |
    | A payment can have one or more refund records, including
    | partial refunds.
    |
    */

    public function refunds(): HasMany
    {
        return $this->hasMany(PaymentRefund::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Created By Relationship
    |--------------------------------------------------------------------------
    */

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Updated By Relationship
    |--------------------------------------------------------------------------
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

    /*
    |--------------------------------------------------------------------------
    | Payment Method Helpers
    |--------------------------------------------------------------------------
    */

    public function isMpesa(): bool
    {
        return $this->payment_method === self::METHOD_MPESA;
    }

    public function isBankTransfer(): bool
    {
        return $this->payment_method === self::METHOD_BANK_TRANSFER;
    }

    public function isCash(): bool
    {
        return $this->payment_method === self::METHOD_CASH;
    }

    public function isCard(): bool
    {
        return $this->payment_method === self::METHOD_CARD;
    }

    public function isCheque(): bool
    {
        return $this->payment_method === self::METHOD_CHEQUE;
    }

    public function isOnline(): bool
    {
        return $this->payment_method === self::METHOD_ONLINE;
    }

    public function isOtherMethod(): bool
    {
        return $this->payment_method === self::METHOD_OTHER;
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Type Helpers
    |--------------------------------------------------------------------------
    */

    public function isRent(): bool
    {
        return $this->payment_type === self::TYPE_RENT;
    }

    public function isDeposit(): bool
    {
        return $this->payment_type === self::TYPE_DEPOSIT;
    }

    public function isServiceCharge(): bool
    {
        return $this->payment_type === self::TYPE_SERVICE_CHARGE;
    }

    public function isUtility(): bool
    {
        return $this->payment_type === self::TYPE_UTILITY;
    }

    public function isPenalty(): bool
    {
        return $this->payment_type === self::TYPE_PENALTY;
    }

    public function isOtherType(): bool
    {
        return $this->payment_type === self::TYPE_OTHER;
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes - Status
    |--------------------------------------------------------------------------
    */

    public function scopePending(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_COMPLETED
        );
    }

    public function scopeFailed(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_FAILED
        );
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_CANCELLED
        );
    }

    public function scopeRefunded(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_REFUNDED
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes - Payment Methods
    |--------------------------------------------------------------------------
    */

    public function scopeMpesa(Builder $query): Builder
    {
        return $query->where(
            'payment_method',
            self::METHOD_MPESA
        );
    }

    public function scopeBankTransfers(Builder $query): Builder
    {
        return $query->where(
            'payment_method',
            self::METHOD_BANK_TRANSFER
        );
    }

    public function scopeCash(Builder $query): Builder
    {
        return $query->where(
            'payment_method',
            self::METHOD_CASH
        );
    }

    public function scopeCards(Builder $query): Builder
    {
        return $query->where(
            'payment_method',
            self::METHOD_CARD
        );
    }

    public function scopeCheques(Builder $query): Builder
    {
        return $query->where(
            'payment_method',
            self::METHOD_CHEQUE
        );
    }

    public function scopeOnline(Builder $query): Builder
    {
        return $query->where(
            'payment_method',
            self::METHOD_ONLINE
        );
    }

    public function scopeOtherMethods(Builder $query): Builder
    {
        return $query->where(
            'payment_method',
            self::METHOD_OTHER
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes - Payment Types
    |--------------------------------------------------------------------------
    */

    public function scopeRent(Builder $query): Builder
    {
        return $query->where(
            'payment_type',
            self::TYPE_RENT
        );
    }

    public function scopeDeposits(Builder $query): Builder
    {
        return $query->where(
            'payment_type',
            self::TYPE_DEPOSIT
        );
    }

    public function scopeServiceCharges(Builder $query): Builder
    {
        return $query->where(
            'payment_type',
            self::TYPE_SERVICE_CHARGE
        );
    }

    public function scopeUtilities(Builder $query): Builder
    {
        return $query->where(
            'payment_type',
            self::TYPE_UTILITY
        );
    }

    public function scopePenalties(Builder $query): Builder
    {
        return $query->where(
            'payment_type',
            self::TYPE_PENALTY
        );
    }

    public function scopeOtherTypes(Builder $query): Builder
    {
        return $query->where(
            'payment_type',
            self::TYPE_OTHER
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Financial Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeSuccessful(Builder $query): Builder
    {
        return $query->where(
            'status',
            self::STATUS_COMPLETED
        );
    }

    public function scopeForPeriod(
        Builder $query,
        $startDate,
        $endDate
    ): Builder {
        return $query->whereBetween(
            'payment_date',
            [
                $startDate,
                $endDate,
            ]
        );
    }

    public function scopeForTenant(
        Builder $query,
        int $tenantId
    ): Builder {
        return $query->where(
            'tenant_id',
            $tenantId
        );
    }

    public function scopeForTenancy(
        Builder $query,
        int $tenancyId
    ): Builder {
        return $query->where(
            'tenancy_id',
            $tenancyId
        );
    }

    public function scopeForProperty(
        Builder $query,
        int $propertyId
    ): Builder {
        return $query->where(
            'property_id',
            $propertyId
        );
    }

    public function scopeForApartment(
        Builder $query,
        int $apartmentId
    ): Builder {
        return $query->where(
            'apartment_id',
            $apartmentId
        );
    }

    public function scopeForUnit(
        Builder $query,
        int $unitId
    ): Builder {
        return $query->where(
            'unit_id',
            $unitId
        );
    }

    public function scopeForMethod(
        Builder $query,
        string $method
    ): Builder {
        return $query->where(
            'payment_method',
            $method
        );
    }

    public function scopeForType(
        Builder $query,
        string $type
    ): Builder {
        return $query->where(
            'payment_type',
            $type
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',

            self::STATUS_COMPLETED => 'Completed',

            self::STATUS_FAILED => 'Failed',

            self::STATUS_CANCELLED => 'Cancelled',

            self::STATUS_REFUNDED => 'Refunded',

            default => ucfirst(
                str_replace(
                    '_',
                    ' ',
                    (string) $this->status
                )
            ),
        };
    }

    public function getPaymentTypeLabelAttribute(): string
    {
        return match ($this->payment_type) {
            self::TYPE_RENT => 'Rent',

            self::TYPE_DEPOSIT => 'Deposit',

            self::TYPE_SERVICE_CHARGE => 'Service Charge',

            self::TYPE_UTILITY => 'Utility',

            self::TYPE_PENALTY => 'Penalty',

            self::TYPE_OTHER => 'Other',

            default => ucfirst(
                str_replace(
                    '_',
                    ' ',
                    (string) $this->payment_type
                )
            ),
        };
    }

    public function getPaymentMethodLabelAttribute(): ?string
    {
        if (! $this->payment_method) {
            return null;
        }

        return match ($this->payment_method) {
            self::METHOD_MPESA => 'M-Pesa',

            self::METHOD_BANK_TRANSFER => 'Bank Transfer',

            self::METHOD_CASH => 'Cash',

            self::METHOD_CARD => 'Card',

            self::METHOD_CHEQUE => 'Cheque',

            self::METHOD_ONLINE => 'Online',

            self::METHOD_OTHER => 'Other',

            default => ucfirst(
                str_replace(
                    '_',
                    ' ',
                    (string) $this->payment_method
                )
            ),
        };
    }

    /*
    |--------------------------------------------------------------------------
    | Static Option Lists
    |--------------------------------------------------------------------------
    */

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_COMPLETED,
            self::STATUS_FAILED,
            self::STATUS_CANCELLED,
            self::STATUS_REFUNDED,
        ];
    }

    public static function paymentTypes(): array
    {
        return [
            self::TYPE_RENT,
            self::TYPE_DEPOSIT,
            self::TYPE_SERVICE_CHARGE,
            self::TYPE_UTILITY,
            self::TYPE_PENALTY,
            self::TYPE_OTHER,
        ];
    }

    public static function paymentMethods(): array
    {
        return [
            self::METHOD_MPESA,
            self::METHOD_BANK_TRANSFER,
            self::METHOD_CASH,
            self::METHOD_CARD,
            self::METHOD_CHEQUE,
            self::METHOD_ONLINE,
            self::METHOD_OTHER,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Static Label Lists
    |--------------------------------------------------------------------------
    */

    public static function statusOptions(): array
    {
        return [
            self::STATUS_PENDING => 'Pending',

            self::STATUS_COMPLETED => 'Completed',

            self::STATUS_FAILED => 'Failed',

            self::STATUS_CANCELLED => 'Cancelled',

            self::STATUS_REFUNDED => 'Refunded',
        ];
    }

    public static function paymentTypeOptions(): array
    {
        return [
            self::TYPE_RENT => 'Rent',

            self::TYPE_DEPOSIT => 'Deposit',

            self::TYPE_SERVICE_CHARGE => 'Service Charge',

            self::TYPE_UTILITY => 'Utility',

            self::TYPE_PENALTY => 'Penalty',

            self::TYPE_OTHER => 'Other',
        ];
    }

    public static function paymentMethodOptions(): array
    {
        return [
            self::METHOD_MPESA => 'M-Pesa',

            self::METHOD_BANK_TRANSFER => 'Bank Transfer',

            self::METHOD_CASH => 'Cash',

            self::METHOD_CARD => 'Card',

            self::METHOD_CHEQUE => 'Cheque',

            self::METHOD_ONLINE => 'Online',

            self::METHOD_OTHER => 'Other',
        ];
    }
}