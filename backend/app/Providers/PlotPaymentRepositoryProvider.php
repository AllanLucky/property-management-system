<?php

namespace App\Providers;

use App\Repositories\Interfaces\PlotPaymentRepositoryInterface;
use App\Repositories\PlotPaymentRepository;
use Illuminate\Support\ServiceProvider;

class PlotPaymentRepositoryProvider extends ServiceProvider
{
    /**
     * Register repository bindings in the service container.
     */
    public function register(): void
    {
        $this->app->bind(
            PlotPaymentRepositoryInterface::class,
            PlotPaymentRepository::class
        );
    }

    /**
     * Bootstrap repository services.
     */
    public function boot(): void
    {
        //
    }
}
