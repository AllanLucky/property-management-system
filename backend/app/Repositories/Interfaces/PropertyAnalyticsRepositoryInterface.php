<?php

namespace App\Repositories\Interfaces;

use App\Models\PropertyAnalytics;

interface PropertyAnalyticsRepositoryInterface
{
    public function all(): iterable;

    public function findById(int $id): ?PropertyAnalytics;

    public function create(array $data): PropertyAnalytics;

    public function update(PropertyAnalytics $analytics, array $data): PropertyAnalytics;

    public function delete(PropertyAnalytics $analytics): bool;
}
