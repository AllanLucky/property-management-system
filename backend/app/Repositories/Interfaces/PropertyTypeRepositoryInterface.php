<?php

namespace App\Repositories\Interfaces;

use App\Models\PropertyType;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface PropertyTypeRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL PROPERTY TYPES
    |--------------------------------------------------------------------------
    */
    public function all(): Collection;

    /*
    |--------------------------------------------------------------------------
    | PAGINATE PROPERTY TYPES
    |--------------------------------------------------------------------------
    */
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | FIND PROPERTY TYPE BY ID
    |--------------------------------------------------------------------------
    */
    public function find(int $id): ?PropertyType;

    /*
    |--------------------------------------------------------------------------
    | FIND PROPERTY TYPE BY SLUG
    |--------------------------------------------------------------------------
    */
    public function findBySlug(string $slug): ?PropertyType;

    /*
    |--------------------------------------------------------------------------
    | CREATE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function create(array $data): PropertyType;

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function update(
        PropertyType $propertyType,
        array $data
    ): PropertyType;

    /*
    |--------------------------------------------------------------------------
    | DELETE PROPERTY TYPE
    |--------------------------------------------------------------------------
    */
    public function delete(
        PropertyType $propertyType
    ): bool;
}