<?php

namespace App\Repositories\Interfaces;

use App\Models\PropertyFavorite;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PropertyFavoriteRepositoryInterface
{

    /**
     * Get all favorites
     */
    public function all(array $filters = []): Collection;


    /**
     * Paginated favorites
     */
    public function paginate(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;



    /**
     * Find favorite by ID
     */
    public function findById(
        int $id
    ): ?PropertyFavorite;



    /**
     * Create favorite
     */
    public function create(
        array $data
    ): PropertyFavorite;



    /**
     * Update favorite
     */
    public function update(
        PropertyFavorite $favorite,
        array $data
    ): bool;



    /**
     * Delete favorite
     */
    public function delete(
        PropertyFavorite $favorite
    ): bool;



    /**
     * Check user favorite property
     */
    public function exists(
        int $userId,
        int $propertyId
    ): bool;



    /**
     * Find user property favorite
     */
    public function findUserFavorite(
        int $userId,
        int $propertyId
    ): ?PropertyFavorite;



    /**
     * Get favorites by user
     */
    public function userFavorites(
        int $userId,
        int $perPage = 15
    ): LengthAwarePaginator;

}