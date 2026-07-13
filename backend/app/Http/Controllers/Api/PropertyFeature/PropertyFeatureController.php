<?php

namespace App\Http\Controllers\Api\PropertyFeature;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Services\PropertyFeatureService;
use App\Http\Requests\Property_feature\CreatePropertyFeatureRequest;
use App\Http\Requests\Property_feature\UpdatePropertyFeatureRequest;

class PropertyFeatureController extends Controller
{
    protected PropertyFeatureService $propertyFeatureService;

    public function __construct(PropertyFeatureService $propertyFeatureService)
    {
        $this->propertyFeatureService = $propertyFeatureService;

        $this->middleware('auth:sanctum');

        $this->middleware('permission:properties.view')->only([
            'index',
            'show',
            'showBySlug',
            'highlighted',
            'propertyFeatures',
            'search',
        ]);

        $this->middleware('permission:properties.create')->only([
            'store',
        ]);

        $this->middleware('permission:properties.edit')->only([
            'update',
            'toggleStatus',
            'toggleHighlight',
        ]);

        $this->middleware('permission:properties.delete')->only([
            'destroy',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'search' => $request->input('search'),
                'type' => $request->input('type'),
                'is_active' => $request->has('is_active')
                    ? filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN)
                    : null,

                'is_highlighted' => $request->has('is_highlighted')
                    ? filter_var($request->input('is_highlighted'), FILTER_VALIDATE_BOOLEAN)
                    : null,
            ];

            $perPage = (int) $request->input('per_page', 15);

            return $this->propertyFeatureService->getAll($filters, $perPage);

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to fetch property features.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */
    public function store(CreatePropertyFeatureRequest $request): JsonResponse
    {
        try {
            return $this->propertyFeatureService->create(
                $request->validated()
            );

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to create property feature.',
                $e->getMessage()
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
            return $this->propertyFeatureService->getById($id);

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to fetch property feature.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW BY SLUG
    |--------------------------------------------------------------------------
    */
    public function showBySlug(string $slug): JsonResponse
    {
        try {
            return $this->propertyFeatureService->getBySlug($slug);

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to fetch property feature.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    public function update(UpdatePropertyFeatureRequest $request, int $id): JsonResponse
    {
        try {
            return $this->propertyFeatureService->update(
                $id,
                $request->validated()
            );

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to update property feature.',
                $e->getMessage()
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
            return $this->propertyFeatureService->delete($id);

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to delete property feature.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY FEATURES (PIVOT SAFE)
    |--------------------------------------------------------------------------
    */
    public function propertyFeatures(int $propertyId, Request $request): JsonResponse
    {
        try {
            $activeOnly = $request->boolean('active_only', false);

            return $this->propertyFeatureService->getByProperty(
                $propertyId,
                $activeOnly
            );

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to fetch property features.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | HIGHLIGHTED
    |--------------------------------------------------------------------------
    */
    public function highlighted(Request $request): JsonResponse
    {
        try {
            $limit = (int) $request->input('limit', 10);

            return $this->propertyFeatureService->getHighlighted($limit);

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to fetch highlighted features.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */
    public function toggleStatus(int $id): JsonResponse
    {
        try {
            return $this->propertyFeatureService->toggleStatus($id);

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to toggle status.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE HIGHLIGHT
    |--------------------------------------------------------------------------
    */
    public function toggleHighlight(int $id): JsonResponse
    {
        try {
            return $this->propertyFeatureService->toggleHighlight($id);

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to toggle highlight.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */
    public function search(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'search' => 'required|string|min:1',
            ]);

            return $this->propertyFeatureService->search(
                $request->input('search'),
                (int) $request->input('per_page', 15)
            );

        } catch (Exception $e) {
            return ApiResponse::serverError(
                'Failed to search features.',
                $e->getMessage()
            );
        }
    }
}