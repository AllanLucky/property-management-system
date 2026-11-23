<?php

namespace App\Services;

use App\Models\MaintenanceCategory;
use App\Repositories\Interfaces\MaintenanceCategoryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class MaintenanceCategoryService
{
    public function __construct(
        protected MaintenanceCategoryRepositoryInterface $categoryRepository
    ) {}

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all maintenance categories.
     */
    public function all(): Collection
    {
        return $this->categoryRepository->all();
    }

    /**
     * Retrieve paginated or filtered maintenance categories.
     */
    public function paginate(
        int $perPage = 20,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->categoryRepository->filter(
            $filters,
            $this->resolvePerPage($perPage)
        );
    }

    /**
     * Find a maintenance category by ID.
     *
     * @throws ValidationException
     */
    public function find(int $id): MaintenanceCategory
    {
        $category = $this->categoryRepository->find($id);

        if (!$category) {
            throw ValidationException::withMessages([
                'category' => ['Maintenance category not found.'],
            ]);
        }

        return $category;
    }

    /**
     * Find a maintenance category by slug.
     *
     * @throws ValidationException
     */
    public function findBySlug(string $slug): MaintenanceCategory
    {
        $category = $this->categoryRepository->findBySlug($slug);

        if (!$category) {
            throw ValidationException::withMessages([
                'slug' => ['Maintenance category not found.'],
            ]);
        }

        return $category;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE CATEGORY
    |--------------------------------------------------------------------------
    */

    /**
     * Create a maintenance category.
     *
     * @throws ValidationException
     */
    public function create(array $data): MaintenanceCategory
    {
        return DB::transaction(function () use ($data) {
            $name = trim($data['name']);

            if ($this->categoryRepository->existsByName($name)) {
                throw ValidationException::withMessages([
                    'name' => [
                        'A maintenance category with this name already exists.',
                    ],
                ]);
            }

            $slug = !empty($data['slug'])
                ? Str::slug(trim($data['slug']))
                : Str::slug($name);

            if (empty($slug)) {
                throw ValidationException::withMessages([
                    'slug' => [
                        'Unable to generate a valid slug for this category.',
                    ],
                ]);
            }

            if ($this->categoryRepository->existsBySlug($slug)) {
                throw ValidationException::withMessages([
                    'slug' => [
                        'A maintenance category with this slug already exists.',
                    ],
                ]);
            }

            $data['name'] = $name;
            $data['slug'] = $slug;
            $data['is_active'] = $data['is_active'] ?? true;

            return $this->categoryRepository->create($data);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE CATEGORY
    |--------------------------------------------------------------------------
    */

    /**
     * Update a maintenance category.
     *
     * @throws ValidationException
     */
    public function update(
        int $id,
        array $data
    ): MaintenanceCategory {
        return DB::transaction(function () use ($id, $data) {
            $category = $this->find($id);

            /*
            |--------------------------------------------------------------------------
            | VALIDATE CATEGORY NAME
            |--------------------------------------------------------------------------
            */

            $nameChanged = false;

            if (array_key_exists('name', $data)) {
                $data['name'] = trim($data['name']);

                $nameChanged = $data['name'] !== $category->name;

                if ($this->categoryRepository->existsByName(
                    $data['name'],
                    $id
                )) {
                    throw ValidationException::withMessages([
                        'name' => [
                            'A maintenance category with this name already exists.',
                        ],
                    ]);
                }
            }

            /*
            |--------------------------------------------------------------------------
            | VALIDATE AND GENERATE SLUG
            |--------------------------------------------------------------------------
            */

            if (
                array_key_exists('slug', $data) &&
                !empty($data['slug'])
            ) {
                $slug = Str::slug(trim($data['slug']));
            } elseif ($nameChanged) {
                $slug = Str::slug($data['name']);
            } else {
                $slug = $category->slug;
            }

            if (empty($slug)) {
                throw ValidationException::withMessages([
                    'slug' => [
                        'Unable to generate a valid slug for this category.',
                    ],
                ]);
            }

            if ($this->categoryRepository->existsBySlug($slug, $id)) {
                throw ValidationException::withMessages([
                    'slug' => [
                        'A maintenance category with this slug already exists.',
                    ],
                ]);
            }

            $data['slug'] = $slug;

            /*
            |--------------------------------------------------------------------------
            | SAVE CATEGORY
            |--------------------------------------------------------------------------
            */

            $updatedCategory = $this->categoryRepository->update(
                $id,
                $data
            );

            if (!$updatedCategory) {
                throw ValidationException::withMessages([
                    'category' => [
                        'Unable to update maintenance category.',
                    ],
                ]);
            }

            return $updatedCategory;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE CATEGORY
    |--------------------------------------------------------------------------
    */

    /**
     * Delete a maintenance category.
     *
     * Categories with existing maintenance requests cannot be deleted.
     *
     * @throws ValidationException
     */
    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $category = $this->find($id);

            if ($this->categoryRepository->hasRequests($category->id)) {
                throw ValidationException::withMessages([
                    'category' => [
                        'This maintenance category cannot be deleted because it has associated maintenance requests.',
                    ],
                ]);
            }

            $deleted = $this->categoryRepository->delete($id);

            if (!$deleted) {
                throw ValidationException::withMessages([
                    'category' => [
                        'Unable to delete maintenance category.',
                    ],
                ]);
            }

            return true;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CATEGORY STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve active categories.
     */
    public function active(): Collection
    {
        return $this->categoryRepository->active();
    }

    /**
     * Retrieve inactive categories.
     */
    public function inactive(): Collection
    {
        return $this->categoryRepository->inactive();
    }

    /**
     * Activate or deactivate a maintenance category.
     *
     * @throws ValidationException
     */
    public function updateStatus(
        int $id,
        bool $isActive
    ): MaintenanceCategory {
        $this->find($id);

        $category = $this->categoryRepository->updateStatus(
            $id,
            $isActive
        );

        if (!$category) {
            throw ValidationException::withMessages([
                'category' => [
                    'Unable to update maintenance category status.',
                ],
            ]);
        }

        return $category;
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve maintenance category statistics.
     */
    public function statistics(): array
    {
        return $this->categoryRepository->statistics();
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATION HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Resolve a safe pagination limit.
     */
    protected function resolvePerPage(int $perPage): int
    {
        return max(1, min($perPage, 100));
    }
}
