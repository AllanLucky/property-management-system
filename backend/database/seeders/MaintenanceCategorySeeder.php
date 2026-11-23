<?php

namespace Database\Seeders;

use App\Models\MaintenanceCategory;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class MaintenanceCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | Maintenance Categories
        |--------------------------------------------------------------------------
        |
        | These categories classify maintenance requests across properties,
        | apartments and individual units.
        |
        */

        $categories = [
            [
                'name' => 'Plumbing',
                'description' => 'Water supply, drainage, pipes, taps, toilets and bathroom repairs.',
                'icon' => 'droplets',
                'color' => '#0EA5E9',
                'is_active' => true,
            ],
            [
                'name' => 'Electrical',
                'description' => 'Electrical wiring, sockets, lighting, switches and power system repairs.',
                'icon' => 'zap',
                'color' => '#F59E0B',
                'is_active' => true,
            ],
            [
                'name' => 'Carpentry',
                'description' => 'Doors, windows, cabinets, furniture and woodwork repairs.',
                'icon' => 'hammer',
                'color' => '#A16207',
                'is_active' => true,
            ],
            [
                'name' => 'Painting',
                'description' => 'Interior and exterior painting, wall finishing and repainting.',
                'icon' => 'paintbrush',
                'color' => '#8B5CF6',
                'is_active' => true,
            ],
            [
                'name' => 'Masonry',
                'description' => 'Walls, floors, ceilings, tiles, concrete and structural repairs.',
                'icon' => 'brick-wall',
                'color' => '#78716C',
                'is_active' => true,
            ],
            [
                'name' => 'HVAC',
                'description' => 'Heating, ventilation, air conditioning and cooling system maintenance.',
                'icon' => 'fan',
                'color' => '#06B6D4',
                'is_active' => true,
            ],
            [
                'name' => 'Cleaning',
                'description' => 'General cleaning, waste management, sanitation and deep cleaning.',
                'icon' => 'sparkles',
                'color' => '#10B981',
                'is_active' => true,
            ],
            [
                'name' => 'Security Systems',
                'description' => 'Locks, gates, CCTV cameras, alarms and access control systems.',
                'icon' => 'shield-check',
                'color' => '#EF4444',
                'is_active' => true,
            ],
            [
                'name' => 'Roofing',
                'description' => 'Roof leaks, gutters, drainage and roof structure repairs.',
                'icon' => 'house',
                'color' => '#64748B',
                'is_active' => true,
            ],
            [
                'name' => 'Landscaping',
                'description' => 'Gardens, lawns, trees, outdoor spaces and compound maintenance.',
                'icon' => 'trees',
                'color' => '#16A34A',
                'is_active' => true,
            ],
            [
                'name' => 'Pest Control',
                'description' => 'Inspection and treatment for insects, rodents and other pests.',
                'icon' => 'bug',
                'color' => '#D97706',
                'is_active' => true,
            ],
            [
                'name' => 'General Maintenance',
                'description' => 'General property inspections, repairs and miscellaneous maintenance work.',
                'icon' => 'wrench',
                'color' => '#6366F1',
                'is_active' => true,
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | Insert or Update Categories
        |--------------------------------------------------------------------------
        */

        foreach ($categories as $category) {
            $slug = Str::slug($category['name']);

            MaintenanceCategory::updateOrCreate(
                [
                    'slug' => $slug,
                ],
                [
                    'name' => $category['name'],
                    'description' => $category['description'],
                    'icon' => $category['icon'],
                    'color' => $category['color'],
                    'is_active' => $category['is_active'],
                ]
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Seeding Summary
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            count($categories) . ' maintenance categories seeded successfully.'
        );
    }
}
