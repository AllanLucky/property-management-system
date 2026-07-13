<?php

namespace App\Services;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class UserActivityService
{
    public function __construct(
        protected ?Request $request = null
    ) {}

    /*
    |--------------------------------------------------------------------------
    | LOG ACTIVITY (WITH DEDUPLICATION)
    |--------------------------------------------------------------------------
    */
    public function log(
        ?User $user,
        ?User $actor,
        string $action,
        ?string $description = null,
        ?array $metadata = []
    ): ActivityLog {
        $request = $this->request ?? request();

        $authUser = $user ?? $request->user();

        $subjectType = $actor ? get_class($actor) : null;
        $subjectId   = $actor?->id;

        // 🔥 PREVENT DUPLICATES
        if ($this->isDuplicate($authUser?->id, $action, $subjectType, $subjectId)) {
            return ActivityLog::where('user_id', $authUser?->id)
                ->where('action', $action)
                ->latest()
                ->first();
        }

        return ActivityLog::record(
            userId: $authUser?->id,
            action: $action,
            description: $description,
            subjectType: $subjectType,
            subjectId: $subjectId,
            meta: $this->buildMeta($metadata),
            ipAddress: $request->ip(),
            userAgent: $request->userAgent(),
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DUPLICATE CHECK (ANTI-SPAM LOGGING)
    |--------------------------------------------------------------------------
    */
    protected function isDuplicate(
        ?int $userId,
        string $action,
        ?string $subjectType,
        ?int $subjectId
    ): bool {
        if (!$userId) return false;

        $windowSeconds = $this->getCooldownWindow($action);

        return ActivityLog::where('user_id', $userId)
            ->where('action', $action)
            ->where('subject_type', $subjectType)
            ->where('subject_id', $subjectId)
            ->where('created_at', '>=', now()->subSeconds($windowSeconds))
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | COOLDOWN RULES PER ACTION
    |--------------------------------------------------------------------------
    */
    protected function getCooldownWindow(string $action): int
    {
        return match ($action) {
            'login' => 300,                 // 5 min
            'logout' => 60,                // 1 min
            'role_request' => 600,         // 10 min (IMPORTANT FIX)
            'approval' => 30,
            'rejection' => 30,
            default => 15,                 // default anti-spam window
        };
    }

    /*
    |--------------------------------------------------------------------------
    | QUICK HELPERS
    |--------------------------------------------------------------------------
    */

    public function logLogin(User $user): ActivityLog
    {
        return $this->log(
            user: $user,
            actor: $user,
            action: 'login',
            description: 'User logged in',
            metadata: ['type' => 'auth']
        );
    }

    public function logLogout(User $user): ActivityLog
    {
        return $this->log(
            user: $user,
            actor: $user,
            action: 'logout',
            description: 'User logged out',
            metadata: ['type' => 'auth']
        );
    }

    public function logRoleChange(User $user, string $role): ActivityLog
    {
        return $this->log(
            user: $user,
            actor: $user,
            action: 'role_change',
            description: "Role assigned: {$role}",
            metadata: [
                'type' => 'security',
                'role' => $role
            ]
        );
    }

    public function logRoleRequest(User $user, string $role): ActivityLog
    {
        return $this->log(
            user: $user,
            actor: $user,
            action: 'role_request',
            description: "User requested role: {$role}",
            metadata: [
                'type' => 'action',
                'requested_role' => $role
            ]
        );
    }

    public function logApproval(User $admin, string $description, array $meta = []): ActivityLog
    {
        return $this->log(
            user: $admin,
            actor: $admin,
            action: 'approval',
            description: $description,
            metadata: array_merge(['type' => 'admin'], $meta)
        );
    }

    public function logRejection(User $admin, string $description, array $meta = []): ActivityLog
    {
        return $this->log(
            user: $admin,
            actor: $admin,
            action: 'rejection',
            description: $description,
            metadata: array_merge(['type' => 'admin'], $meta)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | META BUILDER
    |--------------------------------------------------------------------------
    */
    protected function buildMeta(array $meta): array
    {
        return array_merge([
            'app' => config('app.name'),
            'timestamp' => now()->toDateTimeString(),
        ], $meta);
    }
}