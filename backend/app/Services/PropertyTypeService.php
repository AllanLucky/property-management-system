<?php

namespace App\Services;

use App\Models\PropertyType;
use App\Repositories\Interfaces\PropertyTypeRepositoryInterface;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class PropertyTypeService
{
    /**
     * REPOSITORY INSTANCE
     */
    protected PropertyTypeRepositoryInterface $propertyTypeRepository;

    /**
     * CONSTRUCTOR INJECTION
     */
    public function __construct(
        PropertyTypeRepositoryInterface $propertyTypeRepository
    ) {
        $this->propertyTypeRepository = $propertyTypeRepository;
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL PROPERTY TYPES
    |--------------------------------------------------------------------------
    */
    public function getAll(): Collection
    {
        return $this->propertyTypeRepository->all();
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATED LIST
    |--------------------------------------------------------------------------
    */
    public function getPaginated(
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->propertyTypeRepository->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY ID
    |--------------------------------------------------------------------------
    */
    public function find(int $id): ?PropertyType
    {
        return $this->propertyTypeRepository->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY SLUG
    |--------------------------------------------------------------------------
    */
    public function findBySlug(
        string $slug
    ): ?PropertyType {
        return $this->propertyTypeRepository->findBySlug($slug);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function create(
        array $data
    ): PropertyType {
        return $this->propertyTypeRepository->create($data);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function update(
        int $id,
        array $data
    ): ?PropertyType {
        $propertyType = $this->find($id);

        if (!$propertyType) {
            return null;
        }

        return $this->propertyTypeRepository->update(
            $propertyType,
            $data
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function delete(
        int $id
    ): bool {
        $propertyType = $this->find($id);

        if (!$propertyType) {
            return false;
        }

        return $this->propertyTypeRepository->delete(
            $propertyType
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function activate(
        int $id
    ): ?PropertyType {
        $propertyType = $this->find($id);

        if (!$propertyType) {
            return null;
        }

        return $this->propertyTypeRepository->update(
            $propertyType,
            [
                'status' => 'active',
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function deactivate(
        int $id
    ): ?PropertyType {
        $propertyType = $this->find($id);

        if (!$propertyType) {
            return null;
        }

        return $this->propertyTypeRepository->update(
            $propertyType,
            [
                'status' => 'inactive',
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK EXISTENCE
    |--------------------------------------------------------------------------
    */
    public function existsBySlug(
        string $slug
    ): bool {
        return $this->findBySlug($slug) !== null;
    }
}