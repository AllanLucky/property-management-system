<?php

namespace App\Http\Controllers\Api\PropertyType;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| REQUESTS
|--------------------------------------------------------------------------
*/
use App\Http\Requests\PropertyType\CreatePropertyTypeRequest;
use App\Http\Requests\PropertyType\UpdatePropertyTypeRequest;

/*
|--------------------------------------------------------------------------
| MODELS
|--------------------------------------------------------------------------
*/
use App\Models\Property;
use App\Models\PropertyType;

/*
|--------------------------------------------------------------------------
| SERVICE
|--------------------------------------------------------------------------
*/
use App\Services\PropertyTypeService;

/*
|--------------------------------------------------------------------------
| RESOURCE
|--------------------------------------------------------------------------
*/
use App\Http\Resources\PropertyTypeResource;

/*
|--------------------------------------------------------------------------
| API RESPONSE HELPER
|--------------------------------------------------------------------------
*/
use App\Helpers\ApiResponse;

class PropertyTypeController extends Controller
{
    protected PropertyTypeService $service;

    public function __construct(PropertyTypeService $service)
    {
        $this->service = $service;
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        try {

            $propertyTypes = $this->service->getAll($request);

            return ApiResponse::success(
                PropertyTypeResource::collection($propertyTypes),
                'Property types fetched successfully'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch property types',
                $e->getMessage()
            );

        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */
    public function store(CreatePropertyTypeRequest $request)
    {
        try {

            $propertyType = $this->service->create(
                $request->validated()
            );

            return ApiResponse::success(
                new PropertyTypeResource($propertyType),
                'Property type created successfully',
                201
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to create property type',
                $e->getMessage()
            );

        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */
    public function show($id)
    {
        try {

            $propertyType = $this->service->find($id);

            if (!$propertyType) {

                return ApiResponse::notFound(
                    'Property type not found'
                );

            }

            return ApiResponse::success(
                new PropertyTypeResource($propertyType),
                'Property type retrieved successfully'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to fetch property type',
                $e->getMessage()
            );

        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    public function update(
        UpdatePropertyTypeRequest $request,
        $id
    ) {
        try {

            $propertyType = $this->service->update(
                $id,
                $request->validated()
            );

            if (!$propertyType) {

                return ApiResponse::notFound(
                    'Property type not found'
                );

            }

            return ApiResponse::success(
                new PropertyTypeResource($propertyType),
                'Property type updated successfully'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to update property type',
                $e->getMessage()
            );

        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */
    public function destroy($id)
    {
        try {

            /*
            |--------------------------------------------------------------------------
            | FIND PROPERTY TYPE
            |--------------------------------------------------------------------------
            */
            $propertyType = PropertyType::find($id);

            if (!$propertyType) {

                return ApiResponse::notFound(
                    'Property type not found'
                );

            }

            /*
            |--------------------------------------------------------------------------
            | CHECK LINKED PROPERTIES
            |--------------------------------------------------------------------------
            */
            $propertiesCount = Property::where(
                'property_type_id',
                $propertyType->id
            )->count();

            /*
            |--------------------------------------------------------------------------
            | PREVENT DELETE IF LINKED
            |--------------------------------------------------------------------------
            */
            if ($propertiesCount > 0) {

                return ApiResponse::error(
                    'Cannot delete property type because it is linked to properties.',
                    422
                );

            }

            /*
            |--------------------------------------------------------------------------
            | DELETE PROPERTY TYPE
            |--------------------------------------------------------------------------
            */
            $propertyType->delete();

            return ApiResponse::success(
                null,
                'Property type deleted successfully'
            );

        } catch (\Throwable $e) {

            return ApiResponse::serverError(
                'Failed to delete property type',
                $e->getMessage()
            );

        }
    }
}