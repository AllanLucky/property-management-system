<?php

namespace App\Repositories\Eloquent;

use App\Models\PropertyType;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use App\Repositories\Interfaces\PropertyTypeRepositoryInterface;

class PropertyTypeRepository implements PropertyTypeRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL PROPERTY TYPES
    |--------------------------------------------------------------------------
    */
    public function all(): Collection
    {
        return PropertyType::query()
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATE PROPERTY TYPES
    |--------------------------------------------------------------------------
    */
    public function paginate(
        int $perPage = 15
    ): LengthAwarePaginator {
        return PropertyType::query()
            ->latest()
            ->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND PROPERTY TYPE BY ID
    |--------------------------------------------------------------------------
    */
    public function find(
        int $id
    ): ?PropertyType {
        return PropertyType::find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND PROPERTY TYPE BY SLUG
    |--------------------------------------------------------------------------
    */
    public function findBySlug(
        string $slug
    ): ?PropertyType {
        return PropertyType::where(
            'slug',
            $slug
        )->first();
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function create(
        array $data
    ): PropertyType {
        return PropertyType::create($data);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function update(
        PropertyType $propertyType,
        array $data
    ): PropertyType {
        $propertyType->update($data);

        return $propertyType->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function delete(
        PropertyType $propertyType
    ): bool {
        return $propertyType->delete();
    }
}