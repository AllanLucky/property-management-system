<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/*
|--------------------------------------------------------------------------
| Repositories
|--------------------------------------------------------------------------
*/
use App\Repositories\Interfaces\ActivityLogRepositoryInterface;
use App\Repositories\Eloquent\ActivityLogRepository;

/*
|--------------------------------------------------------------------------
| Services
|--------------------------------------------------------------------------
*/
use App\Services\ActivityLogService;

class UserActivityLogServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        /*
        |-----------------------------------------
        | BIND REPOSITORY INTERFACE
        |-----------------------------------------
        */
        $this->app->bind(
            ActivityLogRepositoryInterface::class,
            ActivityLogRepository::class
        );

        /*
        |-----------------------------------------
        | REGISTER ACTIVITY SERVICE
        |-----------------------------------------
        */
        $this->app->singleton(ActivityLogService::class, function ($app) {
            return new ActivityLogService(
                $app->make(ActivityLogRepositoryInterface::class)
            );
        });
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}