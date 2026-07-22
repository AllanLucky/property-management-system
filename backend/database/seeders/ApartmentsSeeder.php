<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Apartment;
use App\Models\Property;
use Illuminate\Support\Str;

class ApartmentsSeeder extends Seeder
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
                $name  = "{$block} - {$property->title}";

                Apartment::create([
                    'property_id'   => $property->id,
                    'name'          => $name,

                    // ✅ Safe unique slug
                    'slug'          => Str::slug($name . '-' . uniqid()),

                    'description'   => "Modern {$block} located within {$property->title}",

                    'block'         => $block,
                    'floor'         => 1, // default ground floor
                    'total_floors'  => rand(3, 12),
                    'total_units'   => 0, // will be updated after seeding units

                    'status'        => Apartment::STATUS_ACTIVE,

                    'has_elevator'        => (bool) rand(0, 1),
                    'has_backup_generator'=> (bool) rand(0, 1),
                    'has_security'        => (bool) rand(0, 1),
                    'has_parking'         => (bool) rand(0, 1),

                    'thumbnail'     => 'images/default-apartment.jpg',
                    'meta_title'    => $name,
                    'meta_description'=> "Apartment block {$block} in {$property->title}",
                    'meta_keywords' => "{$block}, {$property->title}, apartment",

                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }
        }

        $this->command->info('Apartments seeded successfully.');
    }
}
