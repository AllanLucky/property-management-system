<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Apartment;
use App\Models\Property;
use Illuminate\Support\Str;

class ApartmentSeeder extends Seeder
{
    public function run(): void
    {
        $properties = Property::all();

        if ($properties->isEmpty()) {
            $this->command->warn("No properties found. Run PropertySeeder first.");
            return;
        }

        $blockNames = [
            'Sunrise Block',
            'Sunset Block',
            'Garden Block',
            'Skyline Block',
            'Riverside Block',
            'Palm Block',
        ];

        foreach ($properties as $property) {

            for ($i = 0; $i < 5; $i++) {

                $block = $blockNames[$i] ?? "Block " . ($i + 1);
                $name = "{$block} - {$property->name}";

                Apartment::create([

                    'property_id' => $property->id,
                    'owner_id' => $property->owner_id,

                    'name' => $name,

                    // ✅ SAFE UNIQUE SLUG
                    'slug' => Str::slug($name . '-' . uniqid()),

                    'code' => 'BLK-' . str_pad($i + 1, 2, '0', STR_PAD_LEFT),

                    'description' => "Modern {$block} located within {$property->name}",

                    'total_floors' => rand(3, 12),

                    'total_units' => 0,
                    'occupied_units' => 0,
                    'vacant_units' => 0,
                    'maintenance_units' => 0,
                    'occupancy_rate' => 0,

                    'status' => 'active',
                    'is_featured' => (bool) rand(0, 1),
                    'is_published' => true,

                    'latitude' => $property->latitude,
                    'longitude' => $property->longitude,

                    // ✅ IMPORTANT FIX: ALWAYS JSON ENCODE HERE
                    'amenities' => json_encode([
                        'parking',
                        'security',
                        'water',
                        'wifi',
                    ]),

                    'published_at' => now(),
                ]);
            }
        }
    }
}