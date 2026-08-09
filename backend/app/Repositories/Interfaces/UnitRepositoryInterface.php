<?php

namespace App\Repositories\Interfaces;

use App\Models\Unit;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

interface UnitRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | LISTING
    |--------------------------------------------------------------------------
    */

    /**
     * Get all units.
     *
     * Intended for cases where the complete collection is required.
     * For normal frontend listings, prefer paginate() or filter().
     */
    public function all(): Collection;

    /**
     * Get paginated units.
     *
     * @param int   $perPage
     * @param array $filters
     */
    public function paginate(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get filtered and paginated units.
     *
     * @param array $filters
     * @param int   $perPage
     */
    public function filter(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator;

    /**
     * Search units.
     *
     * @param string $search
     * @param int    $perPage
     */
    public function search(
        string $search,
        int $perPage = 25
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | FIND
    |--------------------------------------------------------------------------
    */

    /**
     * Find unit by ID with full relationships.
     */
    public function find(int $id): ?Unit;

    /**
     * Find unit by slug with full relationships.
     */
    public function findBySlug(string $slug): ?Unit;

    /*
    |--------------------------------------------------------------------------
    | CREATE / UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Create a unit.
     */
    public function create(array $data): Unit;

    /**
     * Update a unit.
     */
    public function update(
        int $id,
        array $data
    ): Unit;

    /**
     * Update unit status.
     */
    public function updateStatus(
        int $id,
        string $status
    ): Unit;

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a unit.
     */
    public function delete(int $id): bool;

    /**
     * Restore a soft-deleted unit.
     */
    public function restore(int $id): ?Unit;

    /**
     * Permanently delete a unit.
     */
    public function forceDelete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | PROPERTY / APARTMENT ASSIGNMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Assign unit to a property.
     */
    public function assignToProperty(
        int $unitId,
        int $propertyId
    ): Unit;

    /**
     * Assign unit to an apartment.
     */
    public function assignToApartment(
        int $unitId,
        int $apartmentId
    ): Unit;

    /*
    |--------------------------------------------------------------------------
    | FILTERED COLLECTIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Get units by property.
     */
    public function getByProperty(
        int $propertyId
    ): Collection;

    /**
     * Get units by apartment.
     */
    public function getByApartment(
        int $apartmentId
    ): Collection;

    /**
     * Get units by status.
     */
    public function getByStatus(
        string $status
    ): Collection;

    /**
     * Get vacant units.
     */
    public function getVacant(): Collection;

    /**
     * Get occupied units.
     */
    public function getOccupied(): Collection;

    /**
     * Get units under maintenance.
     */
    public function getMaintenance(): Collection;

    /**
     * Get reserved units.
     */
    public function getReserved(): Collection;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get unit statistics for a property.
     */
    public function statsByProperty(
        int $propertyId
    ): array;

    /**
     * Get global unit statistics.
     */
    public function stats(): array;

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a unit is available for booking/tenancy.
     */
    public function checkAvailability(
        int $unitId
    ): bool;
}

