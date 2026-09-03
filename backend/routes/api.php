<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| AUTH
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Auth\PasswordController;
use App\Http\Controllers\Api\Auth\VerificationController;

/*
|--------------------------------------------------------------------------
| PROFILE / USERS
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\Profile\ProfileController;
use App\Http\Controllers\Api\User\UserController;

/*
|--------------------------------------------------------------------------
| RBAC
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\RBAC\RoleController;
use App\Http\Controllers\Api\RBAC\PermissionController;
use App\Http\Controllers\Api\RoleRequest\RoleRequestController;

/*
|--------------------------------------------------------------------------
| PROPERTY MODULE
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\Property\PropertyController;
use App\Http\Controllers\Api\Unit\UnitController;
use App\Http\Controllers\Api\PropertyCategory\PropertyCategoryController;
use App\Http\Controllers\Api\PropertyType\PropertyTypeController;
use App\Http\Controllers\Api\PropertyFeature\PropertyFeatureController;
use App\Http\Controllers\Api\PropertyFeature\PropertyFeatureAssignmentController;
use App\Http\Controllers\Api\PropertyAmenity\PropertyAmenityController;
use App\Http\Controllers\Api\Amenity\AmenityController;
use App\Http\Controllers\Api\PropertyReview\PropertyReviewController;
use App\Http\Controllers\Api\PropertyVisit\PropertyVisitController;
use App\Http\Controllers\Api\PropertyFavorite\PropertyFavoriteController;
use App\Http\Controllers\Api\PropertyAnalytics\PropertyAnalyticsController;
use App\Http\Controllers\Api\Apartment\ApartmentController;
use App\Http\Controllers\Api\Dashboard\DashboardController;

/*
|--------------------------------------------------------------------------
| TENANT / TENANCY
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\Tenant\TenantController;
use App\Http\Controllers\Api\Tenancy\TenancyController;

/*
|--------------------------------------------------------------------------
| LEASE
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\Lease\LeaseController;

/*
|--------------------------------------------------------------------------
| ACTIVITY LOGS
|--------------------------------------------------------------------------
*/

use App\Http\Controllers\Api\UserActivity\UserActivityController;


/*
|--------------------------------------------------------------------------
| PUBLIC AUTH ROUTES
|--------------------------------------------------------------------------
*/

Route::prefix('auth')
    ->name('auth.')
    ->group(function () {

        /*
        |--------------------------------------------------------------------------
        | REGISTER
        |--------------------------------------------------------------------------
        */

        Route::post(
            'register',
            [AuthController::class, 'register']
        )->name('register');


        /*
        |--------------------------------------------------------------------------
        | LOGIN
        |--------------------------------------------------------------------------
        */

        Route::post(
            'login',
            [AuthController::class, 'login']
        )->name('login');


        /*
        |--------------------------------------------------------------------------
        | FORGOT PASSWORD
        |--------------------------------------------------------------------------
        */

        Route::post(
            'forgot-password',
            [PasswordController::class, 'forgotPassword']
        )->name('forgot-password');


        /*
        |--------------------------------------------------------------------------
        | RESET PASSWORD
        |--------------------------------------------------------------------------
        */

        Route::post(
            'reset-password',
            [PasswordController::class, 'resetPassword']
        )->name('reset-password');


        /*
        |--------------------------------------------------------------------------
        | VERIFY OTP
        |--------------------------------------------------------------------------
        */

        Route::post(
            'verify-otp',
            [VerificationController::class, 'verifyOtp']
        )->name('verify-otp');


        /*
        |--------------------------------------------------------------------------
        | RESEND OTP
        |--------------------------------------------------------------------------
        */

        Route::post(
            'resend-otp',
            [VerificationController::class, 'resendOtp']
        )->name('resend-otp');
    });


