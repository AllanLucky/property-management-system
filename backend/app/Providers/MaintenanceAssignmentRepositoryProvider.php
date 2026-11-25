<?php

namespace App\Providers;

use App\Repositories\Interfaces\MaintenanceAssignmentRepositoryInterface;
use App\Repositories\MaintenanceAssignmentRepository;
use Illuminate\Support\ServiceProvider;

class MaintenanceAssignmentRepositoryProvider extends ServiceProvider
{
    /**
     * Register repository bindings in the service container.
     */
    public function register(): void
    {
        $this->registerRepositories();
    }

    /**
     * Register application repository implementations.
     */
    protected function registerRepositories(): void
    {
        $this->app->bind(
            MaintenanceAssignmentRepositoryInterface::class,
            MaintenanceAssignmentRepository::class
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