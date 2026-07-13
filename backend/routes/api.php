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

        Route::post(
            'register',
            [AuthController::class, 'register']
        )->name('register');

        Route::post(
            'login',
            [AuthController::class, 'login']
        )->name('login');

        Route::post(
            'forgot-password',
            [PasswordController::class, 'forgotPassword']
        )->name('forgot-password');

        Route::post(
            'reset-password',
            [PasswordController::class, 'resetPassword']
        )->name('reset-password');

        Route::post(
            'verify-otp',
            [VerificationController::class, 'verifyOtp']
        )->name('verify-otp');

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
Route::middleware('auth:sanctum')
    ->group(function () {


        /*
        |--------------------------------------------------------------------------
        | AUTHENTICATED USER
        |--------------------------------------------------------------------------
        */
        Route::get(
            '/user',
            function (Request $request) {
                return $request->user()->load([
                    'roles',
                    'permissions',
                ]);
            }
        );


        Route::post(
            'logout',
            [AuthController::class, 'logout']
        )->name('auth.logout');


        Route::post(
            'refresh-token',
            [AuthController::class, 'refreshToken']
        )->name('auth.refresh-token');


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


                // ID OR SLUG
                Route::get(
                    '{property}',
                    [PropertyController::class, 'show']
                )->name('show');


                // ID ONLY
                Route::put(
                    '{id}',
                    [PropertyController::class, 'update']
                )
                ->whereNumber('id')
                ->name('update');


                Route::patch(
                    '{id}',
                    [PropertyController::class, 'update']
                )
                ->whereNumber('id')
                ->name('patch');


                Route::delete(
                    '{id}',
                    [PropertyController::class, 'destroy']
                )
                ->whereNumber('id')
                ->name('destroy');


            });


        /*
        |--------------------------------------------------------------------------
        | PROPERTY ASSIGNMENTS (ID ONLY)
        |--------------------------------------------------------------------------
        */
        Route::prefix('properties/{property:id}')
            ->whereNumber('property')
            ->group(function () {


                /*
                |--------------------------------------------------------------------------
                | PROPERTY AMENITIES
                |--------------------------------------------------------------------------
                */
                Route::get(
                    'amenities',
                    [PropertyAmenityController::class, 'index']
                );


                Route::post(
                    'amenities/sync',
                    [PropertyAmenityController::class, 'sync']
                );


                Route::post(
                    'amenities/{amenity}',
                    [PropertyAmenityController::class, 'store']
                )->whereNumber('amenity');


                Route::put(
                    'amenities/{amenity}',
                    [PropertyAmenityController::class, 'update']
                )->whereNumber('amenity');


                Route::patch(
                    'amenities/{amenity}/toggle-status',
                    [PropertyAmenityController::class, 'toggleStatus']
                )->whereNumber('amenity');


                Route::delete(
                    'amenities/{amenity}',
                    [PropertyAmenityController::class, 'destroy']
                )->whereNumber('amenity');


                /*
                |--------------------------------------------------------------------------
                | PROPERTY FEATURES
                |--------------------------------------------------------------------------
                */
                Route::get(
                    'features',
                    [
                        PropertyFeatureAssignmentController::class,
                        'index'
                    ]
                );


                Route::post(
                    'features/sync',
                    [
                        PropertyFeatureAssignmentController::class,
                        'sync'
                    ]
                );


                Route::post(
                    'features/{feature}',
                    [
                        PropertyFeatureAssignmentController::class,
                        'store'
                    ]
                )->whereNumber('feature');


                Route::put(
                    'features/{feature}',
                    [
                        PropertyFeatureAssignmentController::class,
                        'update'
                    ]
                )->whereNumber('feature');


                Route::patch(
                    'features/{feature}/toggle-status',
                    [
                        PropertyFeatureAssignmentController::class,
                        'toggleStatus'
                    ]
                )->whereNumber('feature');


                Route::patch(
                    'features/{feature}/toggle-highlight',
                    [
                        PropertyFeatureAssignmentController::class,
                        'toggleHighlight'
                    ]
                )->whereNumber('feature');


                Route::delete(
                    'features/{feature}',
                    [
                        PropertyFeatureAssignmentController::class,
                        'destroy'
                    ]
                )->whereNumber('feature');


            });


            /*

        |--------------------------------------------------------------------------
           PROPERTY REVIEWS
        |--------------------------------------------------------------------------
       */

        /*
|--------------------------------------------------------------------------
| PROPERTY REVIEW MANAGEMENT
|--------------------------------------------------------------------------
*/

Route::prefix('property-reviews')
    ->name('property-reviews.')
    ->group(function () {

        Route::get('/', [PropertyReviewController::class, 'index'])->name('index');

        Route::get('{propertyReview}', [PropertyReviewController::class, 'show'])->name('show');

        Route::put('{propertyReview}', [PropertyReviewController::class, 'update'])->name('update');

        Route::patch('{propertyReview}', [PropertyReviewController::class, 'update'])->name('patch');

        Route::delete('{propertyReview}', [PropertyReviewController::class, 'destroy'])->name('destroy');

        Route::patch('{propertyReview}/publish', [PropertyReviewController::class, 'publish'])->name('publish');

        Route::patch('{propertyReview}/unpublish', [PropertyReviewController::class, 'unpublish'])->name('unpublish');

        Route::patch('{propertyReview}/verify', [PropertyReviewController::class, 'verify'])->name('verify');

        Route::patch('{propertyReview}/unverify', [PropertyReviewController::class, 'unverify'])->name('unverify');

        Route::patch('{propertyReview}/toggle-publish', [PropertyReviewController::class, 'togglePublish'])->name('toggle-publish');

        Route::patch('{propertyReview}/toggle-verification', [PropertyReviewController::class, 'toggleVerification'])->name('toggle-verification');

        Route::post('{propertyReview}/like', [PropertyReviewController::class, 'like'])->name('like');

        Route::delete('{propertyReview}/like', [PropertyReviewController::class, 'unlike'])->name('unlike');

    });


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
        | MASTER DATA
        |--------------------------------------------------------------------------
        */


        /*
        |--------------------------------------------------------------------------
        | AMENITIES
        |--------------------------------------------------------------------------
        */
        Route::apiResource(
            'amenities',
            AmenityController::class
        );


        /*
        |--------------------------------------------------------------------------
        | PROPERTY CATEGORIES
        |--------------------------------------------------------------------------
        */
        Route::apiResource(
            'property-categories',
            PropertyCategoryController::class
        );


        /*
        |--------------------------------------------------------------------------
        | PROPERTY TYPES
        |--------------------------------------------------------------------------
        */
        Route::apiResource(
            'property-types',
            PropertyTypeController::class
        );


        /*
        |--------------------------------------------------------------------------
        | PROPERTY FEATURES
        |--------------------------------------------------------------------------
        */
        Route::apiResource(
            'property-features',
            PropertyFeatureController::class
        );


        /*
        |--------------------------------------------------------------------------
        | UNITS
        |--------------------------------------------------------------------------
        */
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

