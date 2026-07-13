<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;

class CustomRoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        // 🔐 Authentication check (Sanctum)
        if (!auth('sanctum')->check()) {
            return ApiResponse::unauthorized(
                'You are not logged in. Please sign in to continue.'
            );
        }

        $user = auth('sanctum')->user();

        // 🟢 SUPER ADMIN bypass (full access)
        if ($user->hasAnyRole(['super-admin'])) {
            return $next($request);
        }

        // 🚫 No roles defined
        if (empty($roles)) {
            return ApiResponse::forbidden(
                'Access denied. No role defined for this route.'
            );
        }

        // 🔄 Normalize roles
        $roles = array_map('strtolower', $roles);

        // 🚫 Role check
        if (!$user->hasAnyRole($roles)) {
            return ApiResponse::forbidden(
                'Access restricted. You do not have permission to access this resource.'
            );
        }

        return $next($request);
    }
}