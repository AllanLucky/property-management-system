<?php

namespace App\Services;

use App\Models\Amenity;
use App\Repositories\Interfaces\AmenityRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class AmenityService
{
    public function __construct(
        protected AmenityRepositoryInterface $repo
    ) {}

    /**
     * GET ALL AMENITIES
     */
    public function getAll()
    {
        return $this->repo->all();
    }

    /**
     * GET SINGLE AMENITY
     */
    public function getById(int $id): Amenity
    {
        $amenity = $this->repo->find($id);

        if (!$amenity) {
            throw new ModelNotFoundException(
                "Amenity with ID {$id} was not found."
            );
        }

        return $amenity;
    }

    /**
     * CREATE AMENITY
     */
    public function create(array $data): Amenity
    {
        return $this->repo->create($data);
    }

    /**
     * UPDATE AMENITY
     */
    public function update(int $id, array $data): Amenity
    {
        $amenity = $this->repo->find($id);

        if (!$amenity) {
            throw new ModelNotFoundException(
                "Amenity with ID {$id} was not found."
            );
        }

        return $this->repo->update($id, $data);
    }

    /**
     * DELETE AMENITY
     */
    public function delete(int $id): bool
    {
        $amenity = $this->repo->find($id);

        if (!$amenity) {
            throw new ModelNotFoundException(
                "Amenity with ID {$id} was not found."
            );
        }

        return $this->repo->delete($id);
    }

    /**
     * TOGGLE STATUS
     */
    public function toggleStatus(int $id): Amenity
    {
        $amenity = $this->repo->find($id);

        if (!$amenity) {
            throw new ModelNotFoundException(
                "Amenity with ID {$id} was not found."
            );
        }

        return $this->repo->toggleStatus($id);
    }
}