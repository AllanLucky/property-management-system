<?php

namespace App\Providers;

use App\Repositories\Eloquent\OngoingMaintenanceRepository;
use App\Repositories\Interfaces\OngoingMaintenanceRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class OngoingMaintenanceRepositoryProvider extends ServiceProvider
{
    /*
    |--------------------------------------------------------------------------
    | REGISTER REPOSITORIES
    |--------------------------------------------------------------------------
    |
    | Register the Ongoing Maintenance repository interface and its
    | Eloquent implementation in Laravel's service container.
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
            OngoingMaintenanceRepositoryInterface::class =>
            OngoingMaintenanceRepository::class,
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
