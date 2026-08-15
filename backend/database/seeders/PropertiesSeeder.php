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
use App\Models\Area;

class PropertiesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | PROPERTY TYPES
        |--------------------------------------------------------------------------
        */

        $types = PropertyType::pluck('id')->toArray();

        /*
        |--------------------------------------------------------------------------
        | PROPERTY CATEGORIES
        |--------------------------------------------------------------------------
        */

        $categories = PropertyCategory::pluck('id')->toArray();

        /*
        |--------------------------------------------------------------------------
        | PROPERTY FEATURES
        |--------------------------------------------------------------------------
        */

        $features = PropertyFeature::pluck('id')->toArray();

        /*
        |--------------------------------------------------------------------------
        | VALIDATE REQUIRED DATA
        |--------------------------------------------------------------------------
        */

        if (empty($types)) {
            $this->command->warn(
                'Property types are missing. Run PropertyTypesSeeder first.'
            );

            return;
        }

        if (empty($categories)) {
            $this->command->warn(
                'Property categories are missing. Run PropertyCategoriesSeeder first.'
            );

            return;
        }

        if (empty($features)) {
            $this->command->warn(
                'Property features are missing. Run PropertyFeaturesSeeder first.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | LOAD LOCATION DATA
        |--------------------------------------------------------------------------
        |
        | Load the actual location tables directly instead of depending on
        | nested Eloquent relationships.
        |
        */

        $countries = Country::query()->get();

        $regions = Region::query()->get();

        $counties = County::query()->get();

        $cities = City::query()->get();

        $areas = Area::query()->get();

        if ($countries->isEmpty()) {
            $this->command->warn(
                'No countries found. Check LocationSeeder.'
            );

            return;
        }

        if ($regions->isEmpty()) {
            $this->command->warn(
                'No regions found. Check LocationSeeder.'
            );

            return;
        }

        if ($counties->isEmpty()) {
            $this->command->warn(
                'No counties found. Check LocationSeeder.'
            );

            return;
        }

        if ($cities->isEmpty()) {
            $this->command->warn(
                'No cities found. Check LocationSeeder.'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | PROPERTY DATA
        |--------------------------------------------------------------------------
        */

        $propertiesData = [

            [
                'title' => 'The Grand Royale Residences',
                'description' => 'Luxury residences offering elegant architecture, premium finishes, private security and world-class amenities.',
            ],

            [
                'title' => 'Skyline Executive Towers',
                'description' => 'Modern high-rise apartments designed for professionals seeking comfort, convenience and breathtaking city views.',
            ],

            [
                'title' => 'Emerald Valley Villas',
                'description' => 'Exclusive villas surrounded by landscaped gardens, spacious interiors and a peaceful environment.',
            ],

            [
                'title' => 'Imperial Heights Apartments',
                'description' => 'Contemporary apartments featuring stylish interiors, smart home technology and premium facilities.',
            ],

            [
                'title' => 'The Prestige Gardens',
                'description' => 'A distinguished residential community combining luxury living with exceptional outdoor spaces.',
            ],

            [
                'title' => 'Crystal Lake Residences',
                'description' => 'Beautiful waterfront-inspired homes designed with elegance, privacy and modern convenience.',
            ],

            [
                'title' => 'Royal Palm Estate',
                'description' => 'An upscale estate offering spacious homes, secure surroundings and premium lifestyle amenities.',
            ],

            [
                'title' => 'Harmony Park Residences',
                'description' => 'A peaceful residential development offering modern comfort within a green environment.',
            ],

            [
                'title' => 'Golden Crest Apartments',
                'description' => 'Stylish apartments with excellent layouts, quality finishes and outstanding neighborhood access.',
            ],

            [
                'title' => 'The Signature Residences',
                'description' => 'Premium homes crafted with exceptional attention to detail and sophisticated design.',
            ],

            [
                'title' => 'Westwood Luxury Villas',
                'description' => 'Private villas delivering luxury, comfort and exclusive lifestyle experiences.',
            ],

            [
                'title' => 'The Metropolitan Towers',
                'description' => 'Urban residences providing modern living spaces near business and entertainment districts.',
            ],

            [
                'title' => 'Blue Horizon Apartments',
                'description' => 'Elegant apartments with panoramic views, contemporary design and premium amenities.',
            ],

            [
                'title' => 'Oakwood Manor Estate',
                'description' => 'A prestigious estate known for spacious residences and timeless architectural design.',
            ],

            [
                'title' => 'The Elite Court',
                'description' => 'Exclusive homes tailored for residents seeking privacy, security and luxury.',
            ],

            [
                'title' => 'Serenity Hills Residence',
                'description' => 'A calm and sophisticated living environment with beautifully designed homes.',
            ],

            [
                'title' => 'Parkview Executive Homes',
                'description' => 'Modern executive residences overlooking green spaces with excellent facilities.',
            ],

            [
                'title' => 'Silverstone Heights',
                'description' => 'Premium apartments combining elegance, functionality and superior craftsmanship.',
            ],

            [
                'title' => 'The Crown Residences',
                'description' => 'Luxury properties offering unmatched comfort, security and premium services.',
            ],

            [
                'title' => 'Vista Grande Apartments',
                'description' => 'Modern apartments with spacious layouts, beautiful views and exceptional amenities.',
            ],
        ];

        /*
        |--------------------------------------------------------------------------
        | STREET ADDRESSES
        |--------------------------------------------------------------------------
        */

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
            'Argwings Kodhek Road',
            'Mombasa Road',
            'Thika Road',
            'Limuru Road',
            'Raphta Road',
        ];

        /*
        |--------------------------------------------------------------------------
        | CREATE PROPERTIES
        |--------------------------------------------------------------------------
        */

        foreach ($propertiesData as $data) {

            /*
            |--------------------------------------------------------------------------
            | SELECT COUNTRY
            |--------------------------------------------------------------------------
            */

            $country = $countries->random();

            /*
            |--------------------------------------------------------------------------
            | SELECT REGION BELONGING TO COUNTRY
            |--------------------------------------------------------------------------
            */

            $countryRegions = $regions
                ->where('country_id', $country->id);

            if ($countryRegions->isEmpty()) {
                continue;
            }

            $region = $countryRegions->random();

            /*
            |--------------------------------------------------------------------------
            | SELECT COUNTY BELONGING TO REGION
            |--------------------------------------------------------------------------
            */

            $regionCounties = $counties
                ->where('region_id', $region->id);

            if ($regionCounties->isEmpty()) {
                continue;
            }

            $county = $regionCounties->random();

            /*
            |--------------------------------------------------------------------------
            | SELECT CITY BELONGING TO COUNTY
            |--------------------------------------------------------------------------
            */

            $countyCities = $cities
                ->where('county_id', $county->id);

            if ($countyCities->isEmpty()) {
                continue;
            }

            $city = $countyCities->random();

            /*
            |--------------------------------------------------------------------------
            | SELECT AREA BELONGING TO CITY
            |--------------------------------------------------------------------------
            */

            $cityAreas = $areas
                ->where('city_id', $city->id);

            $area = $cityAreas->isNotEmpty()
                ? $cityAreas->random()
                : null;

            /*
            |--------------------------------------------------------------------------
            | LOCATION NAMES
            |--------------------------------------------------------------------------
            */

            $countryName = $country->name;
            $regionName  = $region->name;
            $countyName  = $county->name;
            $cityName    = $city->name;
            $areaName    = $area?->name;

            /*
            |--------------------------------------------------------------------------
            | LISTING TYPE
            |--------------------------------------------------------------------------
            */

            $listingType = rand(0, 1)
                ? 'sale'
                : 'rent';

            /*
            |--------------------------------------------------------------------------
            | CREATE PROPERTY
            |--------------------------------------------------------------------------
            */

            $property = Property::create([

                /*
                |--------------------------------------------------------------------------
                | OWNER
                |--------------------------------------------------------------------------
                */

                'user_id' => 1,

                /*
                |--------------------------------------------------------------------------
                | PROPERTY TYPE
                |--------------------------------------------------------------------------
                */

                'property_type_id' =>
                    $types[array_rand($types)],

                'property_category_id' =>
                    $categories[array_rand($categories)],

                /*
                |--------------------------------------------------------------------------
                | LOCATION RELATIONSHIPS
                |--------------------------------------------------------------------------
                */

                'country_id' => $country->id,

                'region_id' => $region->id,

                'county_id' => $county->id,

                'city_id' => $city->id,

                'area_id' => $area?->id,

                /*
                |--------------------------------------------------------------------------
                | BASIC INFORMATION
                |--------------------------------------------------------------------------
                */

                'title' => $data['title'],

                'slug' => Str::slug(
                    $data['title'] . '-' . Str::random(5)
                ),

                'property_code' =>
                    $this->generatePropertyCode(),

                'description' => $data['description'],

                /*
                |--------------------------------------------------------------------------
                | LISTING
                |--------------------------------------------------------------------------
                */

                'listing_type' => $listingType,

                'status' => 'published',

                /*
                |--------------------------------------------------------------------------
                | LOCATION SNAPSHOT
                |--------------------------------------------------------------------------
                */

                'country_name' => $countryName,

                'region_name' => $regionName,

                'county_name' => $countyName,

                'city_name' => $cityName,

                'area_name' => $areaName,

                'street_address' =>
                    rand(10, 500) . ' ' .
                    $streets[array_rand($streets)],

                /*
                |--------------------------------------------------------------------------
                | GEO LOCATION
                |--------------------------------------------------------------------------
                */

                'latitude' =>
                    -1.2921 + (rand(-100, 100) / 1000),

                'longitude' =>
                    36.8219 + (rand(-100, 100) / 1000),

                /*
                |--------------------------------------------------------------------------
                | PROPERTY DETAILS
                |--------------------------------------------------------------------------
                */

                'bedrooms' => rand(1, 6),

                'bathrooms' => rand(1, 5),

                'toilets' => rand(1, 6),

                'garages' => rand(0, 4),

                'parking_spaces' => rand(1, 6),

                'floors' => rand(1, 25),

                /*
                |--------------------------------------------------------------------------
                | SIZE
                |--------------------------------------------------------------------------
                */

                'size' => rand(80, 800),

                'size_unit' => 'sqm',

                /*
                |--------------------------------------------------------------------------
                | PRICING
                |--------------------------------------------------------------------------
                */

                'price' => rand(
                    5_000_000,
                    150_000_000
                ),

                'discount_price' => rand(0, 1)
                    ? rand(4_500_000, 120_000_000)
                    : null,

                'monthly_rent' => rand(
                    50_000,
                    800_000
                ),

                'service_charge' => rand(
                    5_000,
                    50_000
                ),

                /*
                |--------------------------------------------------------------------------
                | FLAGS
                |--------------------------------------------------------------------------
                */

                'is_featured' => (bool) rand(0, 1),

                'is_verified' => true,

                'is_published' => true,

                /*
                |--------------------------------------------------------------------------
                | PROPERTY FEATURES
                |--------------------------------------------------------------------------
                */

                'has_balcony' => (bool) rand(0, 1),

                'has_swimming_pool' => (bool) rand(0, 1),

                'has_garden' => (bool) rand(0, 1),

                'has_wifi' => (bool) rand(0, 1),

                'has_security' => true,

                /*
                |--------------------------------------------------------------------------
                | MEDIA
                |--------------------------------------------------------------------------
                */

                'image' =>
                    'https://picsum.photos/800/600?random=' .
                    rand(1, 1000),

                'thumbnail' =>
                    'https://picsum.photos/400/300?random=' .
                    rand(1, 1000),

                /*
                |--------------------------------------------------------------------------
                | SEO
                |--------------------------------------------------------------------------
                */

                'meta_title' =>
                    $data['title'] .
                    ' | Luxury Real Estate',

                'meta_description' =>
                    $data['description'],

                'meta_keywords' =>
                    'luxury property, apartment, villa, real estate, premium homes',

                /*
                |--------------------------------------------------------------------------
                | STATISTICS
                |--------------------------------------------------------------------------
                */

                'views_count' => rand(50, 5000),

                'favorites_count' => rand(0, 500),

                /*
                |--------------------------------------------------------------------------
                | PUBLISHING
                |--------------------------------------------------------------------------
                */

                'published_at' => now(),
            ]);

            /*
            |--------------------------------------------------------------------------
            | ATTACH PROPERTY FEATURES
            |--------------------------------------------------------------------------
            */

            $featureCount = min(
                count($features),
                rand(5, 12)
            );

            $selectedFeatures = collect($features)
                ->shuffle()
                ->take($featureCount);

            $pivotData = [];

            foreach ($selectedFeatures as $featureId) {

                $pivotData[$featureId] = [
                    'value' => true,
                    'note' => null,
                    'is_active' => true,
                    'sort_order' => rand(1, 20),
                ];
            }

            if (!empty($pivotData)) {
                $property->features()->attach($pivotData);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SUCCESS MESSAGE
        |--------------------------------------------------------------------------
        */

        $this->command->info(
            count($propertiesData) .
            ' professional properties created successfully.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY CODE GENERATOR
    |--------------------------------------------------------------------------
    */

    private function generatePropertyCode(): string
    {
        do {
            $code =
                'PR-' .
                strtoupper(Str::random(8));

        } while (
            Property::where(
                'property_code',
                $code
            )->exists()
        );

        return $code;
    }
}