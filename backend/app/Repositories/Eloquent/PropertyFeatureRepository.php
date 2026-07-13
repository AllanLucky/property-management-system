<?php

namespace App\Repositories\Eloquent;

use App\Models\PropertyFeature;
use App\Repositories\Interfaces\PropertyFeatureRepositoryInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PropertyFeatureRepository implements PropertyFeatureRepositoryInterface
{
    protected PropertyFeature $model;

    public function __construct(PropertyFeature $model)
    {
        $this->model = $model;
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */
    public function getAll(array $filters = [], int $perPage = 15)
    {
        $query = $this->model->query();

        // SEARCH
        if (!empty($filters['search'])) {
            $query->search($filters['search']);
        }

        // TYPE
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        // ACTIVE
        if (array_key_exists('is_active', $filters) && $filters['is_active'] !== null) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        // HIGHLIGHTED
        if (array_key_exists('is_highlighted', $filters) && $filters['is_highlighted'] !== null) {
            $query->where('is_highlighted', filter_var($filters['is_highlighted'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query
            ->with(['properties'])
            ->ordered()
            ->latest()
            ->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY ID (🔥 HARDENED)
    |--------------------------------------------------------------------------
    */
    public function getById(int|string $id)
    {
        $id = is_numeric($id) ? (int) $id : $id;

        if (!$id) {
            throw new ModelNotFoundException("Invalid PropertyFeature ID");
        }

        return $this->model
            ->with(['properties'])
            ->findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY SLUG
    |--------------------------------------------------------------------------
    */
    public function getBySlug(string $slug)
    {
        if (!$slug) {
            throw new ModelNotFoundException("Slug is required");
        }

        return $this->model
            ->with(['properties'])
            ->where('slug', $slug)
            ->firstOrFail();
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */
    public function create(array $data)
    {
        return $this->model->create([
            'name'           => $data['name'] ?? null,
            'slug'           => $data['slug'] ?? null,
            'type'           => $data['type'] ?? 'text',
            'icon'           => $data['icon'] ?? null,
            'description'    => $data['description'] ?? null,
            'default_value'  => $data['default_value'] ?? null,
            'is_active'      => (bool) ($data['is_active'] ?? true),
            'is_highlighted' => (bool) ($data['is_highlighted'] ?? false),
            'sort_order'     => (int) ($data['sort_order'] ?? 0),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE (🔥 FIXED SAFETY + NO STRING BUGS)
    |--------------------------------------------------------------------------
    */
    public function update(int|string $id, array $data)
    {
        $feature = $this->getById($id);

        $feature->update([
            'name'           => $data['name'] ?? $feature->name,
            'slug'           => $data['slug'] ?? $feature->slug,
            'type'           => $data['type'] ?? $feature->type,
            'icon'           => $data['icon'] ?? $feature->icon,
            'description'    => $data['description'] ?? $feature->description,
            'default_value'  => $data['default_value'] ?? $feature->default_value,
            'is_active'      => array_key_exists('is_active', $data)
                ? (bool) $data['is_active']
                : $feature->is_active,
            'is_highlighted' => array_key_exists('is_highlighted', $data)
                ? (bool) $data['is_highlighted']
                : $feature->is_highlighted,
            'sort_order'     => array_key_exists('sort_order', $data)
                ? (int) $data['sort_order']
                : $feature->sort_order,
        ]);

        return $feature->fresh(['properties']);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */
    public function delete(int|string $id): bool
    {
        return $this->getById($id)->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY PROPERTY
    |--------------------------------------------------------------------------
    */
    public function getByProperty(int $propertyId, bool $activeOnly = false)
    {
        return $this->model
            ->whereHas('properties', function ($q) use ($propertyId) {
                $q->where('properties.id', $propertyId);
            })
            ->with(['properties' => function ($q) use ($propertyId) {
                $q->where('properties.id', $propertyId);
            }])
            ->when($activeOnly, fn ($q) => $q->where('is_active', true))
            ->ordered()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET HIGHLIGHTED
    |--------------------------------------------------------------------------
    */
    public function getHighlighted(int $limit = 10)
    {
        return $this->model
            ->where('is_active', true)
            ->where('is_highlighted', true)
            ->ordered()
            ->limit($limit)
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */
    public function toggleStatus(int|string $id)
    {
        $feature = $this->getById($id);

        $feature->update([
            'is_active' => !$feature->is_active,
        ]);

        return $feature->fresh(['properties']);
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE HIGHLIGHT
    |--------------------------------------------------------------------------
    */
    public function toggleHighlight(int|string $id)
    {
        $feature = $this->getById($id);

        $feature->update([
            'is_highlighted' => !$feature->is_highlighted,
        ]);

        return $feature->fresh(['properties']);
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */
    public function search(string $search, int $perPage = 15)
    {
        if (!$search) {
            return $this->getAll([], $perPage);
        }

        return $this->model
            ->search($search)
            ->with(['properties'])
            ->ordered()
            ->latest()
            ->paginate($perPage);
    }
}