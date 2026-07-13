<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\PropertyType;

class PropertyTypesSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            [
                'name' => 'Apartment',
                'description' => 'Modern residential units located within multi-storey buildings offering convenient urban living.',
                'icon' => 'building',
                'color' => '#3B82F6',
            ],
            [
                'name' => 'Penthouse',
                'description' => 'Luxury top-floor residences featuring premium finishes, spacious layouts, and panoramic views.',
                'icon' => 'crown',
                'color' => '#F59E0B',
            ],
            [
                'name' => 'Villa',
                'description' => 'Exclusive standalone homes offering privacy, luxury amenities, and expansive outdoor spaces.',
                'icon' => 'home',
                'color' => '#10B981',
            ],
            [
                'name' => 'Townhouse',
                'description' => 'Multi-level homes combining private living with community-style residential developments.',
                'icon' => 'houses',
                'color' => '#8B5CF6',
            ],
            [
                'name' => 'Bungalow',
                'description' => 'Single-storey homes designed for comfortable family living with easy accessibility.',
                'icon' => 'house',
                'color' => '#06B6D4',
            ],
            [
                'name' => 'Studio Apartment',
                'description' => 'Compact self-contained living spaces ideal for individuals and young professionals.',
                'icon' => 'door-open',
                'color' => '#6366F1',
            ],
            [
                'name' => 'Duplex',
                'description' => 'Two-level residential homes offering larger living spaces and enhanced privacy.',
                'icon' => 'building-2',
                'color' => '#EC4899',
            ],
            [
                'name' => 'Office Space',
                'description' => 'Professional workspaces suitable for companies, startups, and corporate businesses.',
                'icon' => 'briefcase',
                'color' => '#0F172A',
            ],
            [
                'name' => 'Retail Shop',
                'description' => 'Commercial spaces designed for retail stores, boutiques, and customer-facing businesses.',
                'icon' => 'store',
                'color' => '#F97316',
            ],
            [
                'name' => 'Warehouse',
                'description' => 'Large industrial facilities designed for storage, logistics, and distribution operations.',
                'icon' => 'warehouse',
                'color' => '#64748B',
            ],
            [
                'name' => 'Hotel & Resort',
                'description' => 'Hospitality properties offering accommodation, leisure facilities, and tourism services.',
                'icon' => 'hotel',
                'color' => '#14B8A6',
            ],
            [
                'name' => 'Serviced Apartment',
                'description' => 'Fully furnished apartments providing hotel-style services and long or short-term stays.',
                'icon' => 'key',
                'color' => '#84CC16',
            ],
            [
                'name' => 'Mixed Use Development',
                'description' => 'Properties combining residential, commercial, office, and leisure spaces within one development.',
                'icon' => 'layers',
                'color' => '#DC2626',
            ],
            [
                'name' => 'Land / Plot',
                'description' => 'Undeveloped land available for residential, commercial, agricultural, or investment purposes.',
                'icon' => 'map',
                'color' => '#65A30D',
            ],
            [
                'name' => 'Farm House',
                'description' => 'Country-style homes located on agricultural or spacious rural land.',
                'icon' => 'trees',
                'color' => '#15803D',
            ],
        ];

        foreach ($types as $index => $type) {

            PropertyType::updateOrCreate(
                [
                    'slug' => Str::slug($type['name']),
                ],
                [
                    /*
                    |--------------------------------------------------------------------------
                    | BASIC DETAILS
                    |--------------------------------------------------------------------------
                    */
                    'name' => $type['name'],
                    'slug' => Str::slug($type['name']),
                    'description' => $type['description'],

                    /*
                    |--------------------------------------------------------------------------
                    | DISPLAY SETTINGS
                    |--------------------------------------------------------------------------
                    */
                    'icon' => $type['icon'] ?? null,
                    'color' => $type['color'] ?? null,

                    /*
                    |--------------------------------------------------------------------------
                    | STATUS
                    |--------------------------------------------------------------------------
                    */
                    'is_active' => true,

                    /*
                    |--------------------------------------------------------------------------
                    | ORDERING
                    |--------------------------------------------------------------------------
                    */
                    'sort_order' => $index + 1,
                ]
            );
        }

        $this->command->info(
            'Professional property types seeded successfully.'
        );
    }
}