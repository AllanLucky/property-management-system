<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

/*
|--------------------------------------------------------------------------
| USER REPOSITORIES
|--------------------------------------------------------------------------
*/
use App\Repositories\Eloquent\UserRepository;
use App\Repositories\Interfaces\UserRepositoryInterface;

/*
|--------------------------------------------------------------------------
| RBAC REPOSITORIES
|--------------------------------------------------------------------------
*/
use App\Repositories\Eloquent\RoleRepository;
use App\Repositories\Interfaces\RoleRepositoryInterface;

use App\Repositories\Eloquent\PermissionRepository;
use App\Repositories\Interfaces\PermissionRepositoryInterface;

/*
|--------------------------------------------------------------------------
| ROLE REQUEST REPOSITORIES
|--------------------------------------------------------------------------
*/
use App\Repositories\Eloquent\RoleRequestRepository;
use App\Repositories\Interfaces\RoleRequestRepositoryInterface;

/*
|--------------------------------------------------------------------------
| ACTIVITY LOG REPOSITORIES (🔥 FIXED)
|--------------------------------------------------------------------------
*/
use App\Repositories\Eloquent\ActivityLogRepository;
use App\Repositories\Interfaces\ActivityLogRepositoryInterface;

/*
|--------------------------------------------------------------------------
| PROPERTY REPOSITORIES
|--------------------------------------------------------------------------
*/
use App\Repositories\Eloquent\PropertyRepository;
use App\Repositories\Interfaces\PropertyRepositoryInterface;

use App\Repositories\Eloquent\PropertyCategoryRepository;
use App\Repositories\Interfaces\PropertyCategoryInterface;

use App\Repositories\Eloquent\PropertyTypeRepository;
use App\Repositories\Interfaces\PropertyTypeRepositoryInterface;

use App\Repositories\Eloquent\PropertyFeatureRepository;
use App\Repositories\Interfaces\PropertyFeatureRepositoryInterface;

use App\Repositories\Eloquent\PropertyAmenityRepository;
use App\Repositories\Interfaces\PropertyAmenityRepositoryInterface;

use App\Repositories\Eloquent\EloquentPropertyReviewRepository;
use App\Repositories\Interfaces\PropertyReviewRepositoryInterface;

use App\Repositories\Interfaces\PropertyVisitRepositoryInterface;
use App\Repositories\Eloquent\PropertyVisitRepository;

/*
|--------------------------------------------------------------------------
| APARTMENT REPOSITORIES
|--------------------------------------------------------------------------
*/
use App\Repositories\Eloquent\ApartmentRepository;
use App\Repositories\Interfaces\ApartmentRepositoryInterface;

/*
|--------------------------------------------------------------------------
| UNIT REPOSITORIES
|--------------------------------------------------------------------------
*/
use App\Repositories\Eloquent\UnitRepository;
use App\Repositories\Interfaces\UnitRepositoryInterface;

/*
|--------------------------------------------------------------------------
| LOCATION REPOSITORIES
|--------------------------------------------------------------------------
*/
use App\Repositories\Eloquent\CountryRepository;
use App\Repositories\Interfaces\CountryRepositoryInterface;

use App\Repositories\Eloquent\StateRepository;
use App\Repositories\Interfaces\StateRepositoryInterface;

use App\Repositories\Eloquent\CountyRepository;
use App\Repositories\Interfaces\CountyRepositoryInterface;

use App\Repositories\Eloquent\CityRepository;
use App\Repositories\Interfaces\CityRepositoryInterface;

use App\Repositories\Eloquent\StreetRepository;
use App\Repositories\Interfaces\StreetRepositoryInterface;

/*
|--------------------------------------------------------------------------
| AMENITY REPOSITORY
|--------------------------------------------------------------------------
*/
use App\Repositories\Eloquent\AmenityRepository;
use App\Repositories\Interfaces\AmenityRepositoryInterface;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        /*
        |--------------------------------------------------------------------------
        | USER
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            UserRepositoryInterface::class,
            UserRepository::class
        );

        /*
        |--------------------------------------------------------------------------
        | ACTIVITY LOG (🔥 FIX APPLIED HERE)
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            ActivityLogRepositoryInterface::class,
            ActivityLogRepository::class
        );

        /*
        |--------------------------------------------------------------------------
        | ROLES
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            RoleRepositoryInterface::class,
            RoleRepository::class
        );

        /*
        |--------------------------------------------------------------------------
        | PERMISSIONS
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            PermissionRepositoryInterface::class,
            PermissionRepository::class
        );

        /*
        |--------------------------------------------------------------------------
        | ROLE REQUEST
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            RoleRequestRepositoryInterface::class,
            RoleRequestRepository::class
        );

        /*
        |--------------------------------------------------------------------------
        | PROPERTY
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            PropertyRepositoryInterface::class,
            PropertyRepository::class
        );

        $this->app->bind(
            PropertyCategoryInterface::class,
            PropertyCategoryRepository::class
        );

        $this->app->bind(
            PropertyTypeRepositoryInterface::class,
            PropertyTypeRepository::class
        );

        $this->app->bind(
            PropertyFeatureRepositoryInterface::class,
            PropertyFeatureRepository::class
        );

        $this->app->bind(
            PropertyAmenityRepositoryInterface::class,
            PropertyAmenityRepository::class
        );

        $this->app->bind(
            PropertyReviewRepositoryInterface::class,
            EloquentPropertyReviewRepository::class
        );

         $this->app->bind(
            PropertyVisitRepositoryInterface::class,
            PropertyVisitRepository::class
        );

        /*
        |--------------------------------------------------------------------------
        | APARTMENT
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            ApartmentRepositoryInterface::class,
            ApartmentRepository::class
        );

        /*
        |--------------------------------------------------------------------------
        | UNIT
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            UnitRepositoryInterface::class,
            UnitRepository::class
        );

        /*
        |--------------------------------------------------------------------------
        | LOCATION
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            CountryRepositoryInterface::class,
            CountryRepository::class
        );

        $this->app->bind(
            StateRepositoryInterface::class,
            StateRepository::class
        );

        $this->app->bind(
            CountyRepositoryInterface::class,
            CountyRepository::class
        );

        $this->app->bind(
            CityRepositoryInterface::class,
            CityRepository::class
        );

        $this->app->bind(
            StreetRepositoryInterface::class,
            StreetRepository::class
        );

        /*
        |--------------------------------------------------------------------------
        | AMENITY
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            AmenityRepositoryInterface::class,
            AmenityRepository::class
        );
    }

    public function boot(): void
    {
        Gate::before(function ($user, $ability) {
            if (method_exists($user, 'hasRole') && $user->hasRole('super-admin')) {
                return true;
            }

            return null;
        });
    }
}