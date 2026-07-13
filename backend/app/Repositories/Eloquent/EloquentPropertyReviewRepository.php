<?php

namespace App\Repositories\Eloquent;

use App\Models\PropertyReview;
use App\Repositories\Interfaces\PropertyReviewRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class EloquentPropertyReviewRepository implements PropertyReviewRepositoryInterface
{
    /**
     * PropertyReview model.
     */
    protected PropertyReview $model;

    /**
     * Constructor.
     */
    public function __construct(PropertyReview $model)
    {
        $this->model = $model;
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    /**
     * Get all reviews.
     */
    public function all(): Collection
    {
        return $this->model
            ->with(['user', 'property'])
            ->latest()
            ->get();
    }

    /**
     * Paginate reviews.
     */
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->model
            ->with(['user', 'property'])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Find review.
     */
    public function find(int $id): ?PropertyReview
    {
        return $this->model
            ->with(['user', 'property'])
            ->find($id);
    }

    /**
     * Find review or fail.
     */
    public function findOrFail(int $id): PropertyReview
    {
        return $this->model
            ->with(['user', 'property'])
            ->findOrFail($id);
    }

    /**
     * Create review.
     */
    public function create(array $data): PropertyReview
    {
        $review = $this->model->create($data);

        return $review->load([
            'user',
            'property',
        ]);
    }

    /**
     * Update review.
     */
    public function update(
        PropertyReview $review,
        array $data
    ): PropertyReview {

        $review->update($data);

        return $review->fresh([
            'user',
            'property',
        ]);
    }

    /**
     * Delete review.
     */
    public function delete(PropertyReview $review): bool
    {
        return (bool) $review->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY
    |--------------------------------------------------------------------------
    */
        /**
     * Get reviews for a property.
     */
    public function getByProperty(int $propertyId): Collection
    {
        return $this->model
            ->with(['user', 'property'])
            ->where('property_id', $propertyId)
            ->latest()
            ->get();
    }

    /**
     * Get paginated reviews for a property.
     */
    public function getPaginatedByProperty(
        int $propertyId,
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->model
            ->with(['user', 'property'])
            ->where('property_id', $propertyId)
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Get published reviews for a property.
     */
    public function getPublishedByProperty(int $propertyId): Collection
    {
        return $this->model
            ->with(['user'])
            ->published()
            ->where('property_id', $propertyId)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | USER
    |--------------------------------------------------------------------------
    */

    /**
     * Get reviews by user.
     */
    public function getByUser(int $userId): Collection
    {
        return $this->model
            ->with(['property'])
            ->where('user_id', $userId)
            ->latest()
            ->get();
    }

    /**
     * Find a user's review for a property.
     */
    public function findUserPropertyReview(
        int $propertyId,
        int $userId
    ): ?PropertyReview {
        return $this->model
            ->where('property_id', $propertyId)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Determine whether the user has reviewed the property.
     */
    public function hasUserReviewed(
        int $propertyId,
        int $userId
    ): bool {
        return $this->model
            ->where('property_id', $propertyId)
            ->where('user_id', $userId)
            ->exists();
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Total reviews for a property.
     */
    public function countByProperty(int $propertyId): int
    {
        return $this->model
            ->published()
            ->where('property_id', $propertyId)
            ->count();
    }

    /**
     * Average rating for a property.
     */
    public function averageRating(int $propertyId): float
    {
        return round(
            $this->model
                ->published()
                ->where('property_id', $propertyId)
                ->avg('rating') ?? 0,
            1
        );
    }

    /**
     * Rating breakdown.
     */
    public function ratingBreakdown(int $propertyId): array
    {
        $breakdown = [
            5 => 0,
            4 => 0,
            3 => 0,
            2 => 0,
            1 => 0,
        ];

        $ratings = $this->model
            ->published()
            ->where('property_id', $propertyId)
            ->selectRaw('rating, COUNT(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        foreach ($ratings as $rating => $total) {
            $breakdown[(int) $rating] = (int) $total;
        }

        return $breakdown;
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */
        /**
     * Get published reviews.
     */
    public function published(): Collection
    {
        return $this->model
            ->with(['user', 'property'])
            ->published()
            ->latest()
            ->get();
    }

    /**
     * Get verified reviews.
     */
    public function verified(): Collection
    {
        return $this->model
            ->with(['user', 'property'])
            ->verified()
            ->latest()
            ->get();
    }

    /**
     * Get positive reviews.
     */
    public function positive(): Collection
    {
        return $this->model
            ->with(['user', 'property'])
            ->positive()
            ->latest()
            ->get();
    }

    /**
     * Get negative reviews.
     */
    public function negative(): Collection
    {
        return $this->model
            ->with(['user', 'property'])
            ->negative()
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | MODERATION
    |--------------------------------------------------------------------------
    */

    /**
     * Publish review.
     */
    public function publish(PropertyReview $review): PropertyReview
    {
        $review->update([
            'is_published' => true,
            'published_at' => now(),
        ]);

        return $review->fresh([
            'user',
            'property',
        ]);
    }

    /**
     * Unpublish review.
     */
    public function unpublish(PropertyReview $review): PropertyReview
    {
        $review->update([
            'is_published' => false,
        ]);

        return $review->fresh([
            'user',
            'property',
        ]);
    }

    /**
     * Verify review.
     */
    public function verify(PropertyReview $review): PropertyReview
    {
        $review->update([
            'is_verified' => true,
        ]);

        return $review->fresh([
            'user',
            'property',
        ]);
    }

    /**
     * Remove verification.
     */
    public function unverify(PropertyReview $review): PropertyReview
    {
        $review->update([
            'is_verified' => false,
        ]);

        return $review->fresh([
            'user',
            'property',
        ]);
    }
}