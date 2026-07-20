<?php

namespace App\Http\Controllers\Api\PropertyFavorite;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\PropertyFavorite\StorePropertyFavoriteRequest;
use App\Http\Requests\PropertyFavorite\UpdatePropertyFavoriteRequest;
use App\Http\Resources\PropertyFavoriteResource;
use App\Models\PropertyFavorite;
use App\Services\PropertyFavoriteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Exception;

class PropertyFavoriteController extends Controller
{
    public function __construct(
        protected PropertyFavoriteService $favoriteService
    ) {}

    /**
     * --------------------------------------------------------------------------
     * Display a listing of property favorites.
     * --------------------------------------------------------------------------
     */
    public function index(Request $request): JsonResponse
    {
        try {

            $favorites = $this->favoriteService->paginate(
                perPage: (int) $request->input('per_page', 15),
                filters: [
                    'search'      => $request->input('search'),
                    'user_id'     => $request->input('user_id'),
                    'property_id' => $request->input('property_id'),
                    'is_active'   => $request->input('is_active'),
                    'sort_by'     => $request->input('sort_by', 'created_at'),
                    'sort_order'  => $request->input('sort_order', 'desc'),
                ]
            );

            $favorites->setCollection(
                PropertyFavoriteResource::collection(
                    $favorites->getCollection()
                )->collection
            );

            return ApiResponse::paginated(
                $favorites,
                'Property favorites retrieved successfully.'
            );

        } catch (Exception $e) {

            return ApiResponse::serverError(
                'Failed to retrieve property favorites.',
                $e->getMessage()
            );

        }
    }
        /**
     * --------------------------------------------------------------------------
     * Store a newly created property favorite.
     * --------------------------------------------------------------------------
     */
    public function store(
        StorePropertyFavoriteRequest $request
    ): JsonResponse {

        try {

            $favorite = $this->favoriteService->create(
                $request->validated()
            );

            return ApiResponse::created(
                new PropertyFavoriteResource($favorite),
                'Property added to favorites successfully.'
            );

        } catch (Exception $e) {

            return ApiResponse::conflict(
                $e->getMessage()
            );

        }

    }





    /**
     * --------------------------------------------------------------------------
     * Display the specified property favorite.
     * --------------------------------------------------------------------------
     */
    public function show(
        PropertyFavorite $favorite
    ): JsonResponse {

        try {

            return ApiResponse::success(
                new PropertyFavoriteResource($favorite),
                'Property favorite retrieved successfully.'
            );

        } catch (Exception $e) {

            return ApiResponse::serverError(
                'Failed to retrieve property favorite.',
                $e->getMessage()
            );

        }

    }





    /**
     * --------------------------------------------------------------------------
     * Update the specified property favorite.
     * --------------------------------------------------------------------------
     */
    public function update(
        UpdatePropertyFavoriteRequest $request,
        PropertyFavorite $favorite
    ): JsonResponse {

        try {

            $this->favoriteService->update(
                $favorite,
                $request->validated()
            );

            $favorite->refresh();

            return ApiResponse::updated(
                new PropertyFavoriteResource($favorite),
                'Property favorite updated successfully.'
            );

        } catch (Exception $e) {

            return ApiResponse::serverError(
                'Failed to update property favorite.',
                $e->getMessage()
            );

        }

    }
        /**
     * --------------------------------------------------------------------------
     * Remove the specified property favorite.
     * --------------------------------------------------------------------------
     */
    public function destroy(
        PropertyFavorite $favorite
    ): JsonResponse {

        try {

            $this->favoriteService->delete($favorite);

            return ApiResponse::deleted(
                null,
                'Property favorite deleted successfully.'
            );

        } catch (Exception $e) {

            return ApiResponse::serverError(
                'Failed to delete property favorite.',
                $e->getMessage()
            );

        }

    }
    /**
     * --------------------------------------------------------------------------
     * Toggle property favorite.
     * --------------------------------------------------------------------------
     */
    public function toggle(
        Request $request,
        int $propertyId
    ): JsonResponse {

        try {

            $result = $this->favoriteService->toggle(
                userId: auth()->id(),
                propertyId: $propertyId,
                extra: [
                    'notes' => $request->input('notes'),
                ]
            );

            return ApiResponse::success(
                [
                    'action' => $result['action'],
                    'favorite' => $result['favorite']
                        ? new PropertyFavoriteResource($result['favorite'])
                        : null,
                ],
                $result['action'] === 'added'
                    ? 'Property added to favorites successfully.'
                    : 'Property removed from favorites successfully.'
            );

        } catch (Exception $e) {

            return ApiResponse::serverError(
                'Failed to toggle property favorite.',
                $e->getMessage()
            );

        }

    }
        /**
     * --------------------------------------------------------------------------
     * Check favorite status.
     * --------------------------------------------------------------------------
     */
    public function status(
        int $propertyId
    ): JsonResponse {

        try {

            $isFavorite = $this->favoriteService->checkStatus(
                auth()->id(),
                $propertyId
            );

            return ApiResponse::success(
                [
                    'property_id' => $propertyId,
                    'is_favorite' => $isFavorite,
                ],
                'Favorite status retrieved successfully.'
            );

        } catch (Exception $e) {

            return ApiResponse::serverError(
                'Failed to retrieve favorite status.',
                $e->getMessage()
            );

        }

    }





    /**
     * --------------------------------------------------------------------------
     * Get authenticated user's favorites.
     * --------------------------------------------------------------------------
     */
    public function myFavorites(
        Request $request
    ): JsonResponse {

        try {

            $favorites = $this->favoriteService->userFavorites(
                auth()->id(),
                (int) $request->input('per_page', 15)
            );

            $favorites->setCollection(
                PropertyFavoriteResource::collection(
                    $favorites->getCollection()
                )->collection
            );

            return ApiResponse::paginated(
                $favorites,
                'My favorite properties retrieved successfully.'
            );

        } catch (Exception $e) {

            return ApiResponse::serverError(
                'Failed to retrieve favorite properties.',
                $e->getMessage()
            );

        }

    }

}