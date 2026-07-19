<?php

namespace App\Services;

use App\Models\PropertyFavorite;
use App\Repositories\Interfaces\PropertyFavoriteRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Exception;


class PropertyFavoriteService
{

    public function __construct(
        protected PropertyFavoriteRepositoryInterface $favoriteRepository
    ) {}



    /**
     * Get all favorites
     */
    public function getAll(array $filters = []): Collection
    {
        return $this->favoriteRepository->all($filters);
    }





    /**
     * Get paginated favorites
     */
    public function paginate(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator {

        return $this->favoriteRepository
            ->paginate($perPage, $filters);

    }





    /**
     * Find favorite
     */
    public function find(
        int $id
    ): ?PropertyFavorite {

        return $this->favoriteRepository
            ->findById($id);

    }





    /**
     * Create favorite
     */
    public function create(
        array $data
    ): PropertyFavorite {


        DB::beginTransaction();

        try {


            /*
            |--------------------------------------------------------------------------
            | Prevent Duplicate Favorite
            |--------------------------------------------------------------------------
            */

            $exists = $this->favoriteRepository
                ->exists(
                    $data['user_id'],
                    $data['property_id']
                );


            if ($exists) {

                throw new Exception(
                    'Property already added to favorites.'
                );

            }



            $favorite = $this->favoriteRepository
                ->create($data);



            DB::commit();


            return $favorite;



        } catch(Exception $e) {


            DB::rollBack();


            throw $e;

        }

    }





    /**
     * Update favorite
     */
    public function update(
        PropertyFavorite $favorite,
        array $data
    ): bool {


        return $this->favoriteRepository
            ->update(
                $favorite,
                $data
            );

    }





    /**
     * Delete favorite
     */
    public function delete(
        PropertyFavorite $favorite
    ): bool {


        return $this->favoriteRepository
            ->delete($favorite);

    }





    /**
     * Toggle favorite
     *
     * Add / Remove favorite
     */
    public function toggle(
        int $userId,
        int $propertyId,
        array $extra = []
    ): array {


        DB::beginTransaction();


        try {


            $favorite = $this->favoriteRepository
                ->findUserFavorite(
                    $userId,
                    $propertyId
                );



            /*
            |--------------------------------------------------------------------------
            | Remove Favorite
            |--------------------------------------------------------------------------
            */

            if ($favorite) {


                $this->favoriteRepository
                    ->delete($favorite);


                DB::commit();



                return [

                    'action'=>'removed',

                    'favorite'=>null,

                ];

            }




            /*
            |--------------------------------------------------------------------------
            | Add Favorite
            |--------------------------------------------------------------------------
            */

            $favorite = $this->favoriteRepository
                ->create([

                    'user_id'=>$userId,

                    'property_id'=>$propertyId,

                    'is_active'=>true,

                    ...$extra,

                ]);



            DB::commit();



            return [

                'action'=>'added',

                'favorite'=>$favorite,

            ];



        } catch(Exception $e) {


            DB::rollBack();


            throw $e;

        }

    }





    /**
     * Check favorite status
     */
    public function checkStatus(
        int $userId,
        int $propertyId
    ): bool {


        return $this->favoriteRepository
            ->exists(
                $userId,
                $propertyId
            );

    }





    /**
     * Get user favorites
     */
    public function userFavorites(
        int $userId,
        int $perPage = 15
    ): LengthAwarePaginator {


        return $this->favoriteRepository
            ->userFavorites(
                $userId,
                $perPage
            );

    }

}