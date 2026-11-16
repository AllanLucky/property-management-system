<?php

namespace App\Providers;

use App\Repositories\CountyRepository;
use App\Repositories\Interfaces\CountyRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class CountyRepositoryProvider extends ServiceProvider
{
    /**
     * Register repository bindings in the service container.
     */
    public function register(): void
    {
        $this->registerRepositories();
    }

    /**
     * Register application repositories.
     */
    protected function registerRepositories(): void
    {
        $this->app->bind(
            CountyRepositoryInterface::class,
            CountyRepository::class
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