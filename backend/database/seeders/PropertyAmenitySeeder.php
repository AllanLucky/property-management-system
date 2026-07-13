<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Property;
use App\Models\Amenity;
use App\Models\PropertyAmenity;

class PropertyAmenitySeeder extends Seeder
{
    public function run(): void
    {
        $properties = Property::all();

        $amenities = Amenity::active()
            ->ordered()
            ->get();

        if ($properties->isEmpty() || $amenities->isEmpty()) {
            $this->command->warn('No properties or active amenities found.');
            return;
        }

        foreach ($properties as $property) {

            foreach ($amenities as $amenity) {

                $available = fake()->boolean(85);

                PropertyAmenity::updateOrCreate(
                    [
                        'property_id' => $property->id,
                        'amenity_id'  => $amenity->id,
                    ],
                    [
                        /*
                        |--------------------------------------------------------------------------
                        | STATUS
                        |--------------------------------------------------------------------------
                        */
                        'is_included' => $available,   // ✅ FIXED (replaces "value")
                        'is_available' => $available,

                        /*
                        |--------------------------------------------------------------------------
                        | LOCATION DETAILS
                        |--------------------------------------------------------------------------
                        */
                        'distance' => fake()->boolean(25)
                            ? fake()->randomFloat(2, 0.10, 5.00)
                            : null,

                        'walking_minutes' => fake()->boolean(25)
                            ? fake()->numberBetween(1, 45)
                            : null,

                        /*
                        |--------------------------------------------------------------------------
                        | NOTES
                        |--------------------------------------------------------------------------
                        */
                        'note' => fake()->randomElement([
                            'Available inside the property.',
                            'Located a short walking distance away.',
                            'Shared facility for all residents.',
                            'Premium amenity with restricted access.',
                            'Available 24 hours every day.',
                            'Requires prior booking before use.',
                            'Recently renovated and well maintained.',
                            'Well maintained and regularly inspected.',
                        ]),
                    ]
                );
            }
        }

        $this->command->info(
            'All amenities assigned to all properties successfully.'
        );
    }
}