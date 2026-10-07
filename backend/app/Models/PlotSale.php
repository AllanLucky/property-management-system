<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlotSale extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Table
    |--------------------------------------------------------------------------
    */

    protected $table = 'plot_sales';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'plot_id',
        'buyer_id',
        'agent_id',

        // Sale identification
        'sale_number',
        'sale_date',

        // Financial information
        'sale_price',
        'deposit_amount',
        'discount_amount',
        'amount_paid',
        'balance',
        'currency',

        // Sale terms
        'payment_frequency',
        'due_date',
        'completion_date',
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
        'sale_date' => 'date',
        'due_date' => 'date',
        'completion_date' => 'date',

        'sale_price' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'balance' => 'decimal:2',

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
        'net_sale_price',
        'payment_percentage',
        'formatted_sale_price',
        'formatted_amount_paid',
        'formatted_balance',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Get the plot associated with this sale.
     */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }

    /**
     * Get the buyer associated with this sale.
     *
     * The buyer is an existing system user.
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Get the agent responsible for the sale.
     */
    public function agent(): BelongsTo
    {
        return $this->belongsTo(User::class, 'agent_id');
    }

    /**
     * Get all payments associated with this sale.
     */
    public function payments(): HasMany
    {
        return $this->hasMany(PlotPayment::class);
    }

    /**
     * Get completed payments for this sale.
     */
    public function completedPayments(): HasMany
    {
        return $this->hasMany(PlotPayment::class)
            ->where('status', 'completed');
    }

    /**
     * Get the latest payment.
     */
    public function latestPayment()
    {
        return $this->hasOne(PlotPayment::class)
            ->latestOfMany();
    }

    /*
    |--------------------------------------------------------------------------
    | Accessors
    |--------------------------------------------------------------------------
    */

    /**
     * Get the net sale price after discount.
     */
    public function getNetSalePriceAttribute(): float
    {
        return max(
            0,
            (float) $this->sale_price - (float) $this->discount_amount
        );
    }

    /**
     * Get the payment completion percentage.
     */
    public function getPaymentPercentageAttribute(): float
    {
        $total = $this->net_sale_price;

        if ($total <= 0) {
            return 0;
        }

        return round(
            min(100, ((float) $this->amount_paid / $total) * 100),
            2
        );
    }

    /**
     * Get formatted sale price.
     */
    public function getFormattedSalePriceAttribute(): string
    {
        return $this->formatMoney($this->sale_price);
    }

    /**
     * Get formatted amount paid.
     */
    public function getFormattedAmountPaidAttribute(): string
    {
        return $this->formatMoney($this->amount_paid);
    }

    /**
     * Get formatted balance.
     */
    public function getFormattedBalanceAttribute(): string
    {
        return $this->formatMoney($this->balance);
    }

    /**
     * Format monetary values.
     */
    protected function formatMoney($amount): string
    {
        $currency = $this->currency ?: 'KES';

        return sprintf(
            '%s %s',
            $currency,
            number_format((float) $amount, 2)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Scope active sales.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope inactive sales.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope sales by status.
     */
    public function scopeStatus(
        Builder $query,
        string $status
    ): Builder {
        return $query->where('status', $status);
    }

    /**
     * Scope pending sales.
     */
    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope reserved sales.
     */
    public function scopeReserved(Builder $query): Builder
    {
        return $query->where('status', 'reserved');
    }

    /**
     * Scope approved sales.
     */
    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', 'approved');
    }

    /**
     * Scope completed sales.
     */
    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope cancelled sales.
     */
    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', 'cancelled');
    }

    /**
     * Scope sales with an outstanding balance.
     */
    public function scopeWithOutstandingBalance(
        Builder $query
    ): Builder {
        return $query->where('balance', '>', 0);
    }

    /**
     * Scope fully paid sales.
     */
    public function scopeFullyPaid(Builder $query): Builder
    {
        return $query->where('balance', '<=', 0);
    }

    /**
     * Search plot sales.
     */
    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        return $query->where(function (Builder $builder) use ($search) {
            $builder
                ->where('sale_number', 'like', "%{$search}%")
                ->orWhereHas('plot', function (Builder $plotQuery) use ($search) {
                    $plotQuery
                        ->where('code', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('plot_number', 'like', "%{$search}%")
                        ->orWhere('title_number', 'like', "%{$search}%");
                })
                ->orWhereHas('buyer', function (Builder $userQuery) use ($search) {
                    $userQuery
                        ->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the sale is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Determine whether the sale is reserved.
     */
    public function isReserved(): bool
    {
        return $this->status === 'reserved';
    }

    /**
     * Determine whether the sale is approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    /**
     * Determine whether the sale is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    /**
     * Determine whether the sale is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    /**
     * Determine whether the sale has an outstanding balance.
     */
    public function hasOutstandingBalance(): bool
    {
        return (float) $this->balance > 0;
    }

    /**
     * Determine whether the sale has been fully paid.
     */
    public function isFullyPaid(): bool
    {
        return (float) $this->balance <= 0;
    }

    /**
     * Recalculate the sale balance.
     */
    public function recalculateBalance(): float
    {
        $netSalePrice = $this->net_sale_price;

        $balance = max(
            0,
            $netSalePrice - (float) $this->amount_paid
        );

        $this->balance = $balance;

        return $balance;
    }

    /**
     * Mark the sale as approved.
     */
    public function markAsApproved(): bool
    {
        return $this->update([
            'status' => 'approved',
        ]);
    }

    /**
     * Mark the sale as completed.
     */
    public function markAsCompleted(): bool
    {
        return $this->update([
            'status' => 'completed',
            'completion_date' => $this->completion_date ?: now()->toDateString(),
        ]);
    }

    /**
     * Mark the sale as cancelled.
     */
    public function markAsCancelled(): bool
    {
        return $this->update([
            'status' => 'cancelled',
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
        static::creating(function (PlotSale $sale) {
            /*
             * Generate a sale number when one is not supplied.
             */
            if (empty($sale->sale_number)) {
                $sale->sale_number = 'SALE-' . now()->format('YmdHis');
            }

            /*
             * Default currency.
             */
            if (empty($sale->currency)) {
                $sale->currency = 'KES';
            }

            /*
             * Default amount paid.
             */
            if ($sale->amount_paid === null) {
                $sale->amount_paid = 0;
            }

            /*
             * Default discount.
             */
            if ($sale->discount_amount === null) {
                $sale->discount_amount = 0;
            }

            /*
             * Calculate the initial balance.
             */
            $sale->recalculateBalance();

            /*
             * Default sale date.
             */
            if (empty($sale->sale_date)) {
                $sale->sale_date = now()->toDateString();
            }

            /*
             * Default active state.
             */
            if ($sale->is_active === null) {
                $sale->is_active = true;
            }
        });

        static::updating(function (PlotSale $sale) {
            /*
             * Recalculate financial values when
             * relevant fields change.
             */
            if (
                $sale->isDirty([
                    'sale_price',
                    'discount_amount',
                    'amount_paid',
                ])
            ) {
                $sale->recalculateBalance();
            }

            /*
             * Automatically deactivate cancelled/completed sales
             * only when appropriate.
             */
            if ($sale->status === 'cancelled') {
                $sale->is_active = false;
            }
        });
    }
}
