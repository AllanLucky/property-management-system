<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Interfaces\RoleRequestRepositoryInterface;
use App\Repositories\Eloquent\RoleRequestRepository;

class RoleRequestRepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        /*
        |--------------------------------------------------------------------------
        | BIND INTERFACE TO IMPLEMENTATION
        |--------------------------------------------------------------------------
        */
        $this->app->bind(
            RoleRequestRepositoryInterface::class,
            RoleRequestRepository::class
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