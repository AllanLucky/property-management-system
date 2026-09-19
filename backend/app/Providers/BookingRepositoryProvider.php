<?php

namespace App\Providers;

use App\Repositories\BookingRepository;
use App\Repositories\Interfaces\BookingRepositoryInterface;
use Illuminate\Support\ServiceProvider;

class BookingRepositoryProvider extends ServiceProvider
{
    /**
     * Register Booking repository bindings.
     */
    public function register(): void
    {
        $this->app->bind(
            BookingRepositoryInterface::class,
            BookingRepository::class
        );
    }

    /**
     * Bootstrap Booking repository services.
     */
    public function boot(): void
    {
        //
    }
}