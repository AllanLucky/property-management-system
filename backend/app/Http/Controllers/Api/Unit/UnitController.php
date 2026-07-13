<?php

namespace App\Http\Controllers\Api\Unit;

use App\Http\Controllers\Controller;
use App\Http\Requests\Unit\CreateUnitRequest;
use App\Http\Requests\Unit\UpdateUnitRequest;
use App\Http\Resources\UnitResource;
use App\Helpers\ApiResponse;
use App\Services\UnitService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class UnitController extends Controller
{
    public function __construct(
        protected UnitService $unitService
    ) {
        /*
        |--------------------------------------------------------------------------
        | RBAC MIDDLEWARE
        |--------------------------------------------------------------------------
        */
        $this->middleware('permission:units.view')
            ->only([
                'index',
                'show',
                'stats',
                'byProperty',
                'vacant',
                'occupied',
                'maintenance',
                'available',
            ]);

        $this->middleware('permission:units.create')
            ->only([
                'store',
            ]);

        $this->middleware('permission:units.edit')
            ->only([
                'update',
                'changeStatus',
                'assignToProperty',
            ]);

        $this->middleware('permission:units.delete')
            ->only([
                'destroy',
            ]);

        $this->middleware('permission:units.manage')
            ->only([
                'changeStatus',
                'assignToProperty',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | LIST ALL UNITS
    |--------------------------------------------------------------------------
    */
    public function index(Request $request): JsonResponse
    {
        try {

            $units = $this->unitService->getAll();

            /*
            |--------------------------------------------------------------------------
            | LOAD RELATIONS
            |--------------------------------------------------------------------------
            */
            if ($request->boolean('with_relations', true)) {

                $units->load([
                    'property',
                    'apartment',
                    'tenancies.tenant',
                    'maintenances',
                ]);
            }

            return ApiResponse::success(
                UnitResource::collection($units),
                'Units fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Units fetch failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Failed to fetch units.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIT
    |--------------------------------------------------------------------------
    */
    public function store(
        CreateUnitRequest $request
    ): JsonResponse {
        try {

            $validated = $request->validated();

            /*
            |--------------------------------------------------------------------------
            | FIX FRONTEND FIELD MISMATCH
            |--------------------------------------------------------------------------
            | Frontend sends:
            | unit_type
            |
            | Database/model expects:
            | type
            |--------------------------------------------------------------------------
            */
            if (isset($validated['unit_type'])) {

                $validated['type'] = $validated['unit_type'];

                unset($validated['unit_type']);
            }

            /*
            |--------------------------------------------------------------------------
            | CREATE UNIT
            |--------------------------------------------------------------------------
            */
            $unit = $this->unitService
                ->create($validated);

            /*
            |--------------------------------------------------------------------------
            | LOAD RELATIONS
            |--------------------------------------------------------------------------
            */
            $unit->load([
                'property',
                'apartment',
                'tenancies.tenant',
                'maintenances',
            ]);

            return ApiResponse::success(
                new UnitResource($unit),
                'Unit created successfully.',
                201
            );

        } catch (Throwable $e) {

            Log::error('Unit creation failed', [
                'message' => $e->getMessage(),
                'data'    => $request->all(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Unit creation failed.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW SINGLE UNIT
    |--------------------------------------------------------------------------
    */
    public function show(int $id): JsonResponse
    {
        try {

            /*
            |--------------------------------------------------------------------------
            | FIND UNIT
            |--------------------------------------------------------------------------
            */
            $unit = $this->unitService
                ->getById($id);

            /*
            |--------------------------------------------------------------------------
            | NOT FOUND
            |--------------------------------------------------------------------------
            */
            if (!$unit) {

                return ApiResponse::error(
                    'Unit not found.',
                    [],
                    404
                );
            }

            /*
            |--------------------------------------------------------------------------
            | LOAD RELATIONS
            |--------------------------------------------------------------------------
            */
            $unit->load([
                'property',
                'apartment',
                'tenancies.tenant',
                'maintenances',
            ]);

            /*
            |--------------------------------------------------------------------------
            | PROPERTY STATS
            |--------------------------------------------------------------------------
            */
            if ($unit->property) {

                $property = $unit->property;

                $property->stats = [
                    'total_units' => $property->units()->count(),
                    'vacant_units' => $property->units()
                        ->where('status', 'vacant')
                        ->count(),

                    'occupied_units' => $property->units()
                        ->where('status', 'occupied')
                        ->count(),

                    'maintenance_units' => $property->units()
                        ->where('status', 'maintenance')
                        ->count(),
                ];
            }

            return ApiResponse::success(
                new UnitResource($unit),
                'Unit fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Unit fetch failed', [
                'unit_id' => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Failed to fetch unit.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE UNIT
    |--------------------------------------------------------------------------
    */
    public function update(
        UpdateUnitRequest $request,
        int $id
    ): JsonResponse {
        try {

            $unit = $this->unitService
                ->getById($id);

            if (!$unit) {

                return ApiResponse::error(
                    'Unit not found.',
                    [],
                    404
                );
            }

            $validated = $request->validated();

            /*
            |--------------------------------------------------------------------------
            | FIX FRONTEND FIELD MISMATCH
            |--------------------------------------------------------------------------
            */
            if (isset($validated['unit_type'])) {

                $validated['type'] = $validated['unit_type'];

                unset($validated['unit_type']);
            }

            /*
            |--------------------------------------------------------------------------
            | UPDATE UNIT
            |--------------------------------------------------------------------------
            */
            $updated = $this->unitService
                ->update(
                    $id,
                    $validated
                );

            /*
            |--------------------------------------------------------------------------
            | LOAD RELATIONS
            |--------------------------------------------------------------------------
            */
            $updated->load([
                'property',
                'apartment',
                'tenancies.tenant',
                'maintenances',
            ]);

            return ApiResponse::success(
                new UnitResource($updated),
                'Unit updated successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Unit update failed', [
                'unit_id' => $id,
                'message' => $e->getMessage(),
                'data'    => $request->all(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Unit update failed.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */
    public function destroy(int $id): JsonResponse
    {
        try {

            $unit = $this->unitService
                ->getById($id);

            if (!$unit) {

                return ApiResponse::error(
                    'Unit not found.',
                    [],
                    404
                );
            }

            $deleted = $this->unitService
                ->delete($id);

            if (!$deleted) {

                return ApiResponse::error(
                    'Unit deletion failed.',
                    [],
                    500
                );
            }

            return ApiResponse::success(
                null,
                'Unit deleted successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Unit deletion failed', [
                'unit_id' => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Unit deletion failed.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CHANGE UNIT STATUS
    |--------------------------------------------------------------------------
    */
    public function changeStatus(
        Request $request,
        int $id
    ): JsonResponse {

        $validated = $request->validate([
            'status' => [
                'required',
                'string',
                'in:vacant,occupied,maintenance,inactive',
            ],
        ]);

        try {

            $unit = $this->unitService
                ->getById($id);

            if (!$unit) {

                return ApiResponse::error(
                    'Unit not found.',
                    [],
                    404
                );
            }

            $updated = $this->unitService
                ->changeStatus(
                    $id,
                    $validated['status']
                );

            $updated->load([
                'property',
            ]);

            return ApiResponse::success(
                new UnitResource($updated),
                'Unit status updated successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Unit status update failed', [
                'unit_id' => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Failed to update unit status.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN UNIT TO PROPERTY
    |--------------------------------------------------------------------------
    */
    public function assignToProperty(
        Request $request,
        int $id
    ): JsonResponse {

        $validated = $request->validate([
            'property_id' => [
                'required',
                'integer',
                'exists:properties,id',
            ],
        ]);

        try {

            $unit = $this->unitService
                ->getById($id);

            if (!$unit) {

                return ApiResponse::error(
                    'Unit not found.',
                    [],
                    404
                );
            }

            $updated = $this->unitService
                ->assignToProperty(
                    $id,
                    $validated['property_id']
                );

            $updated->load([
                'property',
            ]);

            return ApiResponse::success(
                new UnitResource($updated),
                'Unit assigned to property successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Unit property assignment failed', [
                'unit_id' => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Failed to assign unit to property.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET UNITS BY PROPERTY
    |--------------------------------------------------------------------------
    */
    public function byProperty(
        int $propertyId
    ): JsonResponse {
        try {

            $units = $this->unitService
                ->getByProperty($propertyId);

            $units->load([
                'property',
                'apartment',
                'tenancies.tenant',
            ]);

            return ApiResponse::success(
                UnitResource::collection($units),
                'Property units fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Property units fetch failed', [
                'property_id' => $propertyId,
                'message'     => $e->getMessage(),
                'trace'       => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Failed to fetch property units.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET VACANT UNITS
    |--------------------------------------------------------------------------
    */
    public function vacant(): JsonResponse
    {
        try {

            $units = $this->unitService
                ->getVacantUnits();

            $units->load('property');

            return ApiResponse::success(
                UnitResource::collection($units),
                'Vacant units fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Vacant units fetch failed', [
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Failed to fetch vacant units.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET OCCUPIED UNITS
    |--------------------------------------------------------------------------
    */
    public function occupied(): JsonResponse
    {
        try {

            $units = $this->unitService
                ->getOccupiedUnits();

            $units->load('property');

            return ApiResponse::success(
                UnitResource::collection($units),
                'Occupied units fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Occupied units fetch failed', [
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Failed to fetch occupied units.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET MAINTENANCE UNITS
    |--------------------------------------------------------------------------
    */
    public function maintenance(): JsonResponse
    {
        try {

            $units = $this->unitService
                ->getMaintenanceUnits();

            $units->load('property');

            return ApiResponse::success(
                UnitResource::collection($units),
                'Maintenance units fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Maintenance units fetch failed', [
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Failed to fetch maintenance units.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GET AVAILABLE UNITS
    |--------------------------------------------------------------------------
    */
    public function available(): JsonResponse
    {
        try {

            $units = $this->unitService
                ->getAvailableUnits();

            $units->load('property');

            return ApiResponse::success(
                UnitResource::collection($units),
                'Available units fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Available units fetch failed', [
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Failed to fetch available units.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UNIT STATISTICS
    |--------------------------------------------------------------------------
    */
    public function stats(int $id): JsonResponse
    {
        try {

            $unit = $this->unitService
                ->getById($id);

            if (!$unit) {

                return ApiResponse::error(
                    'Unit not found.',
                    [],
                    404
                );
            }

            $stats = $this->unitService
                ->getStats($id);

            return ApiResponse::success(
                $stats,
                'Unit statistics fetched successfully.'
            );

        } catch (Throwable $e) {

            Log::error('Unit stats failed', [
                'unit_id' => $id,
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return ApiResponse::error(
                'Failed to fetch unit statistics.',
                [
                    'error' => $e->getMessage(),
                ],
                500
            );
        }
    }
}