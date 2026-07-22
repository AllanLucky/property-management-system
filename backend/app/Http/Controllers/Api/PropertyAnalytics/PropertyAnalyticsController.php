<?php

namespace App\Http\Controllers\Api\PropertyAnalytics;

use App\Http\Controllers\Controller;
use App\Services\PropertyAnalyticsService;
use App\Http\Requests\PropertyAnalytics\CreatePropertyAnalyticsRequest;
use App\Http\Requests\PropertyAnalytics\UpdatePropertyAnalyticsRequest;
use App\Http\Resources\PropertyAnalyticsResource;
use App\Helpers\ApiResponse;
use Illuminate\Http\JsonResponse;

class PropertyAnalyticsController extends Controller
{
    protected PropertyAnalyticsService $service;

    public function __construct(PropertyAnalyticsService $service)
    {
        $this->service = $service;
    }

    /**
     * List all property analytics.
     */
    public function index(): JsonResponse
    {
        $analytics = $this->service->listAnalytics();
        return ApiResponse::success(
            PropertyAnalyticsResource::collection($analytics),
            'Property analytics fetched successfully'
        );
    }

    /**
     * Show a single property analytics record.
     */
    public function show(int $id): JsonResponse
    {
        $analytics = $this->service->findAnalytics($id);

        if (!$analytics) {
            return ApiResponse::notFound('Property analytics record not found');
        }

        return ApiResponse::success(
            new PropertyAnalyticsResource($analytics),
            'Property analytics record fetched successfully'
        );
    }

    /**
     * Store a new property analytics record.
     */
    public function store(CreatePropertyAnalyticsRequest $request): JsonResponse
    {
        $analytics = $this->service->createAnalytics($request->validated());

        return ApiResponse::created(
            new PropertyAnalyticsResource($analytics),
            'Property analytics record created successfully'
        );
    }

    /**
     * Update an existing property analytics record.
     */
    public function update(UpdatePropertyAnalyticsRequest $request, int $id): JsonResponse
    {
        $analytics = $this->service->findAnalytics($id);

        if (!$analytics) {
            return ApiResponse::notFound('Property analytics record not found');
        }

        $updated = $this->service->updateAnalytics($analytics, $request->validated());

        return ApiResponse::updated(
            new PropertyAnalyticsResource($updated),
            'Property analytics record updated successfully'
        );
    }

    /**
     * Delete a property analytics record.
     */
    public function destroy(int $id): JsonResponse
    {
        $analytics = $this->service->findAnalytics($id);

        if (!$analytics) {
            return ApiResponse::notFound('Property analytics record not found');
        }

        $this->service->deleteAnalytics($analytics);

        return ApiResponse::deleted(
            null,
            'Property analytics record deleted successfully'
        );
    }
}
