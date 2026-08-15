<?php

namespace App\Http\Controllers\Api\Dashboard;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Resources\DashboardResource;
use App\Services\DashboardService;
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
     * Get dashboard for authenticated user.
     *
     * GET /api/dashboard
     */
    public function index(Request $request)
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
            | DASHBOARD PERMISSION
            |--------------------------------------------------------------------------
            |
            | Spatie Permission is responsible for determining
            | whether the user can access the dashboard.
            |
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
            | LOG ERROR
            |--------------------------------------------------------------------------
            */

            report($e);

            /*
            |--------------------------------------------------------------------------
            | SERVER ERROR
            |--------------------------------------------------------------------------
            */

            return ApiResponse::serverError(
                'Failed to fetch dashboard.',
                config('app.debug')
                    ? [
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ]
                    : null
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CONFIGURATION
    |--------------------------------------------------------------------------
    */

    /**
     * Get dashboard configuration for authenticated user.
     *
     * GET /api/dashboard/config
     */
    public function config(Request $request)
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
            | DASHBOARD
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
                new DashboardResource([
                    'dashboard' => $dashboard['dashboard'] ?? null,
                ]),
                'Dashboard configuration fetched successfully.'
            );

        } catch (Throwable $e) {

            report($e);

            return ApiResponse::serverError(
                'Failed to fetch dashboard configuration.',
                config('app.debug')
                    ? [
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                    ]
                    : null
            );
        }
    }
}