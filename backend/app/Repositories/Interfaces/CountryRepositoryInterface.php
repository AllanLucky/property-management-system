<?php

namespace App\Repositories\Interfaces;

use App\Models\Country;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface CountryRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | GET COUNTRIES
    |--------------------------------------------------------------------------
    */

    /**
     * Get all countries with optional filters and relationships.
     */
    public function all(array $filters = []): Collection;

    /**
     * Get paginated countries with optional filters and relationships.
     */
    public function paginate(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator;

    /**
     * Get all active countries.
     */
    public function getActive(): Collection;

    /**
     * Get all inactive countries.
     */
    public function getInactive(): Collection;

    /*
    |--------------------------------------------------------------------------
    | FIND COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Find a country by its ID.
     */
    public function find(int $id): ?Country;

    /**
     * Find a country by ID or throw an exception.
     */
    public function findOrFail(int $id): Country;

    /**
     * Find a country by ISO code.
     */
    public function findByCode(string $code): ?Country;

    /**
     * Find a country by slug.
     */
    public function findBySlug(string $slug): ?Country;

    /**
     * Find a country by phone code.
     */
    public function findByPhoneCode(string $phoneCode): ?Country;

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new country.
     */
    public function create(array $data): Country;

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing country.
     */
    public function update(int $id, array $data): Country;

    /*
    |--------------------------------------------------------------------------
    | DELETE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a country.
     */
    public function delete(int $id): bool;

    /**
     * Restore a soft-deleted country.
     */
    public function restore(int $id): bool;

    /**
     * Permanently delete a country.
     */
    public function forceDelete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | COUNTRY STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a country.
     */
    public function activate(int $id): Country;

    /**
     * Deactivate a country.
     */
    public function deactivate(int $id): Country;

    /**
     * Toggle country active status.
     */
    public function toggleStatus(int $id): Country;

    /*
    |--------------------------------------------------------------------------
    | EXISTENCE CHECKS
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a country exists by ID.
     */
    public function exists(int $id): bool;

    /**
     * Check whether a country code already exists.
     */
    public function codeExists(
        string $code,
        ?int $exceptId = null
    ): bool;

    /**
     * Check whether a country slug already exists.
     */
    public function slugExists(
        string $slug,
        ?int $exceptId = null
    ): bool;

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIPS
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a country has associated geographical records
     * or properties.
     */
    public function hasDependencies(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get country statistics.
     */
    public function getStatistics(): array;

    /*
    |--------------------------------------------------------------------------
    | SOFT DELETED COUNTRIES
    |--------------------------------------------------------------------------
    */

    /**
     * Get all soft-deleted countries.
     */
    public function getTrashed(): Collection;

    /**
     * Get a soft-deleted country by ID.
     */
    public function findTrashed(int $id): ?Country;

    /**
     * Get paginated soft-deleted countries.
     */
    public function paginateTrashed(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator;
}
