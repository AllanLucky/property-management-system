<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Property;
use App\Models\PropertyVisit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PropertyVisitsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {

            $users = User::pluck('id')->toArray();
            $properties = Property::pluck('id')->toArray();

            if (empty($properties)) {
                $this->command->warn('No properties found. Skipping PropertyVisitsSeeder.');
                return;
            }

            $devices = [
                'Desktop',
                'Mobile',
                'Tablet',
            ];

            $browsers = [
                'Chrome',
                'Firefox',
                'Safari',
                'Edge',
                'Opera',
            ];

            $platforms = [
                'Windows',
                'macOS',
                'Linux',
                'Android',
                'iOS',
            ];

            $countries = [
                'Kenya',
                'Uganda',
                'Tanzania',
                'Rwanda',
                'South Sudan',
            ];

            $cities = [
                'Nairobi',
                'Mombasa',
                'Kisumu',
                'Nakuru',
                'Eldoret',
                'Thika',
            ];

            $referers = [
                'https://google.com',
                'https://facebook.com',
                'https://instagram.com',
                'https://twitter.com',
                'https://linkedin.com',
                'Direct',
            ];

            foreach ($properties as $propertyId) {

                // Random visits for each property
                $visits = rand(50, 250);

                for ($i = 0; $i < $visits; $i++) {

                    $authenticated = fake()->boolean(70);

                    $userId = null;

                    if ($authenticated && count($users)) {
                        $userId = fake()->randomElement($users);
                    }

                    PropertyVisit::create([

                        /*
                        |--------------------------------------------------------------------------
                        | RELATIONSHIPS
                        |--------------------------------------------------------------------------
                        */

                        'property_id' => $propertyId,
                        'user_id' => $userId,

                        /*
                        |--------------------------------------------------------------------------
                        | VISITOR
                        |--------------------------------------------------------------------------
                        */

                        'session_id' => fake()->uuid(),

                        'ip_address' => fake()->ipv4(),

                        'user_agent' => fake()->userAgent(),

                        /*
                        |--------------------------------------------------------------------------
                        | DEVICE
                        |--------------------------------------------------------------------------
                        */

                        'device' => fake()->randomElement($devices),

                        'browser' => fake()->randomElement($browsers),

                        'platform' => fake()->randomElement($platforms),

                        /*
                        |--------------------------------------------------------------------------
                        | REFERRER
                        |--------------------------------------------------------------------------
                        */

                        'referer' => fake()->randomElement($referers),

                        /*
                        |--------------------------------------------------------------------------
                        | LOCATION
                        |--------------------------------------------------------------------------
                        */

                        'country' => fake()->randomElement($countries),

                        'city' => fake()->randomElement($cities),

                        /*
                        |--------------------------------------------------------------------------
                        | VISIT
                        |--------------------------------------------------------------------------
                        */

                        'is_unique' => fake()->boolean(40),

                        'visited_at' => fake()->dateTimeBetween(
                            '-1 year',
                            'now'
                        ),

                        /*
                        |--------------------------------------------------------------------------
                        | TIMESTAMPS
                        |--------------------------------------------------------------------------
                        */

                        'created_at' => now(),

                        'updated_at' => now(),
                    ]);
                }
            }

            $this->command->info(
                PropertyVisit::count() . ' property visits seeded successfully.'
            );
        });
    }
}