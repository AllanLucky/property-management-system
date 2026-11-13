<?php

namespace App\Http\Controllers\Api\Location;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Location\StoreRegionRequest;
use App\Http\Requests\Location\UpdateRegionRequest;
use App\Http\Resources\RegionResource;
use App\Models\Region;
use App\Services\RegionService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class RegionController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | CONSTRUCTOR
    |--------------------------------------------------------------------------
    */

    protected RegionService $regionService;

    public function __construct(RegionService $regionService)
    {
        $this->regionService = $regionService;
    }

    /*
    |--------------------------------------------------------------------------
    | RESOLVE REGION BY ID OR SLUG
    |--------------------------------------------------------------------------
    */

    protected function resolveRegion(string $identifier): Region
    {
        $region = is_numeric($identifier)
            ? $this->regionService->findById((int) $identifier)
            : $this->regionService->findBySlug($identifier);

        if (!$region) {
            throw (new ModelNotFoundException())
                ->setModel(Region::class, [$identifier]);
        }

        return $region;
    }

    /*
    |--------------------------------------------------------------------------
    | CLEAN REGION FILTERS
    |--------------------------------------------------------------------------
    */

    protected function cleanFilters(array $filters): array
    {
        $cleaned = [];

        foreach ($filters as $key => $value) {

            // Ignore empty values.
            if ($value === null || $value === '') {
                continue;
            }

            // Normalize boolean filters.
            if ($key === 'is_active') {
                $cleaned[$key] = filter_var(
                    $value,
                    FILTER_VALIDATE_BOOLEAN
                );

                continue;
            }

            // Normalize numeric filters.
            if ($key === 'country_id') {
                $cleaned[$key] = (int) $value;

                continue;
            }

            $cleaned[$key] = is_string($value)
                ? trim($value)
                : $value;
        }

        return $cleaned;
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL REGIONS
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', Region::class);

            $validated = $request->validate([
                'per_page' => [
                    'sometimes',
                    'integer',
                    'min:1',
                    'max:100',
                ],

                'country_id' => [
                    'sometimes',
                    'nullable',
                    'integer',
                    'exists:countries,id',
                ],

                'search' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:150',
                ],

                'code' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:10',
                ],

                'name' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:100',
                ],

                'is_active' => [
                    'sometimes',
                    'nullable',
                    'boolean',
                ],

                'status' => [
                    'sometimes',
                    'nullable',
                    'in:active,inactive',
                ],

                'date_from' => [
                    'sometimes',
                    'nullable',
                    'date',
                ],

                'date_to' => [
                    'sometimes',
                    'nullable',
                    'date',
                    'after_or_equal:date_from',
                ],

                'sort_by' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'in:id,name,code,created_at,updated_at',
                ],

                'sort_direction' => [
                    'sometimes',
                    'nullable',
                    'in:asc,desc',
                ],
            ]);

            $perPage = (int) ($validated['per_page'] ?? 25);

            unset($validated['per_page']);

            $filters = $this->cleanFilters($validated);

            /*
            |--------------------------------------------------------------------------
            | FETCH REGIONS
            |--------------------------------------------------------------------------
            */

            $regions = $this->regionService->paginate(
                $perPage,
                $filters
            );

            /*
            |--------------------------------------------------------------------------
            | DEBUG LOG
            |--------------------------------------------------------------------------
            */

            \Log::info('REGION INDEX PAGINATION', [
                'request_query' => $request->query(),
                'filters' => $filters,
                'per_page' => $perPage,
                'total' => $regions->total(),
                'count' => $regions->count(),
                'region_ids' => $regions->getCollection()
                    ->pluck('id')
                    ->values()
                    ->toArray(),
            ]);

            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

            return ApiResponse::paginated(
                RegionResource::collection($regions),
                'Regions retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve regions.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET ACTIVE REGIONS
    |--------------------------------------------------------------------------
    */

    public function active(): JsonResponse
    {
        try {
            $this->authorize('viewAny', Region::class);

            $regions = $this->regionService->getActive();

            return ApiResponse::collection(
                RegionResource::collection($regions),
                'Active regions retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve active regions.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET INACTIVE REGIONS
    |--------------------------------------------------------------------------
    */

    public function inactive(): JsonResponse
    {
        try {
            $this->authorize('viewAny', Region::class);

            $regions = $this->regionService->all([
                'is_active' => false,
            ]);

            return ApiResponse::collection(
                RegionResource::collection($regions),
                'Inactive regions retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve inactive regions.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET REGION STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(Request $request): JsonResponse
    {
        try {
            $this->authorize('statistics', Region::class);

            $validated = $request->validate([
                'country_id' => [
                    'sometimes',
                    'nullable',
                    'integer',
                    'exists:countries,id',
                ],

                'search' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:150',
                ],

                'date_from' => [
                    'sometimes',
                    'nullable',
                    'date',
                ],

                'date_to' => [
                    'sometimes',
                    'nullable',
                    'date',
                    'after_or_equal:date_from',
                ],
            ]);

            $filters = $this->cleanFilters($validated);

            $statistics = $this->regionService->statistics($filters);

            return ApiResponse::success(
                $statistics,
                'Region statistics retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve region statistics.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET REGION REPORTS
    |--------------------------------------------------------------------------
    */

    public function reports(Request $request): JsonResponse
    {
        try {
            $this->authorize('reports', Region::class);

            $validated = $request->validate([
                'search' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'max:150',
                ],

                'country_id' => [
                    'sometimes',
                    'nullable',
                    'integer',
                    'exists:countries,id',
                ],

                'is_active' => [
                    'sometimes',
                    'nullable',
                    'boolean',
                ],

                'status' => [
                    'sometimes',
                    'nullable',
                    'in:active,inactive',
                ],

                'date_from' => [
                    'sometimes',
                    'nullable',
                    'date',
                ],

                'date_to' => [
                    'sometimes',
                    'nullable',
                    'date',
                    'after_or_equal:date_from',
                ],

                'sort_by' => [
                    'sometimes',
                    'nullable',
                    'in:id,name,code,created_at,updated_at',
                ],

                'sort_direction' => [
                    'sometimes',
                    'nullable',
                    'in:asc,desc',
                ],
            ]);

            $filters = $this->cleanFilters($validated);

            $reports = $this->regionService->reports($filters);

            if (isset($reports['regions'])) {
                $reports['regions'] = RegionResource::collection(
                    $reports['regions']
                );
            }

            return ApiResponse::success(
                $reports,
                'Region reports retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to generate region reports.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET REGIONS BY COUNTRY
    |--------------------------------------------------------------------------
    */

    public function byCountry(int $countryId): JsonResponse
    {
        try {
            $this->authorize('viewAny', Region::class);

            $regions = $this->regionService->getByCountry($countryId);

            return ApiResponse::collection(
                RegionResource::collection($regions),
                'Regions retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve regions for the selected country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH REGIONS
    |--------------------------------------------------------------------------
    */

    public function search(Request $request): JsonResponse
    {
        try {
            $this->authorize('viewAny', Region::class);

            $validated = $request->validate([
                'search' => [
                    'required',
                    'string',
                    'min:1',
                    'max:150',
                ],

                'per_page' => [
                    'sometimes',
                    'integer',
                    'min:1',
                    'max:100',
                ],

                'country_id' => [
                    'sometimes',
                    'nullable',
                    'integer',
                    'exists:countries,id',
                ],

                'is_active' => [
                    'sometimes',
                    'nullable',
                    'boolean',
                ],

                'sort_by' => [
                    'sometimes',
                    'nullable',
                    'in:id,name,code,created_at,updated_at',
                ],

                'sort_direction' => [
                    'sometimes',
                    'nullable',
                    'in:asc,desc',
                ],
            ]);

            $perPage = (int) ($validated['per_page'] ?? 25);

            unset($validated['per_page']);

            $filters = $this->cleanFilters($validated);

            $regions = $this->regionService->paginate(
                $perPage,
                $filters
            );

            return ApiResponse::paginated(
                RegionResource::collection($regions),
                'Region search completed successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to search regions.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW REGION BY ID OR SLUG
    |--------------------------------------------------------------------------
    */

    public function show(string $region): JsonResponse
    {
        try {
            $region = $this->resolveRegion($region);

            $this->authorize('view', $region);

            return ApiResponse::success(
                new RegionResource($region),
                'Region retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve region.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE REGION
    |--------------------------------------------------------------------------
    */

    public function store(StoreRegionRequest $request): JsonResponse
    {
        try {
            $region = $this->regionService->create(
                $request->validatedData()
            );

            return ApiResponse::created(
                new RegionResource($region),
                'Region created successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to create region.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE REGION BY ID OR SLUG
    |--------------------------------------------------------------------------
    */

    public function update(
        UpdateRegionRequest $request,
        string $region
    ): JsonResponse {
        try {
            $region = $this->resolveRegion($region);

            $this->authorize('update', $region);

            $updatedRegion = $this->regionService->update(
                $region->id,
                $request->validatedData()
            );

            if (!$updatedRegion) {
                throw (new ModelNotFoundException())
                    ->setModel(Region::class, [$region->id]);
            }

            return ApiResponse::updated(
                new RegionResource($updatedRegion),
                'Region updated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to update region.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE REGION BY ID OR SLUG
    |--------------------------------------------------------------------------
    */

    public function destroy(string $region): JsonResponse
    {
        try {
            $region = $this->resolveRegion($region);

            $this->authorize('delete', $region);

            $deleted = $this->regionService->delete($region->id);

            if (!$deleted) {
                return ApiResponse::error(
                    'Unable to delete region. It may have associated counties.',
                    null,
                    409
                );
            }

            return ApiResponse::deleted(
                null,
                'Region deleted successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to delete region.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE REGION
    |--------------------------------------------------------------------------
    */

    public function forceDelete(string $region): JsonResponse
    {
        try {
            $region = $this->resolveRegion($region);

            $this->authorize('delete', $region);

            $deleted = $this->regionService->forceDelete(
                $region->id
            );

            if (!$deleted) {
                return ApiResponse::error(
                    'Unable to permanently delete region. It may have associated counties.',
                    null,
                    409
                );
            }

            return ApiResponse::deleted(
                null,
                'Region permanently deleted successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to permanently delete region.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE REGION
    |--------------------------------------------------------------------------
    */

    public function activate(string $region): JsonResponse
    {
        try {
            $region = $this->resolveRegion($region);

            $this->authorize('activate', $region);

            $updatedRegion = $this->regionService->activate(
                $region->id
            );

            if (!$updatedRegion) {
                throw (new ModelNotFoundException())
                    ->setModel(Region::class, [$region->id]);
            }

            return ApiResponse::updated(
                new RegionResource($updatedRegion),
                'Region activated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to activate region.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE REGION
    |--------------------------------------------------------------------------
    */

    public function deactivate(string $region): JsonResponse
    {
        try {
            $region = $this->resolveRegion($region);

            $this->authorize('deactivate', $region);

            $updatedRegion = $this->regionService->deactivate(
                $region->id
            );

            if (!$updatedRegion) {
                throw (new ModelNotFoundException())
                    ->setModel(Region::class, [$region->id]);
            }

            return ApiResponse::updated(
                new RegionResource($updatedRegion),
                'Region deactivated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to deactivate region.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE REGION STATUS
    |--------------------------------------------------------------------------
    */

    public function toggleStatus(string $region): JsonResponse
    {
        try {
            $region = $this->resolveRegion($region);

            $this->authorize('toggleStatus', $region);

            $updatedRegion = $this->regionService->toggleStatus(
                $region->id
            );

            if (!$updatedRegion) {
                throw (new ModelNotFoundException())
                    ->setModel(Region::class, [$region->id]);
            }

            $message = $updatedRegion->is_active
                ? 'Region activated successfully.'
                : 'Region deactivated successfully.';

            return ApiResponse::updated(
                new RegionResource($updatedRegion),
                $message
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to change region status.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | HANDLE EXCEPTIONS
    |--------------------------------------------------------------------------
    */

    protected function handleException(
        Throwable $e,
        string $fallbackMessage
    ): JsonResponse {

        if ($e instanceof ValidationException) {
            return ApiResponse::validation(
                $e->errors(),
                'The given data was invalid.'
            );
        }

        if ($e instanceof ModelNotFoundException) {
            return ApiResponse::notFound(
                'Region not found.'
            );
        }

        if ($e instanceof AuthorizationException) {
            return ApiResponse::forbidden(
                'You are not authorized to perform this action.'
            );
        }

        if ($e instanceof HttpExceptionInterface) {
            $statusCode = $e->getStatusCode();

            if ($statusCode === 404) {
                return ApiResponse::notFound(
                    'Region not found.'
                );
            }

            if ($statusCode === 403) {
                return ApiResponse::forbidden(
                    'You are not authorized to perform this action.'
                );
            }

            return ApiResponse::error(
                $e->getMessage() ?: $fallbackMessage,
                null,
                $statusCode
            );
        }

        report($e);

        $debugData = config('app.debug')
            ? [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]
            : null;

        return ApiResponse::serverError(
            $fallbackMessage,
            $debugData
        );
    }
}
