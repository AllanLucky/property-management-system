<?php

namespace Database\Seeders;

use App\Models\Country;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CountrySeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            [
                'name' => 'Kenya',
                'code' => 'KE',
                'phone_code' => '+254',
                'currency' => 'KES',
            ],
            [
                'name' => 'Uganda',
                'code' => 'UG',
                'phone_code' => '+256',
                'currency' => 'UGX',
            ],
            [
                'name' => 'Tanzania',
                'code' => 'TZ',
                'phone_code' => '+255',
                'currency' => 'TZS',
            ],
            [
                'name' => 'Rwanda',
                'code' => 'RW',
                'phone_code' => '+250',
                'currency' => 'RWF',
            ],
            [
                'name' => 'Nigeria',
                'code' => 'NG',
                'phone_code' => '+234',
                'currency' => 'NGN',
            ],
            [
                'name' => 'Zambia',
                'code' => 'ZM',
                'phone_code' => '+260',
                'currency' => 'ZMW',
            ],
            [
                'name' => 'Morocco',
                'code' => 'MA',
                'phone_code' => '+212',
                'currency' => 'MAD',
            ],
            [
                'name' => 'Ghana',
                'code' => 'GH',
                'phone_code' => '+233',
                'currency' => 'GHS',
            ],
        ];

        foreach ($countries as $data) {
            Country::updateOrCreate(
                ['code' => $data['code']],
                [
                    'name' => $data['name'],
                    'slug' => Str::slug($data['name']),
                    'phone_code' => $data['phone_code'],
                    'currency' => $data['currency'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Countries seeded successfully.');
    }
}
