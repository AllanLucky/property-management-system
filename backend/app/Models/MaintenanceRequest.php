<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class MaintenanceRequest extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE REQUEST STATUSES
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_ASSIGNED = 'assigned';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_ON_HOLD = 'on_hold';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /*
    |--------------------------------------------------------------------------
    | MAINTENANCE PRIORITIES
    |--------------------------------------------------------------------------
    */

    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_URGENT = 'urgent';

    /*
    |--------------------------------------------------------------------------
    | PROGRESS
    |--------------------------------------------------------------------------
    */

    public const PROGRESS_NOT_STARTED = 0;
    public const PROGRESS_STARTED = 10;
    public const PROGRESS_COMPLETED = 100;

    /*
    |--------------------------------------------------------------------------
    | MASS ASSIGNABLE ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'reference',

        'property_id',
        'apartment_id',
        'unit_id',

        'tenant_id',
        'category_id',

        'title',
        'description',
        'priority',
        'status',
        'is_emergency',

        'reported_by',
        'approved_by',
        'assigned_by',

        'scheduled_at',
        'started_at',
        'completed_at',
        'rejected_at',
        'cancelled_at',

        'rejection_reason',
        'cancellation_reason',
        'completion_notes',

        'estimated_cost',
        'total_cost',
    ];

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE CASTING
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'property_id' => 'integer',
            'apartment_id' => 'integer',
            'unit_id' => 'integer',
            'tenant_id' => 'integer',
            'category_id' => 'integer',

            'reported_by' => 'integer',
            'approved_by' => 'integer',
            'assigned_by' => 'integer',

            'scheduled_at' => 'datetime',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
            'rejected_at' => 'datetime',
            'cancelled_at' => 'datetime',

            'estimated_cost' => 'decimal:2',
            'total_cost' => 'decimal:2',

            'is_emergency' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MODEL BOOT
    |--------------------------------------------------------------------------
    */

    protected static function booted(): void
    {
        static::creating(function (self $request): void {

            if (blank($request->reference)) {
                do {
                    $reference = 'MR-'
                        . now()->format('Ymd')
                        . '-'
                        . Str::upper(Str::random(6));

                } while (
                    self::where('reference', $reference)->exists()
                );

                $request->reference = $reference;
            }

            if (blank($request->status)) {
                $request->status = self::STATUS_PENDING;
            }

            if (blank($request->priority)) {
                $request->priority = self::PRIORITY_MEDIUM;
            }

            if ($request->is_emergency === null) {
                $request->is_emergency = false;
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class, 'property_id');
    }

    public function apartment(): BelongsTo
    {
        return $this->belongsTo(Apartment::class, 'apartment_id');
    }

    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(
            MaintenanceCategory::class,
            'category_id'
        );
    }

    public function reporter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reported_by');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function assigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function assignments(): HasMany
    {
        return $this->hasMany(
            MaintenanceAssignment::class,
            'maintenance_request_id'
        );
    }

    public function latestAssignment(): HasOne
    {
        return $this->hasOne(
            MaintenanceAssignment::class,
            'maintenance_request_id'
        )->latestOfMany();
    }

    public function updates(): HasMany
    {
        return $this->hasMany(
            MaintenanceUpdate::class,
            'maintenance_request_id'
        );
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(
            MaintenanceAttachment::class,
            'maintenance_request_id'
        );
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(
            MaintenanceExpense::class,
            'maintenance_request_id'
        );
    }

    public function checklists(): HasMany
    {
        return $this->hasMany(
            MaintenanceChecklist::class,
            'maintenance_request_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS QUERY SCOPES
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

    public function scopeAssigned(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ASSIGNED);
    }

    public function scopeInProgress(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_IN_PROGRESS);
    }

    public function scopeOnHold(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_ON_HOLD);
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    public function scopeOngoing(Builder $query): Builder
    {
        return $query->whereIn('status', [
            self::STATUS_ASSIGNED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_ON_HOLD,
        ]);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereNotIn('status', [
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
            self::STATUS_REJECTED,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PRIORITY AND EMERGENCY SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeLowPriority(Builder $query): Builder
    {
        return $query->where('priority', self::PRIORITY_LOW);
    }

    public function scopeMediumPriority(Builder $query): Builder
    {
        return $query->where('priority', self::PRIORITY_MEDIUM);
    }

    public function scopeHighPriority(Builder $query): Builder
    {
        return $query->where('priority', self::PRIORITY_HIGH);
    }

    public function scopeUrgent(Builder $query): Builder
    {
        return $query->where('priority', self::PRIORITY_URGENT);
    }

    public function scopeEmergency(Builder $query): Builder
    {
        return $query->where('is_emergency', true);
    }

    public function scopeNonEmergency(Builder $query): Builder
    {
        return $query->where('is_emergency', false);
    }

    /*
    |--------------------------------------------------------------------------
    | DATE AND WORKFLOW SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeOverdue(Builder $query): Builder
    {
        return $query
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<', now())
            ->whereNotIn('status', [
                self::STATUS_COMPLETED,
                self::STATUS_CANCELLED,
                self::STATUS_REJECTED,
            ]);
    }

    public function scopeDueToday(Builder $query): Builder
    {
        return $query
            ->whereDate('scheduled_at', today())
            ->whereNotIn('status', [
                self::STATUS_COMPLETED,
                self::STATUS_CANCELLED,
                self::STATUS_REJECTED,
            ]);
    }

    public function scopeScheduled(Builder $query): Builder
    {
        return $query->whereNotNull('scheduled_at');
    }

    public function scopeUnscheduled(Builder $query): Builder
    {
        return $query->whereNull('scheduled_at');
    }

    public function scopeRecentlyCreated(
        Builder $query,
        int $days = 7
    ): Builder {
        return $query->where(
            'created_at',
            '>=',
            now()->subDays($days)
        );
    }

    public function scopeCreatedBetween(
        Builder $query,
        string|Carbon $from,
        string|Carbon $to
    ): Builder {
        return $query->whereBetween('created_at', [$from, $to]);
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATION SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeForProperty(
        Builder $query,
        int $propertyId
    ): Builder {
        return $query->where('property_id', $propertyId);
    }

    public function scopeForApartment(
        Builder $query,
        int $apartmentId
    ): Builder {
        return $query->where('apartment_id', $apartmentId);
    }

    public function scopeForUnit(
        Builder $query,
        int $unitId
    ): Builder {
        return $query->where('unit_id', $unitId);
    }

    public function scopeForTenant(
        Builder $query,
        int $tenantId
    ): Builder {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeForCategory(
        Builder $query,
        int $categoryId
    ): Builder {
        return $query->where('category_id', $categoryId);
    }

    public function scopeReportedBy(
        Builder $query,
        int $userId
    ): Builder {
        return $query->where('reported_by', $userId);
    }

    public function scopeApprovedBy(
        Builder $query,
        int $userId
    ): Builder {
        return $query->where('approved_by', $userId);
    }

    public function scopeAssignedBy(
        Builder $query,
        int $userId
    ): Builder {
        return $query->where('assigned_by', $userId);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeAssignedToTechnician(
        Builder $query,
        int $technicianId
    ): Builder {
        return $query->whereHas(
            'assignments',
            fn (Builder $assignmentQuery) =>
                $assignmentQuery->where('technician_id', $technicianId)
        );
    }

    public function scopeUnassigned(Builder $query): Builder
    {
        return $query->whereDoesntHave(
            'assignments',
            fn (Builder $assignmentQuery) =>
                $assignmentQuery->whereNotIn('status', [
                    MaintenanceAssignment::STATUS_REJECTED,
                    MaintenanceAssignment::STATUS_CANCELLED,
                ])
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH SCOPE
    |--------------------------------------------------------------------------
    */

    public function scopeSearch(
        Builder $query,
        ?string $search
    ): Builder {
        if (blank($search)) {
            return $query;
        }

        $search = trim($search);

        return $query->where(function (Builder $builder) use ($search) {
            $builder
                ->where('reference', 'like', "%{$search}%")
                ->orWhere('title', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%")

                // Property uses title, not name.
                ->orWhereHas('property', function (Builder $propertyQuery) use ($search) {
                    $propertyQuery->where(
                        'title',
                        'like',
                        "%{$search}%"
                    );
                })

                ->orWhereHas('apartment', function (Builder $apartmentQuery) use ($search) {
                    $apartmentQuery->where(
                        'name',
                        'like',
                        "%{$search}%"
                    );
                })

                ->orWhereHas('unit', function (Builder $unitQuery) use ($search) {
                    $unitQuery
                        ->where('unit_number', 'like', "%{$search}%")
                        ->orWhere('unit_name', 'like', "%{$search}%");
                })

                ->orWhereHas('tenant', function (Builder $tenantQuery) use ($search) {
                    $tenantQuery->whereHas(
                        'user',
                        function (Builder $userQuery) use ($search) {
                            $userQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                        }
                    );
                });
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP LOADING SCOPES
    |--------------------------------------------------------------------------
    */

    public function scopeWithDetails(Builder $query): Builder
    {
        return $query->with([
            'property',
            'apartment',
            'unit',
            'tenant.user',
            'category',
            'reporter',
            'approver',
            'assigner',
            'latestAssignment.technician',
        ]);
    }

    public function scopeWithMaintenanceRecords(
        Builder $query
    ): Builder {
        return $query->with([
            'assignments.technician',
            'updates.user',
            'attachments.uploader',
            'expenses',
            'checklists.completedBy',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS HELPERS
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

    public function isAssigned(): bool
    {
        return $this->status === self::STATUS_ASSIGNED;
    }

    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    public function isOnHold(): bool
    {
        return $this->status === self::STATUS_ON_HOLD;
    }

    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    public function isOngoing(): bool
    {
        return in_array($this->status, [
            self::STATUS_ASSIGNED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_ON_HOLD,
        ], true);
    }

    public function isOpen(): bool
    {
        return ! in_array($this->status, [
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
            self::STATUS_REJECTED,
        ], true);
    }

    public function isOverdue(): bool
    {
        return $this->scheduled_at !== null
            && $this->scheduled_at->isPast()
            && $this->isOpen();
    }

    public function isEmergency(): bool
    {
        return (bool) $this->is_emergency;
    }

    public function isUrgent(): bool
    {
        return in_array($this->priority, [
            self::PRIORITY_HIGH,
            self::PRIORITY_URGENT,
        ], true);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGNMENT HELPERS
    |--------------------------------------------------------------------------
    */

    public function hasAssignments(): bool
    {
        return $this->assignments()->exists();
    }

    public function hasActiveAssignment(): bool
    {
        return $this->assignments()
            ->whereIn('status', [
                MaintenanceAssignment::STATUS_PENDING,
                MaintenanceAssignment::STATUS_ACCEPTED,
                MaintenanceAssignment::STATUS_IN_PROGRESS,
                MaintenanceAssignment::STATUS_ON_HOLD,
            ])
            ->exists();
    }

    public function getCurrentTechnicianAttribute(): ?User
    {
        $assignment = $this->latestAssignment;

        if (! $assignment) {
            return null;
        }

        if (in_array($assignment->status, [
            MaintenanceAssignment::STATUS_REJECTED,
            MaintenanceAssignment::STATUS_CANCELLED,
        ], true)) {
            return null;
        }

        return $assignment->technician;
    }

    /*
    |--------------------------------------------------------------------------
    | CHECKLIST HELPERS
    |--------------------------------------------------------------------------
    */

    public function getChecklistTotalAttribute(): int
    {
        return $this->checklists()->count();
    }

    public function getChecklistCompletedAttribute(): int
    {
        return $this->checklists()
            ->where('is_completed', true)
            ->count();
    }

    public function getChecklistProgressAttribute(): int
    {
        $total = $this->checklists()->count();

        if ($total === 0) {
            return 0;
        }

        $completed = $this->checklists()
            ->where('is_completed', true)
            ->count();

        return (int) round(($completed / $total) * 100);
    }

    /*
    |--------------------------------------------------------------------------
    | ATTACHMENT HELPERS
    |--------------------------------------------------------------------------
    */

    public function getAttachmentsCountAttribute(): int
    {
        return $this->attachments()->count();
    }

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL HELPERS
    |--------------------------------------------------------------------------
    */

    public function getExpensesTotalAttribute(): float
    {
        return (float) $this->expenses()->sum('amount');
    }

    public function getExpensesApprovedTotalAttribute(): float
    {
        return (float) $this->expenses()
            ->where('status', 'approved')
            ->sum('amount');
    }

    public function getExpensesPaidTotalAttribute(): float
    {
        return (float) $this->expenses()->sum('paid_amount');
    }

    public function getRemainingCostAttribute(): float
    {
        return max(
            0,
            (float) $this->total_cost - $this->expenses_paid_total
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DISPLAY HELPERS
    |--------------------------------------------------------------------------
    */

    public function getStatusLabelAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'Pending',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_ASSIGNED => 'Assigned',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_ON_HOLD => 'On Hold',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
            default => 'Unknown',
        };
    }

    public function getPriorityLabelAttribute(): string
    {
        return match ($this->priority) {
            self::PRIORITY_LOW => 'Low',
            self::PRIORITY_MEDIUM => 'Medium',
            self::PRIORITY_HIGH => 'High',
            self::PRIORITY_URGENT => 'Urgent',
            default => 'Unknown',
        };
    }

    public function getPriorityColorAttribute(): string
    {
        return match ($this->priority) {
            self::PRIORITY_LOW => 'success',
            self::PRIORITY_MEDIUM => 'info',
            self::PRIORITY_HIGH => 'warning',
            self::PRIORITY_URGENT => 'danger',
            default => 'secondary',
        };
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'warning',
            self::STATUS_APPROVED => 'info',
            self::STATUS_REJECTED => 'danger',
            self::STATUS_ASSIGNED => 'primary',
            self::STATUS_IN_PROGRESS => 'info',
            self::STATUS_ON_HOLD => 'secondary',
            self::STATUS_COMPLETED => 'success',
            self::STATUS_CANCELLED => 'dark',
            default => 'secondary',
        };
    }

    public function getFormattedEstimatedCostAttribute(): string
    {
        return 'KES ' . number_format((float) $this->estimated_cost, 2);
    }

    public function getFormattedTotalCostAttribute(): string
    {
        return 'KES ' . number_format((float) $this->total_cost, 2);
    }

    public function getFormattedCreatedAtAttribute(): ?string
    {
        return $this->created_at?->format('d M Y, h:i A');
    }

    public function getFormattedScheduledAtAttribute(): ?string
    {
        return $this->scheduled_at?->format('d M Y, h:i A');
    }

    public function getFormattedCompletedAtAttribute(): ?string
    {
        return $this->completed_at?->format('d M Y, h:i A');
    }

    public function getAgeInDaysAttribute(): int
    {
        return $this->created_at
            ? (int) $this->created_at->diffInDays(now())
            : 0;
    }

    /*
    |--------------------------------------------------------------------------
    | WORKFLOW ACTIONS
    |--------------------------------------------------------------------------
    */

    public function approve(int $userId): bool
    {
        if (! $this->isPending()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_APPROVED,
            'approved_by' => $userId,
        ]);
    }

    public function reject(
        int $userId,
        string $reason
    ): bool {
        if (! $this->isPending()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_REJECTED,
            'approved_by' => $userId,
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);
    }

    public function markAsAssigned(int $userId): bool
    {
        if (! in_array($this->status, [
            self::STATUS_APPROVED,
            self::STATUS_PENDING,
        ], true)) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_ASSIGNED,
            'assigned_by' => $userId,
        ]);
    }

    public function markAsInProgress(): bool
    {
        if (! in_array($this->status, [
            self::STATUS_ASSIGNED,
            self::STATUS_ON_HOLD,
        ], true)) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_IN_PROGRESS,
            'started_at' => $this->started_at ?? now(),
        ]);
    }

    public function putOnHold(): bool
    {
        if (! in_array($this->status, [
            self::STATUS_ASSIGNED,
            self::STATUS_IN_PROGRESS,
        ], true)) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_ON_HOLD,
        ]);
    }

    public function resume(): bool
    {
        if (! $this->isOnHold()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_IN_PROGRESS,
        ]);
    }

    public function markAsCompleted(
        ?string $completionNotes = null
    ): bool {
        if (! $this->isOpen()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_COMPLETED,
            'completed_at' => now(),
            'completion_notes' => $completionNotes,
        ]);
    }

    public function cancel(string $reason): bool
    {
        if (! $this->isOpen()) {
            return false;
        }

        return $this->update([
            'status' => self::STATUS_CANCELLED,
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);
    }

    public function reschedule(Carbon|string $scheduledAt): bool
    {
        if (! $this->isOpen()) {
            return false;
        }

        return $this->update([
            'scheduled_at' => $scheduledAt,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABLE STATUSES AND PRIORITIES
    |--------------------------------------------------------------------------
    */

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING,
            self::STATUS_APPROVED,
            self::STATUS_REJECTED,
            self::STATUS_ASSIGNED,
            self::STATUS_IN_PROGRESS,
            self::STATUS_ON_HOLD,
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED,
        ];
    }

    public static function priorities(): array
    {
        return [
            self::PRIORITY_LOW,
            self::PRIORITY_MEDIUM,
            self::PRIORITY_HIGH,
            self::PRIORITY_URGENT,
        ];
    }

    public static function statusOptions(): array
    {
        return [
            self::STATUS_PENDING => 'Pending',
            self::STATUS_APPROVED => 'Approved',
            self::STATUS_REJECTED => 'Rejected',
            self::STATUS_ASSIGNED => 'Assigned',
            self::STATUS_IN_PROGRESS => 'In Progress',
            self::STATUS_ON_HOLD => 'On Hold',
            self::STATUS_COMPLETED => 'Completed',
            self::STATUS_CANCELLED => 'Cancelled',
        ];
    }

    public static function priorityOptions(): array
    {
        return [
            self::PRIORITY_LOW => 'Low',
            self::PRIORITY_MEDIUM => 'Medium',
            self::PRIORITY_HIGH => 'High',
            self::PRIORITY_URGENT => 'Urgent',
        ];
    }
}
