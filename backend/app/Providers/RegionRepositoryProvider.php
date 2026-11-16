<?php

namespace App\Providers;

use App\Repositories\RegionRepository;
use App\Repositories\Interfaces\RegionRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class RegionRepositoryProvider extends ServiceProvider
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
            RegionRepositoryInterface::class,
            RegionRepository::class
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
