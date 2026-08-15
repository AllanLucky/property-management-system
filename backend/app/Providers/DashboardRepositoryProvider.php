<?php

namespace App\Providers;

use App\Repositories\Interfaces\DashboardRepositoryInterface;
use App\Repositories\DashboardRepository;
use Illuminate\Support\ServiceProvider;

class DashboardRepositoryProvider extends ServiceProvider
{
    /**
     * Register dashboard repository bindings.
     */
    public function register(): void
    {
        $this->app->bind(
            DashboardRepositoryInterface::class,
            DashboardRepository::class
        );
    }

    /**
     * Bootstrap dashboard repository services.
     */
    public function boot(): void
    {
        //
    }
}