<?php

namespace App\Http\Controllers\Api\Maintenance;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Maintenance\StoreMaintenanceCategoryRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceCategoryRequest;
use App\Http\Resources\MaintenanceCategoryResource;
use App\Models\MaintenanceCategory;
use App\Services\MaintenanceCategoryService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

class MaintenanceCategoryController extends Controller
{
    /**
     * Inject maintenance category service.
     */
    public function __construct(
        protected MaintenanceCategoryService $categoryService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | INDEX - RETRIEVE CATEGORIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve paginated maintenance categories.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', MaintenanceCategory::class);

            $perPage = (int) $request->query('per_page', 20);

            $filters = $request->only([
                'search',
                'name',
                'slug',
                'is_active',
                'has_requests',
                'date_from',
                'date_to',
                'sort_by',
                'sort_direction',
            ]);

            $categories = $this->categoryService->paginate(
                $perPage,
                $filters
            );

            $categories->through(
                fn (MaintenanceCategory $category) =>
                    (new MaintenanceCategoryResource($category))
                        ->resolve($request)
            );

            return ApiResponse::paginated(
                $categories,
                'Maintenance categories retrieved successfully.'
            );

        } catch (AuthorizationException $e) {
            return ApiResponse::forbidden(
                'You are not authorized to view maintenance categories.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to retrieve maintenance categories.', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to retrieve maintenance categories.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE - CREATE CATEGORY
    |--------------------------------------------------------------------------
    */

    /**
     * Create a maintenance category.
     */
    public function store(
        StoreMaintenanceCategoryRequest $request
    ): JsonResponse {
        try {
            $this->authorize('create', MaintenanceCategory::class);

            $category = $this->categoryService->create(
                $request->validated()
            );

            return ApiResponse::created(
                new MaintenanceCategoryResource($category),
                'Maintenance category created successfully.'
            );

        } catch (AuthorizationException $e) {
            return ApiResponse::forbidden(
                'You are not authorized to create maintenance categories.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Maintenance category validation failed.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to create maintenance category.', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to create maintenance category.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW - RETRIEVE SINGLE CATEGORY
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve a maintenance category by ID.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $category = $this->categoryService->find($id);

            $this->authorize('view', $category);

            return ApiResponse::success(
                new MaintenanceCategoryResource($category),
                'Maintenance category retrieved successfully.'
            );

        } catch (AuthorizationException $e) {
            return ApiResponse::forbidden(
                'You are not authorized to view this maintenance category.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::notFound(
                'Maintenance category not found.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to retrieve maintenance category.', [
                'category_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to retrieve maintenance category.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE - UPDATE CATEGORY
    |--------------------------------------------------------------------------
    */

    /**
     * Update a maintenance category.
     */
    public function update(
        UpdateMaintenanceCategoryRequest $request,
        int $id
    ): JsonResponse {
        try {
            $category = $this->categoryService->find($id);

            $this->authorize('update', $category);

            $updatedCategory = $this->categoryService->update(
                $id,
                $request->validated()
            );

            return ApiResponse::updated(
                new MaintenanceCategoryResource($updatedCategory),
                'Maintenance category updated successfully.'
            );

        } catch (AuthorizationException $e) {
            return ApiResponse::forbidden(
                'You are not authorized to update this maintenance category.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Maintenance category update failed.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to update maintenance category.', [
                'category_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to update maintenance category.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DESTROY - DELETE CATEGORY
    |--------------------------------------------------------------------------
    */

    /**
     * Delete a maintenance category.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $category = $this->categoryService->find($id);

            $this->authorize('delete', $category);

            $this->categoryService->delete($id);

            return ApiResponse::deleted(
                ['id' => $id],
                'Maintenance category deleted successfully.'
            );

        } catch (AuthorizationException $e) {
            return ApiResponse::forbidden(
                'You are not authorized to delete this maintenance category.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to delete maintenance category.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to delete maintenance category.', [
                'category_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to delete maintenance category.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE CATEGORIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve active maintenance categories.
     */
    public function active(): JsonResponse
    {
        try {
            $this->authorize('viewAny', MaintenanceCategory::class);

            $categories = $this->categoryService->active();

            return ApiResponse::collection(
                MaintenanceCategoryResource::collection($categories),
                'Active maintenance categories retrieved successfully.'
            );

        } catch (AuthorizationException $e) {
            return ApiResponse::forbidden(
                'You are not authorized to view maintenance categories.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to retrieve active maintenance categories.', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to retrieve active maintenance categories.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | INACTIVE CATEGORIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve inactive maintenance categories.
     */
    public function inactive(): JsonResponse
    {
        try {
            $this->authorize('viewAny', MaintenanceCategory::class);

            $categories = $this->categoryService->inactive();

            return ApiResponse::collection(
                MaintenanceCategoryResource::collection($categories),
                'Inactive maintenance categories retrieved successfully.'
            );

        } catch (AuthorizationException $e) {
            return ApiResponse::forbidden(
                'You are not authorized to view maintenance categories.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to retrieve inactive maintenance categories.', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to retrieve inactive maintenance categories.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE CATEGORY STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Activate or deactivate a maintenance category.
     */
    public function updateStatus(
        Request $request,
        int $id
    ): JsonResponse {
        try {
            $validated = $request->validate([
                'is_active' => ['required', 'boolean'],
            ]);

            $category = $this->categoryService->find($id);

            $this->authorize('updateStatus', $category);

            $updatedCategory = $this->categoryService->updateStatus(
                $id,
                (bool) $validated['is_active']
            );

            return ApiResponse::updated(
                new MaintenanceCategoryResource($updatedCategory),
                $updatedCategory->is_active
                    ? 'Maintenance category activated successfully.'
                    : 'Maintenance category deactivated successfully.'
            );

        } catch (AuthorizationException $e) {
            return ApiResponse::forbidden(
                'You are not authorized to change this category status.'
            );

        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Maintenance category status validation failed.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to update maintenance category status.', [
                'category_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to update maintenance category status.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve maintenance category statistics.
     */
    public function statistics(): JsonResponse
    {
        try {
            $this->authorize('statistics', MaintenanceCategory::class);

            $statistics = $this->categoryService->statistics();

            return ApiResponse::success(
                $statistics,
                'Maintenance category statistics retrieved successfully.'
            );

        } catch (AuthorizationException $e) {
            return ApiResponse::forbidden(
                'You are not authorized to view maintenance category statistics.'
            );

        } catch (Throwable $e) {
            Log::error('Failed to retrieve maintenance category statistics.', [
                'error' => $e->getMessage(),
            ]);

            return ApiResponse::serverError(
                'Failed to retrieve maintenance category statistics.'
            );
        }
    }
}
