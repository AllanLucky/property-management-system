<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardResource;
use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class DashboardController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | Service
    |--------------------------------------------------------------------------
    */

    protected DashboardService $dashboardService;

    /*
    |--------------------------------------------------------------------------
    | Constructor
    |--------------------------------------------------------------------------
    */

    public function __construct(
        DashboardService $dashboardService
    ) {
        $this->dashboardService = $dashboardService;
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    /**
     * Get the complete dashboard for the authenticated user.
     *
     * GET /api/dashboard
     *
     * Returns:
     *
     * - Dashboard configuration
     * - Authenticated user
     * - Overview
     * - Properties
     * - Apartments
     * - Units
     * - Occupancy
     * - Tenancies
     * - Bookings
     * - Financials
     * - Maintenance
     * - Recent activity
     */
    public function index(Request $request): JsonResponse
    {
        try {
            /*
            |--------------------------------------------------------------------------
            | AUTHENTICATED USER
            |--------------------------------------------------------------------------
            */

            $user = $request->user();

            if (! $user) {
                return ApiResponse::unauthorized(
                    'Unauthenticated.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | PERMISSION
            |--------------------------------------------------------------------------
            */

            if (! $user->can('dashboard.view')) {
                return ApiResponse::forbidden(
                    'You do not have permission to view the dashboard.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | LOAD DASHBOARD
            |--------------------------------------------------------------------------
            */

            $dashboard = $this->dashboardService
                ->getDashboardForUser($user);

            /*
            |--------------------------------------------------------------------------
            | RESOURCE
            |--------------------------------------------------------------------------
            */

            return ApiResponse::success(
                new DashboardResource($dashboard),
                'Dashboard fetched successfully.'
            );

        } catch (Throwable $e) {

            /*
            |--------------------------------------------------------------------------
            | LOG
            |--------------------------------------------------------------------------
            */

            report($e);

            /*
            |--------------------------------------------------------------------------
            | ERROR RESPONSE
            |--------------------------------------------------------------------------
            */

            return ApiResponse::serverError(
                'Failed to fetch dashboard.',
                $this->debugErrors($e)
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CONFIGURATION
    |--------------------------------------------------------------------------
    */

    /**
     * Get only the dashboard configuration.
     *
     * GET /api/dashboard/config
     *
     * This endpoint is intended for the frontend when it only
     * needs layout/widgets/role configuration.
     */
    public function config(Request $request): JsonResponse
    {
        try {
            /*
            |--------------------------------------------------------------------------
            | AUTHENTICATED USER
            |--------------------------------------------------------------------------
            */

            $user = $request->user();

            if (! $user) {
                return ApiResponse::unauthorized(
                    'Unauthenticated.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | PERMISSION
            |--------------------------------------------------------------------------
            */

            if (! $user->can('dashboard.view')) {
                return ApiResponse::forbidden(
                    'You do not have permission to view the dashboard.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | GET DASHBOARD
            |--------------------------------------------------------------------------
            */

            $dashboardData = $this->dashboardService
                ->getDashboardForUser($user);

            $dashboard = $dashboardData['dashboard'] ?? null;

            /*
            |--------------------------------------------------------------------------
            | CONFIGURATION RESPONSE
            |--------------------------------------------------------------------------
            |
            | Do not use the complete DashboardResource here because
            | this endpoint is configuration-only.
            |
            */

            return ApiResponse::success(
                [
                    'dashboard' => $dashboard
                        ? [
                            'id' => $dashboard->id,

                            'name' => $dashboard->name,

                            'slug' => $dashboard->slug,

                            'description' => $dashboard->description,

                            'type' => $dashboard->type,

                            'layout' => $dashboard->layout ?? [],

                            'widgets' => $dashboard->widgets ?? [],

                            'filters' => $dashboard->filters ?? [],

                            'is_default' => (bool) $dashboard->is_default,

                            'is_active' => (bool) $dashboard->is_active,

                            'sort_order' => (int) $dashboard->sort_order,
                        ]
                        : null,

                    'user' => [
                        'id' => $user->id,

                        'name' => $this->getUserName($user),

                        'first_name' => $user->first_name,

                        'last_name' => $user->last_name,

                        'email' => $user->email,

                        'roles' => $user
                            ->getRoleNames()
                            ->values()
                            ->toArray(),
                    ],
                ],
                'Dashboard configuration fetched successfully.'
            );

        } catch (Throwable $e) {

            /*
            |--------------------------------------------------------------------------
            | LOG
            |--------------------------------------------------------------------------
            */

            report($e);

            /*
            |--------------------------------------------------------------------------
            | ERROR
            |--------------------------------------------------------------------------
            */

            return ApiResponse::serverError(
                'Failed to fetch dashboard configuration.',
                $this->debugErrors($e)
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | REFRESH
    |--------------------------------------------------------------------------
    */

    /**
     * Refresh dashboard statistics.
     *
     * GET /api/dashboard/refresh
     *
     * This endpoint intentionally returns the complete dashboard again.
     * It is useful when the frontend wants to refresh statistics after
     * creating/updating a property, unit, tenancy, booking, payment,
     * or maintenance request.
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            /*
            |--------------------------------------------------------------------------
            | AUTHENTICATED USER
            |--------------------------------------------------------------------------
            */

            $user = $request->user();

            if (! $user) {
                return ApiResponse::unauthorized(
                    'Unauthenticated.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | PERMISSION
            |--------------------------------------------------------------------------
            */

            if (! $user->can('dashboard.view')) {
                return ApiResponse::forbidden(
                    'You do not have permission to view the dashboard.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | FRESH DASHBOARD
            |--------------------------------------------------------------------------
            */

            $dashboard = $this->dashboardService
                ->getDashboardForUser($user);

            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

            return ApiResponse::success(
                new DashboardResource($dashboard),
                'Dashboard refreshed successfully.'
            );

        } catch (Throwable $e) {

            /*
            |--------------------------------------------------------------------------
            | LOG
            |--------------------------------------------------------------------------
            */

            report($e);

            /*
            |--------------------------------------------------------------------------
            | ERROR
            |--------------------------------------------------------------------------
            */

            return ApiResponse::serverError(
                'Failed to refresh dashboard.',
                $this->debugErrors($e)
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | USER SUMMARY
    |--------------------------------------------------------------------------
    */

    /**
     * Build a consistent authenticated user name.
     */
    protected function getUserName($user): string
    {
        $name = trim(
            ($user->first_name ?? '') .
            ' ' .
            ($user->last_name ?? '')
        );

        return $name
            ?: ($user->name ?? $user->email ?? 'User');
    }

    /*
    |--------------------------------------------------------------------------
    | DEBUG ERRORS
    |--------------------------------------------------------------------------
    */

    /**
     * Return detailed errors only when application debugging
     * is enabled.
     */
    protected function debugErrors(Throwable $e): ?array
    {
        if (! config('app.debug')) {
            return null;
        }

        return [
            'error' => $e->getMessage(),

            'file' => $e->getFile(),

            'line' => $e->getLine(),
        ];
    }
}