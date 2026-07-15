<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Repositories\Interfaces\PropertyVisitRepositoryInterface;
use App\Repositories\Eloquent\PropertyVisitRepository;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PropertyVisitRepositoryInterface::class, PropertyVisitRepository::class);
    }

    public function boot(): void
    {
        //
    }
}
