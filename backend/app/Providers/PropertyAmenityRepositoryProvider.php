<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Interfaces\PropertyAmenityRepositoryInterface;
use App\Repositories\Eloquent\PropertyAmenityRepository;

class PropertyAmenityRepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            PropertyAmenityRepositoryInterface::class,
            PropertyAmenityRepository::class
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}