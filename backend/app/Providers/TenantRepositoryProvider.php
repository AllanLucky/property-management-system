<?php

namespace App\Providers;

use App\Repositories\Interfaces\TenantRepositoryInterface;
use App\Repositories\Eloquent\TenantRepository;
use Illuminate\Support\ServiceProvider;

class TenantRepositoryProvider extends ServiceProvider
{
    /**
     * Register tenant repository services.
     */
    public function register(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Tenant Repository Binding
        |--------------------------------------------------------------------------
        |
        | Bind the tenant repository interface to the Eloquent implementation.
        |
        */

        $this->app->bind(
            TenantRepositoryInterface::class,
            TenantRepository::class
        );
    }

    /**
     * Bootstrap tenant repository services.
     */
    public function boot(): void
    {
        //
    }
}