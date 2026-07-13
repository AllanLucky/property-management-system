<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Repositories\Interfaces\UnitRepositoryInterface;
use App\Repositories\Eloquent\UnitRepository;

class UnitServiceProvider extends ServiceProvider
{
    /**
     * Register repository bindings.
     */
    public function register(): void
    {
        /*
        |--------------------------------------------------------------------------
        | UNIT REPOSITORY BINDING
        |--------------------------------------------------------------------------
        |
        | Bind interface to implementation
        | for dependency injection.
        |
        */

        $this->app->bind(
            UnitRepositoryInterface::class,
            UnitRepository::class
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