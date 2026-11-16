<?php

namespace Database\Seeders;

use App\Models\Country;
use App\Models\County;
use App\Models\Region;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use RuntimeException;

class KenyaCountySeeder extends Seeder
{
    public function run(): void
    {
        $country = Country::where('code', 'KE')->first();

        if (!$country) {
            throw new RuntimeException(
                'Kenya does not exist. Run CountrySeeder first.'
            );
        }

        $countyGroups = [

            'CEN' => [
                ['name' => 'Kiambu County', 'code' => 'KBU'],
                ['name' => 'Kirinyaga County', 'code' => 'KRG'],
                ['name' => 'Muranga County', 'code' => 'MRG'],
                ['name' => 'Nyandarua County', 'code' => 'NYD'],
                ['name' => 'Nyeri County', 'code' => 'NYR'],
            ],

            'CST' => [
                ['name' => 'Mombasa County', 'code' => 'MBA'],
                ['name' => 'Kwale County', 'code' => 'KWL'],
                ['name' => 'Kilifi County', 'code' => 'KLF'],
                ['name' => 'Tana River County', 'code' => 'TNR'],
                ['name' => 'Lamu County', 'code' => 'LMU'],
                ['name' => 'Taita Taveta County', 'code' => 'TTV'],
            ],

            'EST' => [
                ['name' => 'Embu County', 'code' => 'EMB'],
                ['name' => 'Isiolo County', 'code' => 'ISL'],
                ['name' => 'Kitui County', 'code' => 'KTI'],
                ['name' => 'Machakos County', 'code' => 'MKS'],
                ['name' => 'Makueni County', 'code' => 'MKN'],
                ['name' => 'Marsabit County', 'code' => 'MRS'],
                ['name' => 'Meru County', 'code' => 'MRU'],
                ['name' => 'Tharaka Nithi County', 'code' => 'TNH'],
            ],

            'NBI' => [
                ['name' => 'Nairobi County', 'code' => 'NBI'],
            ],

            'NER' => [
                ['name' => 'Garissa County', 'code' => 'GRS'],
                ['name' => 'Mandera County', 'code' => 'MND'],
                ['name' => 'Wajir County', 'code' => 'WJR'],
            ],

            'NYZ' => [
                ['name' => 'Homa Bay County', 'code' => 'HMB'],
                ['name' => 'Kisii County', 'code' => 'KSI'],
                ['name' => 'Kisumu County', 'code' => 'KSM'],
                ['name' => 'Migori County', 'code' => 'MGR'],
                ['name' => 'Nyamira County', 'code' => 'NYM'],
                ['name' => 'Siaya County', 'code' => 'SYA'],
            ],

            'RVT' => [
                ['name' => 'Baringo County', 'code' => 'BRG'],
                ['name' => 'Bomet County', 'code' => 'BMT'],
                ['name' => 'Elgeyo Marakwet County', 'code' => 'EMK'],
                ['name' => 'Kajiado County', 'code' => 'KJD'],
                ['name' => 'Kericho County', 'code' => 'KRC'],
                ['name' => 'Laikipia County', 'code' => 'LKP'],
                ['name' => 'Nakuru County', 'code' => 'NKR'],
                ['name' => 'Nandi County', 'code' => 'NDI'],
                ['name' => 'Narok County', 'code' => 'NRK'],
                ['name' => 'Samburu County', 'code' => 'SMB'],
                ['name' => 'Trans Nzoia County', 'code' => 'TNZ'],
                ['name' => 'Turkana County', 'code' => 'TRK'],
                ['name' => 'Uasin Gishu County', 'code' => 'UGS'],
                ['name' => 'West Pokot County', 'code' => 'WPK'],
            ],

            'WST' => [
                ['name' => 'Bungoma County', 'code' => 'BNG'],
                ['name' => 'Busia County', 'code' => 'BSI'],
                ['name' => 'Kakamega County', 'code' => 'KKG'],
                ['name' => 'Vihiga County', 'code' => 'VHG'],
            ],
        ];

        $created = 0;
        $updated = 0;

        foreach ($countyGroups as $regionCode => $counties) {

            $region = Region::where('country_id', $country->id)
                ->where('code', $regionCode)
                ->first();

            if (!$region) {
                throw new RuntimeException(
                    "Region {$regionCode} does not exist. Run KenyaRegionSeeder first."
                );
            }

            foreach ($counties as $data) {

                $county = County::withTrashed()->firstOrNew([
                    'region_id' => $region->id,
                    'code' => $data['code'],
                ]);

                $isNew = !$county->exists;

                if ($county->trashed()) {
                    $county->restore();
                }

                $county->country_id = $country->id;
                $county->region_id = $region->id;
                $county->name = $data['name'];
                $county->code = $data['code'];
                $county->slug = Str::slug(
                    'kenya-' . $region->code . '-' . $data['name']
                );
                $county->is_active = true;

                $county->save();

                $isNew ? $created++ : $updated++;
            }
        }

        $this->command->newLine();

        $this->command->info(
            'Kenya counties seeded successfully.'
        );

        $this->command->table(
            ['Metric', 'Count'],
            [
                ['Total Counties', array_sum(
                    array_map('count', $countyGroups)
                )],
                ['New Counties', $created],
                ['Updated Counties', $updated],
            ]
        );
    }
}
