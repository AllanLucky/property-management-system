<?php

namespace App\Repositories\Interfaces;

use App\Models\PropertyReview;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface PropertyReviewRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    /**
     * Get all reviews.
     */
    public function all(): Collection;

    /**
     * Paginate reviews.
     */
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    /**
     * Find review by ID.
     */
    public function find(int $id): ?PropertyReview;

    /**
     * Find review or fail.
     */
    public function findOrFail(int $id): PropertyReview;

    /**
     * Create review.
     */
    public function create(array $data): PropertyReview;

    /**
     * Update review.
     */
    public function update(PropertyReview $review, array $data): PropertyReview;

    /**
     * Delete review.
     */
    public function delete(PropertyReview $review): bool;

    /*
    |--------------------------------------------------------------------------
    | PROPERTY
    |--------------------------------------------------------------------------
    */

    /**
     * Get reviews for a property.
     */
    public function getByProperty(int $propertyId): Collection;

    /**
     * Get paginated reviews for a property.
     */
    public function getPaginatedByProperty(
        int $propertyId,
        int $perPage = 15
    ): LengthAwarePaginator;

    /**
     * Get published reviews for a property.
     */
    public function getPublishedByProperty(int $propertyId): Collection;

    /*
    |--------------------------------------------------------------------------
    | USER
    |--------------------------------------------------------------------------
    */

    /**
     * Get reviews by user.
     */
    public function getByUser(int $userId): Collection;

    /**
     * Find a user's review for a property.
     */
    public function findUserPropertyReview(
        int $propertyId,
        int $userId
    ): ?PropertyReview;

    /**
     * Determine whether the user has reviewed the property.
     */
    public function hasUserReviewed(
        int $propertyId,
        int $userId
    ): bool;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Total reviews for a property.
     */
    public function countByProperty(int $propertyId): int;

    /**
     * Average rating for a property.
     */
    public function averageRating(int $propertyId): float;

    /**
     * Rating breakdown.
     *
     * Returns:
     * [
     *   5 => 12,
     *   4 => 8,
     *   3 => 2,
     *   2 => 1,
     *   1 => 0,
     * ]
     */
    public function ratingBreakdown(int $propertyId): array;

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */

    /**
     * Get published reviews.
     */
    public function published(): Collection;

    /**
     * Get verified reviews.
     */
    public function verified(): Collection;

    /**
     * Get positive reviews.
     */
    public function positive(): Collection;

    /**
     * Get negative reviews.
     */
    public function negative(): Collection;

    /*
    |--------------------------------------------------------------------------
    | MODERATION
    |--------------------------------------------------------------------------
    */

    /**
     * Publish review.
     */
    public function publish(PropertyReview $review): PropertyReview;

    /**
     * Unpublish review.
     */
    public function unpublish(PropertyReview $review): PropertyReview;

    /**
     * Verify review.
     */
    public function verify(PropertyReview $review): PropertyReview;

    /**
     * Remove verification.
     */
    public function unverify(PropertyReview $review): PropertyReview;
}