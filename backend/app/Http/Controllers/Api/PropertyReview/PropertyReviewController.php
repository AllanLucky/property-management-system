<?php

namespace App\Http\Controllers\Api\PropertyReview;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;

/*
|--------------------------------------------------------------------------
| REQUESTS
|--------------------------------------------------------------------------
*/
use App\Http\Requests\PropertyReview\CreatePropertyReviewRequest;
use App\Http\Requests\PropertyReview\UpdatePropertyReviewRequest;

/*
|--------------------------------------------------------------------------
| RESOURCES
|--------------------------------------------------------------------------
*/
use App\Http\Resources\PropertyReviewResource;

/*
|--------------------------------------------------------------------------
| MODELS
|--------------------------------------------------------------------------
*/
use App\Models\PropertyReview;

/*
|--------------------------------------------------------------------------
| SERVICES
|--------------------------------------------------------------------------
*/
use App\Services\PropertyReviewService;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class PropertyReviewController extends Controller
{
    /**
     * Create a new controller instance.
     */
    public function __construct(
        protected PropertyReviewService $service
    ) {
        //
    }

    /*
    |--------------------------------------------------------------------------
    | LIST REVIEWS
    |--------------------------------------------------------------------------
    */

    /**
     * Display a paginated listing of property reviews.
     */
    public function index(Request $request): JsonResponse
{
    try {

        $perPage = max(
            1,
            min((int) $request->integer('per_page', 15), 100)
        );

        $reviews = $this->service->paginate($perPage);

        // Database statistics
        $stats = [
    'total' => PropertyReview::count(),

    'published' => PropertyReview::published()->count(),

    'verified' => PropertyReview::verified()->count(),

    'positive' => PropertyReview::positive()->count(),

    'negative' => PropertyReview::negative()->count(),

    'recommended' => PropertyReview::recommended()->count(),

    'average_rating' => round((float) PropertyReview::avg('rating'), 1),
];

        return response()->json([
            'status' => true,
            'code' => 200,
            'message' => 'Property reviews retrieved successfully.',

            'data' => $reviews->through(
                fn (PropertyReview $review) => new PropertyReviewResource($review)
            )->values(),

            'stats' => $stats,

            'meta' => [
                'current_page'   => $reviews->currentPage(),
                'last_page'      => $reviews->lastPage(),
                'per_page'       => $reviews->perPage(),
                'total'          => $reviews->total(),
                'from'           => $reviews->firstItem(),
                'to'             => $reviews->lastItem(),
                'has_more_pages' => $reviews->hasMorePages(),
            ],

            'links' => [
                'first' => $reviews->url(1),
                'last'  => $reviews->url($reviews->lastPage()),
                'prev'  => $reviews->previousPageUrl(),
                'next'  => $reviews->nextPageUrl(),
            ],

            'errors' => null,
        ]);

    } catch (Throwable $e) {

        report($e);

        return ApiResponse::serverError(
            'Failed to retrieve property reviews.',
            $e->getMessage()
        );
    }
}

    /*
    |--------------------------------------------------------------------------
    | STORE REVIEW
    |--------------------------------------------------------------------------
    */

    /**
     * Store a newly created property review.
     */
    public function store(
        CreatePropertyReviewRequest $request
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->create(
                $request->validated()
            );

            DB::commit();

            return ApiResponse::created(
                new PropertyReviewResource($review),
                'Property review submitted successfully.'
            );

        } catch (ValidationException $e) {

            DB::rollBack();

            return ApiResponse::validation(
                $e->errors(),
                'Validation failed.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to submit property review.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW REVIEW
    |--------------------------------------------------------------------------
    */

    /**
     * Display the specified property review.
     */
    public function show(
        PropertyReview $propertyReview
    ): JsonResponse {

        try {

            return ApiResponse::success(
                new PropertyReviewResource($propertyReview),
                'Property review retrieved successfully.'
            );

        } catch (Throwable $e) {

            report($e);

            return ApiResponse::serverError(
                'Failed to retrieve property review.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE REVIEW
    |--------------------------------------------------------------------------
    */

    /**
     * Update the specified property review.
     */
    public function update(
        UpdatePropertyReviewRequest $request,
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->update(
                $propertyReview,
                $request->validated()
            );

            DB::commit();

            return ApiResponse::updated(
                new PropertyReviewResource($review),
                'Property review updated successfully.'
            );

        } catch (ValidationException $e) {

            DB::rollBack();

            return ApiResponse::validation(
                $e->errors(),
                'Validation failed.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to update property review.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE REVIEW
    |--------------------------------------------------------------------------
    */
        /**
     * Delete the specified property review.
     */
    public function destroy(
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $this->service->delete($propertyReview);

            DB::commit();

            return ApiResponse::deleted(
                'Property review deleted successfully.'
            );

        } catch (ValidationException $e) {

            DB::rollBack();

            return ApiResponse::validation(
                $e->errors(),
                'Validation failed.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to delete property review.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PROPERTY REVIEWS
    |--------------------------------------------------------------------------
    */

    /**
     * Display paginated reviews for a specific property.
     */
    public function propertyReviews(
        int $propertyId,
        Request $request
    ): JsonResponse {

        try {

            $perPage = max(
                1,
                min((int) $request->integer('per_page', 10), 100)
            );

            $reviews = $this->service->getPaginatedByProperty(
                $propertyId,
                $perPage
            );

            return ApiResponse::paginated(
                $reviews->through(
                    fn (PropertyReview $review) => new PropertyReviewResource($review)
                ),
                'Property reviews retrieved successfully.'
            );

        } catch (Throwable $e) {

            report($e);

            return ApiResponse::serverError(
                'Failed to retrieve property reviews.',
                $e->getMessage()
            );
        }
    }

    /**
     * Display the authenticated user's review for a property.
     */
    public function myReview(
        int $propertyId
    ): JsonResponse {

        try {

            $review = $this->service->myReview($propertyId);

            if (!$review) {

                return ApiResponse::notFound(
                    'You have not reviewed this property.'
                );
            }

            return ApiResponse::success(
                new PropertyReviewResource($review),
                'Your review retrieved successfully.'
            );

        } catch (Throwable $e) {

            report($e);

            return ApiResponse::serverError(
                'Failed to retrieve your review.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | REVIEW SUMMARY
    |--------------------------------------------------------------------------
    */

    /**
     * Display review summary for a property.
     */
    public function summary(
        int $propertyId
    ): JsonResponse {

        try {

            $summary = $this->service->summary($propertyId);

            return ApiResponse::success(
                $summary,
                'Review summary retrieved successfully.'
            );

        } catch (Throwable $e) {

            report($e);

            return ApiResponse::serverError(
                'Failed to retrieve review summary.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | MODERATION
    |--------------------------------------------------------------------------
    */
        /**
     * Publish the specified property review.
     */
    public function publish(
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->publish($propertyReview);

            DB::commit();

            return ApiResponse::updated(
                new PropertyReviewResource($review),
                'Property review published successfully.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to publish property review.',
                $e->getMessage()
            );
        }
    }

    /**
     * Unpublish the specified property review.
     */
    public function unpublish(
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->unpublish($propertyReview);

            DB::commit();

            return ApiResponse::updated(
                new PropertyReviewResource($review),
                'Property review unpublished successfully.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to unpublish property review.',
                $e->getMessage()
            );
        }
    }

    /**
     * Verify the specified property review.
     */
    public function verify(
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->verify($propertyReview);

            DB::commit();

            return ApiResponse::updated(
                new PropertyReviewResource($review),
                'Property review verified successfully.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to verify property review.',
                $e->getMessage()
            );
        }
    }

    /**
     * Remove verification from the specified property review.
     */
    public function unverify(
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->unverify($propertyReview);

            DB::commit();

            return ApiResponse::updated(
                new PropertyReviewResource($review),
                'Property review verification removed successfully.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to remove review verification.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | REVIEW ENGAGEMENT
    |--------------------------------------------------------------------------
    */

    /**
     * Like the specified property review.
     */
    public function like(
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->like($propertyReview);

            DB::commit();

            return ApiResponse::updated(
                new PropertyReviewResource($review),
                'Review liked successfully.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to like review.',
                $e->getMessage()
            );
        }
    }

    /**
     * Unlike the specified property review.
     */
    public function unlike(
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->unlike($propertyReview);

            DB::commit();

            return ApiResponse::updated(
                new PropertyReviewResource($review),
                'Review unliked successfully.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to unlike review.',
                $e->getMessage()
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE OPERATIONS
    |--------------------------------------------------------------------------
    */

    /**
     * Toggle publication status.
     */
    public function togglePublish(
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->togglePublish($propertyReview);

            DB::commit();

            return ApiResponse::updated(
                new PropertyReviewResource($review),
                'Review publication status updated successfully.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to update publication status.',
                $e->getMessage()
            );
        }
    }

    /**
     * Toggle verification status.
     */
    public function toggleVerification(
        PropertyReview $propertyReview
    ): JsonResponse {

        DB::beginTransaction();

        try {

            $review = $this->service->toggleVerification($propertyReview);

            DB::commit();

            return ApiResponse::updated(
                new PropertyReviewResource($review),
                'Review verification status updated successfully.'
            );

        } catch (Throwable $e) {

            DB::rollBack();

            report($e);

            return ApiResponse::serverError(
                'Failed to update verification status.',
                $e->getMessage()
            );
        }
    }
}