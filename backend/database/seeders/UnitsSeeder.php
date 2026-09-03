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
        /*
        |--------------------------------------------------------------------------
        | FETCH APARTMENTS
        |--------------------------------------------------------------------------
        */

        $apartments = Apartment::query()
            ->with('property')
            ->get();

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
        |
        | Unit::UNIT_TYPES is treated as the source of truth.
        |
        | The model may define UNIT_TYPES as either:
        |
        | 1. Associative:
        |
        | [
        |     'bedsitter' => 'Bedsitter',
        |     'office' => 'Office',
        | ]
        |
        | 2. Indexed:
        |
        | [
        |     'bedsitter',
        |     'office',
        | ]
        |
        | We support both formats.
        |
        */

        $types = $this->getUnitTypes();

        if (empty($types)) {
            $this->command->error(
                'No valid unit types were found.'
            );

            return;
        }

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
        | SEED EACH APARTMENT
        |--------------------------------------------------------------------------
        */

        foreach ($apartments as $apartment) {

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */

            $property = $apartment->property;

            if (!$property) {
                $this->command->warn(
                    "Skipping apartment {$apartment->id}: property not found."
                );

                continue;
            }

            /*
            |--------------------------------------------------------------------------
            | NUMBER OF FLOORS
            |--------------------------------------------------------------------------
            */

            $floors = max(
                1,
                (int) ($apartment->total_floors ?? 1)
            );

            $unitsCreatedForApartment = 0;
            $unitsSkippedForApartment = 0;

            /*
            |--------------------------------------------------------------------------
            | CREATE UNITS
            |--------------------------------------------------------------------------
            */

            DB::transaction(function () use (
                $apartment,
                $property,
                $floors,
                $types,
                $statuses,
                &$unitsCreatedForApartment,
                &$unitsSkippedForApartment,
                &$totalCreated,
                &$totalSkipped
            ) {

                /*
                |--------------------------------------------------------------------------
                | FLOOR LOOP
                |--------------------------------------------------------------------------
                */

                for ($floor = 1; $floor <= $floors; $floor++) {

                    /*
                    | 2–8 units per floor.
                    */
                    $unitsPerFloor = rand(2, 8);

                    /*
                    |--------------------------------------------------------------------------
                    | UNIT LOOP
                    |--------------------------------------------------------------------------
                    */

                    for (
                        $room = 1;
                        $room <= $unitsPerFloor;
                        $room++
                    ) {

                        /*
                        |--------------------------------------------------------------------------
                        | UNIT NUMBER
                        |--------------------------------------------------------------------------
                        |
                        | Examples:
                        |
                        | 101
                        | 102
                        | 103
                        |
                        | 201
                        | 202
                        | 203
                        |
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
                            ->where(
                                'apartment_id',
                                $apartment->id
                            )
                            ->where(
                                'unit_number',
                                $unitNumber
                            )
                            ->first();

                        if ($existingUnit) {

                            $unitsSkippedForApartment++;
                            $totalSkipped++;

                            continue;
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | UNIT TYPE
                        |--------------------------------------------------------------------------
                        |
                        | IMPORTANT:
                        |
                        | $types contains actual string values such as:
                        |
                        | bedsitter
                        | studio
                        | one_bedroom
                        | office
                        | shop
                        |
                        | It must NEVER contain numeric indexes such as 0, 1, 2.
                        |
                        */

                        $type = $types[
                            array_rand($types)
                        ];

                        /*
                        |--------------------------------------------------------------------------
                        | SAFETY CHECK
                        |--------------------------------------------------------------------------
                        */

                        if (
                            !is_string($type) ||
                            trim($type) === ''
                        ) {
                            $this->command->warn(
                                "Invalid unit type generated for apartment {$apartment->id}. Skipping unit {$unitNumber}."
                            );

                            continue;
                        }

                        $type = trim($type);

                        /*
                        |--------------------------------------------------------------------------
                        | TYPE-SPECIFIC DETAILS
                        |--------------------------------------------------------------------------
                        */

                        $details = $this->getUnitDetails(
                            $type
                        );

                        /*
                        |--------------------------------------------------------------------------
                        | STATUS
                        |--------------------------------------------------------------------------
                        |
                        | UnitsSeeder creates inventory.
                        |
                        | TenancySeeder is responsible for actual occupancy.
                        |
                        | Therefore we primarily create:
                        |
                        | - vacant
                        | - reserved
                        | - maintenance
                        |
                        */

                        $statusPool = [
                            Unit::STATUS_VACANT,
                            Unit::STATUS_VACANT,
                            Unit::STATUS_VACANT,
                            Unit::STATUS_RESERVED,
                            Unit::STATUS_MAINTENANCE,
                        ];

                        $status = $statusPool[
                            array_rand($statusPool)
                        ];

                        /*
                        |--------------------------------------------------------------------------
                        | UNIT NAME
                        |--------------------------------------------------------------------------
                        */

                        $block = trim(
                            (string) (
                                $apartment->block
                                ?: 'Block-' . $apartment->id
                            )
                        );

                        $unitName = sprintf(
                            '%s-%s',
                            $block,
                            $unitNumber
                        );

                        /*
                        |--------------------------------------------------------------------------
                        | SLUG
                        |--------------------------------------------------------------------------
                        */

                        $slug = Str::slug(
                            $unitName . '-' . Str::random(6)
                        );

                        /*
                        |--------------------------------------------------------------------------
                        | AVAILABILITY
                        |--------------------------------------------------------------------------
                        */

                        $availableFrom = null;

                        if ($status === Unit::STATUS_VACANT) {
                            $availableFrom = now()->addDays(
                                rand(1, 60)
                            );
                        }

                        /*
                        |--------------------------------------------------------------------------
                        | ACTIVE FLAG
                        |--------------------------------------------------------------------------
                        |
                        | is_active means the unit record is operational.
                        |
                        | It is independent from occupancy status.
                        |
                        */

                        $isActive = true;

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

                            'slug' => $slug,

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

                            'service_charge' =>
                                $details['service_charge'],

                            /*
                            |--------------------------------------------------------------------------
                            | FEATURES
                            |--------------------------------------------------------------------------
                            */

                            'has_balcony' =>
                                $details['has_balcony'],

                            'has_wifi' =>
                                $details['has_wifi'],

                            'has_furnished' =>
                                $details['has_furnished'],

                            'has_air_conditioning' =>
                                $details['has_air_conditioning'],

                            /*
                            |--------------------------------------------------------------------------
                            | MEDIA
                            |--------------------------------------------------------------------------
                            */

                            'thumbnail' =>
                                'images/default-unit.jpg',

                            'thumbnail_public_id' => null,

                            /*
                            |--------------------------------------------------------------------------
                            | AVAILABILITY
                            |--------------------------------------------------------------------------
                            */

                            'available_from' =>
                                $availableFrom,

                            'is_active' =>
                                $isActive,

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
                */

                $actualUnitCount = Unit::query()
                    ->where(
                        'apartment_id',
                        $apartment->id
                    )
                    ->count();

                $apartment->update([
                    'total_units' => $actualUnitCount,
                ]);
            });

            /*
            |--------------------------------------------------------------------------
            | APARTMENT SUMMARY
            |--------------------------------------------------------------------------
            */

            $actualUnitCount = Unit::query()
                ->where(
                    'apartment_id',
                    $apartment->id
                )
                ->count();

            $this->command->line(
                "Apartment: {$apartment->name} | " .
                "Created: {$unitsCreatedForApartment} | " .
                "Skipped: {$unitsSkippedForApartment} | " .
                "Total: {$actualUnitCount}"
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

        /*
        |--------------------------------------------------------------------------
        | DATABASE UNIT SUMMARY
        |--------------------------------------------------------------------------
        */

        $totalUnits = Unit::query()
            ->count();

        $vacantUnits = Unit::query()
            ->where(
                'status',
                Unit::STATUS_VACANT
            )
            ->count();

        $occupiedUnits = Unit::query()
            ->where(
                'status',
                Unit::STATUS_OCCUPIED
            )
            ->count();

        $reservedUnits = Unit::query()
            ->where(
                'status',
                Unit::STATUS_RESERVED
            )
            ->count();

        $maintenanceUnits = Unit::query()
            ->where(
                'status',
                Unit::STATUS_MAINTENANCE
            )
            ->count();

        $this->command->info(
            "Total units in database: {$totalUnits}"
        );

        $this->command->line(
            "Vacant: {$vacantUnits}"
        );

        $this->command->line(
            "Occupied: {$occupiedUnits}"
        );

        $this->command->line(
            "Reserved: {$reservedUnits}"
        );

        $this->command->line(
            "Maintenance: {$maintenanceUnits}"
        );
    }

    /**
     * Get valid unit type values.
     *
     * Supports both associative and indexed UNIT_TYPES definitions.
     */
    private function getUnitTypes(): array
    {
        $fallbackTypes = [
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

        if (!defined(Unit::class . '::UNIT_TYPES')) {
            return $fallbackTypes;
        }

        $unitTypes = Unit::UNIT_TYPES;

        if (!is_array($unitTypes) || empty($unitTypes)) {
            return $fallbackTypes;
        }

        /*
        |--------------------------------------------------------------------------
        | ASSOCIATIVE ARRAY
        |--------------------------------------------------------------------------
        |
        | Example:
        |
        | [
        |     'bedsitter' => 'Bedsitter',
        |     'office' => 'Office',
        | ]
        |
        */

        if ($this->isAssociativeArray($unitTypes)) {
            $types = array_keys($unitTypes);
        } else {

            /*
            |--------------------------------------------------------------------------
            | INDEXED ARRAY
            |--------------------------------------------------------------------------
            |
            | Example:
            |
            | [
            |     'bedsitter',
            |     'office',
            | ]
            |
            */

            $types = array_values($unitTypes);
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZE
        |--------------------------------------------------------------------------
        */

        $types = array_values(
            array_filter(
                array_map(
                    static fn ($type) => is_string($type)
                        ? trim($type)
                        : null,
                    $types
                ),
                static fn ($type) => !empty($type)
            )
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDATE AGAINST SUPPORTED DETAILS
        |--------------------------------------------------------------------------
        |
        | This prevents a new unsupported UNIT_TYPES value from causing:
        |
        | Undefined array key
        |
        | inside getUnitDetails().
        |
        */

        $supportedTypes = array_keys(
            $this->getSupportedUnitDetails()
        );

        $types = array_values(
            array_intersect(
                $types,
                $supportedTypes
            )
        );

        return !empty($types)
            ? $types
            : $fallbackTypes;
    }

    /**
     * Determine whether an array is associative.
     */
    private function isAssociativeArray(array $array): bool
    {
        if ([] === $array) {
            return false;
        }

        return array_keys($array) !== range(
            0,
            count($array) - 1
        );
    }

    /**
     * Get all supported unit detail definitions.
     */
    private function getSupportedUnitDetails(): array
    {
        return [

            'bedsitter' => [],

            'studio' => [],

            'single_room' => [],

            'double_room' => [],

            'one_bedroom' => [],

            'two_bedroom' => [],

            'three_bedroom' => [],

            'penthouse' => [],

            'office' => [],

            'shop' => [],

            'warehouse' => [],

            'villa' => [],

            'airbnb' => [],
        ];
    }

    /**
     * Generate realistic unit details based on unit type.
     */
    private function getUnitDetails(string $type): array
    {
        $details = [

            /*
            |--------------------------------------------------------------------------
            | BED-SITTER
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | STUDIO
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | SINGLE ROOM
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | DOUBLE ROOM
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | ONE BEDROOM
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | TWO BEDROOM
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | THREE BEDROOM
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | PENTHOUSE
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | OFFICE
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | SHOP
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | WAREHOUSE
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | VILLA
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | AIRBNB
            |--------------------------------------------------------------------------
            */

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
        | FALLBACK
        |--------------------------------------------------------------------------
        */

        $data = $details[$type]
            ?? $details['bedsitter'];

        /*
        |--------------------------------------------------------------------------
        | SECURITY DEPOSIT
        |--------------------------------------------------------------------------
        |
        | For seeded/demo data, use the monthly rent as the deposit.
        |
        */

        $data['deposit'] = $data['price'];

        return $data;
    }
}