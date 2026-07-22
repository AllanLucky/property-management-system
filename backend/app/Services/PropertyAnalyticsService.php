<?php

namespace App\Services;

use App\Models\PropertyAnalytics;
use App\Repositories\Interfaces\PropertyAnalyticsRepositoryInterface;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\Eloquent\Collection;

class PropertyAnalyticsService
{
    protected PropertyAnalyticsRepositoryInterface $repository;

    public function __construct(PropertyAnalyticsRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Fetch all analytics records.
     */
    public function listAnalytics(): Collection|iterable
    {
        return $this->repository->all();
    }

    /**
     * Find a single analytics record by ID.
     */
    public function findAnalytics(int $id): ?PropertyAnalytics
    {
        return $this->repository->findById($id);
    }

    /**
     * Create a new analytics record.
     */
    public function createAnalytics(array $data): PropertyAnalytics
    {
        try {
            return $this->repository->create($data);
        } catch (\Throwable $e) {
            Log::error('Failed to create PropertyAnalytics', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Update an existing analytics record.
     */
    public function updateAnalytics(PropertyAnalytics $analytics, array $data): PropertyAnalytics
    {
        try {
            return $this->repository->update($analytics, $data);
        } catch (\Throwable $e) {
            Log::error('Failed to update PropertyAnalytics', ['id' => $analytics->id, 'error' => $e->getMessage()]);
            throw $e;
        }
    }

    /**
     * Delete an analytics record.
     */
    public function deleteAnalytics(PropertyAnalytics $analytics): bool
    {
        try {
            return $this->repository->delete($analytics);
        } catch (\Throwable $e) {
            Log::error('Failed to delete PropertyAnalytics', ['id' => $analytics->id, 'error' => $e->getMessage()]);
            throw $e;
        }
    }
}
