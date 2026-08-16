<?php

namespace App\Repositories\Interfaces;

use App\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface TenantRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | Listing
    |--------------------------------------------------------------------------
    */

    public function paginate(
        array $filters = []
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | Find
    |--------------------------------------------------------------------------
    */

    public function find(
        int|string $id
    ): ?Tenant;

    public function findOrFail(
        int|string $id
    ): Tenant;

    public function findByTenantNumber(
        string $tenantNumber
    ): ?Tenant;

    public function findByPhone(
        string $phone
    ): ?Tenant;

    public function findByEmail(
        string $email
    ): ?Tenant;

    public function findByIdNumber(
        string $idNumber
    ): ?Tenant;

    public function findByPassportNumber(
        string $passportNumber
    ): ?Tenant;

    /*
    |--------------------------------------------------------------------------
    | Create / Update
    |--------------------------------------------------------------------------
    */

    public function create(
        array $data
    ): Tenant;

    public function update(
        Tenant $tenant,
        array $data
    ): Tenant;

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    public function delete(
        Tenant $tenant
    ): bool;

    public function restore(
        int|string $id
    ): ?Tenant;

    public function forceDelete(
        int|string $id
    ): bool;

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    public function activate(
        Tenant $tenant
    ): Tenant;

    public function deactivate(
        Tenant $tenant
    ): Tenant;

    public function blacklist(
        Tenant $tenant
    ): Tenant;

    public function setPending(
        Tenant $tenant
    ): Tenant;

    /*
    |--------------------------------------------------------------------------
    | Verification
    |--------------------------------------------------------------------------
    */

    public function verify(
        Tenant $tenant
    ): Tenant;

    public function unverify(
        Tenant $tenant
    ): Tenant;

    /*
    |--------------------------------------------------------------------------
    | Queries
    |--------------------------------------------------------------------------
    */

    public function getActive(): Collection;

    public function getInactive(): Collection;

    public function getPending(): Collection;

    public function getBlacklisted(): Collection;

    public function getVerified(): Collection;

    public function getUnverified(): Collection;

    public function search(
        string $search,
        int $limit = 20
    ): Collection;

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    public function count(): int;

    public function countActive(): int;

    public function countInactive(): int;

    public function countPending(): int;

    public function countBlacklisted(): int;

    public function countVerified(): int;

    public function countUnverified(): int;

    public function statistics(): array;

    /*
    |--------------------------------------------------------------------------
    | Tenant Number
    |--------------------------------------------------------------------------
    */

    public function tenantNumberExists(
        string $tenantNumber
    ): bool;

    public function generateTenantNumber(): string;
}