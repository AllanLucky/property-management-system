<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\County;
use App\Models\City;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;

class KenyaCitySeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::where('code', 'KE')->first();

        if (!$country) {
            throw new RuntimeException('Run CountrySeeder first.');
        }

        $cities = [
            'NBI' => [
                ['name' => 'Nairobi', 'code' => 'NBO'],
            ],

            'KBU' => [
                ['name' => 'Ruiru', 'code' => 'RUI'],
                ['name' => 'Juja', 'code' => 'JUJ'],
                ['name' => 'Ruaka', 'code' => 'RUA'],
            ],

            'KJD' => [
                ['name' => 'Kitengela', 'code' => 'KIT'],
                ['name' => 'Ngong', 'code' => 'NGO'],
            ],

            'MKS' => [
                ['name' => 'Syokimau', 'code' => 'SYO'],
                ['name' => 'Athi River', 'code' => 'ATH'],
            ],
        ];

        $created = 0;
        $updated = 0;

        foreach ($cities as $countyCode => $countyCities) {

            $county = County::where('country_id', $country->id)
                ->where('code', $countyCode)
                ->first();

            if (!$county) {
                throw new RuntimeException(
                    "County {$countyCode} does not exist. Run KenyaCountySeeder first."
                );
            }

            $region = $county->region;

            foreach ($countyCities as $data) {

                $city = City::withTrashed()->firstOrNew([
                    'county_id' => $county->id,
                    'code' => $data['code'],
                ]);

                $isNew = !$city->exists;

                if ($city->trashed()) {
                    $city->restore();
                }

                $city->country_id = $country->id;
                $city->region_id = $region->id;
                $city->county_id = $county->id;
                $city->name = $data['name'];
                $city->code = $data['code'];

                $city->slug = Str::slug(
                    $county->slug . '-' . $data['name']
                );

                $city->is_active = true;
                $city->save();

                $isNew ? $created++ : $updated++;
            }
        }

        $this->command->info('Kenya cities seeded successfully.');

        $this->command->table(
            ['Metric', 'Count'],
            [
                ['New Cities', $created],
                ['Updated Cities', $updated],
                ['Total Cities Processed', $created + $updated],
            ]
        );
    }
}
