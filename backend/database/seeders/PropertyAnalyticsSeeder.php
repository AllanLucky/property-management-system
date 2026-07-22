<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Property;
use App\Models\PropertyAnalytics;

class PropertyAnalyticsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Property::with(['reviews', 'visits', 'units'])->chunk(50, function ($properties) {
            foreach ($properties as $property) {
                PropertyAnalytics::create([
                    'property_id'               => $property->id,
                    'views_count'               => $property->views_count,
                    'favorites_count'           => $property->favorites_count,
                    'reviews_count'             => $property->reviews_count,
                    'visits_count'              => $property->visits_count,
                    'unique_visits_count'       => $property->unique_visits_count,
                    'average_rating'            => $property->average_rating,
                    'rating_breakdown'          => $property->rating_breakdown,
                    'five_star_percentage'      => $property->five_star_percentage,
                    'recommendation_percentage' => $property->recommendation_percentage,

                    // ✅ Query directly against the units table
                    'vacant_units_count'        => $property->units()->where('status', 'vacant')->count(),
                    'occupied_units_count'      => $property->units()->where('status', 'occupied')->count(),

                    'snapshot_date'             => now()->toDateString(),
                ]);
            }
        });
    }
}
