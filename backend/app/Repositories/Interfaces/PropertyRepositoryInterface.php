<?php

namespace App\Repositories\Interfaces;

use App\Models\Property;
use Illuminate\Support\Collection;

interface PropertyRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | BASIC LISTING
    |--------------------------------------------------------------------------
    */
    public function all(): Collection;

    public function allWithRelations(): Collection;

    /*
    |--------------------------------------------------------------------------
    | FINDERS
    |--------------------------------------------------------------------------
    */
    public function find(int $id): ?Property;

    public function findWithRelations(int $id): ?Property;

    /*
    |--------------------------------------------------------------------------
    | CRUD OPERATIONS
    |--------------------------------------------------------------------------
    */
    public function create(array $data): Property;

    public function update(int $id, array $data): Property;

    public function delete(int $id): bool;

    /*
    |--------------------------------------------------------------------------
    | OWNERSHIP (USER BASED)
    |--------------------------------------------------------------------------
    */
    public function assignOwner(int $propertyId, int $userId): Property;

    public function getByOwner(int $userId): Collection;

    /*
    |--------------------------------------------------------------------------
    | FILTERING (BUSINESS LOGIC READY)
    |--------------------------------------------------------------------------
    */
    public function getByStatus(string $status): Collection;

    public function getActive(): Collection;

    public function getFeatured(): Collection;

    public function getVacant(): Collection;

    public function getFullyOccupied(): Collection;

    /*
    |--------------------------------------------------------------------------
    | RELATION SAFETY LAYER
    |--------------------------------------------------------------------------
    */
    public function getWithSafeRelations(array $requestedRelations = []): Collection;
}