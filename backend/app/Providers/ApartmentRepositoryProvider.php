<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/*
|--------------------------------------------------------------------------
| Repositories
|--------------------------------------------------------------------------
*/
use App\Repositories\Interfaces\ApartmentRepositoryInterface;
use App\Repositories\Eloquent\ApartmentRepository;

class ApartmentRepositoryProvider extends ServiceProvider
{
    /**
     * Register bindings
     *
     * This is where we bind the interface
     * to its Eloquent implementation.
     */
    public function register(): void
    {
        $this->app->bind(
            ApartmentRepositoryInterface::class,
            ApartmentRepository::class
        );
    }

    /**
     * Bootstrap services
     */
    public function boot(): void
    {
        //
    }
}