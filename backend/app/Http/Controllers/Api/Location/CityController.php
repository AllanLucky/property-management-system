<?php

namespace App\Http\Controllers\Api\Location;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\City;
use App\Services\CityService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class CityController extends Controller
{
    public function __construct(
        protected CityService $cityService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL CITIES
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'search',
                'name',
                'slug',
                'code',
                'country_id',
                'region_id',
                'county_id',
                'is_active',
                'status',
                'date_from',
                'date_to',
                'sort_by',
                'sort_direction',
            ]);

            $perPage = (int) $request->input('per_page', 25);

            $cities = $this->cityService->paginate(
                $perPage,
                $filters
            );

            return ApiResponse::paginated(
                $cities,
                'Cities retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve cities.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL CITIES WITHOUT PAGINATION
    |--------------------------------------------------------------------------
    */

    public function all(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'search',
                'name',
                'slug',
                'code',
                'country_id',
                'region_id',
                'county_id',
                'is_active',
                'status',
                'date_from',
                'date_to',
                'sort_by',
                'sort_direction',
            ]);

            $cities = $this->cityService->all($filters);

            return ApiResponse::collection(
                $cities,
                'Cities retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve cities.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET CITY STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'country_id',
                'region_id',
                'county_id',
                'date_from',
                'date_to',
            ]);

            $statistics = $this->cityService->statistics($filters);

            return ApiResponse::success(
                $statistics,
                'City statistics retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve city statistics.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET CITY REPORTS
    |--------------------------------------------------------------------------
    */

    public function reports(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'country_id',
                'region_id',
                'county_id',
                'is_active',
                'date_from',
                'date_to',
            ]);

            $reports = $this->cityService->reports($filters);

            return ApiResponse::success(
                $reports,
                'City reports retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to generate city reports.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET ACTIVE CITIES
    |--------------------------------------------------------------------------
    */

    public function active(): JsonResponse
    {
        try {
            $cities = $this->cityService->getActive();

            return ApiResponse::collection(
                $cities,
                'Active cities retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve active cities.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET INACTIVE CITIES
    |--------------------------------------------------------------------------
    */

    public function inactive(): JsonResponse
    {
        try {
            $cities = $this->cityService->getInactive();

            return ApiResponse::collection(
                $cities,
                'Inactive cities retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve inactive cities.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET CITIES BY COUNTRY
    |--------------------------------------------------------------------------
    */

    public function byCountry(int $countryId): JsonResponse
    {
        try {
            $cities = $this->cityService->getByCountry($countryId);

            return ApiResponse::collection(
                $cities,
                'Cities retrieved successfully for the selected country.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve cities by country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET CITIES BY REGION
    |--------------------------------------------------------------------------
    */

    public function byRegion(int $regionId): JsonResponse
    {
        try {
            $cities = $this->cityService->getByRegion($regionId);

            return ApiResponse::collection(
                $cities,
                'Cities retrieved successfully for the selected region.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve cities by region.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET CITIES BY COUNTY
    |--------------------------------------------------------------------------
    */

    public function byCounty(int $countyId): JsonResponse
    {
        try {
            $cities = $this->cityService->getByCounty($countyId);

            return ApiResponse::collection(
                $cities,
                'Cities retrieved successfully for the selected county.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve cities by county.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW CITY BY ID
    |--------------------------------------------------------------------------
    */

    public function show(int $id): JsonResponse
    {
        try {
            $city = $this->cityService->findById($id);

            return ApiResponse::success(
                $city,
                'City retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW CITY BY SLUG
    |--------------------------------------------------------------------------
    */

    public function showBySlug(string $slug): JsonResponse
    {
        try {
            $city = $this->cityService->findBySlug($slug);

            return ApiResponse::success(
                $city,
                'City retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW CITY BY CODE
    |--------------------------------------------------------------------------
    */

    public function showByCode(string $code): JsonResponse
    {
        try {
            $city = $this->cityService->findByCode($code);

            return ApiResponse::success(
                $city,
                'City retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE CITY
    |--------------------------------------------------------------------------
    */

    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'country_id' => [
                    'required',
                    'integer',
                    'exists:countries,id',
                ],
                'region_id' => [
                    'required',
                    'integer',
                    'exists:regions,id',
                ],
                'county_id' => [
                    'required',
                    'integer',
                    'exists:counties,id',
                ],
                'name' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                ],
                'is_active' => [
                    'sometimes',
                    'boolean',
                ],
            ]);

            $city = $this->cityService->create($validated);

            return ApiResponse::created(
                $city,
                'City created successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to create city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE CITY
    |--------------------------------------------------------------------------
    */

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validated = $request->validate([
                'country_id' => [
                    'sometimes',
                    'required',
                    'integer',
                    'exists:countries,id',
                ],
                'region_id' => [
                    'sometimes',
                    'required',
                    'integer',
                    'exists:regions,id',
                ],
                'county_id' => [
                    'sometimes',
                    'required',
                    'integer',
                    'exists:counties,id',
                ],
                'name' => [
                    'sometimes',
                    'required',
                    'string',
                    'max:255',
                ],
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                ],
                'is_active' => [
                    'sometimes',
                    'boolean',
                ],
            ]);

            $city = $this->cityService->update(
                $id,
                $validated
            );

            return ApiResponse::updated(
                $city,
                'City updated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to update city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE CITY (SOFT DELETE)
    |--------------------------------------------------------------------------
    */

    public function destroy(int $id): JsonResponse
    {
        try {
            $this->cityService->delete($id);

            return ApiResponse::deleted(
                ['id' => $id],
                'City deleted successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to delete city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE CITY
    |--------------------------------------------------------------------------
    */

    public function activate(int $id): JsonResponse
    {
        try {
            $this->cityService->activate($id);

            $city = $this->cityService->findById($id);

            return ApiResponse::updated(
                $city,
                'City activated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to activate city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE CITY
    |--------------------------------------------------------------------------
    */

    public function deactivate(int $id): JsonResponse
    {
        try {
            $this->cityService->deactivate($id);

            $city = $this->cityService->findById($id);

            return ApiResponse::updated(
                $city,
                'City deactivated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to deactivate city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE CITY STATUS
    |--------------------------------------------------------------------------
    */

    public function toggleStatus(int $id): JsonResponse
    {
        try {
            $this->cityService->toggleStatus($id);

            $city = $this->cityService->findById($id);

            return ApiResponse::updated(
                $city,
                'City status updated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to update city status.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET TRASHED CITIES
    |--------------------------------------------------------------------------
    */

    public function trashed(Request $request): JsonResponse
    {
        try {
            $filters = $request->only([
                'search',
                'name',
                'slug',
                'code',
                'country_id',
                'region_id',
                'county_id',
                'date_from',
                'date_to',
                'sort_by',
                'sort_direction',
            ]);

            $perPage = (int) $request->input('per_page', 25);

            $cities = $this->cityService->getTrashed(
                $perPage,
                $filters
            );

            return ApiResponse::paginated(
                $cities,
                'Deleted cities retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve deleted cities.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW TRASHED CITY
    |--------------------------------------------------------------------------
    */

    public function showTrashed(int $id): JsonResponse
    {
        try {
            $city = $this->cityService->findTrashedById($id);

            return ApiResponse::success(
                $city,
                'Deleted city retrieved successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to retrieve deleted city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE CITY
    |--------------------------------------------------------------------------
    */

    public function restore(int $id): JsonResponse
    {
        try {
            $this->cityService->restore($id);

            $city = $this->cityService->findById($id);

            return ApiResponse::updated(
                $city,
                'City restored successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to restore city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE CITY
    |--------------------------------------------------------------------------
    */

    public function forceDelete(int $id): JsonResponse
    {
        try {
            $this->cityService->forceDelete($id);

            return ApiResponse::deleted(
                ['id' => $id],
                'City permanently deleted successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to permanently delete city.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK CITY EXISTS
    |--------------------------------------------------------------------------
    */

    public function checkExists(int $id): JsonResponse
    {
        try {
            $exists = $this->cityService->exists($id);

            return ApiResponse::success(
                ['exists' => $exists],
                'City existence checked successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to check city existence.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK CITY CODE
    |--------------------------------------------------------------------------
    */

    public function checkCode(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'code' => [
                    'required',
                    'string',
                    'max:50',
                ],
                'ignore_id' => [
                    'nullable',
                    'integer',
                ],
            ]);

            $exists = $this->cityService->codeExists(
                $validated['code'],
                $validated['ignore_id'] ?? null
            );

            return ApiResponse::success(
                [
                    'code' => strtoupper(trim($validated['code'])),
                    'exists' => $exists,
                    'available' => !$exists,
                ],
                'City code checked successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to check city code.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK CITY SLUG
    |--------------------------------------------------------------------------
    */

    public function checkSlug(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'slug' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'ignore_id' => [
                    'nullable',
                    'integer',
                ],
            ]);

            $exists = $this->cityService->slugExists(
                $validated['slug'],
                $validated['ignore_id'] ?? null
            );

            return ApiResponse::success(
                [
                    'slug' => $validated['slug'],
                    'exists' => $exists,
                    'available' => !$exists,
                ],
                'City slug checked successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Unable to check city slug.'
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
        string $fallbackMessage = 'An unexpected error occurred.'
    ): JsonResponse {

        if ($e instanceof ValidationException) {
            return ApiResponse::validation(
                $e->errors(),
                $e->getMessage() ?: 'Validation failed.'
            );
        }

        if ($e instanceof ModelNotFoundException) {
            return ApiResponse::notFound(
                'The requested city could not be found.'
            );
        }

        if ($e instanceof HttpExceptionInterface) {
            $statusCode = $e->getStatusCode();

            if ($statusCode === 404) {
                return ApiResponse::notFound(
                    $e->getMessage() ?: 'Resource not found.'
                );
            }

            if ($statusCode === 403) {
                return ApiResponse::forbidden(
                    $e->getMessage() ?: 'You are not authorized to perform this action.'
                );
            }

            return ApiResponse::error(
                $e->getMessage() ?: $fallbackMessage,
                null,
                $statusCode
            );
        }

        report($e);

        return ApiResponse::serverError(
            $fallbackMessage,
            config('app.debug')
                ? [
                    'exception' => get_class($e),
                    'message' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                ]
                : null
        );
    }
}
