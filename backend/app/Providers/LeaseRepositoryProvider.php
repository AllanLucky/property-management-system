<?php

namespace App\Providers;

use App\Repositories\Contracts\LeaseRepositoryInterface;
use App\Repositories\Eloquent\LeaseRepository;
use Illuminate\Support\ServiceProvider;

class LeaseRepositoryProvider extends ServiceProvider
{
    /**
     * Register Lease repository services.
     */
    public function register(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Lease Repository Binding
        |--------------------------------------------------------------------------
        |
        | Bind the LeaseRepositoryInterface to its Eloquent implementation.
        |
        | This allows services/controllers to depend on the interface instead
        | of depending directly on the Eloquent repository implementation.
        |
        */
        $this->app->bind(
            LeaseRepositoryInterface::class,
            LeaseRepository::class
        );
    }

    /**
     * Bootstrap Lease repository services.
     */
    public function boot(): void
    {
        //
    }
}