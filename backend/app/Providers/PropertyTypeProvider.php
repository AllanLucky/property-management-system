<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Repositories\Interfaces\PropertyTypeRepositoryInterface;
use App\Repositories\Eloquent\PropertyTypeRepository;

class PropertyTypeProvider extends ServiceProvider
{
    /**
     * Register services
     */
    public function register(): void
    {
        $this->app->bind(
            PropertyTypeRepositoryInterface::class,
            PropertyTypeRepository::class
        );
    }

    /**
     * Bootstrap services
     */
    public function boot(): void
    {
        //
    }
}