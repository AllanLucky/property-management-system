<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\PropertyCategory;

class PropertyCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        // ✅ In local/dev, wipe table before seeding to avoid duplicates
        if (app()->environment('local')) {
            PropertyCategory::truncate();
            $this->command->warn('Property categories truncated before seeding (local env).');
        }

        $categories = [
            [
                'name'        => 'Residential Properties',
                'description' => 'Houses, apartments, villas, and homes designed for comfortable family living.',
                'icon'        => 'home',
                'color'       => '#3B82F6',
                'featured'    => true,
            ],
            [
                'name'        => 'Commercial Properties',
                'description' => 'Office spaces, retail shops, malls, and business premises.',
                'icon'        => 'building',
                'color'       => '#10B981',
                'featured'    => true,
            ],
            [
                'name'        => 'Luxury Properties',
                'description' => 'Exclusive high-end residences with premium designs.',
                'icon'        => 'crown',
                'color'       => '#F59E0B',
                'featured'    => true,
            ],
            // … keep all other categories here …
            [
                'name'        => 'Waterfront Properties',
                'description' => 'Luxury homes and developments near oceans, rivers, and lakes.',
                'icon'        => 'waves',
                'color'       => '#0284C7',
                'featured'    => true,
            ],
        ];

        foreach ($categories as $index => $category) {
            $slug = Str::slug($category['name']);

            PropertyCategory::updateOrCreate(
                ['slug' => $slug], // unique key
                [
                    'parent_id'       => null,
                    'name'            => $category['name'],
                    'slug'            => $slug,
                    'description'     => $category['description'],
                    'status'          => PropertyCategory::STATUS_ACTIVE,
                    'icon'            => $category['icon'],
                    'color'           => $category['color'],
                    'sort_order'      => $index + 1,
                    'is_featured'     => $category['featured'],
                    'is_popular'      => true,
                    'show_in_homepage'=> true,
                    'published_at'    => now(),
                    'views_count'     => 0,
                    'meta_title'      => $category['name'] . ' | Premium Real Estate Listings',
                    'meta_description'=> $category['description'],
                    'meta_keywords'   => strtolower($category['name']) . ', real estate, property listings, homes, investment',
                    'settings'        => [
                        'allow_listing'    => true,
                        'show_on_homepage' => true,
                        'allow_in_search'  => true,
                    ],
                ]
            );
        }

        $this->command->info('✅ Property categories seeded successfully (safe, idempotent, no duplicates).');
    }
}
