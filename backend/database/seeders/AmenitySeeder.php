<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Amenity;
use Illuminate\Support\Str;

class AmenitySeeder extends Seeder
{
    public function run(): void
    {
        $amenities = [

            [
                'name'        => 'WiFi',
                'icon'        => 'wifi',
                'color'       => '#3B82F6',
                'description' => 'High-speed internet connection',
                'sort_order'  => 1,
                'is_active'   => true,
            ],

            [
                'name'        => 'Parking',
                'icon'        => 'car',
                'color'       => '#10B981',
                'description' => 'Secure parking space available',
                'sort_order'  => 2,
                'is_active'   => true,
            ],

            [
                'name'        => '24/7 Security',
                'icon'        => 'shield',
                'color'       => '#EF4444',
                'description' => 'Round-the-clock security services',
                'sort_order'  => 3,
                'is_active'   => true,
            ],

            [
                'name'        => 'Gym',
                'icon'        => 'dumbbell',
                'color'       => '#F59E0B',
                'description' => 'Modern fitness and workout facility',
                'sort_order'  => 4,
                'is_active'   => true,
            ],

            [
                'name'        => 'Swimming Pool',
                'icon'        => 'waves',
                'color'       => '#06B6D4',
                'description' => 'Shared outdoor swimming pool',
                'sort_order'  => 5,
                'is_active'   => true,
            ],

            [
                'name'        => 'Elevator',
                'icon'        => 'arrow-up',
                'color'       => '#6366F1',
                'description' => 'Lift access to all building floors',
                'sort_order'  => 6,
                'is_active'   => true,
            ],

            [
                'name'        => 'Balcony',
                'icon'        => 'home',
                'color'       => '#8B5CF6',
                'description' => 'Private balcony with outdoor space',
                'sort_order'  => 7,
                'is_active'   => true,
            ],

            [
                'name'        => 'Air Conditioning',
                'icon'        => 'snowflake',
                'color'       => '#0EA5E9',
                'description' => 'Cooling and temperature control system',
                'sort_order'  => 8,
                'is_active'   => true,
            ],

            [
                'name'        => 'Laundry Room',
                'icon'        => 'shirt',
                'color'       => '#14B8A6',
                'description' => 'Shared washing and drying facilities',
                'sort_order'  => 9,
                'is_active'   => true,
            ],

            [
                'name'        => 'Backup Generator',
                'icon'        => 'battery',
                'color'       => '#F97316',
                'description' => 'Power backup during electricity outages',
                'sort_order'  => 10,
                'is_active'   => true,
            ],

            [
                'name'        => 'CCTV Surveillance',
                'icon'        => 'camera',
                'color'       => '#DC2626',
                'description' => 'Security cameras installed in common areas',
                'sort_order'  => 11,
                'is_active'   => true,
            ],

            [
                'name'        => 'Garden',
                'icon'        => 'trees',
                'color'       => '#16A34A',
                'description' => 'Beautiful landscaped outdoor garden',
                'sort_order'  => 12,
                'is_active'   => true,
            ],

            [
                'name'        => 'Children Play Area',
                'icon'        => 'baby',
                'color'       => '#EC4899',
                'description' => 'Safe playground for children',
                'sort_order'  => 13,
                'is_active'   => true,
            ],

            [
                'name'        => 'Pet Friendly',
                'icon'        => 'paw-print',
                'color'       => '#A855F7',
                'description' => 'Pets are allowed within the property',
                'sort_order'  => 14,
                'is_active'   => true,
            ],

            [
                'name'        => 'Furnished',
                'icon'        => 'sofa',
                'color'       => '#7C3AED',
                'description' => 'Property comes with furniture included',
                'sort_order'  => 15,
                'is_active'   => true,
            ],

            [
                'name'        => 'Kitchen Appliances',
                'icon'        => 'chef-hat',
                'color'       => '#EAB308',
                'description' => 'Includes modern kitchen appliances',
                'sort_order'  => 16,
                'is_active'   => true,
            ],

            [
                'name'        => 'Water Supply',
                'icon'        => 'droplets',
                'color'       => '#0284C7',
                'description' => 'Reliable and continuous water supply',
                'sort_order'  => 17,
                'is_active'   => true,
            ],

            [
                'name'        => 'Internet Fiber',
                'icon'        => 'router',
                'color'       => '#2563EB',
                'description' => 'High-speed fiber internet connection',
                'sort_order'  => 18,
                'is_active'   => true,
            ],

            [
                'name'        => 'Fire Safety System',
                'icon'        => 'flame',
                'color'       => '#B91C1C',
                'description' => 'Smoke detectors and fire extinguishers installed',
                'sort_order'  => 19,
                'is_active'   => true,
            ],

            [
                'name'        => 'Reception Area',
                'icon'        => 'building',
                'color'       => '#4F46E5',
                'description' => 'Professional reception and guest waiting area',
                'sort_order'  => 20,
                'is_active'   => true,
            ],
        ];


        foreach ($amenities as $item) {

            $slug = Str::slug($item['name']);

            Amenity::updateOrCreate(
                ['slug' => $slug],
                [
                    'name'        => $item['name'],
                    'slug'        => $slug,
                    'icon'        => $item['icon'],
                    'color'       => $item['color'],
                    'description' => $item['description'],
                    'sort_order'  => $item['sort_order'],
                    'is_active'   => $item['is_active'],
                ]
            );
        }

        $this->command->info('20 amenities seeded successfully.');
    }
}