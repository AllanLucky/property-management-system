<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;
use App\Models\Apartment;
use Illuminate\Support\Str;

class UnitSeeder extends Seeder
{
    public function run(): void
    {
        $apartments = Apartment::with('property')->get();

        if ($apartments->isEmpty()) {
            $this->command->warn("No apartments found. Run ApartmentSeeder first.");
            return;
        }

        $types = [
            'bedsitter',
            'studio',
            'single_room',
            'one_bedroom',
            'two_bedroom',
            'three_bedroom',
            'office',
            'shop',
        ];

        foreach ($apartments as $apartment) {

            $property = $apartment->property;

            if (!$property) continue;

            $unitNames = [
                'A1', 'A2', 'A3', 'A4',
                'B1', 'B2', 'B3', 'B4',
                'C1', 'C2', 'C3', 'C4',
                'D1', 'D2', 'D3'
            ];

            for ($i = 0; $i < 15; $i++) {

                $type = $types[array_rand($types)];
                $unitLabel = $unitNames[$i];

                $statusPool = [
                    'vacant',
                    'occupied',
                    'occupied',
                    'vacant',
                    'reserved',
                    'maintenance'
                ];

                $name = "{$unitLabel} - {$apartment->name}";

                Unit::create([

                    'property_id' => $property->id,
                    'apartment_id' => $apartment->id,
                    'owner_id' => $property->owner_id,

                    'name' => $name,
                    'unit_number' => $unitLabel,

                    // safer + cleaner slug
                    'slug' => Str::slug($name . '-' . uniqid()),

                    'type' => $type,
                    'description' => "Spacious {$type} located in {$property->city}, {$property->street}",

                    'floor' => rand(1, (int) $apartment->total_floors ?: 10),

                    'bedrooms' => rand(0, 3),
                    'bathrooms' => rand(1, 2),
                    'size' => rand(25, 180),

                    'rent_amount' => rand(12000, 150000),
                    'deposit_amount' => rand(10000, 90000),
                    'service_charge' => rand(500, 8000),
                    'late_fee' => 500,

                    'status' => $statusPool[array_rand($statusPool)],

                    'available_from' => now()->addDays(rand(1, 90)),

                    'is_short_term' => (bool) rand(0, 1),
                    'is_featured' => (bool) rand(0, 1),
                    'is_furnished' => (bool) rand(0, 1),

                    'amenities' => [
                        'wifi',
                        'parking',
                        'security',
                        'water',
                        'balcony',
                    ],

                    'is_published' => true,
                    'published_at' => now(),
                ]);
            }
        }
    }
}