<?php

namespace App\Repositories\Interfaces;

use Illuminate\Database\Eloquent\Collection;
use App\Models\Apartment;

interface ApartmentRepositoryInterface
{
    public function all(): Collection;

    public function find(int $id): ?Apartment;

    public function create(array $data): Apartment;

    public function update(int $id, array $data): bool;

    public function delete(int $id): bool;

    public function getByProperty(int $propertyId): Collection;
}