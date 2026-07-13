<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Interfaces\PropertyRepositoryInterface;
use App\Repositories\Eloquent\PropertyRepository;

class PropertyRepositoryProvider extends ServiceProvider
{
    /**
     * Register repository bindings.
     *
     * Bind interface to Eloquent implementation
     */
    public function register(): void
    {
        /**
         * Singleton is better for repositories
         * (avoids multiple instances in request lifecycle)
         */
        $this->app->singleton(
            PropertyRepositoryInterface::class,
            PropertyRepository::class
        );
    }

    /**
     * Bootstrap services
     */
    public function boot(): void
    {
        //
    }
}