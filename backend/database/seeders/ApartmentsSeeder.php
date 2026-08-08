<?php

namespace Database\Seeders;

use App\Models\Apartment;
use App\Models\Property;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ApartmentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $properties = Property::all();

        if ($properties->isEmpty()) {
            $this->command->warn(
                'No properties found. Please run PropertySeeder first.'
            );

            return;
        }

        $blocks = [
            'Block A',
            'Block B',
            'Block C',
            'Block D',
            'Block E',
            'Block F',
        ];

        foreach ($properties as $property) {

            $numberOfBlocks = rand(2, 6);

            for ($i = 0; $i < $numberOfBlocks; $i++) {

                $block = $blocks[$i] ?? 'Block ' . chr(65 + $i);

                $name = "{$property->title} {$block}";

                Apartment::create([
                    /*
                    |--------------------------------------------------------------------------
                    | RELATIONSHIP
                    |--------------------------------------------------------------------------
                    */
                    'property_id' => $property->id,

                    /*
                    |--------------------------------------------------------------------------
                    | BASIC INFORMATION
                    |--------------------------------------------------------------------------
                    */
                    'name' => $name,
                    'slug' => Str::slug($name . '-' . Str::random(6)),
                    'description' =>
                        "Modern apartment building {$block} located within {$property->title}.",

                    /*
                    |--------------------------------------------------------------------------
                    | BUILDING INFORMATION
                    |--------------------------------------------------------------------------
                    */
                    'block' => $block,
                    'total_floors' => rand(3, 15),

                    // Updated later by UnitsSeeder
                    'total_units' => 0,

                    /*
                    |--------------------------------------------------------------------------
                    | STATUS
                    |--------------------------------------------------------------------------
                    */
                    'status' => Apartment::STATUS_ACTIVE,

                    /*
                    |--------------------------------------------------------------------------
                    | FEATURES
                    |--------------------------------------------------------------------------
                    */
                    'has_elevator' => (bool) rand(0, 1),
                    'has_backup_generator' => (bool) rand(0, 1),
                    'has_security' => true,
                    'has_parking' => (bool) rand(0, 1),

                    /*
                    |--------------------------------------------------------------------------
                    | MEDIA
                    |--------------------------------------------------------------------------
                    */
                    'thumbnail' => 'images/default-apartment.jpg',
                    'thumbnail_public_id' => null,

                    /*
                    |--------------------------------------------------------------------------
                    | SEO
                    |--------------------------------------------------------------------------
                    */
                    'meta_title' => $name,
                    'meta_description' =>
                        "Apartment building {$block} within {$property->title}.",
                    'meta_keywords' =>
                        implode(', ', [
                            $property->title,
                            $block,
                            'Apartment',
                            'Real Estate',
                            'Rental',
                        ]),

                    /*
                    |--------------------------------------------------------------------------
                    | TIMESTAMPS
                    |--------------------------------------------------------------------------
                    */
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        $this->command->info(
            Apartment::count() . ' apartment buildings seeded successfully.'
        );
    }
}