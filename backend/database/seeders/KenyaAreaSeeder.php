<?php

namespace Database\Seeders;

use App\Models\Area;
use App\Models\City;
use App\Models\Country;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class KenyaAreaSeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::where('code', 'KE')->first();

        if (!$country) {
            throw new RuntimeException('Run CountrySeeder first.');
        }

        $areas = [

            'NBO' => [
                ['name' => 'Westlands', 'lat' => -1.2676, 'long' => 36.8108],
                ['name' => 'Kilimani', 'lat' => -1.2921, 'long' => 36.7870],
                ['name' => 'Kileleshwa', 'lat' => -1.2845, 'long' => 36.7767],
                ['name' => 'Karen', 'lat' => -1.3197, 'long' => 36.7073],
                ['name' => 'Lavington', 'lat' => -1.2786, 'long' => 36.7750],
                ['name' => 'Runda', 'lat' => -1.2144, 'long' => 36.8237],
                ['name' => 'Muthaiga', 'lat' => -1.2500, 'long' => 36.8300],
                ['name' => 'Parklands', 'lat' => -1.2600, 'long' => 36.8230],
                ['name' => 'Hurlingham', 'lat' => -1.2950, 'long' => 36.7920],
                ['name' => 'South B', 'lat' => -1.3150, 'long' => 36.8300],
                ['name' => 'South C', 'lat' => -1.3200, 'long' => 36.8120],
                ['name' => 'Eastleigh', 'lat' => -1.2780, 'long' => 36.8460],
                ['name' => 'Embakasi', 'lat' => -1.3180, 'long' => 36.9000],
                ['name' => 'Kasarani', 'lat' => -1.2200, 'long' => 36.9000],
                ['name' => 'Roysambu', 'lat' => -1.2160, 'long' => 36.8860],
                ['name' => 'Langata', 'lat' => -1.3620, 'long' => 36.7440],
                ['name' => 'Dagoretti', 'lat' => -1.3000, 'long' => 36.7600],
                ['name' => 'Ngong Road', 'lat' => -1.3000, 'long' => 36.7750],
                ['name' => 'Upper Hill', 'lat' => -1.3000, 'long' => 36.8150],
                ['name' => 'Gigiri', 'lat' => -1.2300, 'long' => 36.8050],
                ['name' => 'Spring Valley', 'lat' => -1.2550, 'long' => 36.7850],
                ['name' => 'Riverside', 'lat' => -1.2700, 'long' => 36.7950],
            ],

            'RUI' => [
                ['name' => 'Ruiru', 'lat' => -1.1483, 'long' => 36.9600],
                ['name' => 'Kahawa Sukari', 'lat' => -1.1830, 'long' => 36.9500],
                ['name' => 'Kahawa Wendani', 'lat' => -1.1780, 'long' => 36.9300],
                ['name' => 'Membley', 'lat' => -1.1300, 'long' => 36.9600],
            ],

            'JUJ' => [
                ['name' => 'Juja', 'lat' => -1.1007, 'long' => 37.0130],
                ['name' => 'Juja Farm', 'lat' => -1.0700, 'long' => 37.0400],
                ['name' => 'Kalimoni', 'lat' => -1.0900, 'long' => 37.0200],
            ],

            'RUA' => [
                ['name' => 'Ruaka', 'lat' => -1.2044, 'long' => 36.7794],
                ['name' => 'Rosslyn', 'lat' => -1.2200, 'long' => 36.7900],
                ['name' => 'Banana', 'lat' => -1.1900, 'long' => 36.7700],
            ],

            'KIT' => [
                ['name' => 'Kitengela', 'lat' => -1.4734, 'long' => 36.9584],
                ['name' => 'Milimani', 'lat' => -1.4600, 'long' => 36.9500],
                ['name' => 'Acacia', 'lat' => -1.4800, 'long' => 36.9700],
            ],

            'NGO' => [
                ['name' => 'Ngong', 'lat' => -1.3612, 'long' => 36.6560],
                ['name' => 'Oloolua', 'lat' => -1.3500, 'long' => 36.6800],
                ['name' => 'Ngong Hills', 'lat' => -1.3500, 'long' => 36.6200],
            ],

            'SYO' => [
                ['name' => 'Syokimau', 'lat' => -1.3632, 'long' => 36.9205],
                ['name' => 'Katani', 'lat' => -1.3500, 'long' => 36.9300],
                ['name' => 'Mlolongo', 'lat' => -1.3900, 'long' => 36.9400],
            ],

            'ATH' => [
                ['name' => 'Athi River', 'lat' => -1.4563, 'long' => 36.9783],
                ['name' => 'Kinanie', 'lat' => -1.4700, 'long' => 37.0000],
                ['name' => 'Lukenya', 'lat' => -1.5000, 'long' => 37.0300],
            ],
        ];

        DB::transaction(function () use ($areas, $country) {

            $created = 0;
            $updated = 0;

            foreach ($areas as $cityCode => $cityAreas) {

                $city = City::where('country_id', $country->id)
                    ->where('code', $cityCode)
                    ->first();

                if (!$city) {
                    throw new RuntimeException(
                        "City {$cityCode} does not exist. Run KenyaCitySeeder first."
                    );
                }

                foreach ($cityAreas as $data) {

                    $name = trim($data['name']);

                    $slug = Str::slug(
                        $city->slug . '-' . $name
                    );

                    $area = Area::where('slug', $slug)->first();

                    $isNew = !$area;

                    if (!$area) {
                        $area = new Area();
                    }

                    $prefix = Str::upper(
                        Str::substr(
                            Str::replace('-', '', Str::slug($name)),
                            0,
                            3
                        )
                    );

                    $baseCode = $cityCode . '-' . $prefix;

                    $code = $area->code ?: $baseCode;

                    $codeOwner = Area::where('code', $code)
                        ->when(
                            $area->exists,
                            fn ($query) => $query->where(
                                'id',
                                '!=',
                                $area->id
                            )
                        )
                        ->first();

                    if ($codeOwner) {
                        $code = $baseCode . '-' . Str::upper(
                            Str::substr(hash('sha256', $slug), 0, 6)
                        );
                    }

                    $area->country_id = $country->id;
                    $area->region_id = $city->region_id;
                    $area->county_id = $city->county_id;
                    $area->city_id = $city->id;

                    $area->name = $name;
                    $area->slug = $slug;
                    $area->code = $code;

                    $area->latitude = $data['lat'] ?? null;
                    $area->longitude = $data['long'] ?? null;

                    $area->is_active = true;

                    $area->save();

                    $isNew ? $created++ : $updated++;
                }
            }

            $this->command->info(
                'Kenya areas seeded successfully.'
            );

            $this->command->table(
                ['Metric', 'Count'],
                [
                    ['New Areas', $created],
                    ['Updated Areas', $updated],
                    ['Total Areas', $created + $updated],
                ]
            );
        });
    }
}
