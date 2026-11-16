<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\Region;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;

class KenyaRegionSeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::where('code', 'KE')->first();

        if (!$country) {
            throw new RuntimeException(
                'Kenya does not exist. Run CountrySeeder first.'
            );
        }

        $regions = [
            ['name' => 'Central Region', 'code' => 'CEN'],
            ['name' => 'Coast Region', 'code' => 'CST'],
            ['name' => 'Eastern Region', 'code' => 'EST'],
            ['name' => 'Nairobi Region', 'code' => 'NBI'],
            ['name' => 'North Eastern Region', 'code' => 'NER'],
            ['name' => 'Nyanza Region', 'code' => 'NYZ'],
            ['name' => 'Rift Valley Region', 'code' => 'RVT'],
            ['name' => 'Western Region', 'code' => 'WST'],
        ];

        foreach ($regions as $data) {
            Region::updateOrCreate(
                [
                    'country_id' => $country->id,
                    'code' => $data['code'],
                ],
                [
                    'name' => $data['name'],
                    'slug' => Str::slug(
                        'kenya-' . $data['name']
                    ),
                    'is_active' => true,
                ]
            );
        }

        $this->command->info(
            'Kenya regions seeded successfully: 8 regions.'
        );
    }
}
