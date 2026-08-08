<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\PropertyCategory;

class PropertyCategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | PROPERTY CATEGORY HIERARCHY
        |--------------------------------------------------------------------------
        |
        | Root categories have parent_id = null.
        |
        | Child categories reference the ID of their parent category.
        |
        | The seeder uses category slugs to resolve parent IDs dynamically,
        | therefore IDs do not need to be hard-coded.
        |
        */

        $categories = [

            /*
            |--------------------------------------------------------------------------
            | 01. RESIDENTIAL PROPERTIES
            |--------------------------------------------------------------------------
            */

            [
                'name'        => 'Residential Properties',
                'parent'      => null,
                'description' => 'Houses, apartments, villas, townhouses, and homes designed for comfortable residential living.',
                'icon'        => 'home',
                'color'       => '#3B82F6',
                'featured'    => true,
            ],

            [
                'name'        => 'Apartments',
                'parent'      => 'Residential Properties',
                'description' => 'Modern apartment buildings, flats, studios, and multi-unit residential developments.',
                'icon'        => 'building-2',
                'color'       => '#6366F1',
                'featured'    => true,
            ],

            [
                'name'        => 'Houses',
                'parent'      => 'Residential Properties',
                'description' => 'Standalone residential houses suitable for families, individuals, and long-term residential use.',
                'icon'        => 'house',
                'color'       => '#14B8A6',
                'featured'    => true,
            ],

            [
                'name'        => 'Villas',
                'parent'      => 'Residential Properties',
                'description' => 'Spacious standalone villas offering privacy, premium amenities, gardens, and modern living spaces.',
                'icon'        => 'castle',
                'color'       => '#8B5CF6',
                'featured'    => true,
            ],

            [
                'name'        => 'Townhouses',
                'parent'      => 'Residential Properties',
                'description' => 'Modern attached or semi-detached residential homes offering community living and private facilities.',
                'icon'        => 'home',
                'color'       => '#EC4899',
                'featured'    => false,
            ],

            [
                'name'        => 'Luxury Properties',
                'parent'      => 'Residential Properties',
                'description' => 'Exclusive high-end residences and developments offering premium architecture, finishes, amenities, and services.',
                'icon'        => 'crown',
                'color'       => '#F59E0B',
                'featured'    => true,
            ],

            [
                'name'        => 'Student Housing',
                'parent'      => 'Residential Properties',
                'description' => 'Purpose-built student accommodation, hostels, residences, and rental properties near educational institutions.',
                'icon'        => 'graduation-cap',
                'color'       => '#2563EB',
                'featured'    => false,
            ],

            [
                'name'        => 'Short-Stay Properties',
                'parent'      => 'Residential Properties',
                'description' => 'Furnished apartments, holiday homes, serviced apartments, and properties available for short-term accommodation.',
                'icon'        => 'calendar-days',
                'color'       => '#DB2777',
                'featured'    => true,
            ],

            [
                'name'        => 'Serviced Apartments',
                'parent'      => 'Residential Properties',
                'description' => 'Fully furnished apartments offering housekeeping, security, utilities, and other hotel-style services.',
                'icon'        => 'concierge-bell',
                'color'       => '#9333EA',
                'featured'    => true,
            ],

            [
                'name'        => 'Gated Communities',
                'parent'      => 'Residential Properties',
                'description' => 'Secure residential communities offering shared amenities, controlled access, security, and community facilities.',
                'icon'        => 'shield-check',
                'color'       => '#059669',
                'featured'    => true,
            ],

            /*
            |--------------------------------------------------------------------------
            | 02. COMMERCIAL PROPERTIES
            |--------------------------------------------------------------------------
            */

            [
                'name'        => 'Commercial Properties',
                'parent'      => null,
                'description' => 'Office spaces, retail shops, malls, business premises, and other commercial developments.',
                'icon'        => 'building',
                'color'       => '#10B981',
                'featured'    => true,
            ],

            [
                'name'        => 'Office Spaces',
                'parent'      => 'Commercial Properties',
                'description' => 'Professional office buildings, suites, coworking spaces, and business offices for companies and organizations.',
                'icon'        => 'briefcase-business',
                'color'       => '#0EA5E9',
                'featured'    => true,
            ],

            [
                'name'        => 'Retail Properties',
                'parent'      => 'Commercial Properties',
                'description' => 'Shops, retail stores, showrooms, shopping centers, and spaces designed for retail businesses.',
                'icon'        => 'store',
                'color'       => '#F97316',
                'featured'    => true,
            ],

            [
                'name'        => 'Industrial Properties',
                'parent'      => 'Commercial Properties',
                'description' => 'Warehouses, factories, manufacturing facilities, industrial yards, and logistics properties.',
                'icon'        => 'factory',
                'color'       => '#64748B',
                'featured'    => false,
            ],

            [
                'name'        => 'Mixed-Use Properties',
                'parent'      => 'Commercial Properties',
                'description' => 'Developments combining residential, commercial, retail, office, and other property uses.',
                'icon'        => 'layers-3',
                'color'       => '#7C3AED',
                'featured'    => true,
            ],

            /*
            |--------------------------------------------------------------------------
            | 03. LAND & DEVELOPMENT
            |--------------------------------------------------------------------------
            */

            [
                'name'        => 'Land',
                'parent'      => null,
                'description' => 'Residential, commercial, agricultural, development, and investment land parcels.',
                'icon'        => 'landmark',
                'color'       => '#84CC16',
                'featured'    => true,
            ],

            [
                'name'        => 'Agricultural Properties',
                'parent'      => 'Land',
                'description' => 'Farms, agricultural land, ranches, plantations, and properties suitable for agricultural activities.',
                'icon'        => 'wheat',
                'color'       => '#65A30D',
                'featured'    => false,
            ],

            [
                'name'        => 'Development Projects',
                'parent'      => 'Land',
                'description' => 'New construction projects, off-plan developments, property developments, and investment opportunities.',
                'icon'        => 'construction',
                'color'       => '#EA580C',
                'featured'    => true,
            ],

            /*
            |--------------------------------------------------------------------------
            | 04. INVESTMENT PROPERTIES
            |--------------------------------------------------------------------------
            */

            [
                'name'        => 'Investment Properties',
                'parent'      => null,
                'description' => 'Income-generating and investment-focused properties suitable for rental income, capital growth, and portfolio diversification.',
                'icon'        => 'chart-no-axes-combined',
                'color'       => '#16A34A',
                'featured'    => true,
            ],

            [
                'name'        => 'Waterfront Properties',
                'parent'      => 'Investment Properties',
                'description' => 'Luxury homes, apartments, villas, resorts, and developments located near oceans, rivers, lakes, and other waterfronts.',
                'icon'        => 'waves',
                'color'       => '#0284C7',
                'featured'    => true,
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | SETTINGS
        |--------------------------------------------------------------------------
        */

        $settings = [
            'allow_listing'    => true,
            'show_on_homepage' => true,
            'allow_in_search'  => true,
            'allow_favorites'  => true,
            'allow_reviews'    => true,
            'allow_visits'     => true,
        ];

        /*
        |--------------------------------------------------------------------------
        | STEP 1: CREATE ROOT CATEGORIES
        |--------------------------------------------------------------------------
        |
        | Root categories must exist before child categories can reference them.
        |
        */

        $rootCategories = collect($categories)
            ->whereNull('parent')
            ->values();

        $categoryModels = [];

        foreach ($rootCategories as $index => $category) {

            $slug = Str::slug($category['name']);

            $metaTitle = $category['name']
                . ' | Premium Real Estate Listings';

            $metaDescription = $category['description'];

            $metaKeywords = implode(', ', [
                strtolower($category['name']),
                'real estate',
                'property listings',
                'properties',
                'homes',
                'apartments',
                'property investment',
                'Kenya real estate',
            ]);

            $categoryModel = PropertyCategory::withTrashed()
                ->updateOrCreate(
                    [
                        'slug' => $slug,
                    ],
                    [
                        'parent_id'        => null,
                        'name'             => $category['name'],
                        'slug'             => $slug,
                        'description'      => $category['description'],
                        'status'           => PropertyCategory::STATUS_ACTIVE,
                        'icon'             => $category['icon'],
                        'color'            => $category['color'],
                        'sort_order'       => $index + 1,
                        'is_featured'      => $category['featured'],
                        'is_popular'       => $category['featured'],
                        'show_in_homepage' => true,
                        'published_at'     => now(),
                        'views_count'      => 0,
                        'meta_title'       => $metaTitle,
                        'meta_description' => $metaDescription,
                        'meta_keywords'    => $metaKeywords,
                        'settings'         => $settings,
                    ]
                );

            /*
            |--------------------------------------------------------------------------
            | RESTORE SOFT-DELETED CATEGORY
            |--------------------------------------------------------------------------
            */

            if ($categoryModel->trashed()) {
                $categoryModel->restore();
            }

            $categoryModels[$slug] = $categoryModel;

            $this->command?->info(
                "Root category created/updated: {$category['name']}"
            );
        }

        /*
        |--------------------------------------------------------------------------
        | STEP 2: CREATE CHILD CATEGORIES
        |--------------------------------------------------------------------------
        |
        | Parent IDs are resolved dynamically from the root category models.
        |
        */

        $childCategories = collect($categories)
            ->whereNotNull('parent')
            ->values();

        foreach ($childCategories as $index => $category) {

            $slug = Str::slug($category['name']);

            $parentSlug = Str::slug($category['parent']);

            /*
            |--------------------------------------------------------------------------
            | FIND PARENT
            |--------------------------------------------------------------------------
            */

            $parent = $categoryModels[$parentSlug]
                ?? PropertyCategory::where('slug', $parentSlug)->first();

            if (! $parent) {
                $this->command?->error(
                    "Parent category '{$category['parent']}' not found for '{$category['name']}'."
                );

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | META DATA
            |--------------------------------------------------------------------------
            */

            $metaTitle = $category['name']
                . ' | '
                . $category['parent']
                . ' | Premium Real Estate Listings';

            $metaDescription = $category['description'];

            $metaKeywords = implode(', ', [
                strtolower($category['name']),
                strtolower($category['parent']),
                'real estate',
                'property listings',
                'properties',
                'homes',
                'property investment',
                'Kenya real estate',
            ]);

            /*
            |--------------------------------------------------------------------------
            | SORT ORDER
            |--------------------------------------------------------------------------
            |
            | Child categories continue after the root categories.
            |
            */

            $sortOrder = count($rootCategories) + $index + 1;

            /*
            |--------------------------------------------------------------------------
            | CREATE / UPDATE CHILD
            |--------------------------------------------------------------------------
            */

            $categoryModel = PropertyCategory::withTrashed()
                ->updateOrCreate(
                    [
                        'slug' => $slug,
                    ],
                    [
                        'parent_id'        => $parent->id,
                        'name'             => $category['name'],
                        'slug'             => $slug,
                        'description'      => $category['description'],
                        'status'           => PropertyCategory::STATUS_ACTIVE,
                        'icon'             => $category['icon'],
                        'color'            => $category['color'],
                        'sort_order'       => $sortOrder,
                        'is_featured'      => $category['featured'],
                        'is_popular'       => $category['featured'],
                        'show_in_homepage' => true,
                        'published_at'     => now(),
                        'views_count'      => 0,
                        'meta_title'       => $metaTitle,
                        'meta_description' => $metaDescription,
                        'meta_keywords'    => $metaKeywords,
                        'settings'         => $settings,
                    ]
                );

            /*
            |--------------------------------------------------------------------------
            | RESTORE SOFT-DELETED CATEGORY
            |--------------------------------------------------------------------------
            */

            if ($categoryModel->trashed()) {
                $categoryModel->restore();
            }

            $this->command?->info(
                "Child category created/updated: {$category['name']} "
                . "→ {$parent->name} (parent_id: {$parent->id})"
            );
        }

        /*
        |--------------------------------------------------------------------------
        | FINAL SUMMARY
        |--------------------------------------------------------------------------
        */

        $totalCategories = count($categories);

        $rootCount = $rootCategories->count();

        $childCount = $childCategories->count();

        $this->command?->newLine();

        $this->command?->info(
            "✅ {$totalCategories} property categories seeded successfully."
        );

        $this->command?->info(
            "🌳 Root categories: {$rootCount}"
        );

        $this->command?->info(
            "↳ Child categories: {$childCount}"
        );

        $this->command?->info(
            '✅ Category hierarchy created successfully.'
        );

        $this->command?->info(
            '✅ Seeder is idempotent and does not create duplicate categories.'
        );
    }
}
