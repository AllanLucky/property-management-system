<?php

namespace App\Services;

use Exception;
use App\Helpers\ApiResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Http\Resources\PropertyFeatureResource;
use App\Repositories\Interfaces\PropertyFeatureRepositoryInterface;

class PropertyFeatureService
{
    protected PropertyFeatureRepositoryInterface $repository;

    public function __construct(PropertyFeatureRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE INPUT (CLEAN & SAFE)
    |--------------------------------------------------------------------------
    */
    private function normalize(array $data): array
    {
        return [
            'name'           => $data['name'] ?? null,
            'slug'           => $data['slug'] ?? null,
            'value'          => $data['value'] ?? null,
            'type'           => $data['type'] ?? 'text',
            'icon'           => $data['icon'] ?? null,
            'description'    => $data['description'] ?? null,
            'is_active'      => $data['is_active'] ?? true,
            'is_highlighted' => $data['is_highlighted'] ?? false,
            'sort_order'     => $data['sort_order'] ?? 0,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */
    public function getAll(array $filters = [], int $perPage = 15)
    {
        try {
            $data = $this->repository->getAll($filters, $perPage);

            return ApiResponse::paginated(
                PropertyFeatureResource::collection($data),
                'Property features fetched successfully.'
            );

        } catch (Exception $e) {

            Log::error('PropertyFeature getAll failed', [
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::serverError('Failed to fetch property features.');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY ID
    |--------------------------------------------------------------------------
    */
    public function getById(int|string $id)
    {
        try {

            $feature = $this->repository->getById($id);

            return ApiResponse::success(
                new PropertyFeatureResource($feature),
                'Property feature fetched successfully.'
            );

        } catch (Exception $e) {

            Log::error('PropertyFeature getById failed', [
                'id' => $id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::notFound('Property feature not found.');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY SLUG
    |--------------------------------------------------------------------------
    */
    public function getBySlug(string $slug)
    {
        try {

            $feature = $this->repository->getBySlug($slug);

            return ApiResponse::success(
                new PropertyFeatureResource($feature),
                'Property feature fetched successfully.'
            );

        } catch (Exception $e) {

            Log::error('PropertyFeature getBySlug failed', [
                'slug' => $slug,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::notFound('Property feature not found.');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */
    public function create(array $data)
    {
        DB::beginTransaction();

        try {

            $data = $this->normalize($data);

            if (empty($data['name'])) {
                throw new Exception("Feature name is required.");
            }

            $feature = $this->repository->create($data);

            DB::commit();

            return ApiResponse::created(
                new PropertyFeatureResource($feature),
                'Property feature created successfully.'
            );

        } catch (Exception $e) {

            DB::rollBack();

            Log::error('PropertyFeature create failed', [
                'message' => $e->getMessage(),
                'data' => $data ?? [],
            ]);

            return ApiResponse::serverError(
                'Failed to create property feature.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    public function update(int|string $id, array $data)
    {
        DB::beginTransaction();

        try {

            $data = $this->normalize($data);

            if (empty($id)) {
                throw new Exception("Feature ID is required.");
            }

            $feature = $this->repository->update($id, $data);

            DB::commit();

            return ApiResponse::updated(
                new PropertyFeatureResource($feature),
                'Property feature updated successfully.'
            );

        } catch (Exception $e) {

            DB::rollBack();

            Log::error('PropertyFeature update failed', [
                'id' => $id,
                'message' => $e->getMessage(),
                'data' => $data ?? [],
            ]);

            return ApiResponse::serverError(
                'Failed to update property feature.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */
    public function delete(int|string $id)
    {
        DB::beginTransaction();

        try {

            $this->repository->delete($id);

            DB::commit();

            return ApiResponse::deleted('Property feature deleted successfully.');

        } catch (Exception $e) {

            DB::rollBack();

            Log::error('PropertyFeature delete failed', [
                'id' => $id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::serverError('Failed to delete property feature.');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */
    public function toggleStatus(int|string $id)
    {
        try {

            $feature = $this->repository->toggleStatus($id);

            return ApiResponse::updated(
                new PropertyFeatureResource($feature),
                'Status updated successfully.'
            );

        } catch (Exception $e) {

            Log::error('toggleStatus failed', [
                'id' => $id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::serverError('Failed to update status.');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE HIGHLIGHT
    |--------------------------------------------------------------------------
    */
    public function toggleHighlight(int|string $id)
    {
        try {

            $feature = $this->repository->toggleHighlight($id);

            return ApiResponse::updated(
                new PropertyFeatureResource($feature),
                'Highlight updated successfully.'
            );

        } catch (Exception $e) {

            Log::error('toggleHighlight failed', [
                'id' => $id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::serverError('Failed to update highlight.');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */
    public function search(string $search, int $perPage = 15)
    {
        try {

            $data = $this->repository->search($search, $perPage);

            return ApiResponse::paginated(
                PropertyFeatureResource::collection($data),
                'Search completed successfully.'
            );

        } catch (Exception $e) {

            Log::error('search failed', [
                'search' => $search,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::serverError('Search failed.');
        }
    }
}