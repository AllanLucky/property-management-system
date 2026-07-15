<?php

namespace Database\Seeders;

use App\Models\Property;
use App\Models\PropertyVisit;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PropertyVisitsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // ✅ Only published properties (adjust filters as needed)
        $properties = Property::query()
            ->where('status', 'published')
            ->pluck('id')
            ->toArray();

        $users = User::pluck('id')->toArray();

        if (empty($properties)) {
            $this->command->warn('No published properties found. PropertyVisitsSeeder skipped.');
            return;
        }

        $devices = [
            [
                'device' => 'Desktop',
                'device_type' => 'Desktop',
                'platform' => 'Windows',
                'platform_version' => '11',
                'browser' => 'Chrome',
                'browser_version' => '138',
                'os' => 'Windows',
                'mobile' => false,
                'tablet' => false,
                'desktop' => true,
            ],
            [
                'device' => 'Desktop',
                'device_type' => 'Desktop',
                'platform' => 'macOS',
                'platform_version' => '15',
                'browser' => 'Safari',
                'browser_version' => '18',
                'os' => 'macOS',
                'mobile' => false,
                'tablet' => false,
                'desktop' => true,
            ],
            [
                'device' => 'Mobile',
                'device_type' => 'Phone',
                'platform' => 'Android',
                'platform_version' => '15',
                'browser' => 'Chrome',
                'browser_version' => '138',
                'os' => 'Android',
                'mobile' => true,
                'tablet' => false,
                'desktop' => false,
            ],
            [
                'device' => 'Tablet',
                'device_type' => 'Tablet',
                'platform' => 'iPadOS',
                'platform_version' => '18',
                'browser' => 'Safari',
                'browser_version' => '18',
                'os' => 'iPadOS',
                'mobile' => false,
                'tablet' => true,
                'desktop' => false,
            ],
        ];

        $locations = [
            ['country' => 'Kenya','region' => 'Nairobi','county' => 'Nairobi','city' => 'Nairobi','lat' => -1.286389,'lng' => 36.817223],
            ['country' => 'Kenya','region' => 'Coast','county' => 'Mombasa','city' => 'Mombasa','lat' => -4.043477,'lng' => 39.668206],
            ['country' => 'Kenya','region' => 'Rift Valley','county' => 'Nakuru','city' => 'Nakuru','lat' => -0.303099,'lng' => 36.080025],
            ['country' => 'Uganda','region' => 'Central','county' => 'Kampala','city' => 'Kampala','lat' => 0.347596,'lng' => 32.582520],
        ];

        $sources = [
            ['source' => 'Google','medium' => 'Organic','referer' => 'https://google.com'],
            ['source' => 'Facebook','medium' => 'Social','referer' => 'https://facebook.com'],
            ['source' => 'Instagram','medium' => 'Social','referer' => 'https://instagram.com'],
            ['source' => 'LinkedIn','medium' => 'Social','referer' => 'https://linkedin.com'],
            ['source' => 'Direct','medium' => 'Direct','referer' => null],
        ];

        DB::transaction(function () use ($properties, $users, $devices, $locations, $sources) {
            foreach ($properties as $propertyId) {
                $rows = [];
                $visitCount = fake()->numberBetween(80, 250);

                for ($i = 0; $i < $visitCount; $i++) {
                    $device = fake()->randomElement($devices);
                    $location = fake()->randomElement($locations);
                    $traffic = fake()->randomElement($sources);

                    $authenticated = fake()->boolean(70);
                    $visitedAt = fake()->dateTimeBetween('-1 year', 'now');
                    $isRobot = fake()->boolean(3);

                    $userAgent = match ($device['device']) {
                        'Desktop' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/138.0 Safari/537.36',
                        'Mobile' => 'Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/138.0 Mobile Safari/537.36',
                        'Tablet' => 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15',
                        default => fake()->userAgent(),
                    };

                    $campaign = match ($traffic['source']) {
                        'Google' => 'Google Search',
                        'Facebook' => 'Facebook Ads',
                        'Instagram' => 'Summer Campaign',
                        'LinkedIn' => 'Property Expo',
                        default => null,
                    };

                    $rows[] = [
                        'visit_uuid' => (string) Str::uuid(),
                        'property_id' => $propertyId,
                        'user_id' => $authenticated && count($users) ? fake()->randomElement($users) : null,
                        'session_id' => Str::uuid(),
                        'ip_address' => fake()->ipv4(),
                        'user_agent' => $userAgent,
                        'device' => $device['device'],
                        'device_type' => $device['device_type'],
                        'browser' => $device['browser'],
                        'browser_version' => $device['browser_version'],
                        'platform' => $device['platform'],
                        'platform_version' => $device['platform_version'],
                        'operating_system' => $device['os'],
                        'is_mobile' => $device['mobile'],
                        'is_tablet' => $device['tablet'],
                        'is_desktop' => $device['desktop'],
                        'is_robot' => $isRobot,
                        'country' => $location['country'],
                        'region' => $location['region'],
                        'county' => $location['county'],
                        'city' => $location['city'],
                        'latitude' => $location['lat'],
                        'longitude' => $location['lng'],
                        'timezone' => 'Africa/Nairobi',
                        'referer' => $traffic['referer'],
                        'source' => $traffic['source'],
                        'medium' => $traffic['medium'],
                        'campaign' => $campaign,
                        'is_unique' => fake()->boolean(45),
                        'duration' => fake()->numberBetween(20, 900),
                        'page_views' => fake()->numberBetween(1, 12),
                        'scroll_percentage' => fake()->numberBetween(10, 100),
                        'contact_clicked' => fake()->boolean(15),
                        'call_clicked' => fake()->boolean(12),
                        'whatsapp_clicked' => fake()->boolean(18),
                        'email_clicked' => fake()->boolean(10),
                        'bookmarked' => fake()->boolean(8),
                        'shared' => fake()->boolean(5),
                        'scheduled_visit' => fake()->boolean(6),
                        'visited_at' => $visitedAt,
                        'created_at' => $visitedAt,
                        'updated_at' => $visitedAt,
                    ];
                }

                foreach (array_chunk($rows, 500) as $chunk) {
                    PropertyVisit::insert($chunk);
                }
            }
        });

        $this->command->info(PropertyVisit::count() . ' property visits seeded successfully.');
    }
}
