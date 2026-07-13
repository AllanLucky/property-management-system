<?php

namespace App\Repositories\Eloquent;

use App\Models\Amenity;
use App\Repositories\Interfaces\AmenityRepositoryInterface;

class AmenityRepository implements AmenityRepositoryInterface
{
    public function all()
    {
        return Amenity::query()
            ->orderBy('sort_order')
            ->get();
    }

    public function find(int $id): Amenity
    {
        return Amenity::findOrFail($id);
    }

    public function create(array $data): Amenity
    {
        return Amenity::create($data);
    }

    public function update(int $id, array $data): Amenity
    {
        $amenity = Amenity::findOrFail($id);
        $amenity->update($data);

        return $amenity->fresh();
    }

    public function delete(int $id): bool
    {
        $amenity = Amenity::findOrFail($id);
        return $amenity->delete();
    }

    public function toggleStatus(int $id): Amenity
    {
        $amenity = Amenity::findOrFail($id);

        $amenity->is_active = !$amenity->is_active;
        $amenity->save();

        return $amenity->fresh();
    }
}