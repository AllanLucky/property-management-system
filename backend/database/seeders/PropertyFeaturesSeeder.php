<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\PropertyFeature;

class PropertyFeaturesSeeder extends Seeder
{
    public function run(): void
    {
        $features = [
            [
                'name' => 'Swimming Pool',
                'icon' => 'waves',
                'description' => 'Modern swimming pool for recreation and relaxation',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Gym & Fitness Center',
                'icon' => 'dumbbell',
                'description' => 'Fully equipped gym with modern fitness equipment',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Secure Parking',
                'icon' => 'car',
                'description' => 'Dedicated and secure parking area for residents',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => '24/7 Security',
                'icon' => 'shield-check',
                'description' => 'Round-the-clock security personnel and surveillance',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'High-Speed Internet',
                'icon' => 'wifi',
                'description' => 'Reliable high-speed WiFi connectivity',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Backup Power Generator',
                'icon' => 'battery',
                'description' => 'Automatic backup power during electricity outages',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Air Conditioning',
                'icon' => 'fan',
                'description' => 'Efficient climate control and cooling system',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Elevator Access',
                'icon' => 'arrow-up',
                'description' => 'Easy elevator access to upper floors',
                'type' => 'boolean',
                'is_highlighted' => false,
            ],
            [
                'name' => 'Private Balcony',
                'icon' => 'building',
                'description' => 'Private outdoor space with views and fresh air',
                'type' => 'boolean',
                'is_highlighted' => false,
            ],
            [
                'name' => 'Private Garden',
                'icon' => 'tree-pine',
                'description' => 'Landscaped garden area for relaxation',
                'type' => 'boolean',
                'is_highlighted' => false,
            ],
            [
                'name' => 'CCTV Surveillance',
                'icon' => 'camera',
                'description' => 'Security cameras monitoring common areas',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Children Playground',
                'icon' => 'baby',
                'description' => 'Safe play area designed for children',
                'type' => 'boolean',
                'is_highlighted' => false,
            ],
            [
                'name' => 'Laundry Room',
                'icon' => 'shirt',
                'description' => 'Shared or private laundry facilities available',
                'type' => 'boolean',
                'is_highlighted' => false,
            ],
            [
                'name' => 'Rooftop Terrace',
                'icon' => 'sun',
                'description' => 'Open rooftop area for leisure and gatherings',
                'type' => 'boolean',
                'is_highlighted' => false,
            ],
            [
                'name' => 'Pet Friendly',
                'icon' => 'paw-print',
                'description' => 'Property allows residents to keep pets',
                'type' => 'boolean',
                'is_highlighted' => false,
            ],
            [
                'name' => 'Furnished Units',
                'icon' => 'sofa',
                'description' => 'Properties come with essential furniture',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Water Storage System',
                'icon' => 'droplets',
                'description' => 'Backup water storage for continuous supply',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Electric Fence',
                'icon' => 'zap',
                'description' => 'Additional perimeter security protection',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Fire Safety System',
                'icon' => 'flame',
                'description' => 'Smoke detectors and fire protection equipment',
                'type' => 'boolean',
                'is_highlighted' => true,
            ],
            [
                'name' => 'Wheelchair Accessibility',
                'icon' => 'accessibility',
                'description' => 'Accessible facilities for people with disabilities',
                'type' => 'boolean',
                'is_highlighted' => false,
            ],
        ];

        foreach ($features as $index => $feature) {
            PropertyFeature::updateOrCreate(
                [
                    'slug' => Str::slug($feature['name']),
                ],
                [
                    'name' => $feature['name'],
                    'icon' => $feature['icon'],
                    'description' => $feature['description'],
                    'type' => $feature['type'],
                    'is_active' => true,
                    'is_highlighted' => $feature['is_highlighted'],
                    'sort_order' => $index + 1,
                ]
            );
        }

        $this->command->info('20 property features seeded successfully.');
    }
}