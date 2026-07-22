<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PropertyFavorite;
use App\Models\User;
use App\Models\Property;

class PropertyFavoritesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        /*
        |--------------------------------------------------------------------------
        | CHECK DATA EXISTS
        |--------------------------------------------------------------------------
        */

        $users = User::all();

        $properties = Property::all();


        if ($users->isEmpty() || $properties->isEmpty()) {

            $this->command->warn(
                'Users or Properties table is empty. Favorite seeder skipped.'
            );

            return;
        }



        /*
        |--------------------------------------------------------------------------
        | CREATE FAVORITES
        |--------------------------------------------------------------------------
        */

        foreach ($users as $user) {


            /*
            |--------------------------------------------------------------------------
            | Each User Favorite Random Properties
            |--------------------------------------------------------------------------
            */

            $favoriteProperties = $properties
                ->random(
                    min(
                        rand(1,5),
                        $properties->count()
                    )
                );


            foreach ($favoriteProperties as $property) {


                PropertyFavorite::updateOrCreate(

                    [
                        'user_id' => $user->id,

                        'property_id' => $property->id,
                    ],


                    [

                        'apartment_id' => null,

                        'unit_id' => null,

                        'is_active' => true,

                    ]

                );

            }

        }



        $this->command->info(
            'Property favorites seeded successfully.'
        );

    }
}