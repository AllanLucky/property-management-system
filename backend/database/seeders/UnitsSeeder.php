<?php

namespace Database\Seeders;

use App\Models\Apartment;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class UnitsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $apartments = Apartment::with('property')->get();

        if ($apartments->isEmpty()) {
            $this->command->warn(
                'No apartments found. Please run ApartmentsSeeder first.'
            );

            return;
        }

        $types = [
            'bedsitter',
            'studio',
            'single_room',
            'double_room',
            'one_bedroom',
            'two_bedroom',
            'three_bedroom',
            'penthouse',
            'office',
            'shop',
            'warehouse',
            'villa',
            'airbnb',
        ];

        $statuses = [
            Unit::STATUS_VACANT,
            Unit::STATUS_OCCUPIED,
            Unit::STATUS_RESERVED,
            Unit::STATUS_MAINTENANCE,
        ];

        foreach ($apartments as $apartment) {

            $property = $apartment->property;

            if (!$property) {
                continue;
            }

            $unitsCreated = 0;

            /*
            |--------------------------------------------------------------------------
            | Create units floor by floor
            |--------------------------------------------------------------------------
            */

            $floors = max(1, (int) $apartment->total_floors);

            for ($floor = 1; $floor <= $floors; $floor++) {

                // 2–8 units on each floor
                $unitsPerFloor = rand(2, 8);

                for ($room = 1; $room <= $unitsPerFloor; $room++) {

                    $unitNumber = sprintf(
                        '%d%02d',
                        $floor,
                        $room
                    );

                    $type = $types[array_rand($types)];

                    $status = $statuses[array_rand($statuses)];

                    $unitName = "{$apartment->block}-{$unitNumber}";

                    Unit::create([

                        /*
                        |--------------------------------------------------------------------------
                        | RELATIONSHIPS
                        |--------------------------------------------------------------------------
                        */
                        'property_id' => $property->id,
                        'apartment_id' => $apartment->id,

                        /*
                        |--------------------------------------------------------------------------
                        | BASIC INFORMATION
                        |--------------------------------------------------------------------------
                        */
                        'unit_number' => $unitNumber,
                        'unit_name' => $unitName,
                        'slug' => Str::slug(
                            $unitName . '-' . Str::random(6)
                        ),

                        'description' =>
                            "{$type} unit located in {$apartment->name}.",

                        /*
                        |--------------------------------------------------------------------------
                        | STATUS
                        |--------------------------------------------------------------------------
                        */
                        'status' => $status,
                        'type' => $type,

                        /*
                        |--------------------------------------------------------------------------
                        | UNIT DETAILS
                        |--------------------------------------------------------------------------
                        */
                        'bedrooms' => rand(0, 4),
                        'bathrooms' => rand(1, 3),
                        'toilets' => rand(1, 3),

                        'floor' => $floor,

                        'size' => rand(25, 250),
                        'size_unit' => 'sqm',

                        /*
                        |--------------------------------------------------------------------------
                        | PRICING
                        |--------------------------------------------------------------------------
                        */
                        'price' => rand(15000, 250000),
                        'deposit' => rand(10000, 100000),
                        'service_charge' => rand(1000, 15000),

                        /*
                        |--------------------------------------------------------------------------
                        | FEATURES
                        |--------------------------------------------------------------------------
                        */
                        'has_balcony' => (bool) rand(0, 1),
                        'has_wifi' => (bool) rand(0, 1),
                        'has_furnished' => (bool) rand(0, 1),
                        'has_air_conditioning' => (bool) rand(0, 1),

                        /*
                        |--------------------------------------------------------------------------
                        | MEDIA
                        |--------------------------------------------------------------------------
                        */
                        'thumbnail' => 'images/default-unit.jpg',
                        'thumbnail_public_id' => null,

                        /*
                        |--------------------------------------------------------------------------
                        | AVAILABILITY
                        |--------------------------------------------------------------------------
                        */
                        'available_from' => now()->addDays(rand(1, 90)),

                        /*
                        |--------------------------------------------------------------------------
                        | NOTES
                        |--------------------------------------------------------------------------
                        */
                        'notes' => 'Auto-generated by UnitsSeeder.',

                        /*
                        |--------------------------------------------------------------------------
                        | TIMESTAMPS
                        |--------------------------------------------------------------------------
                        */
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);

                    $unitsCreated++;
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Update apartment statistics
            |--------------------------------------------------------------------------
            */

            $apartment->update([
                'total_units' => $unitsCreated,
            ]);
        }

        $this->command->info(
            Unit::count() . ' units seeded successfully.'
        );
    }
}