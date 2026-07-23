<?php

namespace App\Services;

use App\Models\Apartment;
use App\Traits\HandlesImages;
use Illuminate\Support\Facades\DB;

class ApartmentService
{
    use HandlesImages;

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */
    public function getAll($request)
    {
        return Apartment::query()
            ->latest()
            ->paginate(10);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE APARTMENT (WITH IMAGE)
    |--------------------------------------------------------------------------
    */
    public function create(array $data)
    {
        return DB::transaction(function () use ($data) {

            /*
            |------------------------------------------
            | UPLOAD IMAGE IF EXISTS
            |------------------------------------------
            */
            if (isset($data['image'])) {

                $upload = $this->uploadImage(
                    $data['image'],
                    'apartments'
                );

                if ($upload) {
                    $data['image'] = $upload['url'];
                    $data['image_public_id'] = $upload['public_id'];
                } else {
                    unset($data['image']);
                }
            }

            return Apartment::create($data);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | FIND SINGLE
    |--------------------------------------------------------------------------
    */
    public function findById($id)
    {
        return Apartment::findOrFail($id);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE APARTMENT (REPLACE IMAGE)
    |--------------------------------------------------------------------------
    */
    public function update($id, array $data)
    {
        return DB::transaction(function () use ($id, $data) {

            $apartment = Apartment::findOrFail($id);

            /*
            |------------------------------------------
            | REPLACE IMAGE IF NEW ONE EXISTS
            |------------------------------------------
            */
            if (isset($data['image'])) {

                $upload = $this->replaceImage(
                    $data['image'],
                    $apartment->image_public_id ?? null,
                    'apartments'
                );

                if ($upload) {
                    $data['image'] = $upload['url'];
                    $data['image_public_id'] = $upload['public_id'];
                } else {
                    unset($data['image']);
                }
            }

            $apartment->update($data);

            return $apartment;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE APARTMENT (DELETE IMAGE TOO)
    |--------------------------------------------------------------------------
    */
    public function delete($id)
    {
        return DB::transaction(function () use ($id) {

            $apartment = Apartment::findOrFail($id);

            /*
            |------------------------------------------
            | DELETE IMAGE FROM CLOUDINARY
            |------------------------------------------
            */
            if ($apartment->image_public_id) {
                $this->deleteImage($apartment->image_public_id);
            }

            $apartment->delete();

            return true;
        });
    }
}