/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATED USER
    |--------------------------------------------------------------------------
    */

    Route::get('user', function (Request $request) {
        return $request->user()->load([
            'roles',
            'permissions',
        ]);
    })->name('user');


    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATION
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | Canonical logout endpoint:
    |
    | POST /api/auth/logout
    |
    | Canonical refresh endpoint:
    |
    | POST /api/auth/refresh-token
    |
    */

    Route::prefix('auth')
        ->name('auth.')
        ->group(function () {

            Route::post(
                'logout',
                [AuthController::class, 'logout']
            )->name('logout');

            Route::post(
                'refresh-token',
                [AuthController::class, 'refreshToken']
            )->name('refresh-token');
        });


    /*
    |--------------------------------------------------------------------------
    | BACKWARD-COMPATIBLE AUTH ROUTES
    |--------------------------------------------------------------------------
    |
    | Keep these temporarily if your existing frontend still calls:
    |
    | POST /api/logout
    | POST /api/refresh-token
    |
    */

    Route::post(
        'logout',
        [AuthController::class, 'logout']
    )->name('legacy.logout');

    Route::post(
        'refresh-token',
        [AuthController::class, 'refreshToken']
    )->name('legacy.refresh-token');


    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */

    Route::prefix('dashboard')
        ->name('dashboard.')
        ->group(function () {

            Route::get(
                '/',
                [DashboardController::class, 'index']
            )
                ->middleware('permission:dashboard.view')
                ->name('index');

            Route::get(
                'config',
                [DashboardController::class, 'config']
            )
                ->middleware('permission:dashboard.view')
                ->name('config');
        });


    /*
    |--------------------------------------------------------------------------
    | PROFILE
    |--------------------------------------------------------------------------
    */

    Route::prefix('profile')
        ->name('profile.')
        ->group(function () {

            Route::get(
                '/',
                [ProfileController::class, 'show']
            )->name('show');

            Route::put(
                '/',
                [ProfileController::class, 'update']
            )->name('update');

            Route::post(
                'change-password',
                [ProfileController::class, 'changePassword']
            )->name('change-password');

            Route::post(
                'upload-avatar',
                [ProfileController::class, 'uploadAvatar']
            )->name('upload-avatar');
        });


    /*
    |--------------------------------------------------------------------------
    | ROLE REQUESTS
    |--------------------------------------------------------------------------
    */

    Route::prefix('role-requests')
        ->name('role-requests.')
        ->group(function () {

            Route::post(
                '/',
                [RoleRequestController::class, 'store']
            )->name('store');

            Route::get(
                'me',
                [RoleRequestController::class, 'myRequests']
            )->name('my');

            Route::middleware('role:super-admin|admin')
                ->group(function () {

                    Route::get(
                        '/',
                        [RoleRequestController::class, 'index']
                    )->name('index');

                    Route::get(
                        'pending',
                        [RoleRequestController::class, 'pending']
                    )->name('pending');

                    Route::get(
                        '{role_request}',
                        [RoleRequestController::class, 'show']
                    )->name('show');

                    Route::post(
                        '{role_request}/approve',
                        [RoleRequestController::class, 'approve']
                    )->name('approve');

                    Route::post(
                        '{role_request}/reject',
                        [RoleRequestController::class, 'reject']
                    )->name('reject');

                    Route::delete(
                        '{role_request}',
                        [RoleRequestController::class, 'destroy']
                    )->name('destroy');
                });
        });


    /*
    |--------------------------------------------------------------------------
    | USER ACTIVITY LOGS
    |--------------------------------------------------------------------------
    */

    Route::prefix('activity-logs')
        ->name('activity-logs.')
        ->group(function () {

            Route::get(
                'my-activities',
                [UserActivityController::class, 'myActivities']
            )->name('my');

            Route::middleware('role:super-admin|admin')
                ->group(function () {

                    Route::get(
                        '/',
                        [UserActivityController::class, 'index']
                    )->name('index');

                    Route::get(
                        '{activity_log}',
                        [UserActivityController::class, 'show']
                    )->name('show');

                    Route::post(
                        '/',
                        [UserActivityController::class, 'store']
                    )->name('store');

                    Route::delete(
                        '{activity_log}',
                        [UserActivityController::class, 'destroy']
                    )->name('destroy');
                });
        });


    /*
    |--------------------------------------------------------------------------
    | PROPERTIES
    |--------------------------------------------------------------------------
    */

    Route::prefix('properties')
        ->name('properties.')
        ->group(function () {

            /*
            |--------------------------------------------------------------------------
            | PROPERTY CRUD
            |--------------------------------------------------------------------------
            */

            Route::get(
                '/',
                [PropertyController::class, 'index']
            )->name('index');

            Route::post(
                '/',
                [PropertyController::class, 'store']
            )->name('store');

            Route::get(
                '{property}',
                [PropertyController::class, 'show']
            )
                ->whereNumber('property')
                ->name('show');

            Route::put(
                '{property}',
                [PropertyController::class, 'update']
            )
                ->whereNumber('property')
                ->name('update');

            Route::patch(
                '{property}',
                [PropertyController::class, 'update']
            )
                ->whereNumber('property')
                ->name('patch');

            Route::delete(
                '{property}',
                [PropertyController::class, 'destroy']
            )
                ->whereNumber('property')
                ->name('destroy');


            /*
            |--------------------------------------------------------------------------
            | PROPERTY FEATURES
            |--------------------------------------------------------------------------
            */

            Route::prefix('{property}/features')
                ->name('features.')
                ->whereNumber('property')
                ->group(function () {

                    Route::get(
                        '/',
                        [PropertyFeatureAssignmentController::class, 'index']
                    )->name('index');

                    Route::post(
                        '{feature}',
                        [PropertyFeatureAssignmentController::class, 'attach']
                    )
                        ->whereNumber('feature')
                        ->name('attach');

                    Route::put(
                        '{feature}',
                        [PropertyFeatureAssignmentController::class, 'update']
                    )
                        ->whereNumber('feature')
                        ->name('update');

                    Route::patch(
                        '{feature}',
                        [PropertyFeatureAssignmentController::class, 'update']
                    )
                        ->whereNumber('feature')
                        ->name('patch');

                    Route::delete(
                        '{feature}',
                        [PropertyFeatureAssignmentController::class, 'detach']
                    )
                        ->whereNumber('feature')
                        ->name('detach');
                });


            /*
            |--------------------------------------------------------------------------
            | PROPERTY AMENITIES
            |--------------------------------------------------------------------------
            */

            Route::prefix('{property}/amenities')
                ->name('amenities.')
                ->whereNumber('property')
                ->group(function () {

                    Route::get(
                        '/',
                        [PropertyAmenityController::class, 'index']
                    )->name('index');

                    Route::post(
                        '{amenity}',
                        [PropertyAmenityController::class, 'attach']
                    )
                        ->whereNumber('amenity')
                        ->name('attach');

                    Route::put(
                        '{amenity}',
                        [PropertyAmenityController::class, 'update']
                    )
                        ->whereNumber('amenity')
                        ->name('update');

                    Route::patch(
                        '{amenity}',
                        [PropertyAmenityController::class, 'update']
                    )
                        ->whereNumber('amenity')
                        ->name('patch');

                    Route::delete(
                        '{amenity}',
                        [PropertyAmenityController::class, 'detach']
                    )
                        ->whereNumber('amenity')
                        ->name('detach');
                });
        });


    /*
    |--------------------------------------------------------------------------
    | APARTMENTS
    |--------------------------------------------------------------------------
    */

    Route::prefix('apartments')
        ->name('apartments.')
        ->group(function () {

            Route::get(
                '/',
                [ApartmentController::class, 'index']
            )->name('index');

            Route::post(
                '/',
                [ApartmentController::class, 'store']
            )->name('store');

            Route::get(
                '{apartment}',
                [ApartmentController::class, 'show']
            )
                ->whereNumber('apartment')
                ->name('show');

            Route::put(
                '{apartment}',
                [ApartmentController::class, 'update']
            )
                ->whereNumber('apartment')
                ->name('update');

            Route::patch(
                '{apartment}',
                [ApartmentController::class, 'update']
            )
                ->whereNumber('apartment')
                ->name('patch');

            Route::delete(
                '{apartment}',
                [ApartmentController::class, 'destroy']
            )
                ->whereNumber('apartment')
                ->name('destroy');
        });


    /*
    |--------------------------------------------------------------------------
    | TENANTS
    |--------------------------------------------------------------------------
    */

    Route::prefix('tenants')
        ->name('tenants.')
        ->group(function () {

            /*
            |--------------------------------------------------------------------------
            | TENANT USERS
            |--------------------------------------------------------------------------
            */

            Route::get(
                'users',
                [TenantController::class, 'tenantUsers']
            )->name('users');


            /*
            |--------------------------------------------------------------------------
            | AVAILABLE TENANT USERS
            |--------------------------------------------------------------------------
            */

            Route::get(
                'available-users',
                [TenantController::class, 'availableUsers']
            )->name('available-users');


            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            Route::get(
                'search',
                [TenantController::class, 'search']
            )->name('search');


            /*
            |--------------------------------------------------------------------------
            | STATISTICS
            |--------------------------------------------------------------------------
            */

            Route::get(
                'statistics',
                [TenantController::class, 'statistics']
            )->name('statistics');


            /*
            |--------------------------------------------------------------------------
            | STATUS LISTS
            |--------------------------------------------------------------------------
            */

            Route::get(
                'active',
                [TenantController::class, 'active']
            )->name('active');

            Route::get(
                'pending',
                [TenantController::class, 'pending']
            )->name('pending');

            Route::get(
                'inactive',
                [TenantController::class, 'inactive']
            )->name('inactive');

            Route::get(
                'blacklisted',
                [TenantController::class, 'blacklisted']
            )->name('blacklisted');


            /*
            |--------------------------------------------------------------------------
            | CRUD
            |--------------------------------------------------------------------------
            */

            Route::get(
                '/',
                [TenantController::class, 'index']
            )->name('index');

            Route::post(
                '/',
                [TenantController::class, 'store']
            )->name('store');


            /*
            |--------------------------------------------------------------------------
            | STATUS ACTIONS
            |--------------------------------------------------------------------------
            */

            Route::patch(
                '{tenant}/activate',
                [TenantController::class, 'activate']
            )
                ->whereNumber('tenant')
                ->name('activate');

            Route::patch(
                '{tenant}/deactivate',
                [TenantController::class, 'deactivate']
            )
                ->whereNumber('tenant')
                ->name('deactivate');

            Route::patch(
                '{tenant}/pending',
                [TenantController::class, 'pendingStatus']
            )
                ->whereNumber('tenant')
                ->name('pending');

            Route::patch(
                '{tenant}/blacklist',
                [TenantController::class, 'blacklist']
            )
                ->whereNumber('tenant')
                ->name('blacklist');


            /*
            |--------------------------------------------------------------------------
            | VERIFICATION
            |--------------------------------------------------------------------------
            */

            Route::patch(
                '{tenant}/verify',
                [TenantController::class, 'verify']
            )
                ->whereNumber('tenant')
                ->name('verify');

            Route::patch(
                '{tenant}/unverify',
                [TenantController::class, 'unverify']
            )
                ->whereNumber('tenant')
                ->name('unverify');


            /*
            |--------------------------------------------------------------------------
            | DOCUMENTS
            |--------------------------------------------------------------------------
            */

            Route::post(
                '{tenant}/photo',
                [TenantController::class, 'uploadPhoto']
            )
                ->whereNumber('tenant')
                ->name('photo.upload');

            Route::post(
                '{tenant}/id-front',
                [TenantController::class, 'uploadIdFront']
            )
                ->whereNumber('tenant')
                ->name('id-front.upload');

            Route::post(
                '{tenant}/id-back',
                [TenantController::class, 'uploadIdBack']
            )
                ->whereNumber('tenant')
                ->name('id-back.upload');


            /*
            |--------------------------------------------------------------------------
            | RESTORE
            |--------------------------------------------------------------------------
            */

            Route::patch(
                '{tenant}/restore',
                [TenantController::class, 'restore']
            )
                ->whereNumber('tenant')
                ->name('restore');


            /*
            |--------------------------------------------------------------------------
            | FORCE DELETE
            |--------------------------------------------------------------------------
            */

            Route::delete(
                '{tenant}/force',
                [TenantController::class, 'forceDelete']
            )
                ->whereNumber('tenant')
                ->name('force-delete');


            /*
            |--------------------------------------------------------------------------
            | SHOW
            |--------------------------------------------------------------------------
            */

            Route::get(
                '{tenant}',
                [TenantController::class, 'show']
            )
                ->whereNumber('tenant')
                ->name('show');


            /*
            |--------------------------------------------------------------------------
            | UPDATE
            |--------------------------------------------------------------------------
            */

            Route::put(
                '{tenant}',
                [TenantController::class, 'update']
            )
                ->whereNumber('tenant')
                ->name('update');

            Route::patch(
                '{tenant}',
                [TenantController::class, 'update']
            )
                ->whereNumber('tenant')
                ->name('patch');


            /*
            |--------------------------------------------------------------------------
            | DELETE
            |--------------------------------------------------------------------------
            */

            Route::delete(
                '{tenant}',
                [TenantController::class, 'destroy']
            )
                ->whereNumber('tenant')
                ->name('destroy');
        });


    /*
    |--------------------------------------------------------------------------
    | TENANCIES
    |--------------------------------------------------------------------------
    */

    Route::prefix('tenancies')
        ->name('tenancies.')
        ->group(function () {

            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            Route::get(
                'search',
                [TenancyController::class, 'index']
            )->name('search');


            /*
            |--------------------------------------------------------------------------
            | STATISTICS
            |--------------------------------------------------------------------------
            */

            Route::get(
                'statistics',
                [TenancyController::class, 'statistics']
            )->name('statistics');


            /*
            |--------------------------------------------------------------------------
            | STATUS LISTS
            |--------------------------------------------------------------------------
            */

            Route::get(
                'active',
                [TenancyController::class, 'index']
            )
                ->defaults('status', 'active')
                ->name('active');

            Route::get(
                'pending',
                [TenancyController::class, 'index']
            )
                ->defaults('status', 'pending')
                ->name('pending');

            Route::get(
                'expired',
                [TenancyController::class, 'index']
            )
                ->defaults('status', 'expired')
                ->name('expired');

            Route::get(
                'terminated',
                [TenancyController::class, 'index']
            )
                ->defaults('status', 'terminated')
                ->name('terminated');

            Route::get(
                'cancelled',
                [TenancyController::class, 'index']
            )
                ->defaults('status', 'cancelled')
                ->name('cancelled');


            /*
            |--------------------------------------------------------------------------
            | CRUD
            |--------------------------------------------------------------------------
            */

            Route::get(
                '/',
                [TenancyController::class, 'index']
            )->name('index');

            Route::post(
                '/',
                [TenancyController::class, 'store']
            )->name('store');


            /*
            |--------------------------------------------------------------------------
            | ASSIGN UNIT
            |--------------------------------------------------------------------------
            */

            Route::post(
                'assign-unit',
                [TenancyController::class, 'assignUnit']
            )->name('assign-unit');


            /*
            |--------------------------------------------------------------------------
            | RESTORE
            |--------------------------------------------------------------------------
            */

            Route::patch(
                '{tenancy}/restore',
                [TenancyController::class, 'restore']
            )
                ->whereNumber('tenancy')
                ->name('restore');


            /*
            |--------------------------------------------------------------------------
            | FORCE DELETE
            |--------------------------------------------------------------------------
            */

            Route::delete(
                '{tenancy}/force',
                [TenancyController::class, 'forceDelete']
            )
                ->whereNumber('tenancy')
                ->name('force-delete');


            /*
            |--------------------------------------------------------------------------
            | STATUS MANAGEMENT
            |--------------------------------------------------------------------------
            */

            Route::patch(
                '{tenancy}/activate',
                [TenancyController::class, 'activate']
            )
                ->whereNumber('tenancy')
                ->name('activate');

            Route::patch(
                '{tenancy}/deactivate',
                [TenancyController::class, 'deactivate']
            )
                ->whereNumber('tenancy')
                ->name('deactivate');

            Route::patch(
                '{tenancy}/renew',
                [TenancyController::class, 'renew']
            )
                ->whereNumber('tenancy')
                ->name('renew');

            Route::patch(
                '{tenancy}/terminate',
                [TenancyController::class, 'terminate']
            )
                ->whereNumber('tenancy')
                ->name('terminate');

            Route::patch(
                '{tenancy}/cancel',
                [TenancyController::class, 'cancel']
            )
                ->whereNumber('tenancy')
                ->name('cancel');


            /*
            |--------------------------------------------------------------------------
            | SHOW
            |--------------------------------------------------------------------------
            */

            Route::get(
                '{tenancy}',
                [TenancyController::class, 'show']
            )
                ->whereNumber('tenancy')
                ->name('show');


            /*
            |--------------------------------------------------------------------------
            | UPDATE
            |--------------------------------------------------------------------------
            */

            Route::put(
                '{tenancy}',
                [TenancyController::class, 'update']
            )
                ->whereNumber('tenancy')
                ->name('update');

            Route::patch(
                '{tenancy}',
                [TenancyController::class, 'update']
            )
                ->whereNumber('tenancy')
                ->name('patch');


            /*
            |--------------------------------------------------------------------------
            | DELETE
            |--------------------------------------------------------------------------
            */

            Route::delete(
                '{tenancy}',
                [TenancyController::class, 'destroy']
            )
                ->whereNumber('tenancy')
                ->name('destroy');
        });


    /*
    |--------------------------------------------------------------------------
    | LEASES
    |--------------------------------------------------------------------------
    */

    Route::prefix('leases')
        ->name('leases.')
        ->group(function () {

            /*
            |--------------------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------------------
            */

            Route::get(
                'search',
                [LeaseController::class, 'search']
            )->name('search');


            /*
            |--------------------------------------------------------------------------
            | STATISTICS
            |--------------------------------------------------------------------------
            */

            Route::get(
                'statistics',
                [LeaseController::class, 'statistics']
            )->name('statistics');


            /*
            |--------------------------------------------------------------------------
            | STATUS LISTS
            |--------------------------------------------------------------------------
            */

            Route::get(
                'active',
                [LeaseController::class, 'active']
            )->name('active');

            Route::get(
                'draft',
                [LeaseController::class, 'draft']
            )->name('draft');

            Route::get(
                'pending',
                [LeaseController::class, 'pending']
            )->name('pending');

            Route::get(
                'expired',
                [LeaseController::class, 'expired']
            )->name('expired');

            Route::get(
                'terminated',
                [LeaseController::class, 'terminated']
            )->name('terminated');

            Route::get(
                'cancelled',
                [LeaseController::class, 'cancelled']
            )->name('cancelled');


            /*
            |--------------------------------------------------------------------------
            | EXPIRING / UPCOMING
            |--------------------------------------------------------------------------
            */

            Route::get(
                'expiring',
                [LeaseController::class, 'expiring']
            )->name('expiring');

            Route::get(
                'upcoming',
                [LeaseController::class, 'upcoming']
            )->name('upcoming');


            /*
            |--------------------------------------------------------------------------
            | TENANCY LEASES
            |--------------------------------------------------------------------------
            */

            Route::get(
                'tenancy/{tenancyId}',
                [LeaseController::class, 'byTenancy']
            )
                ->whereNumber('tenancyId')
                ->name('by-tenancy');


            /*
            |--------------------------------------------------------------------------
            | LEASE NUMBER
            |--------------------------------------------------------------------------
            */

            Route::get(
                'number/{leaseNumber}',
                [LeaseController::class, 'showByLeaseNumber']
            )->name('by-number');


            /*
            |--------------------------------------------------------------------------
            | CREATE
            |--------------------------------------------------------------------------
            */

            Route::post(
                '/',
                [LeaseController::class, 'store']
            )->name('store');


            /*
            |--------------------------------------------------------------------------
            | AUTOMATIC EXPIRATION
            |--------------------------------------------------------------------------
            */

            Route::post(
                'expire-ended',
                [LeaseController::class, 'expireEnded']
            )->name('expire-ended');


            /*
            |--------------------------------------------------------------------------
            | STATUS ACTIONS
            |--------------------------------------------------------------------------
            */

            Route::patch(
                '{id}/activate',
                [LeaseController::class, 'activate']
            )
                ->whereNumber('id')
                ->name('activate');

            Route::patch(
                '{id}/pending',
                [LeaseController::class, 'setPending']
            )
                ->whereNumber('id')
                ->name('pending');

            Route::patch(
                '{id}/draft',
                [LeaseController::class, 'setDraft']
            )
                ->whereNumber('id')
                ->name('draft');

            Route::patch(
                '{id}/expire',
                [LeaseController::class, 'expire']
            )
                ->whereNumber('id')
                ->name('expire');

            Route::patch(
                '{id}/terminate',
                [LeaseController::class, 'terminate']
            )
                ->whereNumber('id')
                ->name('terminate');

            Route::patch(
                '{id}/cancel',
                [LeaseController::class, 'cancel']
            )
                ->whereNumber('id')
                ->name('cancel');


            /*
            |--------------------------------------------------------------------------
            | RESTORE
            |--------------------------------------------------------------------------
            */

            Route::patch(
                '{id}/restore',
                [LeaseController::class, 'restore']
            )
                ->whereNumber('id')
                ->name('restore');


            /*
            |--------------------------------------------------------------------------
            | FORCE DELETE
            |--------------------------------------------------------------------------
            */

            Route::delete(
                '{id}/force',
                [LeaseController::class, 'forceDelete']
            )
                ->whereNumber('id')
                ->name('force-delete');


            /*
            |--------------------------------------------------------------------------
            | LIST
            |--------------------------------------------------------------------------
            */

            Route::get(
                '/',
                [LeaseController::class, 'index']
            )->name('index');


            /*
            |--------------------------------------------------------------------------
            | SHOW
            |--------------------------------------------------------------------------
            */

            Route::get(
                '{id}',
                [LeaseController::class, 'show']
            )
                ->whereNumber('id')
                ->name('show');


            /*
            |--------------------------------------------------------------------------
            | UPDATE
            |--------------------------------------------------------------------------
            */

            Route::put(
                '{id}',
                [LeaseController::class, 'update']
            )
                ->whereNumber('id')
                ->name('update');

            Route::patch(
                '{id}',
                [LeaseController::class, 'update']
            )
                ->whereNumber('id')
                ->name('patch');


            /*
            |--------------------------------------------------------------------------
            | DELETE
            |--------------------------------------------------------------------------
            */

            Route::delete(
                '{id}',
                [LeaseController::class, 'destroy']
            )
                ->whereNumber('id')
                ->name('destroy');
        });


    /*
    |--------------------------------------------------------------------------
    | PROPERTY VISITS
    |--------------------------------------------------------------------------
    */

    Route::prefix('property-visits')
        ->name('property-visits.')
        ->group(function () {

            Route::get(
                '/',
                [PropertyVisitController::class, 'index']
            )->name('index');

            Route::post(
                '/',
                [PropertyVisitController::class, 'store']
            )->name('store');

            Route::get(
                '{propertyVisit}',
                [PropertyVisitController::class, 'show']
            )->name('show');

            Route::put(
                '{propertyVisit}',
                [PropertyVisitController::class, 'update']
            )->name('update');

            Route::patch(
                '{propertyVisit}',
                [PropertyVisitController::class, 'update']
            )->name('patch');

            Route::delete(
                '{propertyVisit}',
                [PropertyVisitController::class, 'destroy']
            )->name('destroy');
        });


    /*
    |--------------------------------------------------------------------------
    | PROPERTY REVIEWS
    |--------------------------------------------------------------------------
    */

    Route::prefix('property-reviews')
        ->name('property-reviews.')
        ->group(function () {

            Route::get(
                '/',
                [PropertyReviewController::class, 'index']
            )->name('index');

            Route::get(
                '{propertyReview}',
                [PropertyReviewController::class, 'show']
            )->name('show');

            Route::put(
                '{propertyReview}',
                [PropertyReviewController::class, 'update']
            )->name('update');

            Route::patch(
                '{propertyReview}',
                [PropertyReviewController::class, 'update']
            )->name('patch');

            Route::delete(
                '{propertyReview}',
                [PropertyReviewController::class, 'destroy']
            )->name('destroy');

            Route::patch(
                '{propertyReview}/publish',
                [PropertyReviewController::class, 'publish']
            )->name('publish');

            Route::patch(
                '{propertyReview}/unpublish',
                [PropertyReviewController::class, 'unpublish']
            )->name('unpublish');

            Route::patch(
                '{propertyReview}/verify',
                [PropertyReviewController::class, 'verify']
            )->name('verify');

            Route::patch(
                '{propertyReview}/unverify',
                [PropertyReviewController::class, 'unverify']
            )->name('unverify');

            Route::patch(
                '{propertyReview}/toggle-publish',
                [PropertyReviewController::class, 'togglePublish']
            )->name('toggle-publish');

            Route::patch(
                '{propertyReview}/toggle-verification',
                [PropertyReviewController::class, 'toggleVerification']
            )->name('toggle-verification');

            Route::post(
                '{propertyReview}/like',
                [PropertyReviewController::class, 'like']
            )->name('like');

            Route::delete(
                '{propertyReview}/like',
                [PropertyReviewController::class, 'unlike']
            )->name('unlike');
        });


    /*
    |--------------------------------------------------------------------------
    | PROPERTY REVIEW SHORTCUTS
    |--------------------------------------------------------------------------
    */

    Route::get(
        'reviews',
        [PropertyReviewController::class, 'propertyReviews']
    )->name('properties.reviews.index');

    Route::get(
        'reviews/my-review',
        [PropertyReviewController::class, 'myReview']
    )->name('properties.reviews.my-review');

    Route::get(
        'reviews/summary',
        [PropertyReviewController::class, 'summary']
    )->name('properties.reviews.summary');

    Route::post(
        'reviews',
        [PropertyReviewController::class, 'store']
    )->name('properties.reviews.store');


    /*
    |--------------------------------------------------------------------------
    | PROPERTY FAVORITES
    |--------------------------------------------------------------------------
    */

    Route::prefix('property-favorites')
        ->name('property-favorites.')
        ->group(function () {

            Route::get(
                'my',
                [PropertyFavoriteController::class, 'myFavorites']
            )->name('my');

            Route::get(
                'status/{propertyId}',
                [PropertyFavoriteController::class, 'status']
            )
                ->whereNumber('propertyId')
                ->name('status');

            Route::post(
                'toggle/{propertyId}',
                [PropertyFavoriteController::class, 'toggle']
            )
                ->whereNumber('propertyId')
                ->name('toggle');

            Route::get(
                '/',
                [PropertyFavoriteController::class, 'index']
            )->name('index');

            Route::post(
                '/',
                [PropertyFavoriteController::class, 'store']
            )->name('store');

            Route::get(
                '{favorite}',
                [PropertyFavoriteController::class, 'show']
            )
                ->whereNumber('favorite')
                ->name('show');

            Route::put(
                '{favorite}',
                [PropertyFavoriteController::class, 'update']
            )
                ->whereNumber('favorite')
                ->name('update');

            Route::patch(
                '{favorite}',
                [PropertyFavoriteController::class, 'update']
            )
                ->whereNumber('favorite')
                ->name('patch');

            Route::delete(
                '{favorite}',
                [PropertyFavoriteController::class, 'destroy']
            )
                ->whereNumber('favorite')
                ->name('destroy');
        });


    /*
    |--------------------------------------------------------------------------
    | PROPERTY ANALYTICS
    |--------------------------------------------------------------------------
    */

    Route::prefix('property-analytics')
        ->name('property-analytics.')
        ->group(function () {

            Route::get(
                '/',
                [PropertyAnalyticsController::class, 'index']
            )->name('index');

            Route::post(
                '/',
                [PropertyAnalyticsController::class, 'store']
            )->name('store');

            Route::get(
                '{id}',
                [PropertyAnalyticsController::class, 'show']
            )
                ->whereNumber('id')
                ->name('show');

            Route::put(
                '{id}',
                [PropertyAnalyticsController::class, 'update']
            )
                ->whereNumber('id')
                ->name('update');

            Route::patch(
                '{id}',
                [PropertyAnalyticsController::class, 'update']
            )
                ->whereNumber('id')
                ->name('patch');

            Route::delete(
                '{id}',
                [PropertyAnalyticsController::class, 'destroy']
            )
                ->whereNumber('id')
                ->name('destroy');
        });


    /*
    |--------------------------------------------------------------------------
    | MASTER DATA
    |--------------------------------------------------------------------------
    */

    Route::apiResource(
        'amenities',
        AmenityController::class
    );

    Route::apiResource(
        'property-categories',
        PropertyCategoryController::class
    );

    Route::apiResource(
        'property-types',
        PropertyTypeController::class
    );

    Route::apiResource(
        'property-features',
        PropertyFeatureController::class
    );

    Route::apiResource(
        'units',
        UnitController::class
    );


    /*
    |--------------------------------------------------------------------------
    | ADMIN ROUTES
    |--------------------------------------------------------------------------
    */

    Route::middleware('role:super-admin|admin')
        ->group(function () {

            /*
            |--------------------------------------------------------------------------
            | USERS
            |--------------------------------------------------------------------------
            */

            Route::apiResource(
                'users',
                UserController::class
            );


            /*
            |--------------------------------------------------------------------------
            | RBAC
            |--------------------------------------------------------------------------
            */

            Route::prefix('rbac')
                ->name('rbac.')
                ->group(function () {

                    /*
                    |--------------------------------------------------------------------------
                    | ROLES
                    |--------------------------------------------------------------------------
                    */

                    Route::apiResource(
                        'roles',
                        RoleController::class
                    );


                    /*
                    |--------------------------------------------------------------------------
                    | ROLE PERMISSIONS
                    |--------------------------------------------------------------------------
                    */

                    Route::get(
                        'roles/{role}/permissions',
                        [RoleController::class, 'getPermissions']
                    )->name('roles.permissions');

                    Route::post(
                        'roles/{role}/permissions',
                        [RoleController::class, 'assignPermissions']
                    )->name('roles.assign-permissions');


                    /*
                    |--------------------------------------------------------------------------
                    | PERMISSIONS
                    |--------------------------------------------------------------------------
                    */

                    Route::apiResource(
                        'permissions',
                        PermissionController::class
                    );
                });
        });
});