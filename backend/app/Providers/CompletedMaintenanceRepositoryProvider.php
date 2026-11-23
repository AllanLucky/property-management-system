<?php

namespace App\Providers;

use App\Repositories\Eloquent\CompletedMaintenanceRepository;
use App\Repositories\Interfaces\CompletedMaintenanceRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class CompletedMaintenanceRepositoryProvider extends ServiceProvider
{
    /**
     * Register repository bindings.
     */
    public function register(): void
    {
        $this->registerRepositories();
    }

    /**
     * Bind repository interfaces to their Eloquent implementations.
     */
    protected function registerRepositories(): void
    {
        $repositories = [
            CompletedMaintenanceRepositoryInterface::class =>
            CompletedMaintenanceRepository::class,
        ];

        foreach ($repositories as $interface => $implementation) {
            $this->app->bind($interface, $implementation);
        }
    }

    /**
     * Bootstrap application services.
     */
    public function boot(): void
    {
        //
    }
}
