<?php

namespace App\Repositories\Interfaces;

use App\Models\Amenity;

interface AmenityRepositoryInterface
{
    public function all();

    public function find(int $id): Amenity;

    public function create(array $data): Amenity;

    public function update(int $id, array $data): Amenity;

    public function delete(int $id): bool;

    public function toggleStatus(int $id): Amenity;
}