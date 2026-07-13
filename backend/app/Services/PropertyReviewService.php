<?php

namespace App\Services;

use App\Helpers\ApiResponse;
use App\Models\PropertyReview;
use App\Repositories\Interfaces\PropertyReviewRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class PropertyReviewService
{
    /**
     * Property Review Repository.
     */
    protected PropertyReviewRepositoryInterface $repository;

    /**
     * Constructor.
     */
    public function __construct(
        PropertyReviewRepositoryInterface $repository
    ) {
        $this->repository = $repository;
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
        return $this->repository->all();
    }

    /**
     * Paginate reviews.
     */
    public function paginate(int $perPage = 15): LengthAwarePaginator
    {
        return $this->repository->paginate($perPage);
    }

    /**
     * Find review.
     */
    public function find(int $id): PropertyReview
    {
        return $this->repository->findOrFail($id);
    }

    /**
     * Create review.
     *
     * One review per user per property.
     */
    public function create(array $data): PropertyReview
    {
        $userId = Auth::id();

        if (!$userId) {
            throw ValidationException::withMessages([
                'user' => 'You must be logged in to review a property.',
            ]);
        }

        $alreadyReviewed = $this->repository->hasUserReviewed(
            $data['property_id'],
            $userId
        );

        if ($alreadyReviewed) {
            throw ValidationException::withMessages([
                'review' => 'You have already reviewed this property.',
            ]);
        }

        $data['user_id'] = $userId;

        /*
        |--------------------------------------------------------------------------
        | AUTO VALUES
        |--------------------------------------------------------------------------
        */

        $data['is_published'] = $data['is_published'] ?? true;
        $data['is_verified'] = $data['is_verified'] ?? false;
        $data['likes_count'] = 0;

        if (!isset($data['would_recommend'])) {
            $data['would_recommend'] = $data['rating'] >= 4;
        }

        $data['published_at'] = now();

        return $this->repository->create($data);
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY REVIEWS
    |--------------------------------------------------------------------------
    */

    /**
     * Get all reviews for a property.
     */
    public function getByProperty(int $propertyId): Collection
    {
        return $this->repository->getPublishedByProperty($propertyId);
    }

    /**
     * Paginated property reviews.
     */
    public function getPaginatedByProperty(
        int $propertyId,
        int $perPage = 10
    ): LengthAwarePaginator {
        return $this->repository
            ->getPaginatedByProperty(
                $propertyId,
                $perPage
            );
    }

    /**
     * Current user's review.
     */
    public function myReview(int $propertyId): ?PropertyReview
    {
        if (!Auth::check()) {
            return null;
        }

        return $this->repository->findUserPropertyReview(
            $propertyId,
            Auth::id()
        );
    }

    /**
     * Check whether current user reviewed.
     */
    public function hasReviewed(int $propertyId): bool
    {
        if (!Auth::check()) {
            return false;
        }

        return $this->repository->hasUserReviewed(
            $propertyId,
            Auth::id()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE & DELETE
    |--------------------------------------------------------------------------
    */
        /**
     * Update review.
     */
    public function update(
        PropertyReview $review,
        array $data
    ): PropertyReview {

        /*
        |--------------------------------------------------------------------------
        | ONLY OWNER CAN UPDATE
        |--------------------------------------------------------------------------
        */

        if ($review->user_id !== Auth::id()) {
            throw ValidationException::withMessages([
                'review' => 'You are not allowed to update this review.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | AUTO UPDATE RECOMMENDATION
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['rating']) &&
            !isset($data['would_recommend'])
        ) {
            $data['would_recommend'] = $data['rating'] >= 4;
        }

        $data['edited_at'] = now();

        return $this->repository->update($review, $data);
    }

    /**
     * Delete review.
     */
    public function delete(PropertyReview $review): bool
    {
        /*
        |--------------------------------------------------------------------------
        | ONLY OWNER CAN DELETE
        |--------------------------------------------------------------------------
        */

        if ($review->user_id !== Auth::id()) {
            throw ValidationException::withMessages([
                'review' => 'You are not allowed to delete this review.',
            ]);
        }

        return $this->repository->delete($review);
    }

    /*
    |--------------------------------------------------------------------------
    | USER REVIEWS
    |--------------------------------------------------------------------------
    */

    /**
     * Get reviews by user.
     */
    public function getByUser(int $userId): Collection
    {
        return $this->repository->getByUser($userId);
    }

    /**
     * Get current authenticated user's reviews.
     */
    public function myReviews(): Collection
    {
        if (!Auth::check()) {
            return collect();
        }

        return $this->repository->getByUser(Auth::id());
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
        return $this->repository->countByProperty($propertyId);
    }

    /**
     * Average rating.
     */
    public function averageRating(int $propertyId): float
    {
        return $this->repository->averageRating($propertyId);
    }

    /**
     * Rating breakdown.
     */
    public function ratingBreakdown(int $propertyId): array
    {
        return $this->repository->ratingBreakdown($propertyId);
    }

    /**
     * Property review summary.
     */
    public function summary(int $propertyId): array
    {
        return [
            'total_reviews' => $this->countByProperty($propertyId),
            'average_rating' => $this->averageRating($propertyId),
            'rating_breakdown' => $this->ratingBreakdown($propertyId),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MODERATION
    |--------------------------------------------------------------------------
    */
        /**
     * Get published reviews.
     */
    public function published(): Collection
    {
        return $this->repository->published();
    }

    /**
     * Get verified reviews.
     */
    public function verified(): Collection
    {
        return $this->repository->verified();
    }

    /**
     * Get positive reviews.
     */
    public function positive(): Collection
    {
        return $this->repository->positive();
    }

    /**
     * Get negative reviews.
     */
    public function negative(): Collection
    {
        return $this->repository->negative();
    }

    /**
     * Publish review.
     */
    public function publish(PropertyReview $review): PropertyReview
    {
        return $this->repository->publish($review);
    }

    /**
     * Unpublish review.
     */
    public function unpublish(PropertyReview $review): PropertyReview
    {
        return $this->repository->unpublish($review);
    }

    /**
     * Verify review.
     */
    public function verify(PropertyReview $review): PropertyReview
    {
        return $this->repository->verify($review);
    }

    /**
     * Remove review verification.
     */
    public function unverify(PropertyReview $review): PropertyReview
    {
        return $this->repository->unverify($review);
    }

    /**
     * Toggle review publication status.
     */
    public function togglePublish(PropertyReview $review): PropertyReview
    {
        if ($review->is_published) {
            return $this->repository->unpublish($review);
        }

        return $this->repository->publish($review);
    }

    /**
     * Toggle review verification status.
     */
    public function toggleVerification(PropertyReview $review): PropertyReview
    {
        if ($review->is_verified) {
            return $this->repository->unverify($review);
        }

        return $this->repository->verify($review);
    }

    /*
    |--------------------------------------------------------------------------
    | REVIEW ENGAGEMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Like a review.
     */
    public function like(PropertyReview $review): PropertyReview
    {
        $review->increment('likes_count');

        return $review->fresh([
            'user',
            'property',
        ]);
    }

    /**
     * Unlike a review.
     */
    public function unlike(PropertyReview $review): PropertyReview
    {
        if ($review->likes_count > 0) {
            $review->decrement('likes_count');
        }

        return $review->fresh([
            'user',
            'property',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Find a review by ID.
     */
    public function findOrFail(int $id): PropertyReview
    {
        return $this->repository->findOrFail($id);
    }

    /**
     * Check whether a review belongs to the authenticated user.
     */
    public function isOwner(PropertyReview $review): bool
    {
        return Auth::check() &&
            $review->user_id === Auth::id();
    }
}