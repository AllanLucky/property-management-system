<?php

namespace App\Repositories\Eloquent;

use App\Models\PropertyAnalytics;
use App\Repositories\Interfaces\PropertyAnalyticsRepositoryInterface;

class PropertyAnalyticsRepository implements PropertyAnalyticsRepositoryInterface
{
    public function all(): iterable
    {
        return PropertyAnalytics::with('property')->latest()->get();
    }

    public function findById(int $id): ?PropertyAnalytics
    {
        return PropertyAnalytics::with('property')->find($id);
    }

    public function create(array $data): PropertyAnalytics
    {
        return PropertyAnalytics::create($data);
    }

    public function update(PropertyAnalytics $analytics, array $data): PropertyAnalytics
    {
        $analytics->update($data);
        return $analytics;
    }

    public function delete(PropertyAnalytics $analytics): bool
    {
        return $analytics->delete();
    }
}
