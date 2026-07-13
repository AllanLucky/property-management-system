<?php

namespace App\Http\Controllers\Api\PropertyCategory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/*
|--------------------------------------------------------------------------
| REQUESTS
|--------------------------------------------------------------------------
*/
use App\Http\Requests\PropertyCategory\CreatePropertyCategoryRequest;
use App\Http\Requests\PropertyCategory\UpdatePropertyCategoryRequest;

/*
|--------------------------------------------------------------------------
| SERVICES & RESOURCES
|--------------------------------------------------------------------------
*/
use App\Services\PropertyCategoryService;
use App\Http\Resources\PropertyCategoryResource;

/*
|--------------------------------------------------------------------------
| API RESPONSE HELPER
|--------------------------------------------------------------------------
*/
use App\Helpers\ApiResponse;

class PropertyCategoryController extends Controller
{
    public function __construct(
        protected PropertyCategoryService $service
    ) {
        /*
        |--------------------------------------------------------------------------
        | RBAC PERMISSIONS
        |--------------------------------------------------------------------------
        */
        $this->middleware('permission:view property categories')
            ->only(['index', 'show']);

        $this->middleware('permission:create property categories')
            ->only(['store']);

        $this->middleware('permission:edit property categories')
            ->only(['update']);

        $this->middleware('permission:delete property categories')
            ->only(['destroy']);

        $this->middleware('permission:restore property categories')
            ->only(['restore']);

        $this->middleware('permission:force delete property categories')
            ->only(['forceDelete']);
    }


    /*
    |--------------------------------------------------------------------------
    | GET ALL PROPERTY CATEGORIES
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        try {

            $categories = $this->service
                ->getAll($request->all())
                ->loadCount('properties');

            return ApiResponse::success(
                PropertyCategoryResource::collection($categories),
                'Property categories fetched successfully'
            );

        } catch (Throwable $e) {

            Log::error('Failed to fetch property categories', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return ApiResponse::error(
                'Failed to fetch property categories',
                [],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | GET SINGLE PROPERTY CATEGORY
    |--------------------------------------------------------------------------
    */
    public function show(int $id)
    {
        try {

            $category = $this->service
                ->getById($id);

            $category->load([
                'properties',
            ])->loadCount('properties');


            $this->service->incrementViews($id);


            return ApiResponse::success(
                new PropertyCategoryResource($category),
                'Property category fetched successfully'
            );

        } catch (Throwable $e) {

            Log::error('Failed to fetch property category', [
                'category_id' => $id,
                'message' => $e->getMessage(),
            ]);

            return ApiResponse::error(
                'Property category not found',
                [],
                404
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE PROPERTY CATEGORY
    |--------------------------------------------------------------------------
    */
    public function store(CreatePropertyCategoryRequest $request)
    {
        try {

            $category = $this->service
                ->create($request->validated())
                ->loadCount('properties');


            return ApiResponse::success(
                new PropertyCategoryResource($category),
                'Property category created successfully',
                201
            );

        } catch (Throwable $e) {

            Log::error('Failed to create property category', [
                'message' => $e->getMessage(),
                'data' => $request->validated(),
            ]);


            return ApiResponse::error(
                'Failed to create property category',
                [],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE PROPERTY CATEGORY
    |--------------------------------------------------------------------------
    */
    public function update(
        UpdatePropertyCategoryRequest $request,
        int $id
    ) {
        try {

            $category = $this->service
                ->update($id, $request->validated())
                ->loadCount('properties');


            return ApiResponse::success(
                new PropertyCategoryResource($category),
                'Property category updated successfully'
            );

        } catch (Throwable $e) {

            Log::error('Failed to update property category', [
                'category_id' => $id,
                'message' => $e->getMessage(),
            ]);


            return ApiResponse::error(
                'Failed to update property category',
                [],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE PROPERTY CATEGORY
    |--------------------------------------------------------------------------
    */
    public function destroy(int $id)
    {
        try {

            $this->service->delete($id);


            return ApiResponse::success(
                null,
                'Property category deleted successfully'
            );

        } catch (Throwable $e) {

            Log::error('Failed to delete property category', [
                'category_id' => $id,
                'message' => $e->getMessage(),
            ]);


            return ApiResponse::error(
                'Failed to delete property category',
                [],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | RESTORE PROPERTY CATEGORY
    |--------------------------------------------------------------------------
    */
    public function restore(int $id)
    {
        try {

            $category = $this->service
                ->restore($id)
                ->loadCount('properties');


            return ApiResponse::success(
                new PropertyCategoryResource($category),
                'Property category restored successfully'
            );

        } catch (Throwable $e) {

            Log::error('Failed to restore property category', [
                'category_id' => $id,
                'message' => $e->getMessage(),
            ]);


            return ApiResponse::error(
                'Failed to restore property category',
                [],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE PROPERTY CATEGORY
    |--------------------------------------------------------------------------
    */
    public function forceDelete(int $id)
    {
        try {

            $this->service->forceDelete($id);


            return ApiResponse::success(
                null,
                'Property category permanently deleted'
            );

        } catch (Throwable $e) {

            Log::error('Failed to permanently delete property category', [
                'category_id' => $id,
                'message' => $e->getMessage(),
            ]);


            return ApiResponse::error(
                'Failed to permanently delete property category',
                [],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | TOGGLE CATEGORY STATUS
    |--------------------------------------------------------------------------
    */
    public function toggleStatus(int $id)
    {
        try {

            $category = $this->service
                ->toggleStatus($id)
                ->loadCount('properties');


            return ApiResponse::success(
                new PropertyCategoryResource($category),
                'Category status updated successfully'
            );

        } catch (Throwable $e) {

            Log::error('Failed to toggle category status', [
                'category_id' => $id,
                'message' => $e->getMessage(),
            ]);


            return ApiResponse::error(
                'Failed to update category status',
                [],
                500
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | TOGGLE FEATURED STATUS
    |--------------------------------------------------------------------------
    */
    public function toggleFeatured(int $id)
    {
        try {

            $category = $this->service
                ->toggleFeatured($id)
                ->loadCount('properties');


            return ApiResponse::success(
                new PropertyCategoryResource($category),
                'Category featured status updated successfully'
            );

        } catch (Throwable $e) {

            Log::error('Failed to toggle featured status', [
                'category_id' => $id,
                'message' => $e->getMessage(),
            ]);


            return ApiResponse::error(
                'Failed to update featured status',
                [],
                500
            );
        }
    }
}