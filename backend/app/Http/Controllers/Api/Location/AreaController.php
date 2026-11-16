<?php

namespace App\Http\Controllers\Api\Location;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Location\StoreAreaRequest;
use App\Http\Requests\Location\UpdateAreaRequest;
use App\Http\Resources\AreaResource;
use App\Services\AreaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AreaController extends Controller
{
    /**
     * Area service.
     */
    protected AreaService $areaService;

    /**
     * Constructor.
     */
    public function __construct(AreaService $areaService)
    {
        $this->areaService = $areaService;
    }

    /*
    |--------------------------------------------------------------------------
    | RETRIEVE AREAS
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated areas with optional filters.
     *
     * GET /api/areas
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->query();

        $perPage = min(
            max((int) $request->query('per_page', 25), 1),
            100
        );

        unset($filters['per_page'], $filters['page']);

        $areas = $this->areaService->getAll(
            $filters,
            $perPage
        );

        /*
        |--------------------------------------------------------------------------
        | TRANSFORM PAGINATED RECORDS
        |--------------------------------------------------------------------------
        */

        $areas->setCollection(
            $areas->getCollection()->map(
                fn ($area) => AreaResource::make($area)->resolve($request)
            )
        );

        return ApiResponse::paginated(
            $areas,
            'Areas fetched successfully.'
        );
    }

    /**
     * Get all areas without pagination.
     *
     * GET /api/areas/all
     */
    public function all(Request $request): JsonResponse
    {
        $areas = $this->areaService->getAllRecords(
            $request->query()
        );

        return ApiResponse::collection(
            AreaResource::collection($areas)->resolve($request),
            'Areas fetched successfully.'
        );
    }

    /**
     * Get a single area by ID.
     *
     * GET /api/areas/{id}
     */
    public function show(int $id): JsonResponse
    {
        $area = $this->areaService->findById($id);

        if (!$area) {
            return ApiResponse::notFound(
                'Area not found.'
            );
        }

        return ApiResponse::success(
            AreaResource::make($area)->resolve(request()),
            'Area fetched successfully.'
        );
    }

    /**
     * Get an area by slug.
     *
     * GET /api/areas/slug/{slug}
     */
    public function showBySlug(string $slug): JsonResponse
    {
        $area = $this->areaService->findBySlug($slug);

        if (!$area) {
            return ApiResponse::notFound(
                'Area not found.'
            );
        }

        return ApiResponse::success(
            AreaResource::make($area)->resolve(request()),
            'Area fetched successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new area.
     *
     * POST /api/areas
     */
    public function store(StoreAreaRequest $request): JsonResponse
    {
        $area = $this->areaService->create(
            $request->validated()
        );

        return ApiResponse::created(
            AreaResource::make($area)->resolve($request),
            'Area created successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing area.
     *
     * PUT/PATCH /api/areas/{id}
     */
    public function update(
        UpdateAreaRequest $request,
        int $id
    ): JsonResponse {

        $existingArea = $this->areaService->findById($id);

        if (!$existingArea) {
            return ApiResponse::notFound(
                'Area not found.'
            );
        }

        $area = $this->areaService->update(
            $id,
            $request->validated()
        );

        if (!$area) {
            return ApiResponse::error(
                'Unable to update area.',
                null,
                500
            );
        }

        return ApiResponse::updated(
            AreaResource::make($area)->resolve($request),
            'Area updated successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE AREA
    |--------------------------------------------------------------------------
    */

    /**
     * Delete an area permanently.
     *
     * DELETE /api/areas/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $area = $this->areaService->findById($id);

        if (!$area) {
            return ApiResponse::notFound(
                'Area not found.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PREVENT DELETION WHEN AREA HAS PROPERTIES
        |--------------------------------------------------------------------------
        */

        if ($area->properties()->exists()) {
            return ApiResponse::conflict(
                'This area cannot be deleted because it has associated properties.'
            );
        }

        $deleted = $this->areaService->delete($id);

        if (!$deleted) {
            return ApiResponse::error(
                'Unable to delete area.',
                null,
                500
            );
        }

        return ApiResponse::deleted(
            ['id' => $id],
            'Area deleted successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AREA STATUS MANAGEMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Activate an area.
     *
     * PATCH /api/areas/{id}/activate
     */
    public function activate(int $id): JsonResponse
    {
        $area = $this->areaService->findById($id);

        if (!$area) {
            return ApiResponse::notFound(
                'Area not found.'
            );
        }

        $updated = $this->areaService->activate($id);

        if (!$updated) {
            return ApiResponse::error(
                'Unable to activate area.',
                null,
                500
            );
        }

        $area = $this->areaService->findById($id);

        return ApiResponse::updated(
            AreaResource::make($area)->resolve(request()),
            'Area activated successfully.'
        );
    }

    /**
     * Deactivate an area.
     *
     * PATCH /api/areas/{id}/deactivate
     */
    public function deactivate(int $id): JsonResponse
    {
        $area = $this->areaService->findById($id);

        if (!$area) {
            return ApiResponse::notFound(
                'Area not found.'
            );
        }

        $updated = $this->areaService->deactivate($id);

        if (!$updated) {
            return ApiResponse::error(
                'Unable to deactivate area.',
                null,
                500
            );
        }

        $area = $this->areaService->findById($id);

        return ApiResponse::updated(
            AreaResource::make($area)->resolve(request()),
            'Area deactivated successfully.'
        );
    }

    /**
     * Update area active status.
     *
     * PATCH /api/areas/{id}/status
     */
    public function updateStatus(
        Request $request,
        int $id
    ): JsonResponse {

        $area = $this->areaService->findById($id);

        if (!$area) {
            return ApiResponse::notFound(
                'Area not found.'
            );
        }

        $validator = Validator::make(
            $request->all(),
            [
                'is_active' => [
                    'required',
                    'boolean',
                ],
            ],
            [
                'is_active.required' => 'Please provide the area status.',
                'is_active.boolean' => 'Area status must be active or inactive.',
            ]
        );

        if ($validator->fails()) {
            return ApiResponse::validation(
                $validator->errors()->toArray(),
                'Area status validation failed.'
            );
        }

        $updated = $this->areaService->updateStatus(
            $id,
            (bool) $validator->validated()['is_active']
        );

        if (!$updated) {
            return ApiResponse::error(
                'Unable to update area status.',
                null,
                500
            );
        }

        $area = $this->areaService->findById($id);

        return ApiResponse::updated(
            AreaResource::make($area)->resolve($request),
            'Area status updated successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AREAS BY LOCATION
    |--------------------------------------------------------------------------
    */

    /**
     * Get areas by country.
     *
     * GET /api/areas/country/{countryId}
     */
    public function byCountry(int $countryId): JsonResponse
    {
        $areas = $this->areaService->getByCountry($countryId);

        return ApiResponse::collection(
            AreaResource::collection($areas)->resolve(request()),
            'Country areas fetched successfully.'
        );
    }

    /**
     * Get areas by region.
     *
     * GET /api/areas/region/{regionId}
     */
    public function byRegion(int $regionId): JsonResponse
    {
        $areas = $this->areaService->getByRegion($regionId);

        return ApiResponse::collection(
            AreaResource::collection($areas)->resolve(request()),
            'Region areas fetched successfully.'
        );
    }

    /**
     * Get areas by county.
     *
     * GET /api/areas/county/{countyId}
     */
    public function byCounty(int $countyId): JsonResponse
    {
        $areas = $this->areaService->getByCounty($countyId);

        return ApiResponse::collection(
            AreaResource::collection($areas)->resolve(request()),
            'County areas fetched successfully.'
        );
    }

    /**
     * Get areas by city.
     *
     * GET /api/areas/city/{cityId}
     */
    public function byCity(int $cityId): JsonResponse
    {
        $areas = $this->areaService->getByCity($cityId);

        return ApiResponse::collection(
            AreaResource::collection($areas)->resolve(request()),
            'City areas fetched successfully.'
        );
    }

    /**
     * Get active areas by city.
     *
     * GET /api/areas/city/{cityId}/active
     */
    public function activeByCity(int $cityId): JsonResponse
    {
        $areas = $this->areaService->getActiveByCity($cityId);

        return ApiResponse::collection(
            AreaResource::collection($areas)->resolve(request()),
            'Active city areas fetched successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH AREAS
    |--------------------------------------------------------------------------
    */

    /**
     * Search areas.
     *
     * GET /api/areas/search?q=Westlands
     */
    public function search(Request $request): JsonResponse
    {
        $validator = Validator::make(
            $request->all(),
            [
                'q' => [
                    'required',
                    'string',
                    'min:2',
                    'max:255',
                ],
            ],
            [
                'q.required' => 'Please enter a search term.',
                'q.min' => 'Search term must contain at least 2 characters.',
                'q.max' => 'Search term cannot exceed 255 characters.',
            ]
        );

        if ($validator->fails()) {
            return ApiResponse::validation(
                $validator->errors()->toArray(),
                'Area search validation failed.'
            );
        }

        $areas = $this->areaService->search(
            $validator->validated()['q'],
            $request->except('q')
        );

        return ApiResponse::collection(
            AreaResource::collection($areas)->resolve($request),
            'Area search completed successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AREA STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get area statistics.
     *
     * GET /api/areas/statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $statistics = $this->areaService->getStatistics(
            $request->query()
        );

        return ApiResponse::success(
            $statistics,
            'Area statistics fetched successfully.'
        );
    }

    /**
     * Get total area count.
     *
     * GET /api/areas/count/total
     */
    public function totalCount(Request $request): JsonResponse
    {
        $count = $this->areaService->getTotalCount(
            $request->query()
        );

        return ApiResponse::success(
            ['total' => $count],
            'Total area count fetched successfully.'
        );
    }

    /**
     * Get active area count.
     *
     * GET /api/areas/count/active
     */
    public function activeCount(Request $request): JsonResponse
    {
        $count = $this->areaService->getActiveCount(
            $request->query()
        );

        return ApiResponse::success(
            ['active' => $count],
            'Active area count fetched successfully.'
        );
    }

    /**
     * Get inactive area count.
     *
     * GET /api/areas/count/inactive
     */
    public function inactiveCount(Request $request): JsonResponse
    {
        $count = $this->areaService->getInactiveCount(
            $request->query()
        );

        return ApiResponse::success(
            ['inactive' => $count],
            'Inactive area count fetched successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AREA COUNTS BY LOCATION
    |--------------------------------------------------------------------------
    */

    /**
     * Get area counts grouped by country.
     *
     * GET /api/areas/count-by-country
     */
    public function countByCountry(): JsonResponse
    {
        return ApiResponse::collection(
            $this->areaService->getCountByCountry(),
            'Area counts by country fetched successfully.'
        );
    }

    /**
     * Get area counts grouped by region.
     *
     * GET /api/areas/count-by-region
     */
    public function countByRegion(): JsonResponse
    {
        return ApiResponse::collection(
            $this->areaService->getCountByRegion(),
            'Area counts by region fetched successfully.'
        );
    }

    /**
     * Get area counts grouped by county.
     *
     * GET /api/areas/count-by-county
     */
    public function countByCounty(): JsonResponse
    {
        return ApiResponse::collection(
            $this->areaService->getCountByCounty(),
            'Area counts by county fetched successfully.'
        );
    }

    /**
     * Get area counts grouped by city.
     *
     * GET /api/areas/count-by-city
     */
    public function countByCity(): JsonResponse
    {
        return ApiResponse::collection(
            $this->areaService->getCountByCity(),
            'Area counts by city fetched successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get the number of areas with properties.
     *
     * GET /api/areas/with-properties/count
     */
    public function withPropertiesCount(): JsonResponse
    {
        $count = $this->areaService->getAreasWithPropertiesCount();

        return ApiResponse::success(
            ['with_properties' => $count],
            'Areas with properties count fetched successfully.'
        );
    }

    /**
     * Get the number of areas without properties.
     *
     * GET /api/areas/without-properties/count
     */
    public function withoutPropertiesCount(): JsonResponse
    {
        $count = $this->areaService->getAreasWithoutPropertiesCount();

        return ApiResponse::success(
            ['without_properties' => $count],
            'Areas without properties count fetched successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | AREA REPORTS
    |--------------------------------------------------------------------------
    */

    /**
     * Get area reports.
     *
     * GET /api/areas/reports
     */
    public function reports(Request $request): JsonResponse
    {
        $reports = $this->areaService->getReports(
            $request->query()
        );

        return ApiResponse::success(
            $reports,
            'Area reports fetched successfully.'
        );
    }

    /**
     * Get area status breakdown.
     *
     * GET /api/areas/reports/status-breakdown
     */
    public function statusBreakdown(Request $request): JsonResponse
    {
        $breakdown = $this->areaService->getStatusBreakdown(
            $request->query()
        );

        return ApiResponse::collection(
            $breakdown,
            'Area status breakdown fetched successfully.'
        );
    }

    /**
     * Get area breakdown by country.
     *
     * GET /api/areas/reports/country-breakdown
     */
    public function countryBreakdown(Request $request): JsonResponse
    {
        $breakdown = $this->areaService->getCountryBreakdown(
            $request->query()
        );

        return ApiResponse::collection(
            $breakdown,
            'Area country breakdown fetched successfully.'
        );
    }

    /**
     * Get area breakdown by region.
     *
     * GET /api/areas/reports/region-breakdown
     */
    public function regionBreakdown(Request $request): JsonResponse
    {
        $breakdown = $this->areaService->getRegionBreakdown(
            $request->query()
        );

        return ApiResponse::collection(
            $breakdown,
            'Area region breakdown fetched successfully.'
        );
    }

    /**
     * Get area breakdown by county.
     *
     * GET /api/areas/reports/county-breakdown
     */
    public function countyBreakdown(Request $request): JsonResponse
    {
        $breakdown = $this->areaService->getCountyBreakdown(
            $request->query()
        );

        return ApiResponse::collection(
            $breakdown,
            'Area county breakdown fetched successfully.'
        );
    }

    /**
     * Get area breakdown by city.
     *
     * GET /api/areas/reports/city-breakdown
     */
    public function cityBreakdown(Request $request): JsonResponse
    {
        $breakdown = $this->areaService->getCityBreakdown(
            $request->query()
        );

        return ApiResponse::collection(
            $breakdown,
            'Area city breakdown fetched successfully.'
        );
    }
}
