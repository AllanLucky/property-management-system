<?php

namespace App\Providers;

use App\Repositories\CityRepository;
use App\Repositories\Interfaces\CityRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class CityRepositoryProvider extends ServiceProvider
{
    /*
    |--------------------------------------------------------------------------
    | REGISTER REPOSITORIES
    |--------------------------------------------------------------------------
    |
    | Register repository interfaces and their implementations
    | in Laravel's service container.
    |
    */

    public function register(): void
    {
        $this->registerRepositories();
    }

    /*
    |--------------------------------------------------------------------------
    | REPOSITORY BINDINGS
    |--------------------------------------------------------------------------
    */

    protected function registerRepositories(): void
    {
        $this->app->bind(
            CityRepositoryInterface::class,
            CityRepository::class
        );
    }

    /*
    |--------------------------------------------------------------------------
    | BOOTSTRAP REPOSITORIES
    |--------------------------------------------------------------------------
    */

    public function boot(): void
    {
        //
    }
}
