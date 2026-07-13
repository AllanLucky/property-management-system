<?php

namespace App\Repositories\Interfaces;

interface PropertyFeatureRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | CRUD OPERATIONS
    |--------------------------------------------------------------------------
    */

    public function getAll(
        array $filters = [],
        int $perPage = 15
    );

    public function getById(
        int|string $id
    );

    public function getBySlug(
        string $slug
    );

    public function create(
        array $data
    );

    public function update(
        int|string $id,
        array $data
    );

    public function delete(
        int|string $id
    ): bool;

    /*
    |--------------------------------------------------------------------------
    | PROPERTY RELATION (PIVOT)
    |--------------------------------------------------------------------------
    */

    public function getByProperty(
        int $propertyId,
        bool $activeOnly = false
    );

    /*
    |--------------------------------------------------------------------------
    | FEATURE FLAGS
    |--------------------------------------------------------------------------
    */

    public function getHighlighted(
        int $limit = 10
    );

    public function toggleStatus(
        int|string $id
    );

    public function toggleHighlight(
        int|string $id
    );

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    public function search(
        string $search,
        int $perPage = 15
    );
}