<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Property;
use App\Models\PropertyReview;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PropertyReviewsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::transaction(function () {

            $users = User::pluck('id')->toArray();
            $properties = Property::pluck('id')->toArray();

            if (empty($users) || empty($properties)) {
                $this->command->warn('No users or properties found. Skipping PropertyReviewsSeeder.');
                return;
            }

            $titles = [
                'Excellent Property',
                'Highly Recommended',
                'Amazing Experience',
                'Very Comfortable',
                'Perfect Family Home',
                'Luxury Living',
                'Great Investment',
                'Beautiful Property',
                'Worth Every Penny',
                'Peaceful Environment',
                'Modern Design',
                'Fantastic Location',
                'Clean and Spacious',
                'Exceptional Service',
                'Lovely Neighborhood',
            ];

            $comments = [
                'The property exceeded my expectations. Everything was clean, spacious, and exactly as described.',
                'Excellent location with modern amenities. I would definitely recommend this property.',
                'Very secure environment with friendly neighbors and easy access to shopping centers.',
                'Perfect place for a family. Spacious rooms and plenty of parking.',
                'The management team was professional and responsive throughout the process.',
                'Beautiful property with stunning finishes and excellent value for money.',
                'One of the best rental properties I have visited.',
                'Highly recommend this property to anyone looking for comfort and convenience.',
                'Very peaceful area with excellent security and beautiful surroundings.',
                'Modern apartments with quality finishing and reliable utilities.',
                'The location is ideal with schools, hospitals, and supermarkets nearby.',
                'Everything was well maintained and exactly as advertised.',
                'Amazing experience from viewing to moving in.',
                'Excellent investment opportunity with great appreciation potential.',
                'I would definitely choose this property again.',
            ];

            foreach ($properties as $propertyId) {
                // Random number of reviews per property
                $reviewsCount = rand(5, 25);

                shuffle($users);
                $reviewUsers = array_slice($users, 0, min($reviewsCount, count($users)));

                foreach ($reviewUsers as $userId) {
                    $rating = fake()->numberBetween(3, 5);

                    // Occasionally generate lower ratings
                    if (rand(1, 10) <= 2) {
                        $rating = fake()->numberBetween(1, 2);
                    }

                    PropertyReview::updateOrCreate(
                        [
                            'property_id' => $propertyId,
                            'user_id'     => $userId,
                        ],
                        [
                            'rating'          => $rating,
                            'title'           => fake()->randomElement($titles),
                            'comment'         => fake()->randomElement($comments),
                            'would_recommend' => $rating >= 4,
                            'is_verified'     => fake()->boolean(80),
                            'is_published'    => true,
                            'likes_count'     => fake()->numberBetween(0, 150),
                            'published_at'    => now()->subDays(rand(1, 365)),
                            'edited_at'       => fake()->boolean(25)
                                ? now()->subDays(rand(1, 180))
                                : null,
                            'created_at'      => now()->subDays(rand(1, 365)),
                            'updated_at'      => now(),
                        ]
                    );
                }
            }

            $this->command->info(
                PropertyReview::count() . ' property reviews seeded successfully.'
            );
        });
    }
}
