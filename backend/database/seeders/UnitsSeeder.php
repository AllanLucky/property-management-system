<?php

namespace Database\Seeders;

use App\Models\Apartment;
use App\Models\Unit;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
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

        /*
        |--------------------------------------------------------------------------
        | UNIT TYPES
        |--------------------------------------------------------------------------
        */

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

        /*
        |--------------------------------------------------------------------------
        | UNIT STATUSES
        |--------------------------------------------------------------------------
        */

        $statuses = [
            Unit::STATUS_VACANT,
            Unit::STATUS_OCCUPIED,
            Unit::STATUS_RESERVED,
            Unit::STATUS_MAINTENANCE,
        ];

        /*
        |--------------------------------------------------------------------------
        | TRACKING
        |--------------------------------------------------------------------------
        */

        $totalCreated = 0;
        $totalSkipped = 0;

        /*
        |--------------------------------------------------------------------------
        | SEED APARTMENTS
        |--------------------------------------------------------------------------
        */

        foreach ($apartments as $apartment) {

            $property = $apartment->property;

            if (!$property) {
                $this->command->warn(
                    "Skipping apartment {$apartment->id}: property not found."
                );

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | Number of floors
            |--------------------------------------------------------------------------
            */

            $floors = max(
                1,
                (int) ($apartment->total_floors ?? 1)
            );

            $unitsCreatedForApartment = 0;

            /*
            |--------------------------------------------------------------------------
            | Create units floor by floor
            |--------------------------------------------------------------------------
            */

            for ($floor = 1; $floor <= $floors; $floor++) {

                /*
                | 2–8 units per floor.
                */
                $unitsPerFloor = rand(2, 8);

                for ($room = 1; $room <= $unitsPerFloor; $room++) {

                    /*
                    |--------------------------------------------------------------------------
                    | UNIT NUMBER
                    |--------------------------------------------------------------------------
                    */

                    $unitNumber = sprintf(
                        '%d%02d',
                        $floor,
                        $room
                    );

                    /*
                    |--------------------------------------------------------------------------
                    | DUPLICATE PROTECTION
                    |--------------------------------------------------------------------------
                    */

                    $existingUnit = Unit::withTrashed()
                        ->where('apartment_id', $apartment->id)
                        ->where('unit_number', $unitNumber)
                        ->first();

                    if ($existingUnit) {

                        $totalSkipped++;

                        continue;
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | TYPE
                    |--------------------------------------------------------------------------
                    */

                    $type = $types[array_rand($types)];

                    /*
                    |--------------------------------------------------------------------------
                    | TYPE-SPECIFIC DETAILS
                    |--------------------------------------------------------------------------
                    */

                    $details = $this->getUnitDetails($type);

                    /*
                    |--------------------------------------------------------------------------
                    | STATUS
                    |--------------------------------------------------------------------------
                    */

                    $status = $statuses[array_rand($statuses)];

                    /*
                    |--------------------------------------------------------------------------
                    | UNIT NAME
                    |--------------------------------------------------------------------------
                    */

                    $block = $apartment->block
                        ?: 'Block-' . $apartment->id;

                    $unitName = "{$block}-{$unitNumber}";

                    /*
                    |--------------------------------------------------------------------------
                    | CREATE UNIT
                    |--------------------------------------------------------------------------
                    */

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

                        'description' => sprintf(
                            '%s unit located on floor %d of %s in %s.',
                            Str::headline($type),
                            $floor,
                            $apartment->name,
                            $property->title
                        ),

                        /*
                        |--------------------------------------------------------------------------
                        | CLASSIFICATION
                        |--------------------------------------------------------------------------
                        */

                        'status' => $status,

                        'type' => $type,

                        /*
                        |--------------------------------------------------------------------------
                        | UNIT DETAILS
                        |--------------------------------------------------------------------------
                        */

                        'bedrooms' => $details['bedrooms'],

                        'bathrooms' => $details['bathrooms'],

                        'toilets' => $details['toilets'],

                        'floor' => $floor,

                        'size' => $details['size'],

                        'size_unit' => 'sqm',

                        /*
                        |--------------------------------------------------------------------------
                        | PRICING
                        |--------------------------------------------------------------------------
                        */

                        'price' => $details['price'],

                        'deposit' => $details['deposit'],

                        'service_charge' => $details['service_charge'],

                        /*
                        |--------------------------------------------------------------------------
                        | FEATURES
                        |--------------------------------------------------------------------------
                        */

                        'has_balcony' => $details['has_balcony'],

                        'has_wifi' => $details['has_wifi'],

                        'has_furnished' => $details['has_furnished'],

                        'has_air_conditioning' =>
                            $details['has_air_conditioning'],

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

                        'available_from' =>
                            $status === Unit::STATUS_VACANT
                                ? now()->addDays(rand(1, 60))
                                : null,

                        /*
                        |--------------------------------------------------------------------------
                        | NOTES
                        |--------------------------------------------------------------------------
                        */

                        'notes' =>
                            'Auto-generated by UnitsSeeder.',

                        /*
                        |--------------------------------------------------------------------------
                        | TIMESTAMPS
                        |--------------------------------------------------------------------------
                        */

                        'created_at' => now(),

                        'updated_at' => now(),
                    ]);

                    $unitsCreatedForApartment++;

                    $totalCreated++;
                }
            }

            /*
            |--------------------------------------------------------------------------
            | UPDATE APARTMENT UNIT COUNT
            |--------------------------------------------------------------------------
            |
            | Count actual units instead of relying only on the number
            | created during this particular seeder execution.
            |
            */

            $actualUnitCount = Unit::where(
                'apartment_id',
                $apartment->id
            )->count();

            $apartment->update([
                'total_units' => $actualUnitCount,
            ]);

            /*
            |--------------------------------------------------------------------------
            | APARTMENT SUMMARY
            |--------------------------------------------------------------------------
            */

            $this->command->line(
                "Apartment: {$apartment->name} | " .
                "Units created: {$unitsCreatedForApartment} | " .
                "Total units: {$actualUnitCount}"
            );
        }

        /*
        |--------------------------------------------------------------------------
        | FINAL SUMMARY
        |--------------------------------------------------------------------------
        */

        $this->command->newLine();

        $this->command->info(
            "{$totalCreated} new units seeded successfully."
        );

        if ($totalSkipped > 0) {
            $this->command->warn(
                "{$totalSkipped} existing units were skipped."
            );
        }

        $this->command->info(
            'Total units in database: ' . Unit::count()
        );
    }

    /**
     * Generate realistic unit details based on unit type.
     */
    private function getUnitDetails(string $type): array
    {
        $details = [
            'bedsitter' => [
                'bedrooms' => 0,
                'bathrooms' => 1,
                'toilets' => 1,
                'size' => rand(20, 35),
                'price' => rand(8000, 18000),
                'service_charge' => rand(500, 2500),
                'has_balcony' => (bool) rand(0, 1),
                'has_wifi' => (bool) rand(0, 1),
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => false,
            ],

            'studio' => [
                'bedrooms' => 0,
                'bathrooms' => 1,
                'toilets' => 1,
                'size' => rand(25, 50),
                'price' => rand(12000, 30000),
                'service_charge' => rand(1000, 3500),
                'has_balcony' => (bool) rand(0, 1),
                'has_wifi' => (bool) rand(0, 1),
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => (bool) rand(0, 1),
            ],

            'single_room' => [
                'bedrooms' => 1,
                'bathrooms' => 1,
                'toilets' => 1,
                'size' => rand(25, 45),
                'price' => rand(7000, 16000),
                'service_charge' => rand(500, 2000),
                'has_balcony' => (bool) rand(0, 1),
                'has_wifi' => (bool) rand(0, 1),
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => false,
            ],

            'double_room' => [
                'bedrooms' => 2,
                'bathrooms' => 1,
                'toilets' => 1,
                'size' => rand(45, 70),
                'price' => rand(15000, 30000),
                'service_charge' => rand(1000, 3500),
                'has_balcony' => (bool) rand(0, 1),
                'has_wifi' => (bool) rand(0, 1),
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => (bool) rand(0, 1),
            ],

            'one_bedroom' => [
                'bedrooms' => 1,
                'bathrooms' => 1,
                'toilets' => 1,
                'size' => rand(45, 75),
                'price' => rand(18000, 40000),
                'service_charge' => rand(1500, 5000),
                'has_balcony' => (bool) rand(0, 1),
                'has_wifi' => (bool) rand(0, 1),
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => (bool) rand(0, 1),
            ],

            'two_bedroom' => [
                'bedrooms' => 2,
                'bathrooms' => rand(1, 2),
                'toilets' => rand(1, 2),
                'size' => rand(70, 120),
                'price' => rand(30000, 65000),
                'service_charge' => rand(2500, 7000),
                'has_balcony' => true,
                'has_wifi' => (bool) rand(0, 1),
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => (bool) rand(0, 1),
            ],

            'three_bedroom' => [
                'bedrooms' => 3,
                'bathrooms' => rand(2, 3),
                'toilets' => rand(2, 3),
                'size' => rand(110, 180),
                'price' => rand(50000, 100000),
                'service_charge' => rand(4000, 10000),
                'has_balcony' => true,
                'has_wifi' => true,
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => (bool) rand(0, 1),
            ],

            'penthouse' => [
                'bedrooms' => rand(3, 5),
                'bathrooms' => rand(3, 5),
                'toilets' => rand(3, 5),
                'size' => rand(180, 400),
                'price' => rand(120000, 300000),
                'service_charge' => rand(8000, 20000),
                'has_balcony' => true,
                'has_wifi' => true,
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => true,
            ],

            'office' => [
                'bedrooms' => 0,
                'bathrooms' => rand(1, 3),
                'toilets' => rand(1, 3),
                'size' => rand(40, 250),
                'price' => rand(30000, 150000),
                'service_charge' => rand(3000, 15000),
                'has_balcony' => false,
                'has_wifi' => true,
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => true,
            ],

            'shop' => [
                'bedrooms' => 0,
                'bathrooms' => 1,
                'toilets' => 1,
                'size' => rand(20, 150),
                'price' => rand(15000, 100000),
                'service_charge' => rand(1000, 8000),
                'has_balcony' => false,
                'has_wifi' => true,
                'has_furnished' => false,
                'has_air_conditioning' => (bool) rand(0, 1),
            ],

            'warehouse' => [
                'bedrooms' => 0,
                'bathrooms' => rand(1, 3),
                'toilets' => rand(1, 3),
                'size' => rand(150, 1000),
                'price' => rand(50000, 300000),
                'service_charge' => rand(5000, 30000),
                'has_balcony' => false,
                'has_wifi' => true,
                'has_furnished' => false,
                'has_air_conditioning' => false,
            ],

            'villa' => [
                'bedrooms' => rand(3, 6),
                'bathrooms' => rand(3, 6),
                'toilets' => rand(3, 6),
                'size' => rand(180, 500),
                'price' => rand(100000, 350000),
                'service_charge' => rand(5000, 25000),
                'has_balcony' => true,
                'has_wifi' => true,
                'has_furnished' => (bool) rand(0, 1),
                'has_air_conditioning' => true,
            ],

            'airbnb' => [
                'bedrooms' => rand(1, 3),
                'bathrooms' => rand(1, 3),
                'toilets' => rand(1, 3),
                'size' => rand(40, 150),
                'price' => rand(25000, 120000),
                'service_charge' => rand(2000, 10000),
                'has_balcony' => (bool) rand(0, 1),
                'has_wifi' => true,
                'has_furnished' => true,
                'has_air_conditioning' => (bool) rand(0, 1),
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | DEPOSIT
        |--------------------------------------------------------------------------
        */

        $data = $details[$type] ?? $details['bedsitter'];

        $data['deposit'] = $data['price'];

        return $data;
    }
}
