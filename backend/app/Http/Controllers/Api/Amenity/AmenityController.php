<?php

namespace App\Http\Controllers\Api\Amenity;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Helpers\ApiResponse;
use App\Models\Amenity;
use App\Services\AmenityService;
use App\Http\Resources\AmenityResource;
use App\Http\Requests\Amenity\CreateAmenityRequest;
use App\Http\Requests\Amenity\UpdateAmenityRequest;

class AmenityController extends Controller
{
    protected AmenityService $service;

    public function __construct(AmenityService $service)
    {
        $this->service = $service;

        // RBAC middleware
        $this->middleware('permission:amenities.view')
            ->only(['index', 'show']);

        $this->middleware('permission:amenities.create')
            ->only('store');

        $this->middleware('permission:amenities.edit')
            ->only('update');

        $this->middleware('permission:amenities.delete')
            ->only('destroy');

        $this->middleware('permission:amenities.toggle')
            ->only('toggleStatus');
    }


    /*
    |--------------------------------------------------------------------------
    | GET ALL AMENITIES
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        try {
            $query = $request->input('q');
            $status = $request->input('status');

            $amenities = $this->service->getAll($query, $status);

            return ApiResponse::success(
                AmenityResource::collection($amenities),
                'Amenities fetched successfully'
            );

        } catch (\Throwable $e) {
            return ApiResponse::error(
                'Failed to fetch amenities',
                500,
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE AMENITY
    |--------------------------------------------------------------------------
    */
    public function store(CreateAmenityRequest $request)
    {
        try {
            $amenity = $this->service->create(
                $request->validated()
            );

            return ApiResponse::created(
                new AmenityResource($amenity),
                'Amenity created successfully'
            );

        } catch (\Throwable $e) {
            return ApiResponse::error(
                'Failed to create amenity',
                500,
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW SINGLE AMENITY
    |--------------------------------------------------------------------------
    */
    public function show(Amenity $amenity)
    {
        return ApiResponse::success(
            new AmenityResource($amenity),
            'Amenity details fetched successfully'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE AMENITY
    |--------------------------------------------------------------------------
    */
    public function update(
        UpdateAmenityRequest $request,
        Amenity $amenity
    )
    {
        try {
            $updated = $this->service->update(
                $amenity->id,
                $request->validated()
            );

            return ApiResponse::updated(
                new AmenityResource($updated),
                'Amenity updated successfully'
            );

        } catch (\Throwable $e) {
            return ApiResponse::error(
                'Failed to update amenity',
                500,
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE AMENITY
    |--------------------------------------------------------------------------
    */
    public function destroy(Amenity $amenity)
    {
        try {
            $this->service->delete($amenity->id);

            return ApiResponse::deleted(
                'Amenity deleted successfully'
            );

        } catch (\Throwable $e) {
            return ApiResponse::error(
                'Failed to delete amenity',
                500,
                $e->getMessage()
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */
    public function toggleStatus(Amenity $amenity)
    {
        try {
            $updated = $this->service->toggleStatus(
                $amenity->id
            );

            return ApiResponse::success(
                new AmenityResource($updated),
                'Amenity status updated successfully'
            );

        } catch (\Throwable $e) {
            return ApiResponse::error(
                'Failed to toggle amenity status',
                500,
                $e->getMessage()
            );
        }
    }
}