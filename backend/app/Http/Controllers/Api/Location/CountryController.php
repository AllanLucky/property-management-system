<?php

namespace App\Http\Controllers\Api\Location;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Location\StoreCountryRequest;
use App\Http\Requests\Location\UpdateCountryRequest;
use App\Models\Country;
use App\Services\CountryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class CountryController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | CONSTRUCTOR
    |--------------------------------------------------------------------------
    */

    public function __construct(
        protected CountryService $countryService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL COUNTRIES
    |--------------------------------------------------------------------------
    |
    | GET /api/countries
    |
    */

    /**
     * Display paginated countries.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Country::class);

        try {
            $filters = request()->only([
                'search',
                'name',
                'slug',
                'code',
                'phone_code',
                'currency',
                'is_active',
                'with',
                'sort_by',
                'sort_direction',
            ]);

            $perPage = (int) request()->input('per_page', 25);

            $countries = $this->countryService->getCountries(
                $filters,
                $perPage
            );

            return ApiResponse::paginated(
                $countries,
                'Countries fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch countries.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET ACTIVE COUNTRIES
    |--------------------------------------------------------------------------
    |
    | GET /api/countries/active
    |
    */

    /**
     * Display all active countries.
     */
    public function active(): JsonResponse
    {
        $this->authorize('viewAny', Country::class);

        try {
            $countries = $this->countryService
                ->getActiveCountries();

            return ApiResponse::collection(
                $countries,
                'Active countries fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch active countries.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET INACTIVE COUNTRIES
    |--------------------------------------------------------------------------
    |
    | GET /api/countries/inactive
    |
    */

    /**
     * Display all inactive countries.
     */
    public function inactive(): JsonResponse
    {
        $this->authorize('viewAny', Country::class);

        try {
            $countries = $this->countryService
                ->getInactiveCountries();

            return ApiResponse::collection(
                $countries,
                'Inactive countries fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch inactive countries.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTRY STATISTICS
    |--------------------------------------------------------------------------
    |
    | GET /api/countries/statistics
    |
    */

    /**
     * Display country statistics.
     */
    public function statistics(): JsonResponse
    {
        $this->authorize('statistics', Country::class);

        try {
            $statistics = $this->countryService
                ->getCountryStatistics();

            return ApiResponse::success(
                $statistics,
                'Country statistics fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch country statistics.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET SINGLE COUNTRY
    |--------------------------------------------------------------------------
    |
    | GET /api/countries/{country}
    |
    */

    /**
     * Display a single country.
     */
    public function show(int $country): JsonResponse
    {
        try {
            $country = $this->countryService
                ->getCountry($country);

            $this->authorize('view', $country);

            return ApiResponse::success(
                $country,
                'Country fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTRY
    |--------------------------------------------------------------------------
    |
    | POST /api/countries
    |
    */

    /**
     * Store a newly created country.
     */
    public function store(
        StoreCountryRequest $request
    ): JsonResponse {
        try {
            $country = $this->countryService->createCountry(
                $request->validated()
            );

            return ApiResponse::created(
                $country,
                'Country created successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to create country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTRY
    |--------------------------------------------------------------------------
    |
    | PUT/PATCH /api/countries/{country}
    |
    */

    /**
     * Update an existing country.
     */
    public function update(
        UpdateCountryRequest $request,
        int $country
    ): JsonResponse {
        try {
            $existingCountry = $this->countryService
                ->getCountry($country);

            $this->authorize('update', $existingCountry);

            $updatedCountry = $this->countryService->updateCountry(
                $existingCountry->id,
                $request->validated()
            );

            return ApiResponse::updated(
                $updatedCountry,
                'Country updated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to update country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE COUNTRY
    |--------------------------------------------------------------------------
    |
    | DELETE /api/countries/{country}
    |
    */

    /**
     * Soft delete a country.
     */
    public function destroy(int $country): JsonResponse
    {
        try {
            $existingCountry = $this->countryService
                ->getCountry($country);

            $this->authorize('delete', $existingCountry);

            $this->countryService->deleteCountry(
                $existingCountry->id
            );

            return ApiResponse::deleted(
                [
                    'id' => $existingCountry->id,
                    'name' => $existingCountry->name,
                    'deleted' => true,
                ],
                'Country deleted successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to delete country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE COUNTRY
    |--------------------------------------------------------------------------
    |
    | PATCH /api/countries/{country}/activate
    |
    */

    /**
     * Activate a country.
     */
    public function activate(int $country): JsonResponse
    {
        try {
            $existingCountry = $this->countryService
                ->getCountry($country);

            $this->authorize('activate', $existingCountry);

            $updatedCountry = $this->countryService
                ->activateCountry($existingCountry->id);

            return ApiResponse::updated(
                $updatedCountry,
                'Country activated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to activate country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE COUNTRY
    |--------------------------------------------------------------------------
    |
    | PATCH /api/countries/{country}/deactivate
    |
    */

    /**
     * Deactivate a country.
     */
    public function deactivate(int $country): JsonResponse
    {
        try {
            $existingCountry = $this->countryService
                ->getCountry($country);

            $this->authorize('deactivate', $existingCountry);

            $updatedCountry = $this->countryService
                ->deactivateCountry($existingCountry->id);

            return ApiResponse::updated(
                $updatedCountry,
                'Country deactivated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to deactivate country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE COUNTRY STATUS
    |--------------------------------------------------------------------------
    |
    | PATCH /api/countries/{country}/toggle-status
    |
    */

    /**
     * Toggle country active status.
     */
    public function toggleStatus(int $country): JsonResponse
    {
        try {
            $existingCountry = $this->countryService
                ->getCountry($country);

            /*
            |--------------------------------------------------------------------------
            | AUTHORIZE BASED ON CURRENT STATUS
            |--------------------------------------------------------------------------
            */

            if ($existingCountry->is_active) {
                $this->authorize('deactivate', $existingCountry);
            } else {
                $this->authorize('activate', $existingCountry);
            }

            $updatedCountry = $this->countryService
                ->toggleCountryStatus($existingCountry->id);

            return ApiResponse::updated(
                $updatedCountry,
                $updatedCountry->is_active
                    ? 'Country activated successfully.'
                    : 'Country deactivated successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to change country status.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TRASHED COUNTRIES
    |--------------------------------------------------------------------------
    |
    | GET /api/countries/trashed
    |
    */

    /**
     * Display paginated soft-deleted countries.
     */
    public function trashed(): JsonResponse
    {
        $this->authorize('viewAny', Country::class);

        try {
            $filters = request()->only([
                'search',
                'name',
                'code',
                'slug',
                'phone_code',
                'currency',
                'sort_by',
                'sort_direction',
            ]);

            $perPage = (int) request()->input('per_page', 25);

            $countries = $this->countryService
                ->getTrashedCountriesPaginated(
                    $filters,
                    $perPage
                );

            return ApiResponse::paginated(
                $countries,
                'Trashed countries fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch trashed countries.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW TRASHED COUNTRY
    |--------------------------------------------------------------------------
    |
    | GET /api/countries/trashed/{country}
    |
    */

    /**
     * Display a soft-deleted country.
     */
    public function showTrashed(int $country): JsonResponse
    {
        try {
            $trashedCountry = $this->countryService
                ->getTrashedCountry($country);

            $this->authorize('restore', $trashedCountry);

            return ApiResponse::success(
                $trashedCountry,
                'Trashed country fetched successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to fetch trashed country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE COUNTRY
    |--------------------------------------------------------------------------
    |
    | POST /api/countries/{country}/restore
    |
    */

    /**
     * Restore a soft-deleted country.
     */
    public function restore(int $country): JsonResponse
    {
        try {
            $trashedCountry = $this->countryService
                ->getTrashedCountry($country);

            $this->authorize('restore', $trashedCountry);

            $this->countryService->restoreCountry(
                $trashedCountry->id
            );

            $restoredCountry = $this->countryService
                ->getCountry($trashedCountry->id);

            return ApiResponse::updated(
                $restoredCountry,
                'Country restored successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to restore country.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE COUNTRY
    |--------------------------------------------------------------------------
    |
    | DELETE /api/countries/{country}/force-delete
    |
    */

    /**
     * Permanently delete a country.
     */
    public function forceDelete(int $country): JsonResponse
    {
        try {
            $trashedCountry = $this->countryService
                ->getTrashedCountry($country);

            $this->authorize('forceDelete', $trashedCountry);

            $this->countryService->forceDeleteCountry(
                $trashedCountry->id
            );

            return ApiResponse::deleted(
                [
                    'id' => $country,
                    'permanently_deleted' => true,
                ],
                'Country permanently deleted successfully.'
            );

        } catch (Throwable $e) {
            return $this->handleException(
                $e,
                'Failed to permanently delete country.'
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
                $e->getMessage() ?: 'Country validation failed.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | MODEL NOT FOUND
        |--------------------------------------------------------------------------
        */

        if ($e instanceof ModelNotFoundException) {
            return ApiResponse::notFound(
                'Country not found.'
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
        | LOG UNEXPECTED ERRORS
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
