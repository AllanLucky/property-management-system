<?php

namespace App\Providers;

use App\Repositories\CountryRepository;
use App\Repositories\Interfaces\CountryRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class CountryRepositoryProvider extends ServiceProvider
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
            CountryRepositoryInterface::class,
            CountryRepository::class
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