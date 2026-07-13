<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

use App\Repositories\Interfaces\PropertyCategoryInterface;
use App\Repositories\Eloquent\PropertyCategoryRepository;

class PropertyCategoryProvider extends ServiceProvider
{
    /**
     * Register services
     *
     * Bind interface to repository implementation
     */
    public function register(): void
    {
        /*
        |--------------------------------------------------------------------------
        | PROPERTY CATEGORY REPOSITORY BINDING
        |--------------------------------------------------------------------------
        |
        | Using singleton to avoid multiple instances per request
        | and improve performance in large applications.
        |
        */

        $this->app->singleton(
            PropertyCategoryInterface::class,
            PropertyCategoryRepository::class
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