<?php

namespace App\Providers;

use App\Repositories\Interfaces\PlotSaleRepositoryInterface;
use App\Repositories\PlotSaleRepository;
use Illuminate\Support\ServiceProvider;

class PlotSaleRepositoryProvider extends ServiceProvider
{
    /**
     * Register repository bindings in the service container.
     */
    public function register(): void
    {
        $this->app->bind(
            PlotSaleRepositoryInterface::class,
            PlotSaleRepository::class
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
