<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\PropertyCategory;

class PropertyCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Residential Properties',
                'description' => 'Houses, apartments, villas, and homes designed for comfortable family living.',
                'icon' => 'home',
                'color' => '#3B82F6',
                'featured' => true,
            ],
            [
                'name' => 'Commercial Properties',
                'description' => 'Office spaces, retail shops, malls, and business premises.',
                'icon' => 'building',
                'color' => '#10B981',
                'featured' => true,
            ],
            [
                'name' => 'Luxury Properties',
                'description' => 'Exclusive high-end residences with premium designs.',
                'icon' => 'crown',
                'color' => '#F59E0B',
                'featured' => true,
            ],
            [
                'name' => 'Affordable Housing',
                'description' => 'Budget-friendly homes offering quality living.',
                'icon' => 'wallet',
                'color' => '#6366F1',
                'featured' => false,
            ],
            [
                'name' => 'Rental Properties',
                'description' => 'Short and long-term rental homes and apartments.',
                'icon' => 'key',
                'color' => '#8B5CF6',
                'featured' => false,
            ],
            [
                'name' => 'Student Accommodation',
                'description' => 'Hostels, dormitories and student residences.',
                'icon' => 'graduation-cap',
                'color' => '#06B6D4',
                'featured' => false,
            ],
            [
                'name' => 'Holiday & Vacation Homes',
                'description' => 'Beach houses, resorts and getaway properties.',
                'icon' => 'palmtree',
                'color' => '#14B8A6',
                'featured' => false,
            ],
            [
                'name' => 'Investment Properties',
                'description' => 'Properties focused on long-term investment returns.',
                'icon' => 'chart-line',
                'color' => '#EF4444',
                'featured' => true,
            ],
            [
                'name' => 'Land & Development',
                'description' => 'Residential and commercial land for development.',
                'icon' => 'map',
                'color' => '#84CC16',
                'featured' => false,
            ],
            [
                'name' => 'Industrial Properties',
                'description' => 'Factories, warehouses and logistics facilities.',
                'icon' => 'factory',
                'color' => '#64748B',
                'featured' => false,
            ],
            [
                'name' => 'Farm & Agricultural Land',
                'description' => 'Farmland, ranches, plantations, and agricultural investment properties.',
                'icon' => 'tractor',
                'color' => '#65A30D',
                'featured' => false,
            ],
            [
                'name' => 'Mixed-Use Developments',
                'description' => 'Properties combining residential, commercial, and recreational facilities.',
                'icon' => 'layout-grid',
                'color' => '#0EA5E9',
                'featured' => true,
            ],
            [
                'name' => 'Office Spaces',
                'description' => 'Corporate offices, coworking spaces, and professional workplaces.',
                'icon' => 'briefcase',
                'color' => '#2563EB',
                'featured' => false,
            ],
            [
                'name' => 'Retail Properties',
                'description' => 'Shopping malls, stores, showrooms, and retail business locations.',
                'icon' => 'shopping-bag',
                'color' => '#EC4899',
                'featured' => false,
            ],
            [
                'name' => 'Hotels & Hospitality',
                'description' => 'Hotels, resorts, lodges, and hospitality investment properties.',
                'icon' => 'hotel',
                'color' => '#F97316',
                'featured' => true,
            ],
            [
                'name' => 'Healthcare Properties',
                'description' => 'Hospitals, clinics, medical centers, and healthcare facilities.',
                'icon' => 'heart-pulse',
                'color' => '#DC2626',
                'featured' => false,
            ],
            [
                'name' => 'Senior Living Communities',
                'description' => 'Retirement homes and assisted living facilities.',
                'icon' => 'users',
                'color' => '#9333EA',
                'featured' => false,
            ],
            [
                'name' => 'Eco-Friendly Properties',
                'description' => 'Sustainable green buildings designed for environmental efficiency.',
                'icon' => 'leaf',
                'color' => '#16A34A',
                'featured' => true,
            ],
            [
                'name' => 'Smart Homes',
                'description' => 'Modern homes equipped with automation and smart technology.',
                'icon' => 'cpu',
                'color' => '#0891B2',
                'featured' => true,
            ],
            [
                'name' => 'Waterfront Properties',
                'description' => 'Luxury homes and developments near oceans, rivers, and lakes.',
                'icon' => 'waves',
                'color' => '#0284C7',
                'featured' => true,
            ],
        ];

        foreach ($categories as $index => $category) {

            $slug = Str::slug($category['name']);

            PropertyCategory::updateOrCreate(
                [
                    'slug' => $slug,
                ],
                [
                    /*
                    |--------------------------------------------------------------------------
                    | BASIC INFO
                    |--------------------------------------------------------------------------
                    */
                    'parent_id' => null,
                    'name' => $category['name'],
                    'slug' => $slug,
                    'description' => $category['description'],
                    'status' => PropertyCategory::STATUS_ACTIVE,

                    /*
                    |--------------------------------------------------------------------------
                    | DISPLAY
                    |--------------------------------------------------------------------------
                    */
                    'icon' => $category['icon'],
                    'color' => $category['color'],
                    'sort_order' => $index + 1,

                    /*
                    |--------------------------------------------------------------------------
                    | VISIBILITY
                    |--------------------------------------------------------------------------
                    */
                    'is_featured' => $category['featured'],
                    'is_popular' => true,
                    'show_in_homepage' => true,
                    'published_at' => now(),

                    /*
                    |--------------------------------------------------------------------------
                    | ANALYTICS
                    |--------------------------------------------------------------------------
                    */
                    'views_count' => 0,

                    /*
                    |--------------------------------------------------------------------------
                    | SEO (FLAT ONLY — NO JSON DUPLICATION)
                    |--------------------------------------------------------------------------
                    */
                    'meta_title' => $category['name'] . ' | Premium Real Estate Listings',
                    'meta_description' => $category['description'],
                    'meta_keywords' => strtolower($category['name']) . ', real estate, property listings, homes, investment',

                    /*
                    |--------------------------------------------------------------------------
                    | SETTINGS (ONLY JSON LEFT)
                    |--------------------------------------------------------------------------
                    */
                    'settings' => [
                        'allow_listing' => true,
                        'show_on_homepage' => true,
                        'allow_in_search' => true,
                    ],
                ]
            );
        }

        $this->command->info(
            '✅ Property categories seeded successfully (clean schema, no duplication, production ready).'
        );
    }
}