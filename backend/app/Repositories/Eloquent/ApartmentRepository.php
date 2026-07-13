<?php

namespace App\Repositories\Eloquent;

use App\Models\Apartment;
use App\Repositories\Interfaces\ApartmentRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;

class ApartmentRepository implements ApartmentRepositoryInterface
{
    protected Apartment $model;

    public function __construct(Apartment $model)
    {
        $this->model = $model;
    }

    /*
    |-----------------------------------------
    | GET ALL
    |-----------------------------------------
    */
    public function all(): Collection
    {
        return $this->model
            ->with(['property', 'units'])
            ->get();
    }

    /*
    |-----------------------------------------
    | FIND SINGLE
    |-----------------------------------------
    */
    public function find(int $id): ?Apartment
    {
        return $this->model
            ->with(['property', 'units'])
            ->find($id);
    }

    /*
    |-----------------------------------------
    | CREATE
    |-----------------------------------------
    */
    public function create(array $data): Apartment
    {
        return $this->model->create($data);
    }

    /*
    |-----------------------------------------
    | UPDATE
    |-----------------------------------------
    */
    public function update(int $id, array $data): bool
    {
        $apartment = $this->model->find($id);

        if (!$apartment) {
            return false;
        }

        return $apartment->update($data);
    }

    /*
    |-----------------------------------------
    | DELETE
    |-----------------------------------------
    */
    public function delete(int $id): bool
    {
        $apartment = $this->model->find($id);

        if (!$apartment) {
            return false;
        }

        return $apartment->delete();
    }

    /*
    |-----------------------------------------
    | GET BY PROPERTY
    |-----------------------------------------
    */
    public function getByProperty(int $propertyId): Collection
    {
        return $this->model
            ->with(['units'])
            ->where('property_id', $propertyId)
            ->get();
    }
}