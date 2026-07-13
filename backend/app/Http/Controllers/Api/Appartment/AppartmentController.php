<?php

namespace App\Http\Controllers\Api\Appartment;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Helpers\ApiResponse;
use App\Http\Requests\Appartment\StoreApartmentRequests;
use App\Http\Requests\Appartment\UpdateApartmentRequest;
use App\Http\Resources\AppartmentResource;
use App\Services\Appartment\AppartmentService;

class AppartmentController extends Controller
{
    protected AppartmentService $service;

    public function __construct(AppartmentService $service)
    {
        $this->service = $service;

        /*
        |--------------------------------------------------------------------------
        | MIDDLEWARE PROTECTION
        |--------------------------------------------------------------------------
        */

        // Must be logged in
        $this->middleware('auth:sanctum');

        // Optional RBAC protection (adjust permissions to your system)
        $this->middleware('permission:apartments.view')->only(['index', 'show']);
        $this->middleware('permission:apartments.create')->only(['store']);
        $this->middleware('permission:apartments.edit')->only(['update']);
        $this->middleware('permission:apartments.delete')->only(['destroy']);
    }

    /*
    |--------------------------------------------------------------------------
    | LIST APARTMENTS
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        try {
            $apartments = $this->service->getAll($request);

            return ApiResponse::success(
                AppartmentResource::collection($apartments),
                'Apartments fetched successfully'
            );

        } catch (\Exception $e) {
            return ApiResponse::serverError(
                'Failed to fetch apartments',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE APARTMENT
    |--------------------------------------------------------------------------
    */
    public function store(StoreApartmentRequests $request)
    {
        try {
            $apartment = $this->service->create($request->validated());

            return ApiResponse::success(
                new AppartmentResource($apartment),
                'Apartment created successfully',
                201
            );

        } catch (\Exception $e) {
            return ApiResponse::serverError(
                'Failed to create apartment',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW APARTMENT
    |--------------------------------------------------------------------------
    */
    public function show($id)
    {
        try {
            $apartment = $this->service->findById($id);

            return ApiResponse::success(
                new AppartmentResource($apartment),
                'Apartment fetched successfully'
            );

        } catch (\Exception $e) {
            return ApiResponse::notFound('Apartment not found');
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE APARTMENT
    |--------------------------------------------------------------------------
    */
    public function update(UpdateApartmentRequest $request, $id)
    {
        try {
            $apartment = $this->service->update($id, $request->validated());

            return ApiResponse::success(
                new AppartmentResource($apartment),
                'Apartment updated successfully'
            );

        } catch (\Exception $e) {
            return ApiResponse::serverError(
                'Failed to update apartment',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE APARTMENT
    |--------------------------------------------------------------------------
    */
    public function destroy($id)
    {
        try {
            $this->service->delete($id);

            return ApiResponse::success(
                null,
                'Apartment deleted successfully'
            );

        } catch (\Exception $e) {
            return ApiResponse::serverError(
                'Failed to delete apartment',
                $e->getMessage()
            );
        }
    }
}