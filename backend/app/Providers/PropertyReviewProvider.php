<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/*
|--------------------------------------------------------------------------
| REPOSITORIES
|--------------------------------------------------------------------------
*/

use App\Repositories\Interfaces\PropertyReviewRepositoryInterface;
use App\Repositories\Eloquent\EloquentPropertyReviewRepository;

class PropertyReviewProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            PropertyReviewRepositoryInterface::class,
            EloquentPropertyReviewRepository::class
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