<?php
namespace App\Providers;

use App\Repositories\Interfaces\PlotRepositoryInterface;
use App\Repositories\Eloquent\PlotRepository;
use Illuminate\Support\ServiceProvider;

class PlotRepositoryProvider extends ServiceProvider
{
    /**
     * Register Plot repository bindings.
     */
    public function register(): void
    {
        $this->app->bind(
            PlotRepositoryInterface::class,
            PlotRepository::class
        );
    }

    /**
     * Bootstrap Plot repository services.
     */
    public function boot(): void
    {
        //
    }
}
