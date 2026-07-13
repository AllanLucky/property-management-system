<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Country;
use App\Models\Region;
use App\Models\County;
use App\Models\City;
use App\Models\Area;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | MASTER LOCATION DATA (5 COUNTRIES)
        |--------------------------------------------------------------------------
        */
        $locations = [
            [
                'country' => 'Kenya',
                'code'    => 'KE',
                'region'  => 'Nairobi Region',
                'county'  => 'Nairobi County',
                'city'    => 'Nairobi',
                'areas'   => [
                    'Westlands',
                    'Kilimani',
                    'Kileleshwa',
                    'Karen',
                    'Eastleigh',
                    'South B',
                    'Embakasi',
                ],
            ],
            [
                'country' => 'Uganda',
                'code'    => 'UG',
                'region'  => 'Central Region',
                'county'  => 'Kampala District',
                'city'    => 'Kampala',
                'areas'   => [
                    'Kampala Central',
                    'Ntinda',
                    'Nakasero',
                    'Kololo',
                ],
            ],
            [
                'country' => 'Tanzania',
                'code'    => 'TZ',
                'region'  => 'Dar es Salaam Region',
                'county'  => 'Ilala District',
                'city'    => 'Dar es Salaam',
                'areas'   => [
                    'Masaki',
                    'Oysterbay',
                    'Mikocheni',
                    'Upanga',
                ],
            ],
            [
                'country' => 'Rwanda',
                'code'    => 'RW',
                'region'  => 'Kigali Province',
                'county'  => 'Kigali District',
                'city'    => 'Kigali',
                'areas'   => [
                    'Kacyiru',
                    'Nyarutarama',
                    'Kimihurura',
                    'Remera',
                ],
            ],
            [
                'country' => 'Nigeria',
                'code'    => 'NG',
                'region'  => 'Lagos State',
                'county'  => 'Lagos Mainland',
                'city'    => 'Lagos',
                'areas'   => [
                    'Victoria Island',
                    'Ikoyi',
                    'Lekki',
                    'Yaba',
                ],
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | SEED LOOP
        |--------------------------------------------------------------------------
        */
        foreach ($locations as $loc) {

            // COUNTRY
            $country = Country::firstOrCreate(
                ['code' => $loc['code']],
                [
                    'name'      => $loc['country'],
                    'slug'      => Str::slug($loc['country']),
                    'is_active' => true,
                ]
            );

            // REGION
            $region = Region::firstOrCreate(
                [
                    'country_id' => $country->id,
                    'name'       => $loc['region'],
                ],
                [
                    'slug'      => Str::slug($loc['region']),
                    'is_active' => true,
                ]
            );

            // COUNTY
            $county = County::firstOrCreate(
                [
                    'country_id' => $country->id,
                    'region_id'  => $region->id,
                    'name'       => $loc['county'],
                ],
                [
                    'slug'      => Str::slug($loc['county']),
                    'is_active' => true,
                ]
            );

            // CITY
            $city = City::firstOrCreate(
                [
                    'country_id' => $country->id,
                    'region_id'  => $region->id,
                    'county_id'  => $county->id,
                    'name'       => $loc['city'],
                ],
                [
                    'slug'      => Str::slug($loc['city']),
                    'is_active' => true,
                ]
            );

            // AREAS
            foreach ($loc['areas'] as $areaName) {
                Area::firstOrCreate(
                    [
                        'city_id' => $city->id,
                        'name'    => $areaName,
                    ],
                    [
                        'country_id' => $country->id,
                        'region_id'  => $region->id,
                        'county_id'  => $county->id,
                        'slug'       => Str::slug($areaName),
                        'is_active'  => true,
                    ]
                );
            }
        }
    }
}