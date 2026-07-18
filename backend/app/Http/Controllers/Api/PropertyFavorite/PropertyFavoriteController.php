<?php

namespace App\Http\Controllers\Api\PropertyFavorite;

use App\Http\Controllers\Controller;

use Illuminate\Http\Request;

use App\Helpers\ApiResponse;

use App\Models\PropertyFavorite;

use App\Http\Requests\PropertyFavorite\CreatePropertyFavoriteRequest;
use App\Http\Requests\PropertyFavorite\UpdatePropertyFavoriteRequest;

use App\Http\Resources\PropertyFavoriteResource;

use App\Services\PropertyFavoriteService;

use Illuminate\Support\Facades\Auth;
use Exception;



class PropertyFavoriteController extends Controller
{

    public function __construct(
        protected PropertyFavoriteService $favoriteService
    ) {}



    /*
    |--------------------------------------------------------------------------
    | GET ALL FAVORITES
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        try {


            $favorites = $this->favoriteService->paginate(
                $request->get('per_page',15),
                $request->all()
            );


            return ApiResponse::paginated(
                PropertyFavoriteResource::collection($favorites),
                'Favorites fetched successfully'
            );


        } catch(Exception $e) {


            return ApiResponse::serverError(
                'Failed to fetch favorites',
                $e->getMessage()
            );

        }
    }





    /*
    |--------------------------------------------------------------------------
    | STORE FAVORITE
    |--------------------------------------------------------------------------
    */
    public function store(
        CreatePropertyFavoriteRequest $request
    ) {

        try {


            $favorite = $this->favoriteService->create([

                'user_id'=>Auth::id(),

                'property_id'=>$request->property_id,

                'apartment_id'=>$request->apartment_id,

                'unit_id'=>$request->unit_id,

                'source'=>$request->source ?? 'web',

                'is_active'=>true,

            ]);



            return ApiResponse::created(

                new PropertyFavoriteResource(
                    $favorite->load([
                        'user',
                        'property',
                        'apartment',
                        'unit'
                    ])
                ),

                'Property added to favorites'

            );



        } catch(Exception $e) {


            return ApiResponse::conflict(
                $e->getMessage()
            );

        }

    }







    /*
    |--------------------------------------------------------------------------
    | SHOW FAVORITE
    |--------------------------------------------------------------------------
    */
    public function show(
        int $id
    ) {

        try {


            $favorite = $this->favoriteService
                ->find($id);



            if(!$favorite){

                return ApiResponse::notFound(
                    'Favorite not found'
                );

            }



            return ApiResponse::success(

                new PropertyFavoriteResource($favorite),

                'Favorite fetched successfully'

            );



        } catch(Exception $e) {


            return ApiResponse::serverError(
                'Failed to fetch favorite',
                $e->getMessage()
            );

        }

    }







    /*
    |--------------------------------------------------------------------------
    | UPDATE FAVORITE
    |--------------------------------------------------------------------------
    */
    public function update(
        UpdatePropertyFavoriteRequest $request,
        PropertyFavorite $favorite
    ) {

        try {


            $this->favoriteService->update(
                $favorite,
                $request->validated()
            );



            return ApiResponse::updated(

                new PropertyFavoriteResource(
                    $favorite->fresh([
                        'user',
                        'property',
                        'apartment',
                        'unit'
                    ])
                ),

                'Favorite updated successfully'

            );



        } catch(Exception $e) {


            return ApiResponse::serverError(
                'Failed to update favorite',
                $e->getMessage()
            );

        }

    }








    /*
    |--------------------------------------------------------------------------
    | DELETE FAVORITE
    |--------------------------------------------------------------------------
    */
    public function destroy(
        PropertyFavorite $favorite
    ) {

        try {


            $id = $favorite->id;



            $this->favoriteService
                ->delete($favorite);



            return ApiResponse::deleted(

                [
                    'id'=>$id
                ],

                'Favorite removed successfully'

            );



        } catch(Exception $e) {


            return ApiResponse::serverError(
                'Failed to delete favorite',
                $e->getMessage()
            );

        }

    }







    /*
    |--------------------------------------------------------------------------
    | TOGGLE FAVORITE
    |--------------------------------------------------------------------------
    */
    public function toggle(
        Request $request,
        int $propertyId
    ) {

        try {


            $result = $this->favoriteService->toggle(

                Auth::id(),

                $propertyId,

                [
                    'source'=>$request->source ?? 'web'
                ]

            );



            return ApiResponse::success(

                $result,

                $result['action'] === 'added'
                    ? 'Property added to favorites'
                    : 'Property removed from favorites'

            );



        } catch(Exception $e) {


            return ApiResponse::serverError(
                'Favorite action failed',
                $e->getMessage()
            );

        }

    }







    /*
    |--------------------------------------------------------------------------
    | CHECK FAVORITE STATUS
    |--------------------------------------------------------------------------
    */
    public function status(
        int $propertyId
    ) {


        try {


            $isFavorite = $this->favoriteService
                ->checkStatus(

                    Auth::id(),

                    $propertyId

                );



            return ApiResponse::success(

                [
                    'property_id'=>$propertyId,

                    'is_favorite'=>$isFavorite

                ],

                'Favorite status fetched successfully'

            );



        } catch(Exception $e) {


            return ApiResponse::serverError(
                'Unable to check favorite status',
                $e->getMessage()
            );

        }

    }







    /*
    |--------------------------------------------------------------------------
    | MY FAVORITES
    |--------------------------------------------------------------------------
    */
    public function myFavorites(Request $request)
    {

        try {


            $favorites = $this->favoriteService
                ->userFavorites(

                    Auth::id(),

                    $request->get('per_page',15)

                );



            return ApiResponse::paginated(

                PropertyFavoriteResource::collection($favorites),

                'My favorites fetched successfully'

            );



        } catch(Exception $e) {


            return ApiResponse::serverError(
                'Failed to fetch my favorites',
                $e->getMessage()
            );

        }

    }

}