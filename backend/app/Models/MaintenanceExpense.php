<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaintenanceExpense extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | Expense Categories
    |--------------------------------------------------------------------------
    */

    public const CATEGORY_LABOUR = 'labour';
    public const CATEGORY_MATERIALS = 'materials';
    public const CATEGORY_SPARE_PARTS = 'spare_parts';
    public const CATEGORY_TRANSPORT = 'transport';
    public const CATEGORY_EQUIPMENT = 'equipment';
    public const CATEGORY_SERVICE = 'service';
    public const CATEGORY_OTHER = 'other';

    /*
    |--------------------------------------------------------------------------
    | Approval Statuses
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    /*
    |--------------------------------------------------------------------------
    | Payment Statuses
    |--------------------------------------------------------------------------
    */

    public const PAYMENT_UNPAID = 'unpaid';
    public const PAYMENT_PARTIALLY_PAID = 'partially_paid';
    public const PAYMENT_PAID = 'paid';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignable Attributes
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'maintenance_request_id',
        'maintenance_assignment_id',
        'category',
        'description',
        'quantity',
        'unit_cost',
        'amount',
        'currency',
        'expense_date',
        'receipt_number',
        'receipt_path',
        'supplier_name',
        'supplier_contact',
        'submitted_by',
        'approved_by',
        'approved_at',
        'rejected_at',
        'rejection_reason',
        'status',
        'payment_status',
        'paid_amount',
        'paid_at',
        'payment_reference',
        'notes',
    ];

    /*
    |--------------------------------------------------------------------------
    | Attribute Casting
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:2',
            'unit_cost' => 'decimal:2',
            'amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',

            'expense_date' => 'date',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'paid_at' => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Maintenance request associated with this expense.
     */
    public function maintenanceRequest(): BelongsTo
    {
        return $this->belongsTo(
            MaintenanceRequest::class,
            'maintenance_request_id'
        );
    }

    /**
     * Maintenance assignment associated with this expense.
     */
    public function maintenanceAssignment(): BelongsTo
    {
        return $this->belongsTo(
            MaintenanceAssignment::class,
            'maintenance_assignment_id'
        );
    }

    /**
     * User who submitted the expense.
     */
    public function submittedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    /**
     * User who approved the expense.
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Query Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeApproved(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_APPROVED);
    }

    public function scopeRejected(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_REJECTED);
    }

    public function scopeUnpaid(Builder $query): Builder
    {
        return $query->where('payment_status', self::PAYMENT_UNPAID);
    }

    public function scopePartiallyPaid(Builder $query): Builder
    {
        return $query->where(
            'payment_status',
            self::PAYMENT_PARTIALLY_PAID
        );
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('payment_status', self::PAYMENT_PAID);
    }

    public function scopeForRequest(
        Builder $query,
        int $maintenanceRequestId
    ): Builder {
        return $query->where(
            'maintenance_request_id',
            $maintenanceRequestId
        );
    }

    public function scopeForAssignment(
        Builder $query,
        int $assignmentId
    ): Builder {
        return $query->where(
            'maintenance_assignment_id',
            $assignmentId
        );
    }

    public function scopeForCategory(
        Builder $query,
        string $category
    ): Builder {
        return $query->where('category', $category);
    }

    public function scopeBetweenDates(
        Builder $query,
        string $from,
        string $to
    ): Builder {
        return $query->whereBetween('expense_date', [$from, $to]);
    }

    /*
    |--------------------------------------------------------------------------
    | Approval Helpers
    |--------------------------------------------------------------------------
    */

    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED;
    }

    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Approve the expense.
     */
    public function approve(?int $userId = null): bool
    {
        return $this->update([
            'status' => self::STATUS_APPROVED,
            'approved_by' => $userId,
            'approved_at' => now(),
            'rejected_at' => null,
            'rejection_reason' => null,
        ]);
    }

    /**
     * Reject the expense.
     */
    public function reject(string $reason, ?int $userId = null): bool
    {
        return $this->update([
            'status' => self::STATUS_REJECTED,
            'approved_by' => null,
            'approved_at' => null,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Payment Helpers
    |--------------------------------------------------------------------------
    */

    public function isPaid(): bool
    {
        return $this->payment_status === self::PAYMENT_PAID;
    }

    public function isUnpaid(): bool
    {
        return $this->payment_status === self::PAYMENT_UNPAID;
    }

    public function getOutstandingAmountAttribute(): float
    {
        return max(
            0,
            (float) $this->amount - (float) $this->paid_amount
        );
    }

    /**
     * Record a payment against this expense.
     *
     * Callers should authorize the payment and validate the amount
     * before invoking this method.
     */
    public function recordPayment(
        float $amount,
        ?string $reference = null
    ): bool {
        if ($amount <= 0 || ! $this->isApproved()) {
            return false;
        }

        $currentPaid = (float) $this->paid_amount;
        $totalAmount = (float) $this->amount;

        if ($currentPaid + $amount > $totalAmount) {
            return false;
        }

        $newPaidAmount = round($currentPaid + $amount, 2);

        return $this->update([
            'paid_amount' => $newPaidAmount,
            'payment_status' => $newPaidAmount >= $totalAmount
                ? self::PAYMENT_PAID
                : self::PAYMENT_PARTIALLY_PAID,
            'paid_at' => $newPaidAmount >= $totalAmount
                ? now()
                : $this->paid_at,
            'payment_reference' => $reference ?? $this->payment_reference,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Display Helpers
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_REJECTED => 'Rejected',
            default => ucfirst((string) $this->status),
        };
    }

    public function getPaymentStatusLabelAttribute(): string
    {
        return match ($this->payment_status) {
            self::PAYMENT_UNPAID => 'Unpaid',
            self::PAYMENT_PARTIALLY_PAID => 'Partially Paid',
            self::PAYMENT_PAID => 'Paid',
            default => ucfirst((string) $this->payment_status),
        };
    }

    public function getFormattedAmountAttribute(): string
    {
        return $this->currency . ' ' . number_format((float) $this->amount, 2);
    }

    public function getFormattedPaidAmountAttribute(): string
    {
        return $this->currency . ' ' . number_format((float) $this->paid_amount, 2);
    }

    /*
    |--------------------------------------------------------------------------
    | Available Options
    |--------------------------------------------------------------------------
    */

    public static function categories(): array
    {
        return [
            self::CATEGORY_LABOUR,
            self::CATEGORY_MATERIALS,
            self::CATEGORY_SPARE_PARTS,
            self::CATEGORY_TRANSPORT,
            self::CATEGORY_EQUIPMENT,
            self::CATEGORY_SERVICE,
            self::CATEGORY_OTHER,
        ];
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
        ];
    }

    public static function paymentStatuses(): array
    {
        return [
            self::PAYMENT_UNPAID,
            self::PAYMENT_PARTIALLY_PAID,
            self::PAYMENT_PAID,
        ];
    }
}
