<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Property;
use App\Models\PropertyType;
use App\Models\PropertyCategory;
use App\Models\PropertyFeature;
use App\Models\Country;
use App\Models\Region;
use App\Models\County;
use App\Models\City;

class PropertiesSeeder extends Seeder
{
    public function run(): void
    {
        $types = PropertyType::pluck('id')->toArray();
        $categories = PropertyCategory::pluck('id')->toArray();
        $features = PropertyFeature::pluck('id')->toArray();

        if (!$types || !$categories) {
            $this->command->warn('Property types or categories are missing.');
            return;
        }

        if (!$features) {
            $this->command->warn('Property features are missing.');
            return;
        }

        $countries = Country::with([
            'regions.counties.cities.areas'
        ])->get();

        if ($countries->isEmpty()) {
            $this->command->warn('No locations found. Run LocationSeeder first.');
            return;
        }

        $propertiesData = [
            ['title' => 'The Grand Royale Residences', 'description' => 'Luxury residences offering elegant architecture, premium finishes, private security and world-class amenities.'],
            ['title' => 'Skyline Executive Towers', 'description' => 'Modern high-rise apartments designed for professionals seeking comfort, convenience and breathtaking city views.'],
            ['title' => 'Emerald Valley Villas', 'description' => 'Exclusive villas surrounded by landscaped gardens, spacious interiors and a peaceful environment.'],
            ['title' => 'Imperial Heights Apartments', 'description' => 'Contemporary apartments featuring stylish interiors, smart home technology and premium facilities.'],
            ['title' => 'The Prestige Gardens', 'description' => 'A distinguished residential community combining luxury living with exceptional outdoor spaces.'],
            ['title' => 'Crystal Lake Residences', 'description' => 'Beautiful waterfront-inspired homes designed with elegance, privacy and modern convenience.'],
            ['title' => 'Royal Palm Estate', 'description' => 'An upscale estate offering spacious homes, secure surroundings and premium lifestyle amenities.'],
            ['title' => 'Harmony Park Residences', 'description' => 'A peaceful residential development offering modern comfort within a green environment.'],
            ['title' => 'Golden Crest Apartments', 'description' => 'Stylish apartments with excellent layouts, quality finishes and outstanding neighborhood access.'],
            ['title' => 'The Signature Residences', 'description' => 'Premium homes crafted with exceptional attention to detail and sophisticated design.'],
            ['title' => 'Westwood Luxury Villas', 'description' => 'Private villas delivering luxury, comfort and exclusive lifestyle experiences.'],
            ['title' => 'The Metropolitan Towers', 'description' => 'Urban residences providing modern living spaces near business and entertainment districts.'],
            ['title' => 'Blue Horizon Apartments', 'description' => 'Elegant apartments with panoramic views, contemporary design and premium amenities.'],
            ['title' => 'Oakwood Manor Estate', 'description' => 'A prestigious estate known for spacious residences and timeless architectural design.'],
            ['title' => 'The Elite Court', 'description' => 'Exclusive homes tailored for residents seeking privacy, security and luxury.'],
            ['title' => 'Serenity Hills Residence', 'description' => 'A calm and sophisticated living environment with beautifully designed homes.'],
            ['title' => 'Parkview Executive Homes', 'description' => 'Modern executive residences overlooking green spaces with excellent facilities.'],
            ['title' => 'Silverstone Heights', 'description' => 'Premium apartments combining elegance, functionality and superior craftsmanship.'],
            ['title' => 'The Crown Residences', 'description' => 'Luxury properties offering unmatched comfort, security and premium services.'],
            ['title' => 'Vista Grande Apartments', 'description' => 'Modern apartments with spacious layouts, beautiful views and exceptional amenities.'],
        ];

        $streets = [
            'Riverside Drive',
            'Peponi Road',
            'General Mathenge Road',
            'Dennis Pritt Road',
            'Waiyaki Way',
            'Ngong Road',
            'Kilimani Avenue',
            'Muthaiga Road',
            'Karen Plains Road',
            'Gigiri Crescent',
        ];

        foreach ($propertiesData as $data) {

            $country = $countries->random();
            $region = $country->regions->random();
            $county = $region->counties->random();
            $city = $county->cities->random();
            $area = $city->areas->isNotEmpty() ? $city->areas->random() : null;

            $property = Property::create([
                'user_id' => 1,
                'property_type_id' => $types[array_rand($types)],
                'property_category_id' => $categories[array_rand($categories)],

                'title' => $data['title'],
                'slug' => Str::slug($data['title'] . '-' . Str::random(5)),
                'property_code' => $this->generatePropertyCode(),
                'description' => $data['description'],

                'listing_type' => rand(0, 1) ? 'sale' : 'rent',
                'status' => 'published',

                'country_id' => $country->id,
                'region_id' => $region->id,
                'county_id' => $county->id,
                'city_id' => $city->id,
                'area_id' => $area?->id,

                'street_address' => rand(10, 500) . ' ' . $streets[array_rand($streets)],

                'latitude' => -1.2921 + (rand(-100, 100) / 1000),
                'longitude' => 36.8219 + (rand(-100, 100) / 1000),

                'bedrooms' => rand(1, 6),
                'bathrooms' => rand(1, 5),
                'toilets' => rand(1, 6),
                'floors' => rand(1, 25),

                'size' => rand(80, 800),
                'size_unit' => 'sqm',

                'price' => rand(5000000, 150000000),
                'monthly_rent' => rand(50000, 800000),
                'service_charge' => rand(5000, 50000),

                'is_featured' => (bool) rand(0, 1),
                'is_verified' => (bool) rand(0, 1),
                'is_published' => true,

                // ✅ NEW IMAGE FIELD (NO PROPERTY IMAGE MODEL)
                'image' => 'https://picsum.photos/800/600?random=' . rand(1, 1000),

                'meta_title' => $data['title'] . ' | Luxury Real Estate',
                'meta_description' => $data['description'],
                'meta_keywords' => 'luxury property, apartment, villa, real estate, premium homes',

                'views_count' => rand(50, 5000),
                'favorites_count' => rand(0, 500),

                'published_at' => now(),
            ]);

            /*
            |--------------------------------------------------------------------------
            | Attach Features (safe pivot format)
            |--------------------------------------------------------------------------
            */
            $property->features()->attach(
                collect($features)
                    ->random(rand(5, 12))
                    ->mapWithKeys(fn ($featureId) => [
                        $featureId => [
                            'value' => true,
                            'note' => null,
                            'is_active' => true,
                            'sort_order' => rand(1, 20),
                        ]
                    ])
                    ->toArray()
            );
        }

        $this->command->info('20 professional properties created successfully.');
    }

    private function generatePropertyCode(): string
    {
        do {
            $code = 'PR-' . strtoupper(Str::random(8));
        } while (Property::where('property_code', $code)->exists());

        return $code;
    }
}