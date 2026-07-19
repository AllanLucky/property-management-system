<?php

namespace App\Repositories\Interfaces;

use App\Models\PropertyVisit;

interface PropertyVisitRepositoryInterface
{
    public function all(int $perPage = 20);

    public function find(int $id): ?PropertyVisit;

    public function create(array $data): PropertyVisit;

    public function update(PropertyVisit $visit, array $data): PropertyVisit;

    public function delete(PropertyVisit $visit): bool;

    public function findByProperty(int $propertyId, int $perPage = 20);
}
