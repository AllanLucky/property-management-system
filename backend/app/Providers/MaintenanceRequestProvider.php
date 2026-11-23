<?php

namespace App\Providers;

use App\Repositories\Eloquent\MaintenanceRequestRepository;
use App\Repositories\Interfaces\MaintenanceRequestRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class MaintenanceRequestRepositoryProvider extends ServiceProvider
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
            MaintenanceRequestRepositoryInterface::class,
            MaintenanceRequestRepository::class,
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
