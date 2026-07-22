<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Interfaces\PropertyAnalyticsRepositoryInterface;
use App\Repositories\Eloquent\PropertyAnalyticsRepository;

class PropertyAnalyticsProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
       
        $this->app->bind(
            PropertyAnalyticsRepositoryInterface::class,
            PropertyAnalyticsRepository::class
        );
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
