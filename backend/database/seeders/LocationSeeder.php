<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\City;
use App\Models\Country;
use App\Models\County;
use App\Models\Region;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class LocationSeeder extends Seeder
{
    /**
     * Seed the complete location hierarchy.
     *
     * Country -> Region -> County -> City -> Area
     *
     * This seeder owns location creation and updates.
     * Other seeders should retrieve existing locations rather
     * than create their own location records.
     */
    public function run(): void
    {
        $locations = [

            /*
            |--------------------------------------------------------------------------
            | KENYA
            |--------------------------------------------------------------------------
            */

            [
                'country' => 'Kenya',
                'code' => 'KE',
                'phone_code' => '+254',
                'currency' => 'KES',

                'regions' => [
                    [
                        'name' => 'Nairobi Region',
                        'code' => 'NBI',

                        'counties' => [
                            [
                                'name' => 'Nairobi County',
                                'code' => 'NBI',

                                'cities' => [
                                    [
                                        'name' => 'Nairobi',
                                        'code' => 'NBO',

                                        'areas' => [
                                            ['name' => 'Westlands', 'latitude' => -1.2676, 'longitude' => 36.8108],
                                            ['name' => 'Kilimani', 'latitude' => -1.2921, 'longitude' => 36.7870],
                                            ['name' => 'Kileleshwa', 'latitude' => -1.2845, 'longitude' => 36.7767],
                                            ['name' => 'Karen', 'latitude' => -1.3197, 'longitude' => 36.7073],
                                            ['name' => 'Lavington', 'latitude' => -1.2786, 'longitude' => 36.7750],
                                            ['name' => 'Runda', 'latitude' => -1.2144, 'longitude' => 36.8237],
                                            ['name' => 'Muthaiga', 'latitude' => -1.2500, 'longitude' => 36.8300],
                                            ['name' => 'Parklands', 'latitude' => -1.2600, 'longitude' => 36.8230],
                                            ['name' => 'Hurlingham', 'latitude' => -1.2950, 'longitude' => 36.7920],
                                            ['name' => 'South B', 'latitude' => -1.3150, 'longitude' => 36.8300],
                                            ['name' => 'South C', 'latitude' => -1.3200, 'longitude' => 36.8120],
                                            ['name' => 'Eastleigh', 'latitude' => -1.2780, 'longitude' => 36.8460],
                                            ['name' => 'Embakasi', 'latitude' => -1.3180, 'longitude' => 36.9000],
                                            ['name' => 'Kasarani', 'latitude' => -1.2200, 'longitude' => 36.9000],
                                            ['name' => 'Roysambu', 'latitude' => -1.2160, 'longitude' => 36.8860],
                                            ['name' => 'Langata', 'latitude' => -1.3620, 'longitude' => 36.7440],
                                            ['name' => 'Dagoretti', 'latitude' => -1.3000, 'longitude' => 36.7600],
                                            ['name' => 'Ngong Road', 'latitude' => -1.3000, 'longitude' => 36.7750],
                                            ['name' => 'Upper Hill', 'latitude' => -1.3000, 'longitude' => 36.8150],
                                            ['name' => 'Gigiri', 'latitude' => -1.2300, 'longitude' => 36.8050],
                                            ['name' => 'Spring Valley', 'latitude' => -1.2550, 'longitude' => 36.7850],
                                            ['name' => 'Riverside', 'latitude' => -1.2700, 'longitude' => 36.7950],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],

                    [
                        'name' => 'Central Region',
                        'code' => 'CEN',

                        'counties' => [
                            [
                                'name' => 'Kiambu County',
                                'code' => 'KBU',

                                'cities' => [
                                    [
                                        'name' => 'Ruiru',
                                        'code' => 'RUI',
                                        'areas' => [
                                            ['name' => 'Ruiru', 'latitude' => -1.1483, 'longitude' => 36.9600],
                                            ['name' => 'Kahawa Sukari', 'latitude' => -1.1830, 'longitude' => 36.9500],
                                            ['name' => 'Kahawa Wendani', 'latitude' => -1.1780, 'longitude' => 36.9300],
                                            ['name' => 'Membley', 'latitude' => -1.1300, 'longitude' => 36.9600],
                                        ],
                                    ],

                                    [
                                        'name' => 'Juja',
                                        'code' => 'JUJ',
                                        'areas' => [
                                            ['name' => 'Juja', 'latitude' => -1.1007, 'longitude' => 37.0130],
                                            ['name' => 'Juja Farm', 'latitude' => -1.0700, 'longitude' => 37.0400],
                                            ['name' => 'Kalimoni', 'latitude' => -1.0900, 'longitude' => 37.0200],
                                        ],
                                    ],

                                    [
                                        'name' => 'Ruaka',
                                        'code' => 'RUA',
                                        'areas' => [
                                            ['name' => 'Ruaka', 'latitude' => -1.2044, 'longitude' => 36.7794],
                                            ['name' => 'Rosslyn', 'latitude' => -1.2200, 'longitude' => 36.7900],
                                            ['name' => 'Banana', 'latitude' => -1.1900, 'longitude' => 36.7700],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],

                    [
                        'name' => 'Rift Valley Region',
                        'code' => 'RVT',

                        'counties' => [
                            [
                                'name' => 'Kajiado County',
                                'code' => 'KJD',

                                'cities' => [
                                    [
                                        'name' => 'Kitengela',
                                        'code' => 'KIT',
                                        'areas' => [
                                            ['name' => 'Kitengela', 'latitude' => -1.4734, 'longitude' => 36.9584],
                                            ['name' => 'Milimani', 'latitude' => -1.4600, 'longitude' => 36.9500],
                                            ['name' => 'Acacia', 'latitude' => -1.4800, 'longitude' => 36.9700],
                                        ],
                                    ],

                                    [
                                        'name' => 'Ngong',
                                        'code' => 'NGO',
                                        'areas' => [
                                            ['name' => 'Ngong', 'latitude' => -1.3612, 'longitude' => 36.6560],
                                            ['name' => 'Oloolua', 'latitude' => -1.3500, 'longitude' => 36.6800],
                                            ['name' => 'Ngong Hills', 'latitude' => -1.3500, 'longitude' => 36.6200],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],

                    [
                        'name' => 'Eastern Region',
                        'code' => 'EST',

                        'counties' => [
                            [
                                'name' => 'Machakos County',
                                'code' => 'MKS',

                                'cities' => [
                                    [
                                        'name' => 'Syokimau',
                                        'code' => 'SYO',
                                        'areas' => [
                                            ['name' => 'Syokimau', 'latitude' => -1.3632, 'longitude' => 36.9205],
                                            ['name' => 'Katani', 'latitude' => -1.3500, 'longitude' => 36.9300],
                                            ['name' => 'Mlolongo', 'latitude' => -1.3900, 'longitude' => 36.9400],
                                        ],
                                    ],

                                    [
                                        'name' => 'Athi River',
                                        'code' => 'ATH',
                                        'areas' => [
                                            ['name' => 'Athi River', 'latitude' => -1.4563, 'longitude' => 36.9783],
                                            ['name' => 'Kinanie', 'latitude' => -1.4700, 'longitude' => 37.0000],
                                            ['name' => 'Lukenya', 'latitude' => -1.5000, 'longitude' => 37.0300],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | UGANDA
            |--------------------------------------------------------------------------
            */

            [
                'country' => 'Uganda',
                'code' => 'UG',
                'phone_code' => '+256',
                'currency' => 'UGX',

                'regions' => [
                    [
                        'name' => 'Central Region',
                        'code' => 'CEN',

                        'counties' => [
                            [
                                'name' => 'Kampala District',
                                'code' => 'KLA',

                                'cities' => [
                                    [
                                        'name' => 'Kampala',
                                        'code' => 'KLA',
                                        'areas' => [
                                            ['name' => 'Kampala Central', 'latitude' => 0.3136, 'longitude' => 32.5811],
                                            ['name' => 'Ntinda', 'latitude' => 0.3650, 'longitude' => 32.6200],
                                            ['name' => 'Nakasero', 'latitude' => 0.3200, 'longitude' => 32.5800],
                                            ['name' => 'Kololo', 'latitude' => 0.3400, 'longitude' => 32.5950],
                                            ['name' => 'Naguru', 'latitude' => 0.3500, 'longitude' => 32.6100],
                                            ['name' => 'Bugolobi', 'latitude' => 0.3300, 'longitude' => 32.6250],
                                            ['name' => 'Muyenga', 'latitude' => 0.2850, 'longitude' => 32.6100],
                                            ['name' => 'Makindye', 'latitude' => 0.2800, 'longitude' => 32.5600],
                                            ['name' => 'Kansanga', 'latitude' => 0.2750, 'longitude' => 32.6100],
                                            ['name' => 'Bukoto', 'latitude' => 0.3500, 'longitude' => 32.5900],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | TANZANIA
            |--------------------------------------------------------------------------
            */

            [
                'country' => 'Tanzania',
                'code' => 'TZ',
                'phone_code' => '+255',
                'currency' => 'TZS',

                'regions' => [
                    [
                        'name' => 'Dar es Salaam Region',
                        'code' => 'DSM',

                        'counties' => [
                            [
                                'name' => 'Ilala District',
                                'code' => 'ILA',

                                'cities' => [
                                    [
                                        'name' => 'Dar es Salaam',
                                        'code' => 'DSM',
                                        'areas' => [
                                            ['name' => 'Masaki', 'latitude' => -6.7510, 'longitude' => 39.2800],
                                            ['name' => 'Oysterbay', 'latitude' => -6.7630, 'longitude' => 39.2680],
                                            ['name' => 'Mikocheni', 'latitude' => -6.7550, 'longitude' => 39.2450],
                                            ['name' => 'Upanga', 'latitude' => -6.8100, 'longitude' => 39.2850],
                                            ['name' => 'Msasani', 'latitude' => -6.7700, 'longitude' => 39.2500],
                                            ['name' => 'Kinondoni', 'latitude' => -6.7900, 'longitude' => 39.2200],
                                            ['name' => 'Sinza', 'latitude' => -6.7900, 'longitude' => 39.2050],
                                            ['name' => 'Kijitonyama', 'latitude' => -6.7700, 'longitude' => 39.2200],
                                            ['name' => 'Kariakoo', 'latitude' => -6.8200, 'longitude' => 39.2750],
                                            ['name' => 'Mbezi', 'latitude' => -6.7000, 'longitude' => 39.1900],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | RWANDA
            |--------------------------------------------------------------------------
            */

            [
                'country' => 'Rwanda',
                'code' => 'RW',
                'phone_code' => '+250',
                'currency' => 'RWF',

                'regions' => [
                    [
                        'name' => 'Kigali Province',
                        'code' => 'KGL',

                        'counties' => [
                            [
                                'name' => 'Kigali District',
                                'code' => 'KGL',

                                'cities' => [
                                    [
                                        'name' => 'Kigali',
                                        'code' => 'KGL',
                                        'areas' => [
                                            ['name' => 'Kacyiru', 'latitude' => -1.9350, 'longitude' => 30.0850],
                                            ['name' => 'Nyarutarama', 'latitude' => -1.9250, 'longitude' => 30.1100],
                                            ['name' => 'Kimihurura', 'latitude' => -1.9500, 'longitude' => 30.0850],
                                            ['name' => 'Remera', 'latitude' => -1.9500, 'longitude' => 30.1200],
                                            ['name' => 'Kiyovu', 'latitude' => -1.9500, 'longitude' => 30.0600],
                                            ['name' => 'Gacuriro', 'latitude' => -1.9100, 'longitude' => 30.1000],
                                            ['name' => 'Nyamirambo', 'latitude' => -1.9700, 'longitude' => 30.0400],
                                            ['name' => 'Kibagabaga', 'latitude' => -1.9000, 'longitude' => 30.1050],
                                            ['name' => 'Kagugu', 'latitude' => -1.9000, 'longitude' => 30.0800],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | NIGERIA
            |--------------------------------------------------------------------------
            */

            [
                'country' => 'Nigeria',
                'code' => 'NG',
                'phone_code' => '+234',
                'currency' => 'NGN',

                'regions' => [
                    [
                        'name' => 'Lagos State',
                        'code' => 'LA',

                        'counties' => [
                            [
                                'name' => 'Lagos Mainland',
                                'code' => 'LGM',

                                'cities' => [
                                    [
                                        'name' => 'Lagos',
                                        'code' => 'LOS',
                                        'areas' => [
                                            ['name' => 'Victoria Island', 'latitude' => 6.4281, 'longitude' => 3.4219],
                                            ['name' => 'Ikoyi', 'latitude' => 6.4549, 'longitude' => 3.4357],
                                            ['name' => 'Lekki', 'latitude' => 6.4698, 'longitude' => 3.5852],
                                            ['name' => 'Yaba', 'latitude' => 6.5095, 'longitude' => 3.3711],
                                            ['name' => 'Surulere', 'latitude' => 6.4969, 'longitude' => 3.3533],
                                            ['name' => 'Ikeja', 'latitude' => 6.6018, 'longitude' => 3.3515],
                                            ['name' => 'Maryland', 'latitude' => 6.5770, 'longitude' => 3.3670],
                                            ['name' => 'Magodo', 'latitude' => 6.6200, 'longitude' => 3.3900],
                                            ['name' => 'Ajah', 'latitude' => 6.4700, 'longitude' => 3.5700],
                                            ['name' => 'Chevron', 'latitude' => 6.4500, 'longitude' => 3.5300],
                                            ['name' => 'Banana Island', 'latitude' => 6.4450, 'longitude' => 3.4350],
                                            ['name' => 'Oniru', 'latitude' => 6.4400, 'longitude' => 3.4450],
                                            ['name' => 'Ikate', 'latitude' => 6.4350, 'longitude' => 3.4700],
                                            ['name' => 'Admiralty', 'latitude' => 6.4550, 'longitude' => 3.4700],
                                        ],
                                    ],
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | SEED LOCATION HIERARCHY
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use ($locations): void {
            $counts = [
                'countries' => 0,
                'regions' => 0,
                'counties' => 0,
                'cities' => 0,
                'areas' => 0,
                'created' => 0,
                'updated' => 0,
            ];

            foreach ($locations as $countryData) {
                $countryName = trim($countryData['country']);
                $countryCode = Str::upper(trim($countryData['code']));
                $countrySlug = Str::slug($countryName);

                $country = Country::updateOrCreate(
                    ['code' => $countryCode],
                    [
                        'name' => $countryName,
                        'slug' => $countrySlug,
                        'phone_code' => $countryData['phone_code'],
                        'currency' => Str::upper($countryData['currency']),
                        'is_active' => true,
                    ]
                );

                $counts['countries']++;

                foreach ($countryData['regions'] as $regionData) {
                    $regionName = trim($regionData['name']);
                    $regionCode = Str::upper(trim($regionData['code']));
                    $regionSlug = Str::slug($countrySlug . '-' . $regionName);

                    $region = Region::updateOrCreate(
                        [
                            'country_id' => $country->id,
                            'code' => $regionCode,
                        ],
                        [
                            'name' => $regionName,
                            'slug' => $regionSlug,
                            'is_active' => true,
                        ]
                    );

                    $counts['regions']++;

                    foreach ($regionData['counties'] as $countyData) {
                        $countyName = trim($countyData['name']);
                        $countyCode = Str::upper(trim($countyData['code']));
                        $countySlug = Str::slug($regionSlug . '-' . $countyName);

                        $county = County::updateOrCreate(
                            [
                                'region_id' => $region->id,
                                'code' => $countyCode,
                            ],
                            [
                                'country_id' => $country->id,
                                'region_id' => $region->id,
                                'name' => $countyName,
                                'slug' => $countySlug,
                                'is_active' => true,
                            ]
                        );

                        $counts['counties']++;

                        foreach ($countyData['cities'] as $cityData) {
                            $cityName = trim($cityData['name']);
                            $cityCode = Str::upper(trim($cityData['code']));
                            $citySlug = Str::slug($countySlug . '-' . $cityName);

                            $city = City::updateOrCreate(
                                [
                                    'county_id' => $county->id,
                                    'code' => $cityCode,
                                ],
                                [
                                    'country_id' => $country->id,
                                    'region_id' => $region->id,
                                    'county_id' => $county->id,
                                    'name' => $cityName,
                                    'slug' => $citySlug,
                                    'is_active' => true,
                                ]
                            );

                            $counts['cities']++;

                            foreach ($cityData['areas'] as $areaData) {
                                $areaName = trim($areaData['name']);

                                // A full hierarchy-based slug keeps same-named
                                // areas in different cities separate.
                                $areaSlug = Str::slug($citySlug . '-' . $areaName);

                                // Generate a readable, deterministic area code.
                                // Example: RUI-RUI, KIT-KIT, NBO-KAR.
                                $areaPrefix = Str::upper(
                                    Str::substr(
                                        Str::replace('-', '', Str::slug($areaName)),
                                        0,
                                        3
                                    )
                                );

                                $areaCodeBase = $cityCode . '-' . $areaPrefix;

                                $area = Area::where('slug', $areaSlug)->first();

                                if (!$area) {
                                    $area = Area::where('country_id', $country->id)
                                        ->where('region_id', $region->id)
                                        ->where('county_id', $county->id)
                                        ->where('city_id', $city->id)
                                        ->where('name', $areaName)
                                        ->first();
                                }

                                // Keep an existing area code if it is already
                                // assigned to this exact area.
                                $areaCode = $area?->code;

                                if (empty($areaCode)) {
                                    $areaCode = $areaCodeBase;
                                }

                                // Resolve a genuine code collision without
                                // generating a new random code on every run.
                                $codeOwner = Area::where('code', $areaCode)
                                    ->when(
                                        $area,
                                        fn ($query) => $query->where('id', '!=', $area->id)
                                    )
                                    ->first();

                                if ($codeOwner) {
                                    $areaCode = $areaCodeBase . '-' . Str::upper(
                                        Str::substr(hash('sha256', $areaSlug), 0, 6)
                                    );

                                    $secondOwner = Area::where('code', $areaCode)
                                        ->when(
                                            $area,
                                            fn ($query) => $query->where('id', '!=', $area->id)
                                        )
                                        ->exists();

                                    if ($secondOwner) {
                                        throw new RuntimeException(
                                            "Unable to generate a unique area code for '{$areaName}'."
                                        );
                                    }
                                }

                                // Protect the unique slug constraint.
                                $slugOwner = Area::where('slug', $areaSlug)
                                    ->when(
                                        $area,
                                        fn ($query) => $query->where('id', '!=', $area->id)
                                    )
                                    ->exists();

                                if ($slugOwner) {
                                    throw new RuntimeException(
                                        "Area slug '{$areaSlug}' is already assigned to another area."
                                    );
                                }

                                $isNewArea = !$area;

                                if ($isNewArea) {
                                    $area = new Area();
                                }

                                $area->country_id = $country->id;
                                $area->region_id = $region->id;
                                $area->county_id = $county->id;
                                $area->city_id = $city->id;
                                $area->name = $areaName;
                                $area->slug = $areaSlug;
                                $area->code = $areaCode;
                                $area->latitude = $areaData['latitude'] ?? null;
                                $area->longitude = $areaData['longitude'] ?? null;
                                $area->is_active = true;
                                $area->save();

                                $counts['areas']++;

                                if ($isNewArea) {
                                    $counts['created']++;
                                } else {
                                    $counts['updated']++;
                                }
                            }
                        }
                    }
                }
            }

            /*
            |--------------------------------------------------------------------------
            | SEEDING REPORT
            |--------------------------------------------------------------------------
            */

            $this->command?->newLine();
            $this->command?->info('Location seeding completed successfully.');

            $this->command?->table(
                ['Location Type', 'Processed'],
                [
                    ['Countries', $counts['countries']],
                    ['Regions', $counts['regions']],
                    ['Counties', $counts['counties']],
                    ['Cities', $counts['cities']],
                    ['Areas', $counts['areas']],
                    ['New Areas Created', $counts['created']],
                    ['Existing Areas Updated', $counts['updated']],
                ]
            );
        });
    }
}
