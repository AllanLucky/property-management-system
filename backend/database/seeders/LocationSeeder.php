<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Property;

class LocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | LOCATION DATA
        |--------------------------------------------------------------------------
        |
        | These values are stored directly on the properties table:
        |
        | country_name
        | region_name
        | county_name
        | city_name
        | area_name
        | street_address
        |
        |--------------------------------------------------------------------------
        */

        $locations = [

            /*
            |--------------------------------------------------------------------------
            | KENYA
            |--------------------------------------------------------------------------
            */
            [
                'country_name' => 'Kenya',
                'region_name'  => 'Nairobi Region',
                'county_name'  => 'Nairobi County',
                'city_name'    => 'Nairobi',

                'areas' => [
                    'Westlands',
                    'Kilimani',
                    'Kileleshwa',
                    'Karen',
                    'Lavington',
                    'Runda',
                    'Muthaiga',
                    'Parklands',
                    'Hurlingham',
                    'South B',
                    'South C',
                    'Eastleigh',
                    'Embakasi',
                    'Kasarani',
                    'Roysambu',
                    'Langata',
                    'Dagoretti',
                    'Ngong Road',
                    'Upper Hill',
                    'Gigiri',
                    'Spring Valley',
                    'Riverside',
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | UGANDA
            |--------------------------------------------------------------------------
            */
            [
                'country_name' => 'Uganda',
                'region_name'  => 'Central Region',
                'county_name'  => 'Kampala District',
                'city_name'    => 'Kampala',

                'areas' => [
                    'Kampala Central',
                    'Ntinda',
                    'Nakasero',
                    'Kololo',
                    'Naguru',
                    'Bugolobi',
                    'Muyenga',
                    'Makindye',
                    'Kansanga',
                    'Bukoto',
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | TANZANIA
            |--------------------------------------------------------------------------
            */
            [
                'country_name' => 'Tanzania',
                'region_name'  => 'Dar es Salaam Region',
                'county_name'  => 'Ilala District',
                'city_name'    => 'Dar es Salaam',

                'areas' => [
                    'Masaki',
                    'Oysterbay',
                    'Mikocheni',
                    'Upanga',
                    'Msasani',
                    'Kinondoni',
                    'Sinza',
                    'Kijitonyama',
                    'Kariakoo',
                    'Mbezi',
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | RWANDA
            |--------------------------------------------------------------------------
            */
            [
                'country_name' => 'Rwanda',
                'region_name'  => 'Kigali Province',
                'county_name'  => 'Kigali District',
                'city_name'    => 'Kigali',

                'areas' => [
                    'Kacyiru',
                    'Nyarutarama',
                    'Kimihurura',
                    'Remera',
                    'Kiyovu',
                    'Gacuriro',
                    'Nyamirambo',
                    'Kibagabaga',
                    'Kagugu',
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | NIGERIA
            |--------------------------------------------------------------------------
            */
            [
                'country_name' => 'Nigeria',
                'region_name'  => 'Lagos State',
                'county_name'  => 'Lagos Mainland',
                'city_name'    => 'Lagos',

                'areas' => [
                    'Victoria Island',
                    'Ikoyi',
                    'Lekki',
                    'Yaba',
                    'Surulere',
                    'Ikeja',
                    'Maryland',
                    'Magodo',
                    'Ajah',
                    'Chevron',
                    'Banana Island',
                    'Oniru',
                    'Ikate',
                    'Admiralty',
                ],
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | SEED LOCATIONS
        |--------------------------------------------------------------------------
        |
        | We create a property record for each location combination.
        | The location names are stored directly on the properties table.
        |
        |--------------------------------------------------------------------------
        */

        foreach ($locations as $location) {

            foreach ($location['areas'] as $area) {

                Property::updateOrCreate(
                    [
                        'country_name' => $location['country_name'],
                        'region_name'  => $location['region_name'],
                        'county_name'  => $location['county_name'],
                        'city_name'    => $location['city_name'],
                        'area_name'    => $area,
                    ],
                    [
                        'title'          => $area . ', ' . $location['city_name'],
                        'description'    => 'Property located in ' . $area . ', ' . $location['city_name'] . ', ' . $location['county_name'] . ', ' . $location['country_name'] . '.',
                        'listing_type'   => 'sale',
                        'status'         => 'draft',
                        'is_featured'    => false,
                        'is_verified'    => false,
                        'is_published'   => false,
                    ]
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SUCCESS MESSAGE
        |--------------------------------------------------------------------------
        */

        $this->command?->info('Property location data seeded successfully.');
    }
}

