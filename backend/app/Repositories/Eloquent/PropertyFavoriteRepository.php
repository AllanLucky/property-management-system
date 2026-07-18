<?php

namespace App\Repositories\Eloquent;

use App\Models\PropertyFavorite;
use App\Repositories\Interfaces\PropertyFavoriteRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class PropertyFavoriteRepository implements PropertyFavoriteRepositoryInterface
{
    protected PropertyFavorite $model;

    public function __construct(PropertyFavorite $model)
    {
        $this->model = $model;
    }

    /**
     * --------------------------------------------------------------------------
     * Relationships
     * --------------------------------------------------------------------------
     */
    protected function relationships(): array
    {
        return [
            'user.roles',
            'property',
            'property.propertyCategory',
            'property.propertyType',
            'apartment',
            'unit',
        ];
    }

    /**
     * --------------------------------------------------------------------------
     * Get all favorites
     * --------------------------------------------------------------------------
     */
    public function all(array $filters = []): Collection
    {
        return $this->query($filters)->get();
    }

    /**
     * --------------------------------------------------------------------------
     * Pagination
     * --------------------------------------------------------------------------
     */
    public function paginate(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->query($filters)
            ->paginate($perPage);
    }

    /**
     * --------------------------------------------------------------------------
     * Find by ID
     * --------------------------------------------------------------------------
     */
    public function findById(
        int $id
    ): ?PropertyFavorite {
        return $this->model
            ->with($this->relationships())
            ->find($id);
    }

    /**
     * --------------------------------------------------------------------------
     * Create favorite
     * --------------------------------------------------------------------------
     */
    public function create(
        array $data
    ): PropertyFavorite {
        return $this->model->create($data);
    }

    /**
     * --------------------------------------------------------------------------
     * Update favorite
     * --------------------------------------------------------------------------
     */
    public function update(
        PropertyFavorite $favorite,
        array $data
    ): bool {
        return $favorite->update($data);
    }

    /**
     * --------------------------------------------------------------------------
     * Delete favorite
     * --------------------------------------------------------------------------
     */
    public function delete(
        PropertyFavorite $favorite
    ): bool {
        return $favorite->delete();
    }

    /**
     * --------------------------------------------------------------------------
     * Check existing favorite
     * --------------------------------------------------------------------------
     */
    public function exists(
        int $userId,
        int $propertyId
    ): bool {
        return $this->model
            ->where('user_id', $userId)
            ->where('property_id', $propertyId)
            ->exists();
    }

    /**
     * --------------------------------------------------------------------------
     * Find user favorite property
     * --------------------------------------------------------------------------
     */
    public function findUserFavorite(
        int $userId,
        int $propertyId
    ): ?PropertyFavorite {
        return $this->model
            ->where('user_id', $userId)
            ->where('property_id', $propertyId)
            ->with($this->relationships())
            ->first();
    }

    /**
     * --------------------------------------------------------------------------
     * User favorites
     * --------------------------------------------------------------------------
     */
    public function userFavorites(
        int $userId,
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->model
            ->where('user_id', $userId)
            ->with($this->relationships())
            ->latest()
            ->paginate($perPage);
    }

    /**
     * --------------------------------------------------------------------------
     * Query builder
     * --------------------------------------------------------------------------
     */
    protected function query(array $filters = [])
    {
        $query = $this->model
            ->with($this->relationships());

        if (!empty($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        if (!empty($filters['property_id'])) {
            $query->where('property_id', $filters['property_id']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', $filters['is_active']);
        }

        return $query->latest();
    }
}