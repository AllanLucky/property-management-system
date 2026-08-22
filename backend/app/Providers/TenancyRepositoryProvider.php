<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Contracts\TenancyRepositoryInterface;
use App\Repositories\Eloquent\TenancyRepository;

class TenancyRepositoryProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        // Bind the interface to the Eloquent implementation
        $this->app->bind(
            TenancyRepositoryInterface::class,
            TenancyRepository::class
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // You can add boot logic here if needed
    }
}
