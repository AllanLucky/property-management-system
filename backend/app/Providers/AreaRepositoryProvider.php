<?php

namespace App\Providers;

use App\Repositories\AreaRepository;
use App\Repositories\Interfaces\AreaRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class AreaRepositoryProvider extends ServiceProvider
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
            AreaRepositoryInterface::class,
            AreaRepository::class
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
