<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

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

        // Sale agreement
        'agreement_number',
        'agreement_date',

        // Financial information
        'sale_price',
        'deposit_amount',
        'discount_amount',
        'amount_paid',
        'balance',
        'currency',

        // Payment terms
        'payment_frequency',
        'due_date',

        // Completion
        'completion_date',

        // Notes and cancellation
        'notes',
        'cancellation_reason',

        // Status
        'status',
        'is_active',
    ];

    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected $casts = [
        'sale_date' => 'date',
        'agreement_date' => 'date',
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
        'is_fully_paid',
        'has_outstanding_balance',
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
     *
     * Ensure "completed" matches the status used by PlotPayment.
     */
    public function completedPayments(): HasMany
    {
        return $this->payments()->where('status', 'completed');
    }

    /**
     * Get the latest payment.
     */
    public function latestPayment(): HasOne
    {
        return $this->hasOne(PlotPayment::class)->latestOfMany();
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
     * Get the percentage of the sale price paid.
     */
    public function getPaymentPercentageAttribute(): float
    {
        $total = $this->net_sale_price;

        if ($total <= 0) {
            return 0.0;
        }

        return round(
            min(100, ((float) $this->amount_paid / $total) * 100),
            2
        );
    }

    /**
     * Determine whether the sale is fully paid.
     */
    public function getIsFullyPaidAttribute(): bool
    {
        return (float) $this->balance <= 0;
    }

    /**
     * Determine whether the sale has an outstanding balance.
     */
    public function getHasOutstandingBalanceAttribute(): bool
    {
        return (float) $this->balance > 0;
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
     * Get formatted outstanding balance.
     */
    public function getFormattedBalanceAttribute(): string
    {
        return $this->formatMoney($this->balance);
    }

    /**
     * Format a monetary amount using the sale currency.
     */
    protected function formatMoney($amount): string
    {
        return sprintf(
            '%s %s',
            $this->currency ?: 'KES',
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
     * Scope sales with outstanding balances.
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
     * Scope sales with an upcoming or overdue payment date.
     */
    public function scopeDue(Builder $query): Builder
    {
        return $query
            ->whereNotNull('due_date')
            ->whereDate('due_date', '<=', now()->toDateString())
            ->where('balance', '>', 0)
            ->where('is_active', true)
            ->whereIn('status', ['reserved', 'approved']);
    }

    /**
     * Search sales by sale number, agreement number, plot,
     * buyer, or agent.
     */
    public function scopeSearch(
        Builder $query,
        string $search
    ): Builder {
        $search = trim($search);

        if ($search === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($search) {
            $builder
                ->where('sale_number', 'like', "%{$search}%")
                ->orWhere('agreement_number', 'like', "%{$search}%")
                ->orWhereHas(
                    'plot',
                    function (Builder $plotQuery) use ($search) {
                        $plotQuery
                            ->where('code', 'like', "%{$search}%")
                            ->orWhere('title', 'like', "%{$search}%")
                            ->orWhere('plot_number', 'like', "%{$search}%")
                            ->orWhere('title_number', 'like', "%{$search}%");
                    }
                )
                ->orWhereHas(
                    'buyer',
                    function (Builder $userQuery) use ($search) {
                        $userQuery
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    }
                )
                ->orWhereHas(
                    'agent',
                    function (Builder $userQuery) use ($search) {
                        $userQuery
                            ->where('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%");
                    }
                );
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
     *
     * This method updates the in-memory model.
     * Persist the model when the change needs to be saved.
     */
    public function recalculateBalance(): float
    {
        $netSalePrice = $this->net_sale_price;

        $balance = max(
            0,
            round($netSalePrice - (float) $this->amount_paid, 2)
        );

        $this->balance = number_format($balance, 2, '.', '');

        return $balance;
    }

    /**
     * Mark the sale as approved.
     */
    public function markAsApproved(): bool
    {
        if ($this->status === 'cancelled') {
            return false;
        }

        return $this->update([
            'status' => 'approved',
            'is_active' => true,
        ]);
    }

    /**
     * Mark the sale as completed.
     *
     * Completion requires the outstanding balance to be zero.
     */
    public function markAsCompleted(): bool
    {
        if (
            $this->status === 'cancelled'
            || (float) $this->balance > 0
        ) {
            return false;
        }

        return $this->update([
            'status' => 'completed',
            'completion_date' => $this->completion_date
                ?: now()->toDateString(),
        ]);
    }

    /**
     * Mark the sale as cancelled.
     */
    public function markAsCancelled(
        ?string $reason = null
    ): bool {
        if ($this->status === 'completed') {
            return false;
        }

        $attributes = [
            'status' => 'cancelled',
            'is_active' => false,
        ];

        if ($reason !== null) {
            $attributes['cancellation_reason'] = $reason;
        }

        return $this->update($attributes);
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

        static::creating(function (PlotSale $sale) {
            // Generate a unique sale number if one was not supplied.
            if (empty($sale->sale_number)) {
                do {
                    $saleNumber = 'SALE-'
                        . now()->format('YmdHis')
                        . '-'
                        . Str::upper(Str::random(5));
                } while (
                    static::withTrashed()
                        ->where('sale_number', $saleNumber)
                        ->exists()
                );

                $sale->sale_number = $saleNumber;
            }

            // Default currency.
            if (empty($sale->currency)) {
                $sale->currency = 'KES';
            }

            // Default sale date.
            if (empty($sale->sale_date)) {
                $sale->sale_date = now()->toDateString();
            }

            // Default financial values.
            if ($sale->sale_price === null) {
                $sale->sale_price = 0;
            }

            if ($sale->deposit_amount === null) {
                $sale->deposit_amount = 0;
            }

            if ($sale->discount_amount === null) {
                $sale->discount_amount = 0;
            }

            if ($sale->amount_paid === null) {
                $sale->amount_paid = 0;
            }

            // Default status.
            if (empty($sale->status)) {
                $sale->status = 'pending';
            }

            // Default active state.
            if ($sale->is_active === null) {
                $sale->is_active = true;
            }

            // Calculate the initial balance.
            $sale->recalculateBalance();
        });

        /*
        |--------------------------------------------------------------------------
        | Updating
        |--------------------------------------------------------------------------
        */

        static::updating(function (PlotSale $sale) {
            // Recalculate financial values when relevant fields change.
            if (
                $sale->isDirty([
                    'sale_price',
                    'discount_amount',
                    'amount_paid',
                ])
            ) {
                $sale->recalculateBalance();
            }

            // Deactivate cancelled sales.
            if ($sale->status === 'cancelled') {
                $sale->is_active = false;
            }

            // Set completion date if a sale is marked completed.
            if (
                $sale->isDirty('status')
                && $sale->status === 'completed'
                && empty($sale->completion_date)
            ) {
                $sale->completion_date = now()->toDateString();
            }
        });
    }
}