<?php

namespace App\Repositories\Interfaces;

use App\Models\Region;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface RegionRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL REGIONS
    |--------------------------------------------------------------------------
    */

    public function all(array $filters = []): Collection;

    /*
    |--------------------------------------------------------------------------
    | GET PAGINATED REGIONS
    |--------------------------------------------------------------------------
    */

    public function paginate(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | FIND REGION
    |--------------------------------------------------------------------------
    */

    public function findById(int $id): ?Region;

    public function findBySlug(string $slug): ?Region;

    public function findByCode(string $code): ?Region;

    /*
    |--------------------------------------------------------------------------
    | CREATE REGION
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Region;

    /*
    |--------------------------------------------------------------------------
    | UPDATE REGION
    |--------------------------------------------------------------------------
    */

    public function update(int $id, array $data): ?Region;

    /*
    |--------------------------------------------------------------------------
    | DELETE REGION
    |--------------------------------------------------------------------------
    */

    public function delete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | REGION STATUS MANAGEMENT
    |--------------------------------------------------------------------------
    */

    public function activate(int $id): bool;

    public function deactivate(int $id): bool;

    public function toggleStatus(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | REGION STATISTICS AND REPORTS
    |--------------------------------------------------------------------------
    */

    public function statistics(array $filters = []): array;

    public function reports(array $filters = []): array;

    /*
    |--------------------------------------------------------------------------
    | GET REGIONS BY COUNTRY
    |--------------------------------------------------------------------------
    */

    public function getByCountry(int $countryId): Collection;

    /*
    |--------------------------------------------------------------------------
    | GET ACTIVE REGIONS
    |--------------------------------------------------------------------------
    */

    public function getActive(): Collection;

    /*
    |--------------------------------------------------------------------------
    | EXISTENCE CHECKS
    |--------------------------------------------------------------------------
    */

    public function exists(int $id): bool;

    public function codeExists(
        string $code,
        ?int $ignoreId = null
    ): bool;

    public function slugExists(
        string $slug,
        ?int $ignoreId = null
    ): bool;

    /*
    |--------------------------------------------------------------------------
    | RESTORE REGION
    |--------------------------------------------------------------------------
    */

    public function restore(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE REGION
    |--------------------------------------------------------------------------
    */

    public function forceDelete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | GET DELETED REGIONS
    |--------------------------------------------------------------------------
    */

    public function getTrashed(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | FIND DELETED REGION
    |--------------------------------------------------------------------------
    */

    public function findTrashedById(int $id): ?Region;

    /*
    |--------------------------------------------------------------------------
    | CHECK REGION DEPENDENCIES
    |--------------------------------------------------------------------------
    */

    public function hasDependencies(int $id): bool;
}