<?php

namespace App\Http\Controllers\Api\Property;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\CreatePropertyRequest;
use App\Http\Requests\Property\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Helpers\ApiResponse;
use App\Services\PropertyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class PropertyController extends Controller
{
    public function __construct(
        protected PropertyService $propertyService
    ) {
        $this->middleware('permission:properties.view')->only([
            'index', 'show', 'stats', 'active', 'vacant', 'fullyOccupied'
        ]);

        $this->middleware('permission:properties.create')->only(['store']);
        $this->middleware('permission:properties.edit')->only(['update']);
        $this->middleware('permission:properties.delete')->only(['destroy']);
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */
    public function index(Request $request): JsonResponse
    {
        try {
            $withRelations = $request->boolean('with_relations', true);

            $properties = $withRelations
                ? $this->propertyService->getAllWithRelations()
                : $this->propertyService->getAll();

            if ($properties instanceof \Illuminate\Support\Collection) {
                $properties = $properties->values();
            }

            return ApiResponse::success(
                PropertyResource::collection($properties),
                'Properties fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Property index failed', [
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Failed to fetch properties.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */
    public function store(CreatePropertyRequest $request): JsonResponse
    {
        try {
            $property = $this->propertyService->create($request->validated());

            $property->load([
                'user',
                'propertyType',
                'propertyCategory',
            ]);

            return ApiResponse::success(
                new PropertyResource($property),
                'Property created successfully.',
                201
            );

        } catch (Throwable $e) {

            Log::error('Property creation failed', [
                'message' => $e->getMessage(),
                'payload' => $request->validated()
            ]);

            return ApiResponse::error(
                'Property creation failed.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */
    public function show(int $id): JsonResponse
    {
        try {
            $property = $this->propertyService->getByIdWithRelations($id);

            if (!$property) {
                return ApiResponse::error('Property not found.', [], 404);
            }

            return ApiResponse::success(
                new PropertyResource($property),
                'Property fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Property show failed', [
                'property_id' => $id,
                'message' => $e->getMessage()
            ]);

            return ApiResponse::error(
                'Failed to fetch property.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    public function update(UpdatePropertyRequest $request, int $id): JsonResponse
    {
        try {
            $updated = $this->propertyService->update($id, $request->validated());

            if (!$updated) {
                return ApiResponse::error('Property update failed.', [], 500);
            }

            $updated->load([
                'user',
                'propertyType',
                'propertyCategory',
            ]);

            return ApiResponse::success(
                new PropertyResource($updated),
                'Property updated successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Property update failed', [
                'property_id' => $id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Property update failed.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */
    public function destroy(int $id): JsonResponse
    {
        try {
            $deleted = $this->propertyService->delete($id);

            if (!$deleted) {
                return ApiResponse::error('Property deletion failed.', [], 500);
            }

            return ApiResponse::success(
                null,
                'Property deleted successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Property delete failed', [
                'property_id' => $id,
                'message' => $e->getMessage()
            ]);

            return ApiResponse::error(
                'Property deletion failed.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATS (SAFE FIX)
    |--------------------------------------------------------------------------
    */
    public function stats(int $id): JsonResponse
    {
        try {
            $stats = $this->propertyService->getStats($id) ?? [];

            return ApiResponse::success([
                'total_units'    => $stats['total_units'] ?? 0,
                'occupied_units' => $stats['occupied_units'] ?? 0,
                'vacant_units'   => $stats['vacant_units'] ?? 0,
                'occupancy_rate' => $stats['occupancy_rate'] ?? 0,
            ], 'Property statistics fetched successfully.');

        } catch (Throwable $e) {

            Log::error('Property stats failed', [
                'property_id' => $id,
                'message' => $e->getMessage()
            ]);

            return ApiResponse::error(
                'Failed to fetch property statistics.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE
    |--------------------------------------------------------------------------
    */
    public function active(): JsonResponse
    {
        try {
            $properties = $this->propertyService->getActiveProperties() ?? collect();

            return ApiResponse::success(
                PropertyResource::collection($properties),
                'Active properties fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Active properties failed', [
                'message' => $e->getMessage()
            ]);

            return ApiResponse::error(
                'Failed to fetch active properties.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | VACANT
    |--------------------------------------------------------------------------
    */
    public function vacant(): JsonResponse
    {
        try {
            $properties = $this->propertyService->getVacantProperties() ?? collect();

            return ApiResponse::success(
                PropertyResource::collection($properties),
                'Vacant properties fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Vacant properties failed', [
                'message' => $e->getMessage()
            ]);

            return ApiResponse::error(
                'Failed to fetch vacant properties.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FULLY OCCUPIED
    |--------------------------------------------------------------------------
    */
    public function fullyOccupied(): JsonResponse
    {
        try {
            $properties = $this->propertyService->getFullyOccupiedProperties() ?? collect();

            return ApiResponse::success(
                PropertyResource::collection($properties),
                'Fully occupied properties fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Fully occupied properties failed', [
                'message' => $e->getMessage()
            ]);

            return ApiResponse::error(
                'Failed to fetch fully occupied properties.',
                ['error' => $e->getMessage()],
                500
            );
        }
    }
}