<?php

namespace App\Http\Controllers\Api\Apartment;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Apartment\StoreApartmentRequest;
use App\Http\Requests\Apartment\UpdateApartmentRequest;
use App\Http\Resources\ApartmentResource;
use App\Services\ApartmentService;
use Illuminate\Http\Request;

class ApartmentController extends Controller
{
    /**
     * Apartment Service
     */
    protected ApartmentService $service;

    /**
     * Constructor
     */
    public function __construct(ApartmentService $service)
    {
        $this->service = $service;

        /*
        |--------------------------------------------------------------------------
        | Middleware
        |--------------------------------------------------------------------------
        */

        $this->middleware('auth:sanctum');
        $this->middleware('permission:apartments.view')->only(['index', 'show']);
        $this->middleware('permission:apartments.create')->only(['store']);
        $this->middleware('permission:apartments.edit')->only(['update']);
        $this->middleware('permission:apartments.delete')->only(['destroy']);
           
    }

    /*
    |--------------------------------------------------------------------------
    | List Apartments
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        try {

            $apartments = $this->service->getAll($request->all());

            return ApiResponse::success(
                ApartmentResource::collection($apartments),
                'Apartments fetched successfully'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch apartments',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Store Apartment
    |--------------------------------------------------------------------------
    */
    public function store(StoreApartmentRequest $request)
    {
        try {

            $apartment = $this->service->create(
                $request->validated()
            );

            return ApiResponse::success(
                new ApartmentResource($apartment),
                'Apartment created successfully',
                201
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to create apartment',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Show Apartment
    |--------------------------------------------------------------------------
    */
    public function show($id)
    {
        try {

            $apartment = $this->service->findById($id);

            return ApiResponse::success(
                new ApartmentResource($apartment),
                'Apartment fetched successfully'
            );

        } catch (\Throwable $e) {

            return ApiResponse::notFound(
                'Apartment not found'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Update Apartment
    |--------------------------------------------------------------------------
    */
    public function update(UpdateApartmentRequest $request, $id)
    {
        try {

            $apartment = $this->service->update(
                $id,
                $request->validated()
            );

            return ApiResponse::success(
                new ApartmentResource($apartment),
                'Apartment updated successfully'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to update apartment',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Apartment
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

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to delete apartment',
                $e->getMessage()
            );
        }
    }
}