<?php

namespace App\Http\Controllers\Api\Location;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Location\StoreCountyRequest;
use App\Http\Requests\Location\UpdateCountyRequest;
use App\Http\Resources\CountyResource;
use App\Models\County;
use App\Services\CountyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class CountyController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | CONSTRUCTOR
    |--------------------------------------------------------------------------
    */

    public function __construct(
        protected CountyService $countyService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL COUNTIES
    |--------------------------------------------------------------------------
    |
    | GET /api/counties
    |
    */

    /**
     * Display paginated counties.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', County::class);

        try {
            $filters = request()->only([
                'search',
                'name',
                'slug',
                'code',
                'country_id',
                'region_id',
                'is_active',
                'date_from',
                'date_to',
                'sort_by',
                'sort_direction',
            ]);

            $perPage = (int) request()->input('per_page', 25);

            $counties = $this->countyService->getPaginatedCounties(
                $filters,
                $perPage
            );

            $counties->setCollection(
                CountyResource::collection(
                    $counties->getCollection()
                )->collection
            );

            return ApiResponse::paginated(
                $counties,
                'Counties fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch counties.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET ACTIVE COUNTIES
    |--------------------------------------------------------------------------
    |
    | GET /api/counties/active
    |
    */

    /**
     * Display all active counties.
     */
    public function active(): JsonResponse
    {
        $this->authorize('viewAny', County::class);

        try {
            $filters = request()->only([
                'search',
                'country_id',
                'region_id',
                'sort_by',
                'sort_direction',
            ]);

            $counties = $this->countyService
                ->getActiveCounties($filters);

            return ApiResponse::collection(
                CountyResource::collection($counties),
                'Active counties fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch active counties.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET INACTIVE COUNTIES
    |--------------------------------------------------------------------------
    |
    | GET /api/counties/inactive
    |
    */

    /**
     * Display all inactive counties.
     */
    public function inactive(): JsonResponse
    {
        $this->authorize('viewAny', County::class);

        try {
            $filters = request()->only([
                'search',
                'country_id',
                'region_id',
                'sort_by',
                'sort_direction',
            ]);

            $counties = $this->countyService
                ->getInactiveCounties($filters);

            return ApiResponse::collection(
                CountyResource::collection($counties),
                'Inactive counties fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch inactive counties.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTY STATISTICS
    |--------------------------------------------------------------------------
    |
    | GET /api/counties/statistics
    |
    */

    /**
     * Display county statistics.
     */
    public function statistics(): JsonResponse
    {
        $this->authorize('statistics', County::class);

        try {
            $filters = request()->only([
                'country_id',
                'region_id',
                'date_from',
                'date_to',
            ]);

            $statistics = $this->countyService
                ->getStatistics($filters);

            return ApiResponse::success(
                $statistics,
                'County statistics fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch county statistics.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET COUNTIES BY COUNTRY
    |--------------------------------------------------------------------------
    |
    | GET /api/counties/country/{country}
    |
    */

    /**
     * Display counties belonging to a country.
     */
    public function byCountry(int $country): JsonResponse
    {
        $this->authorize('viewAny', County::class);

        try {
            $counties = $this->countyService
                ->getCountiesByCountry($country);

            return ApiResponse::collection(
                CountyResource::collection($counties),
                'Country counties fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch country counties.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET COUNTIES BY REGION
    |--------------------------------------------------------------------------
    |
    | GET /api/counties/region/{region}
    |
    */

    /**
     * Display counties belonging to a region.
     */
    public function byRegion(int $region): JsonResponse
    {
        $this->authorize('viewAny', County::class);

        try {
            $counties = $this->countyService
                ->getCountiesByRegion($region);

            return ApiResponse::collection(
                CountyResource::collection($counties),
                'Region counties fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch region counties.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH COUNTIES
    |--------------------------------------------------------------------------
    |
    | GET /api/counties/search
    |
    */

    /**
     * Search counties.
     */
    public function search(): JsonResponse
    {
        $this->authorize('viewAny', County::class);

        try {
            $search = trim(
                request()->input('search', '')
            );

            $counties = $this->countyService
                ->searchCounties($search);

            return ApiResponse::collection(
                CountyResource::collection($counties),
                'County search completed successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to search counties.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET SINGLE COUNTY
    |--------------------------------------------------------------------------
    |
    | GET /api/counties/{county}
    |
    */

    /**
     * Display a single county.
     */
    public function show(int $county): JsonResponse
    {
        try {
            $county = $this->countyService
                ->getCountyById($county);

            $this->authorize('view', $county);

            return ApiResponse::success(
                new CountyResource($county),
                'County fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTY
    |--------------------------------------------------------------------------
    |
    | POST /api/counties
    |
    */

    /**
     * Store a newly created county.
     */
    public function store(
        StoreCountyRequest $request
    ): JsonResponse {
        try {
            $county = $this->countyService->createCounty(
                $request->validated()
            );

            return ApiResponse::created(
                new CountyResource($county),
                'County created successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to create county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTY
    |--------------------------------------------------------------------------
    |
    | PUT/PATCH /api/counties/{county}
    |
    */

    /**
     * Update an existing county.
     */
    public function update(
        UpdateCountyRequest $request,
        int $county
    ): JsonResponse {
        try {
            $existingCounty = $this->countyService
                ->getCountyById($county);

            $this->authorize('update', $existingCounty);

            $updatedCounty = $this->countyService->updateCounty(
                $existingCounty->id,
                $request->validated()
            );

            return ApiResponse::updated(
                new CountyResource($updatedCounty),
                'County updated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to update county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE COUNTY
    |--------------------------------------------------------------------------
    |
    | DELETE /api/counties/{county}
    |
    */

    /**
     * Soft delete a county.
     */
    public function destroy(int $county): JsonResponse
    {
        try {
            $existingCounty = $this->countyService
                ->getCountyById($county);

            $this->authorize('delete', $existingCounty);

            $this->countyService->deleteCounty(
                $existingCounty->id
            );

            return ApiResponse::deleted(
                [
                    'id' => $existingCounty->id,
                    'name' => $existingCounty->name,
                    'slug' => $existingCounty->slug,
                    'deleted' => true,
                ],
                'County deleted successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to delete county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE COUNTY
    |--------------------------------------------------------------------------
    |
    | PATCH /api/counties/{county}/activate
    |
    */

    /**
     * Activate a county.
     */
    public function activate(int $county): JsonResponse
    {
        try {
            $existingCounty = $this->countyService
                ->getCountyById($county);

            $this->authorize('activate', $existingCounty);

            $updatedCounty = $this->countyService
                ->activateCounty($existingCounty->id);

            return ApiResponse::updated(
                new CountyResource($updatedCounty),
                'County activated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to activate county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE COUNTY
    |--------------------------------------------------------------------------
    |
    | PATCH /api/counties/{county}/deactivate
    |
    */

    /**
     * Deactivate a county.
     */
    public function deactivate(int $county): JsonResponse
    {
        try {
            $existingCounty = $this->countyService
                ->getCountyById($county);

            $this->authorize('deactivate', $existingCounty);

            $updatedCounty = $this->countyService
                ->deactivateCounty($existingCounty->id);

            return ApiResponse::updated(
                new CountyResource($updatedCounty),
                'County deactivated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to deactivate county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE COUNTY STATUS
    |--------------------------------------------------------------------------
    |
    | PATCH /api/counties/{county}/toggle-status
    |
    */

    /**
     * Toggle county active status.
     */
    public function toggleStatus(int $county): JsonResponse
    {
        try {
            $existingCounty = $this->countyService
                ->getCountyById($county);

            /*
             * Authorize according to the current status.
             */

            if ($existingCounty->is_active) {
                $this->authorize('deactivate', $existingCounty);
            } else {
                $this->authorize('activate', $existingCounty);
            }

            $updatedCounty = $this->countyService
                ->toggleCountyStatus($existingCounty->id);

            return ApiResponse::updated(
                new CountyResource($updatedCounty),
                $updatedCounty->is_active
                    ? 'County activated successfully.'
                    : 'County deactivated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to change county status.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TRASHED COUNTIES
    |--------------------------------------------------------------------------
    |
    | GET /api/counties/trashed
    |
    */

    /**
     * Display paginated soft-deleted counties.
     */
    public function trashed(): JsonResponse
    {
        $this->authorize('viewAny', County::class);

        try {
            $filters = request()->only([
                'search',
                'country_id',
                'region_id',
                'sort_by',
                'sort_direction',
                'per_page',
            ]);

            $counties = $this->countyService
                ->getTrashedCounties($filters);

            $counties->setCollection(
                CountyResource::collection(
                    $counties->getCollection()
                )->collection
            );

            return ApiResponse::paginated(
                $counties,
                'Trashed counties fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch trashed counties.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW TRASHED COUNTY
    |--------------------------------------------------------------------------
    |
    | GET /api/counties/trashed/{county}
    |
    */

    /**
     * Display a soft-deleted county.
     */
    public function showTrashed(int $county): JsonResponse
    {
        try {
            $trashedCounty = $this->countyService
                ->getCountyByTrashedId($county);

            $this->authorize('restore', $trashedCounty);

            return ApiResponse::success(
                new CountyResource($trashedCounty),
                'Trashed county fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch trashed county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE COUNTY
    |--------------------------------------------------------------------------
    |
    | POST /api/counties/{county}/restore
    |
    */

    /**
     * Restore a soft-deleted county.
     */
    public function restore(int $county): JsonResponse
    {
        try {
            $trashedCounty = $this->countyService
                ->getCountyByTrashedId($county);

            $this->authorize('restore', $trashedCounty);

            $restoredCounty = $this->countyService
                ->restoreCounty($trashedCounty->id);

            return ApiResponse::updated(
                new CountyResource($restoredCounty),
                'County restored successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to restore county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE COUNTY
    |--------------------------------------------------------------------------
    |
    | DELETE /api/counties/{county}/force-delete
    |
    */

    /**
     * Permanently delete a county.
     */
    public function forceDelete(int $county): JsonResponse
    {
        try {
            $trashedCounty = $this->countyService
                ->getCountyByTrashedId($county);

            $this->authorize('forceDelete', $trashedCounty);

            $this->countyService->forceDeleteCounty(
                $trashedCounty->id
            );

            return ApiResponse::deleted(
                [
                    'id' => $trashedCounty->id,
                    'name' => $trashedCounty->name,
                    'permanently_deleted' => true,
                ],
                'County permanently deleted successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to permanently delete county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EXCEPTION HANDLER
    |--------------------------------------------------------------------------
    */

    /**
     * Convert exceptions into standardized API responses.
     */
    protected function handleException(
        Throwable $e,
        string $fallbackMessage
    ): JsonResponse {

        /*
        |--------------------------------------------------------------------------
        | VALIDATION ERRORS
        |--------------------------------------------------------------------------
        */

        if ($e instanceof ValidationException) {
            return ApiResponse::validation(
                $e->errors(),
                $e->getMessage() ?: 'County validation failed.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | MODEL NOT FOUND
        |--------------------------------------------------------------------------
        */

        if (
            $e instanceof ModelNotFoundException
            || $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException
        ) {
            return ApiResponse::notFound(
                'County not found.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | HTTP EXCEPTIONS
        |--------------------------------------------------------------------------
        */

        if ($e instanceof HttpExceptionInterface) {
            $statusCode = $e->getStatusCode();

            $message = $e->getMessage() ?: $fallbackMessage;

            if ($statusCode === 404) {
                return ApiResponse::notFound($message);
            }

            if ($statusCode === 403) {
                return ApiResponse::forbidden($message);
            }

            return ApiResponse::error(
                $message,
                null,
                $statusCode
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UNEXPECTED ERRORS
        |--------------------------------------------------------------------------
        */

        report($e);

        return ApiResponse::serverError(
            $fallbackMessage,
            config('app.debug')
                ? [
                    'exception' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
                : null
        );
    }
}
