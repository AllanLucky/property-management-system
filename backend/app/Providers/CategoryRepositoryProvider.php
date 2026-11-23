<?php

namespace App\Providers;

use App\Repositories\Eloquent\MaintenanceCategoryRepository;
use App\Repositories\Interfaces\MaintenanceCategoryRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class MaintenanceCategoryRepositoryProvider extends ServiceProvider
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
        $repositories = [
            MaintenanceCategoryRepositoryInterface::class =>
                MaintenanceCategoryRepository::class,
        ];

        foreach ($repositories as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }
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
