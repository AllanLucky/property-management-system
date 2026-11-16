<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\City;
use App\Models\Country;
use App\Models\County;
use App\Models\Plot;
use App\Models\Region;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class PlotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | SUPPORTED PLOT STATUSES
        |--------------------------------------------------------------------------
        */

        $allowedStatuses = [
            'available',
            'reserved',
            'sold',
            'unavailable',
        ];

        /*
        |--------------------------------------------------------------------------
        | PLOT DATA
        |--------------------------------------------------------------------------
        |
        | Location records are managed exclusively by LocationSeeder.
        | This seeder only resolves existing location records using codes.
        |
        */

        $plotsData = [

            /*
            |--------------------------------------------------------------------------
            | RUIRU
            |--------------------------------------------------------------------------
            */

            [
                'title' => 'Ruiru Prime Residential Plot',
                'title_number' => 'TL-RUI-001245',
                'plot_number' => 'RUIRU/2/1456',

                'country_code' => 'KE',
                'region_code' => 'CEN',
                'county_code' => 'KBU',
                'city_code' => 'RUI',
                'area_code' => 'RUI-RUI',

                'size' => 0.125,
                'size_unit' => 'acre',

                'description' => 'Prime residential plot located in a developed neighbourhood with access to roads, electricity and water.',

                'address' => 'Ruiru, Kiambu County',

                'latitude' => -1.1483,
                'longitude' => 36.9600,

                'asking_price' => 3500000,
                'currency' => 'KES',

                'status' => 'available',
                'is_active' => true,
            ],

            /*
            |--------------------------------------------------------------------------
            | KITENGELA
            |--------------------------------------------------------------------------
            */

            [
                'title' => 'Kitengela Residential Plot',
                'title_number' => 'TL-KIT-002318',
                'plot_number' => 'KITENGELA/4/2318',

                'country_code' => 'KE',
                'region_code' => 'RVT',
                'county_code' => 'KJD',
                'city_code' => 'KIT',
                'area_code' => 'KIT-KIT',

                'size' => 0.25,
                'size_unit' => 'acre',

                'description' => 'Quarter-acre residential plot suitable for a family home or investment development.',

                'address' => 'Kitengela, Kajiado County',

                'latitude' => -1.4734,
                'longitude' => 36.9584,

                'asking_price' => 2800000,
                'currency' => 'KES',

                'status' => 'available',
                'is_active' => true,
            ],

            /*
            |--------------------------------------------------------------------------
            | SYOKIMAU
            |--------------------------------------------------------------------------
            */

            [
                'title' => 'Syokimau Investment Plot',
                'title_number' => 'TL-SYO-003421',
                'plot_number' => 'SYOKIMAU/3/3421',

                'country_code' => 'KE',
                'region_code' => 'EST',
                'county_code' => 'MKS',
                'city_code' => 'SYO',
                'area_code' => 'SYO-SYO',

                'size' => 0.125,
                'size_unit' => 'acre',

                'description' => 'Strategically positioned plot suitable for residential development or long-term property investment.',

                'address' => 'Syokimau, Machakos County',

                'latitude' => -1.3632,
                'longitude' => 36.9205,

                'asking_price' => 4200000,
                'currency' => 'KES',

                'status' => 'reserved',
                'is_active' => true,
            ],

            /*
            |--------------------------------------------------------------------------
            | JUJA
            |--------------------------------------------------------------------------
            */

            [
                'title' => 'Juja Commercial Plot',
                'title_number' => 'TL-JUJ-004512',
                'plot_number' => 'JUJA/1/4512',

                'country_code' => 'KE',
                'region_code' => 'CEN',
                'county_code' => 'KBU',
                'city_code' => 'JUJ',
                'area_code' => 'JUJ-JUJ',

                'size' => 0.50,
                'size_unit' => 'acre',

                'description' => 'Half-acre commercial plot positioned near major transport routes and growing commercial developments.',

                'address' => 'Juja, Kiambu County',

                'latitude' => -1.1007,
                'longitude' => 37.0130,

                'asking_price' => 8500000,
                'currency' => 'KES',

                'status' => 'available',
                'is_active' => true,
            ],

            /*
            |--------------------------------------------------------------------------
            | NGONG
            |--------------------------------------------------------------------------
            */

            [
                'title' => 'Ngong Residential Plot',
                'title_number' => 'TL-NGO-005624',
                'plot_number' => 'NGONG/5/5624',

                'country_code' => 'KE',
                'region_code' => 'RVT',
                'county_code' => 'KJD',
                'city_code' => 'NGO',
                'area_code' => 'NGO-NGO',

                'size' => 0.25,
                'size_unit' => 'acre',

                'description' => 'Well-positioned residential plot in a growing area with access to essential amenities.',

                'address' => 'Ngong, Kajiado County',

                'latitude' => -1.3612,
                'longitude' => 36.6560,

                'asking_price' => 3200000,
                'currency' => 'KES',

                'status' => 'available',
                'is_active' => true,
            ],

            /*
            |--------------------------------------------------------------------------
            | ATHI RIVER
            |--------------------------------------------------------------------------
            */

            [
                'title' => 'Athi River Development Plot',
                'title_number' => 'TL-ATH-006735',
                'plot_number' => 'ATHIRIVER/2/6735',

                'country_code' => 'KE',
                'region_code' => 'EST',
                'county_code' => 'MKS',
                'city_code' => 'ATH',
                'area_code' => 'ATH-ATH',

                'size' => 1.00,
                'size_unit' => 'acre',

                'description' => 'One-acre development parcel suitable for residential apartments, gated community or commercial development.',

                'address' => 'Athi River, Machakos County',

                'latitude' => -1.4563,
                'longitude' => 36.9783,

                'asking_price' => 12500000,
                'currency' => 'KES',

                'status' => 'available',
                'is_active' => true,
            ],

            /*
            |--------------------------------------------------------------------------
            | RUAKA
            |--------------------------------------------------------------------------
            */

            [
                'title' => 'Ruaka Premium Plot',
                'title_number' => 'TL-RUA-007846',
                'plot_number' => 'RUAKA/7/7846',

                'country_code' => 'KE',
                'region_code' => 'CEN',
                'county_code' => 'KBU',
                'city_code' => 'RUA',
                'area_code' => 'RUA-RUA',

                'size' => 0.125,
                'size_unit' => 'acre',

                'description' => 'Premium investment plot in a high-demand area suitable for residential or mixed-use development.',

                'address' => 'Ruaka, Kiambu County',

                'latitude' => -1.2044,
                'longitude' => 36.7794,

                'asking_price' => 9800000,
                'currency' => 'KES',

                'status' => 'sold',
                'is_active' => false,
            ],

            /*
            |--------------------------------------------------------------------------
            | KAREN
            |--------------------------------------------------------------------------
            */

            [
                'title' => 'Karen Residential Plot',
                'title_number' => 'TL-KAR-008957',
                'plot_number' => 'KAREN/8/8957',

                'country_code' => 'KE',
                'region_code' => 'NBI',
                'county_code' => 'NBI',
                'city_code' => 'NBO',
                'area_code' => 'NBO-KAR',

                'size' => 0.50,
                'size_unit' => 'acre',

                'description' => 'Spacious residential plot in a premium neighbourhood suitable for a luxury home.',

                'address' => 'Karen, Nairobi County',

                'latitude' => -1.3197,
                'longitude' => 36.7073,

                'asking_price' => 18000000,
                'currency' => 'KES',

                'status' => 'unavailable',
                'is_active' => false,
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | VALIDATE PLOT STATUSES
        |--------------------------------------------------------------------------
        */

        foreach ($plotsData as $data) {
            if (!in_array($data['status'], $allowedStatuses, true)) {
                throw new RuntimeException(
                    "Invalid plot status '{$data['status']}' for '{$data['title']}'."
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SEED PLOTS
        |--------------------------------------------------------------------------
        */

        DB::transaction(function () use ($plotsData): void {

            $counts = [
                'created' => 0,
                'updated' => 0,
                'restored' => 0,
            ];

            foreach ($plotsData as $data) {

                /*
                |--------------------------------------------------------------------------
                | RESOLVE LOCATION
                |--------------------------------------------------------------------------
                */

                $location = $this->resolveLocation(
                    countryCode: $data['country_code'],
                    regionCode: $data['region_code'],
                    countyCode: $data['county_code'],
                    cityCode: $data['city_code'],
                    areaCode: $data['area_code'] ?? null
                );

                /*
                |--------------------------------------------------------------------------
                | FIND EXISTING PLOT
                |--------------------------------------------------------------------------
                */

                $existingPlot = Plot::withTrashed()
                    ->where('title_number', $data['title_number'])
                    ->first();

                /*
                |--------------------------------------------------------------------------
                | PRESERVE OR GENERATE PLOT CODE
                |--------------------------------------------------------------------------
                */

                $plotCode = $existingPlot?->code;

                if (empty($plotCode)) {
                    $plotCode = $this->generatePlotCode($data['title']);
                }

                /*
                |--------------------------------------------------------------------------
                | CHECK SOFT DELETE STATUS
                |--------------------------------------------------------------------------
                */

                $wasDeleted = $existingPlot && $existingPlot->trashed();

                /*
                |--------------------------------------------------------------------------
                | CREATE OR UPDATE PLOT
                |--------------------------------------------------------------------------
                */

                $plot = Plot::withTrashed()->updateOrCreate(
                    [
                        'title_number' => $data['title_number'],
                    ],
                    [
                        'property_id' => null,

                        'code' => $plotCode,
                        'title' => $data['title'],
                        'title_number' => $data['title_number'],
                        'plot_number' => $data['plot_number'],

                        'country_id' => $location['country']->id,
                        'region_id' => $location['region']->id,
                        'county_id' => $location['county']->id,
                        'city_id' => $location['city']->id,
                        'area_id' => $location['area']?->id,

                        'size' => $data['size'],
                        'size_unit' => $data['size_unit'],
                        'description' => $data['description'],

                        'address' => $data['address'],

                        'latitude' => $data['latitude'],
                        'longitude' => $data['longitude'],

                        'asking_price' => $data['asking_price'],
                        'currency' => $data['currency'],

                        // Only supported plot statuses are assigned.
                        'status' => $data['status'],
                        'is_active' => $data['is_active'],
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | RESTORE SOFT-DELETED PLOT
                |--------------------------------------------------------------------------
                */

                if ($plot->trashed()) {
                    $plot->restore();
                }

                /*
                |--------------------------------------------------------------------------
                | COUNT RESULTS
                |--------------------------------------------------------------------------
                */

                if (!$existingPlot) {
                    $counts['created']++;
                } else {
                    $counts['updated']++;
                }

                if ($wasDeleted) {
                    $counts['restored']++;
                }

                /*
                |--------------------------------------------------------------------------
                | DISPLAY LOCATION
                |--------------------------------------------------------------------------
                */

                $locationText = implode(' → ', [
                    $location['country']->name,
                    $location['region']->name,
                    $location['county']->name,
                    $location['city']->name,
                ]);

                if ($location['area']) {
                    $locationText .= ' → ' . $location['area']->name;
                }

                $this->command?->info(
                    "Plot '{$plot->title}' ({$plot->code}) assigned to {$locationText}."
                );
            }

            /*
            |--------------------------------------------------------------------------
            | SEEDING REPORT
            |--------------------------------------------------------------------------
            */

            $this->command?->newLine();

            $this->command?->info(
                'Plot seeding completed successfully.'
            );

            $this->command?->table(
                ['Operation', 'Count'],
                [
                    ['Total Processed', count($plotsData)],
                    ['New Plots Created', $counts['created']],
                    ['Existing Plots Updated', $counts['updated']],
                    ['Soft-Deleted Plots Restored', $counts['restored']],
                ]
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RESOLVE LOCATION
    |--------------------------------------------------------------------------
    */

    private function resolveLocation(
        string $countryCode,
        string $regionCode,
        string $countyCode,
        string $cityCode,
        ?string $areaCode = null
    ): array {

        $country = Country::query()
            ->where('code', Str::upper($countryCode))
            ->first();

        if (!$country) {
            throw new RuntimeException(
                "Country '{$countryCode}' was not found. Run LocationSeeder first."
            );
        }

        $region = Region::query()
            ->where('country_id', $country->id)
            ->where('code', Str::upper($regionCode))
            ->first();

        if (!$region) {
            throw new RuntimeException(
                "Region '{$regionCode}' was not found under {$country->name}."
            );
        }

        $county = County::query()
            ->where('country_id', $country->id)
            ->where('region_id', $region->id)
            ->where('code', Str::upper($countyCode))
            ->first();

        if (!$county) {
            throw new RuntimeException(
                "County '{$countyCode}' was not found under {$region->name}."
            );
        }

        $city = City::query()
            ->where('country_id', $country->id)
            ->where('region_id', $region->id)
            ->where('county_id', $county->id)
            ->where('code', Str::upper($cityCode))
            ->first();

        if (!$city) {
            throw new RuntimeException(
                "City '{$cityCode}' was not found under {$county->name}."
            );
        }

        $area = null;

        if ($areaCode !== null) {
            $area = Area::query()
                ->where('country_id', $country->id)
                ->where('region_id', $region->id)
                ->where('county_id', $county->id)
                ->where('city_id', $city->id)
                ->where('code', Str::upper($areaCode))
                ->first();

            if (!$area) {
                throw new RuntimeException(
                    "Area '{$areaCode}' was not found under city '{$city->name}'. " .
                    'Run LocationSeeder and verify the area code.'
                );
            }
        }

        return [
            'country' => $country,
            'region' => $region,
            'county' => $county,
            'city' => $city,
            'area' => $area,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE UNIQUE PLOT CODE
    |--------------------------------------------------------------------------
    */

    private function generatePlotCode(string $title): string
    {
        $words = preg_split('/\s+/', trim($title));

        $prefix = collect($words)
            ->filter()
            ->map(function ($word) {
                return substr(
                    preg_replace('/[^A-Za-z0-9]/', '', $word),
                    0,
                    3
                );
            })
            ->implode('');

        $prefix = Str::upper(substr($prefix, 0, 6));

        if (empty($prefix)) {
            $prefix = 'PLOT';
        }

        do {
            $code = sprintf(
                'PLT-%s-%s-%04d',
                now()->format('Ymd'),
                $prefix,
                random_int(1000, 9999)
            );

        } while (
            Plot::withTrashed()
                ->where('code', $code)
                ->exists()
        );

        return $code;
    }
}
