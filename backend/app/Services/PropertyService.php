<?php

namespace App\Services;

use App\Models\Property;
use App\Events\PropertyAssigned;
use App\Repositories\Interfaces\PropertyRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Http\UploadedFile;
use Exception;

class PropertyService
{
    public function __construct(
        protected PropertyRepositoryInterface $propertyRepository,
        protected ImageService $imageService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */
    public function getAll(): Collection
    {
        try {
            return collect($this->propertyRepository->all() ?? []);
        } catch (Exception $e) {
            Log::error("PropertyService@getAll failed", [
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET WITH RELATIONS
    |--------------------------------------------------------------------------
    */
    public function getAllWithRelations(): Collection
    {
        try {
            return collect($this->propertyRepository->allWithRelations() ?? []);
        } catch (Exception $e) {
            Log::error("PropertyService@getAllWithRelations FAILED", [
                'message' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY ID
    |--------------------------------------------------------------------------
    */
    public function getById(int $id): ?Property
    {
        return $this->propertyRepository->find($id);
    }

    public function getByIdWithRelations(int $id): ?Property
    {
        return $this->propertyRepository->findWithRelations($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PROPERTY
    |--------------------------------------------------------------------------
    */
    public function create(array $data): Property
    {
        return DB::transaction(function () use ($data) {

            if (empty($data['user_id']) && auth()->check()) {
                $data['user_id'] = auth()->id();
            }

            $data['status'] = $data['status'] ?? 'published';

            if (empty($data['property_category_id'])) {
                throw new Exception("Property category is required");
            }

            if (!empty($data['title'])) {
                $data['title'] = Str::title(trim($data['title']));
            }

            if (empty($data['slug']) && !empty($data['title'])) {
                $data['slug'] = Str::slug($data['title']);
            }

            /*
            |--------------------------------------------------------------------------
            | IMAGE UPLOAD (FIXED - SUPPORTS NEW "image" FIELD)
            |--------------------------------------------------------------------------
            */
            if (isset($data['cover_image']) && $data['cover_image'] instanceof UploadedFile) {

                $upload = $this->imageService->upload(
                    $data['cover_image'],
                    'properties'
                );

                if (empty($upload['url'])) {
                    throw new Exception("Image upload failed");
                }

                // NEW SYSTEM
                $data['image'] = $upload['url'];

                // BACKWARD COMPATIBILITY
                $data['thumbnail'] = $upload['url'];
                $data['thumbnail_public_id'] = $upload['public_id'] ?? null;

                unset($data['cover_image']);
            }

            $property = $this->propertyRepository->create($data);

            if (!$property instanceof Property) {
                throw new Exception("Property creation failed");
            }

            event(new PropertyAssigned($property));

            return $property;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROPERTY
    |--------------------------------------------------------------------------
    */
    public function update(int $id, array $data): Property
    {
        return DB::transaction(function () use ($id, $data) {

            $property = $this->propertyRepository->find($id);

            if (!$property instanceof Property) {
                throw new Exception("Property not found");
            }

            if (!empty($data['title'])) {
                $data['title'] = Str::title(trim($data['title']));
            }

            if (!empty($data['title']) && empty($data['slug'])) {
                $data['slug'] = Str::slug($data['title']);
            }

            /*
            |--------------------------------------------------------------------------
            | IMAGE REPLACEMENT (SAFE)
            |--------------------------------------------------------------------------
            */
            if (isset($data['cover_image']) && $data['cover_image'] instanceof UploadedFile) {

                $upload = $this->imageService->replace(
                    $data['cover_image'],
                    $property->thumbnail_public_id,
                    'properties'
                );

                // NEW FIELD
                $data['image'] = $upload['url'] ?? null;

                // BACKWARD COMPATIBILITY
                $data['thumbnail'] = $upload['url'] ?? null;
                $data['thumbnail_public_id'] = $upload['public_id'] ?? null;

                unset($data['cover_image']);
            }

            $updated = $this->propertyRepository->update($id, $data);

            if (!$updated instanceof Property) {
                throw new Exception("Update failed");
            }

            return $updated;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE PROPERTY
    |--------------------------------------------------------------------------
    */
    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $property = $this->propertyRepository->find($id);

            if (!$property instanceof Property) {
                return false;
            }

            if ($property->thumbnail_public_id) {
                $this->imageService->delete($property->thumbnail_public_id);
            }

            return $this->propertyRepository->delete($id);
        });
    }
}