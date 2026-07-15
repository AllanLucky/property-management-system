<?php

namespace App\Repositories\Eloquent;

use App\Models\PropertyVisit;
use App\Repositories\Interfaces\PropertyVisitRepositoryInterface;

class PropertyVisitRepository implements PropertyVisitRepositoryInterface
{
    public function all(int $perPage = 20)
    {
        return PropertyVisit::latest()->paginate($perPage);
    }

    public function find(int $id): ?PropertyVisit
    {
        return PropertyVisit::find($id);
    }

    public function create(array $data): PropertyVisit
    {
        return PropertyVisit::create($data);
    }

    public function update(PropertyVisit $visit, array $data): PropertyVisit
    {
        $visit->update($data);
        return $visit;
    }

    public function delete(PropertyVisit $visit): bool
    {
        return $visit->delete();
    }

    public function findByProperty(int $propertyId, int $perPage = 20)
    {
        return PropertyVisit::where('property_id', $propertyId)->latest()->paginate($perPage);
    }
}
