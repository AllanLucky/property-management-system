<?php

namespace App\Repositories\Eloquent;

use App\Models\PropertyCategory;
use App\Repositories\Interfaces\PropertyCategoryInterface;

class PropertyCategoryRepository implements PropertyCategoryInterface
{
    protected PropertyCategory $model;

    public function __construct(PropertyCategory $model)
    {
        $this->model = $model;
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */
    public function getAll(array $filters = [])
    {
        $query = $this->model->query()
            ->withCount('properties');

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['search'])) {

            $search = $filters['search'];

            $query->where(function ($q) use ($search) {

                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('slug', 'LIKE', "%{$search}%")
                    ->orWhere('description', 'LIKE', "%{$search}%")
                    ->orWhere('meta_title', 'LIKE', "%{$search}%")
                    ->orWhere('meta_keywords', 'LIKE', "%{$search}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | STATUS FILTER
        |--------------------------------------------------------------------------
        */
        if (!empty($filters['status'])) {

            $query->where('status', $filters['status']);
        }

        /*
        |--------------------------------------------------------------------------
        | FEATURED FILTER
        |--------------------------------------------------------------------------
        */
        if (isset($filters['is_featured'])) {

            $query->where('is_featured', (bool) $filters['is_featured']);
        }

        /*
        |--------------------------------------------------------------------------
        | SORTING
        |--------------------------------------------------------------------------
        */
        $sortBy = $filters['sort_by'] ?? 'latest';

        switch ($sortBy) {

            case 'oldest':
                $query->oldest();
                break;

            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;

            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;

            case 'popular':
                $query->orderBy('views_count', 'desc');
                break;

            case 'featured':
                $query->orderBy('is_featured', 'desc');
                break;

            default:
                $query->latest();
                break;
        }

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */
        $perPage = $filters['per_page'] ?? 10;

        return $query->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY ID
    |--------------------------------------------------------------------------
    */
    public function getById(int $id)
    {
        return $this->model
            ->withCount('properties')
            ->findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */
    public function create(array $data)
    {
        return $this->model->create($data);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    public function update(int $id, array $data)
    {
        $category = $this->getById($id);

        $category->update($data);

        return $category->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE (SOFT DELETE)
    |--------------------------------------------------------------------------
    */
    public function delete(int $id)
    {
        $category = $this->getById($id);

        return $category->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */
    public function restore(int $id)
    {
        $category = $this->model
            ->onlyTrashed()
            ->findOrFail($id);

        $category->restore();

        return $category->fresh();
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */
    public function forceDelete(int $id)
    {
        $category = $this->model
            ->onlyTrashed()
            ->findOrFail($id);

        return $category->forceDelete();
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */
    public function toggleStatus(int $id)
    {
        $category = $this->getById($id);

        $category->status =
            $category->status === 'active'
                ? 'inactive'
                : 'active';

        $category->save();

        return $category;
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE FEATURED
    |--------------------------------------------------------------------------
    */
    public function toggleFeatured(int $id)
    {
        $category = $this->getById($id);

        $category->is_featured = !$category->is_featured;

        $category->save();

        return $category;
    }

    /*
    |--------------------------------------------------------------------------
    | INCREMENT VIEWS
    |--------------------------------------------------------------------------
    */
    public function incrementViews(int $id)
    {
        $category = $this->getById($id);

        $category->increment('views_count');

        return $category;
    }
}