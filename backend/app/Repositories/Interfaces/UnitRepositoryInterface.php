<?php

namespace App\Repositories\Interfaces;

use App\Models\Unit;
use Illuminate\Support\Collection;

interface UnitRepositoryInterface
{
    /**
     * Get all units (fast listing - light relations)
     */
    public function all(): Collection;

    /**
     * Find unit by ID (full relations)
     */
    public function find(int $id): ?Unit;

    /**
     * Create unit
     */
    public function create(array $data): Unit;

    /**
     * Update unit
     */
    public function update(int $id, array $data): Unit;

    /**
     * Delete unit
     */
    public function delete(int $id): bool;

    /**
     * Assign unit to property
     */
    public function assignToProperty(int $unitId, int $propertyId): Unit;

    /**
     * Get units by property (fast listing)
     */
    public function getByProperty(int $propertyId): Collection;

    /**
     * Get units by status
     */
    public function getByStatus(string $status): Collection;

    /**
     * OPTIONAL: Get property unit stats (performance optimized)
     */
    public function statsByProperty(int $propertyId): array;
}