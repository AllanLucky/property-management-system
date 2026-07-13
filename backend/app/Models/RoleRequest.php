<?php

namespace App\Models;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class RoleRequest extends Model
{
    use HasFactory;

    /*
    |--------------------------------------------------------------------------
    | TABLE
    |--------------------------------------------------------------------------
    */
    protected $table = 'role_requests';

    /*
    |--------------------------------------------------------------------------
    | FILLABLE
    |--------------------------------------------------------------------------
    */
    protected $fillable = [
        'user_id',
        'requested_role',
        'status',
        'reviewed_by',
        'reviewed_at',
        'reason',
        'admin_notes',
        'timeline',
    ];

    /*
    |--------------------------------------------------------------------------
    | CASTS
    |--------------------------------------------------------------------------
    */
    protected $casts = [
        'reviewed_at' => 'datetime',
        'timeline' => 'array',
    ];

    /*
    |--------------------------------------------------------------------------
    | STATUS CONSTANTS
    |--------------------------------------------------------------------------
    */
    public const STATUS_PENDING  = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';

    /*
    |--------------------------------------------------------------------------
    | ALLOWED ROLES
    |--------------------------------------------------------------------------
    */
    public const ALLOWED_ROLES = [
        'agent',
        'landlord',
        'tenant',
        'technician',
        'accountant',
        'customer',
    ];

    public const FORBIDDEN_ROLES = [
        'admin',
        'super-admin',
    ];

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /*
    |--------------------------------------------------------------------------
    | SCOPES
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

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
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

    /*
    |--------------------------------------------------------------------------
    | TIMELINE CORE (SAFE & CLEAN)
    |--------------------------------------------------------------------------
    */

    /**
     * Add timeline event safely (no recursion, no duplicate writes)
     */
    public function addTimelineEvent(
        string $title,
        string $type = 'system',
        ?int $userId = null
    ): void {
        $timeline = $this->timeline ?? [];

        $timeline[] = [
            'title' => $title,
            'type' => $type,
            'user_id' => $userId ?? auth()->id(),
            'timestamp' => now()->toISOString(),
        ];

        // prevent triggering events / observers loops
        $this->timestamps = false;

        $this->forceFill([
            'timeline' => $timeline,
        ])->saveQuietly();

        $this->timestamps = true;
    }

    /*
    |--------------------------------------------------------------------------
    | BOOT (SAFE - NO SIDE EFFECTS)
    |--------------------------------------------------------------------------
    */
    protected static function booted(): void
    {
        // Intentionally left empty
        // Timeline should ONLY be updated via service layer
    }

    /*
    |--------------------------------------------------------------------------
    | ACCESSORS
    |--------------------------------------------------------------------------
    */
    public function getStatusLabelAttribute(): string
    {
        return ucfirst($this->status);
    }

    public function getRequestedRoleLabelAttribute(): string
    {
        return ucwords(str_replace('-', ' ', $this->requested_role));
    }

    /*
    |--------------------------------------------------------------------------
    | APPENDS
    |--------------------------------------------------------------------------
    */
    protected $appends = [
        'status_label',
        'requested_role_label',
    ];
}