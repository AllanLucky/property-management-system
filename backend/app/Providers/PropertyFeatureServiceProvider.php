<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Repositories\Eloquent\PropertyFeatureRepository;

use App\Repositories\Interfaces\PropertyFeatureRepositoryInterface;

class PropertyFeatureServiceProvider extends ServiceProvider
{
    /**
     * -------------------------------------------------------------------------
     * REGISTER SERVICES
     * -------------------------------------------------------------------------
     */

    public function register(): void
    {
        /*
        |--------------------------------------------------------------------------
        | PROPERTY FEATURE REPOSITORY
        |--------------------------------------------------------------------------
        */

        $this->app->bind(

            PropertyFeatureRepositoryInterface::class,

            PropertyFeatureRepository::class
        );
    }

    /**
     * -------------------------------------------------------------------------
     * BOOT SERVICES
     * -------------------------------------------------------------------------
     */

    public function boot(): void
    {
        //
    }
}