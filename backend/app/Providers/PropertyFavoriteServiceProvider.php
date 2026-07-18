<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Repositories\Interfaces\PropertyFavoriteRepositoryInterface;
use App\Repositories\Eloquent\PropertyFavoriteRepository;

class PropertyFavoriteServiceProvider extends ServiceProvider
{

    /**
     * Register services.
     */
    public function register(): void
    {

        $this->app->bind(
            PropertyFavoriteRepositoryInterface::class,
            PropertyFavoriteRepository::class
        );

    }


    /**
     * Bootstrap services.
     */
    public function boot(): void
    {

    }

}