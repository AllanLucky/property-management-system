<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Unit;
use App\Models\Apartment;
use Illuminate\Support\Str;

class UnitsSeeder extends Seeder
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

        $statusPool = [
            'vacant',
            'occupied',
            'reserved',
            'maintenance',
        ];

        foreach ($apartments as $apartment) {
            $property = $apartment->property;
            if (!$property) continue;

            $unitLabels = [
                'A1','A2','A3','A4',
                'B1','B2','B3','B4',
                'C1','C2','C3','C4',
                'D1','D2','D3'
            ];

            for ($i = 0; $i < count($unitLabels); $i++) {
                $unitNumber = $unitLabels[$i];
                $unitName   = "{$unitNumber} - {$apartment->name}";
                $type       = $types[array_rand($types)];
                $status     = $statusPool[array_rand($statusPool)];

                Unit::create([
                    'property_id'   => $property->id,
                    'apartment_id'  => $apartment->id,

                    'unit_number'   => $unitNumber,
                    'unit_name'     => $unitName,
                    'slug'          => Str::slug($unitName . '-' . uniqid()),

                    'description'   => "Spacious {$type} located in {$property->city_name}, {$property->street_address}",
                    'status'        => $status,
                    'type'          => $type,

                    'bedrooms'      => rand(0, 3),
                    'bathrooms'     => rand(1, 2),
                    'toilets'       => rand(1, 2),
                    'floor'         => rand(1, (int) $apartment->total_floors ?: 10),
                    'size'          => rand(25, 180),
                    'size_unit'     => 'sqm',

                    'price'         => rand(12000, 150000),
                    'deposit'       => rand(10000, 90000),
                    'service_charge'=> rand(500, 8000),

                    'has_balcony'       => (bool) rand(0, 1),
                    'has_wifi'          => (bool) rand(0, 1),
                    'has_furnished'     => (bool) rand(0, 1),
                    'has_air_conditioning' => (bool) rand(0, 1),

                    'thumbnail'     => 'images/default-unit.jpg',
                    'available_from'=> now()->addDays(rand(1, 90)),
                    'notes'         => "Auto-generated seeder data",

                    'created_at'    => now(),
                    'updated_at'    => now(),
                ]);
            }
        }
    }
}
