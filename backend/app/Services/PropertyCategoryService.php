<?php

namespace App\Services;

use App\Models\Property;
use Illuminate\Support\Str;
use App\Services\ImageService;
use Illuminate\Http\UploadedFile;
use App\Repositories\Interfaces\PropertyCategoryInterface;

class PropertyCategoryService
{
    public function __construct(
        protected PropertyCategoryInterface $repository,
        protected ImageService $imageService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | GET ALL CATEGORIES
    |--------------------------------------------------------------------------
    */
    public function getAll(array $filters = [])
    {
        return $this->repository->getAll($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | GET SINGLE CATEGORY
    |--------------------------------------------------------------------------
    */
    public function getById(int $id)
    {
        return $this->repository->getById($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE CATEGORY
    |--------------------------------------------------------------------------
    */
    public function create(array $data)
    {
        $propertyIds = $data['property_ids'] ?? [];

        unset($data['property_ids']);

        if (empty($data['slug']) && !empty($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $data['status'] = $data['status'] ?? 'active';
        $data['is_featured'] = $data['is_featured'] ?? false;
        $data['show_in_homepage'] = $data['show_in_homepage'] ?? false;
        $data['is_popular'] = $data['is_popular'] ?? false;
        $data['views_count'] = 0;

        /*
        |--------------------------------------------------------------------------
        | CATEGORY IMAGE
        |--------------------------------------------------------------------------
        */
        if (
            isset($data['image']) &&
            $data['image'] instanceof UploadedFile
        ) {
            $upload = $this->imageService->upload(
                $data['image'],
                'property_categories'
            );

            $data['image_url'] = $upload['url'] ?? null;
            $data['image_public_id'] = $upload['public_id'] ?? null;

            unset($data['image']);
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE CATEGORY
        |--------------------------------------------------------------------------
        */
        $category = $this->repository->create($data);

        /*
        |--------------------------------------------------------------------------
        | ASSIGN SELECTED PROPERTIES
        |--------------------------------------------------------------------------
        */
        if (!empty($propertyIds)) {

            Property::whereIn('id', $propertyIds)
                ->update([
                    'property_category_id' => $category->id,
                ]);
        }

        return $category->fresh()->loadCount('properties');
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE CATEGORY
    |--------------------------------------------------------------------------
    */
    public function update(int $id, array $data)
    {
        /*
        |--------------------------------------------------------------------------
        | Detect Property Sync Request
        |--------------------------------------------------------------------------
        */
        $hasPropertyAssignments = array_key_exists(
            'property_ids',
            $data
        );

        $propertyIds = $data['property_ids'] ?? [];

        unset($data['property_ids']);

        /*
        |--------------------------------------------------------------------------
        | Auto Slug
        |--------------------------------------------------------------------------
        */
        if (!empty($data['name']) && empty($data['slug'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $category = $this->repository->getById($id);

        /*
        |--------------------------------------------------------------------------
        | REPLACE CATEGORY IMAGE
        |--------------------------------------------------------------------------
        */
        if (
            isset($data['image']) &&
            $data['image'] instanceof UploadedFile
        ) {
            $upload = $this->imageService->replace(
                $data['image'],
                $category->image_public_id,
                'property_categories'
            );

            $data['image_url'] = $upload['url'] ?? null;
            $data['image_public_id'] = $upload['public_id'] ?? null;

            unset($data['image']);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE CATEGORY
        |--------------------------------------------------------------------------
        */
        $this->repository->update($id, $data);

        /*
        |--------------------------------------------------------------------------
        | SYNC PROPERTIES ONLY IF FIELD EXISTS
        |--------------------------------------------------------------------------
        |
        | Prevents accidental removal of properties when
        | editing category name, status, image, SEO etc.
        |
        */
        if ($hasPropertyAssignments) {

            /*
            |--------------------------------------------------------------------------
            | Remove Existing Assignments
            |--------------------------------------------------------------------------
            */
            Property::where(
                'property_category_id',
                $id
            )->update([
                'property_category_id' => null,
            ]);

            /*
            |--------------------------------------------------------------------------
            | Assign New Properties
            |--------------------------------------------------------------------------
            */
            if (!empty($propertyIds)) {

                Property::whereIn(
                    'id',
                    $propertyIds
                )->update([
                    'property_category_id' => $id,
                ]);
            }
        }

        return $this->repository
            ->getById($id)
            ->loadCount('properties');
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE CATEGORY
    |--------------------------------------------------------------------------
    */
    public function delete(int $id)
    {
        $category = $this->repository->getById($id);

        if (!empty($category->image_public_id)) {
            $this->imageService->delete(
                $category->image_public_id
            );
        }

        return $this->repository->delete($id);
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE CATEGORY
    |--------------------------------------------------------------------------
    */
    public function restore(int $id)
    {
        return $this->repository->restore($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE CATEGORY
    |--------------------------------------------------------------------------
    */
    public function forceDelete(int $id)
    {
        $category = $this->repository->getById($id);

        if (!empty($category->image_public_id)) {
            $this->imageService->delete(
                $category->image_public_id
            );
        }

        return $this->repository->forceDelete($id);
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */
    public function toggleStatus(int $id)
    {
        return $this->repository->toggleStatus($id);
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE FEATURED
    |--------------------------------------------------------------------------
    */
    public function toggleFeatured(int $id)
    {
        return $this->repository->toggleFeatured($id);
    }

    /*
    |--------------------------------------------------------------------------
    | INCREMENT VIEWS
    |--------------------------------------------------------------------------
    */
    public function incrementViews(int $id)
    {
        return $this->repository->incrementViews($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FEATURED CATEGORIES
    |--------------------------------------------------------------------------
    */
    public function getFeatured(array $filters = [])
    {
        $filters['is_featured'] = true;

        return $this->repository->getAll($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE CATEGORIES
    |--------------------------------------------------------------------------
    */
    public function getActive(array $filters = [])
    {
        $filters['status'] = 'active';

        return $this->repository->getAll($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */
    public function search(string $keyword, array $filters = [])
    {
        $filters['search'] = $keyword;

        return $this->repository->getAll($filters);
    }
}