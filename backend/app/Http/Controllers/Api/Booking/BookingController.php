<?php

namespace App\Http\Controllers\Api\Booking;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\CancelBookingRequest;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Http\Requests\Booking\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Services\BookingService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class BookingController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | DEPENDENCIES
    |--------------------------------------------------------------------------
    */

    /**
     * Booking service instance.
     */
    protected BookingService $bookingService;

    /**
     * Standard relationships returned with booking responses.
     *
     * Keep this list centralized so index, show, create, update and
     * workflow endpoints return a consistent booking structure.
     */
    protected array $bookingRelations = [
        'user',
        'customer',
        'tenant.user',
        'property',
        'apartment',
        'unit',
        'tenancy',
    ];

    /**
     * Standard booking filters accepted by listing endpoints.
     */
    protected array $bookingFilters = [
        'search',
        'status',
        'payment_status',
        'booking_type',
        'source',
        'property_id',
        'apartment_id',
        'unit_id',
        'customer_id',
        'tenant_id',
        'tenancy_id',
        'start_date',
        'end_date',
        'booking_date',
        'booking_date_from',
        'booking_date_to',
        'paid_date_from',
        'paid_date_to',
        'with_trashed',
        'only_trashed',
    ];

    /**
     * Filters accepted by statistics endpoints.
     */
    protected array $statisticsFilters = [
        'start_date',
        'end_date',
        'property_id',
        'apartment_id',
        'unit_id',
        'booking_type',
        'source',
    ];

    /**
     * Filters accepted by report endpoints.
     */
    protected array $reportFilters = [
        'start_date',
        'end_date',
        'status',
        'payment_status',
        'booking_type',
        'source',
        'property_id',
        'apartment_id',
        'unit_id',
        'customer_id',
        'tenant_id',
        'tenancy_id',
        'booking_date',
        'booking_date_from',
        'booking_date_to',
        'paid_date_from',
        'paid_date_to',
        'with_trashed',
        'only_trashed',
    ];

    /**
     * Create a new controller instance.
     */
    public function __construct(
        BookingService $bookingService
    ) {
        $this->bookingService = $bookingService;
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    /**
     * Display a paginated listing of bookings.
     *
     * GET /api/bookings
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $bookings = $this->bookingService->paginate(
                $this->perPage($request),
                $this->filters($request)
            );

            $this->transformPaginator($bookings);

            return ApiResponse::paginated(
                $bookings,
                'Bookings fetched successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking filter validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch bookings.',
                $e
            );
        }
    }

    /**
     * Store a newly created booking.
     *
     * POST /api/bookings
     */
    public function store(
        StoreBookingRequest $request
    ): JsonResponse {
        try {
            $booking = $this->bookingService->create(
                $request->validated()
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::created(
                new BookingResource($booking),
                'Booking created successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking validation failed.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Required booking resource was not found.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to create booking.',
                $e
            );
        }
    }

    /**
     * Display the specified booking.
     *
     * GET /api/bookings/{id}
     */
    public function show(
        int|string $id
    ): JsonResponse {
        try {
            $bookingId = $this->normalizeId($id);

            $booking = $this->bookingService->findOrFail(
                $bookingId
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::success(
                new BookingResource($booking),
                'Booking fetched successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking lookup validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch booking.',
                $e
            );
        }
    }

    /**
     * Update the specified booking.
     *
     * PUT/PATCH /api/bookings/{id}
     */
    public function update(
        UpdateBookingRequest $request,
        int|string $id
    ): JsonResponse {
        try {
            /*
             * Normalize the route ID before it reaches the service.
             */
            $bookingId = $this->normalizeId($id);

            /*
             * Only validated update fields are sent to the service.
             */
            $validated = $request->validated();

            /*
             * BookingService handles:
             * - current booking lookup
             * - state merging
             * - customer/tenant synchronization
             * - property/apartment/unit validation
             * - tenancy validation
             * - availability validation
             * - financial recalculation
             */
            $booking = $this->bookingService->update(
                $bookingId,
                $validated
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::updated(
                new BookingResource($booking),
                'Booking updated successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking update validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to update booking.',
                $e
            );
        }
    }

    /**
     * Soft-delete the specified booking.
     *
     * DELETE /api/bookings/{id}
     */
    public function destroy(
        int|string $id
    ): JsonResponse {
        try {
            $bookingId = $this->normalizeId($id);

            $this->bookingService->delete(
                $bookingId
            );

            return ApiResponse::deleted(
                null,
                'Booking deleted successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking deletion validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to delete booking.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Search bookings.
     *
     * GET /api/bookings/search
     */
    public function search(
        Request $request
    ): JsonResponse {
        try {
            $search = trim(
                (string) $request->input(
                    'search',
                    ''
                )
            );

            /*
             * Empty search behaves like index.
             */
            if ($search === '') {
                return $this->index($request);
            }

            $results = $this->bookingService->search(
                $search,
                $this->perPage($request),
                $this->filters($request)
            );

            $this->transformPaginator($results);

            return ApiResponse::paginated(
                $results,
                'Bookings search completed successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking search validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to search bookings.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS & REPORTS
    |--------------------------------------------------------------------------
    */

    /**
     * Display booking statistics.
     *
     * GET /api/bookings/statistics
     */
    public function statistics(
        Request $request
    ): JsonResponse {
        try {
            $statistics = $this->bookingService->getStatistics(
                $request->only(
                    $this->statisticsFilters
                )
            );

            return ApiResponse::success(
                $statistics,
                'Booking statistics fetched successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking statistics validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch booking statistics.',
                $e
            );
        }
    }

    /**
     * Generate booking report.
     *
     * GET /api/bookings/reports
     */
    public function reports(
        Request $request
    ): JsonResponse {
        try {
            $report = $this->bookingService->getReport(
                $request->only(
                    $this->reportFilters
                )
            );

            return ApiResponse::success(
                $report,
                'Booking report generated successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking report validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to generate booking report.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS LISTS
    |--------------------------------------------------------------------------
    */

    /**
     * Display pending bookings.
     */
    public function pending(
        Request $request
    ): JsonResponse {
        return $this->statusList(
            Booking::STATUS_PENDING,
            $request
        );
    }

    /**
     * Display confirmed bookings.
     */
    public function confirmed(
        Request $request
    ): JsonResponse {
        return $this->statusList(
            Booking::STATUS_CONFIRMED,
            $request
        );
    }

    /**
     * Display active bookings.
     */
    public function active(
        Request $request
    ): JsonResponse {
        try {
            $bookings = $this->bookingService->getActive(
                $this->perPage($request),
                $this->filters($request)
            );

            $this->transformPaginator($bookings);

            return ApiResponse::paginated(
                $bookings,
                'Active bookings fetched successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Active booking filter validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch active bookings.',
                $e
            );
        }
    }

    /**
     * Display completed bookings.
     */
    public function completed(
        Request $request
    ): JsonResponse {
        return $this->statusList(
            Booking::STATUS_COMPLETED,
            $request
        );
    }

    /**
     * Display cancelled bookings.
     */
    public function cancelled(
        Request $request
    ): JsonResponse {
        return $this->statusList(
            Booking::STATUS_CANCELLED,
            $request
        );
    }

    /**
     * Display expired bookings.
     */
    public function expired(
        Request $request
    ): JsonResponse {
        return $this->statusList(
            Booking::STATUS_EXPIRED,
            $request
        );
    }

    /**
     * Display rejected bookings.
     */
    public function rejected(
        Request $request
    ): JsonResponse {
        return $this->statusList(
            Booking::STATUS_REJECTED,
            $request
        );
    }

    /**
     * Return bookings filtered by status.
     */
    protected function statusList(
        string $status,
        Request $request
    ): JsonResponse {
        try {
            $bookings = $this->bookingService->getByStatus(
                $status,
                $this->perPage($request),
                $this->filters($request)
            );

            $this->transformPaginator($bookings);

            return ApiResponse::paginated(
                $bookings,
                ucfirst($status)
                    . ' bookings fetched successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                ucfirst($status)
                    . ' booking filter validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                "Unable to fetch {$status} bookings.",
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BOOKING WORKFLOW
    |--------------------------------------------------------------------------
    */

    /**
     * Confirm a booking.
     */
    public function confirm(
        int|string $id
    ): JsonResponse {
        try {
            $booking = $this->bookingService->confirm(
                $this->normalizeId($id)
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::updated(
                new BookingResource($booking),
                'Booking confirmed successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking confirmation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to confirm booking.',
                $e
            );
        }
    }

    /**
     * Approve a booking.
     */
    public function approve(
        int|string $id
    ): JsonResponse {
        try {
            $booking = $this->bookingService->approve(
                $this->normalizeId($id)
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::updated(
                new BookingResource($booking),
                'Booking approved successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking approval failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to approve booking.',
                $e
            );
        }
    }

    /**
     * Check in a booking.
     */
    public function checkIn(
        int|string $id
    ): JsonResponse {
        try {
            $booking = $this->bookingService->checkIn(
                $this->normalizeId($id)
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::updated(
                new BookingResource($booking),
                'Booking checked in successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking check-in failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to check in booking.',
                $e
            );
        }
    }

    /**
     * Complete a booking.
     */
    public function complete(
        int|string $id
    ): JsonResponse {
        try {
            $booking = $this->bookingService->complete(
                $this->normalizeId($id)
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::updated(
                new BookingResource($booking),
                'Booking completed successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking completion failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to complete booking.',
                $e
            );
        }
    }

    /**
     * Cancel a booking.
     */
    public function cancel(
        CancelBookingRequest $request,
        int|string $id
    ): JsonResponse {
        try {
            $booking = $this->bookingService->cancel(
                $this->normalizeId($id),
                $request->validated()
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::updated(
                new BookingResource($booking),
                'Booking cancelled successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking cancellation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to cancel booking.',
                $e
            );
        }
    }

    /**
     * Reject a booking.
     */
    public function reject(
        Request $request,
        int|string $id
    ): JsonResponse {
        try {
            $validated = $request->validate([
                'rejection_reason' => [
                    'required',
                    'string',
                    'min:3',
                    'max:5000',
                ],
            ]);

            $booking = $this->bookingService->reject(
                $this->normalizeId($id),
                $validated['rejection_reason']
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::updated(
                new BookingResource($booking),
                'Booking rejected successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking rejection failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to reject booking.',
                $e
            );
        }
    }

    /**
     * Expire a booking.
     */
    public function expire(
        int|string $id
    ): JsonResponse {
        try {
            $booking = $this->bookingService->expire(
                $this->normalizeId($id)
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::updated(
                new BookingResource($booking),
                'Booking expired successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking expiry failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to expire booking.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY
    |--------------------------------------------------------------------------
    */

    /**
     * Get units available for booking.
     *
     * GET /api/bookings/available-units
     */
    public function availableUnits(
        Request $request
    ): JsonResponse {
        try {
            $validated = $request->validate([
                'start_date' => [
                    'required',
                    'date',
                ],

                'end_date' => [
                    'required',
                    'date',
                    'after_or_equal:start_date',
                ],

                'property_id' => [
                    'sometimes',
                    'nullable',
                    'integer',
                    'exists:properties,id',
                ],

                'apartment_id' => [
                    'sometimes',
                    'nullable',
                    'integer',
                    'exists:apartments,id',
                ],

                'booking_id' => [
                    'sometimes',
                    'nullable',
                    'integer',
                    'exists:bookings,id',
                ],
            ]);

            $bookingId = isset(
                $validated['booking_id']
            )
                ? (int) $validated['booking_id']
                : null;

            $propertyId = isset(
                $validated['property_id']
            )
                ? (int) $validated['property_id']
                : null;

            $apartmentId = isset(
                $validated['apartment_id']
            )
                ? (int) $validated['apartment_id']
                : null;

            $units = $this->bookingService->getAvailableUnits(
                $validated['start_date'],
                $validated['end_date'],
                $propertyId,
                $apartmentId,
                $bookingId
            );

            return ApiResponse::collection(
                $units,
                'Available booking units fetched successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Availability validation failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch available units.',
                $e
            );
        }
    }

    /**
     * Get users eligible to make bookings.
     *
     * GET /api/bookings/available-users
     */
    public function availableUsers(
        Request $request
    ): JsonResponse {
        try {
            $search = $request->filled('search')
                ? trim(
                    (string) $request->input('search')
                )
                : null;

            $users = $this->bookingService->getAvailableUsers(
                $search
            );

            return ApiResponse::collection(
                $users,
                'Available booking users fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch available booking users.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE / FORCE DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft-deleted booking.
     */
    public function restore(
        int|string $id
    ): JsonResponse {
        try {
            $booking = $this->bookingService->restore(
                $this->normalizeId($id)
            );

            $this->loadBookingRelations($booking);

            return ApiResponse::updated(
                new BookingResource($booking),
                'Booking restored successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Deleted booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking restoration failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to restore booking.',
                $e
            );
        }
    }

    /**
     * Permanently delete a booking.
     */
    public function forceDelete(
        int|string $id
    ): JsonResponse {
        try {
            $this->bookingService->forceDelete(
                $this->normalizeId($id)
            );

            return ApiResponse::deleted(
                null,
                'Booking permanently deleted successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Permanent booking deletion failed.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to permanently delete booking.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE / PROTECTED HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Normalize a booking route ID.
     *
     * This intentionally rejects invalid values such as:
     *
     * [object Object]
     * empty strings
     * arrays
     * zero
     * negative numbers
     * non-numeric strings
     *
     * This protects the backend from frontend navigation mistakes.
     *
     * @throws ValidationException
     */
    protected function normalizeId(
        int|string $id
    ): int {
        if (is_int($id)) {
            if ($id < 1) {
                throw ValidationException::withMessages([
                    'booking_id' => [
                        'The booking ID must be a positive integer.',
                    ],
                ]);
            }

            return $id;
        }

        $value = trim($id);

        if (
            $value === '' ||
            !ctype_digit($value) ||
            (int) $value < 1
        ) {
            throw ValidationException::withMessages([
                'booking_id' => [
                    'A valid booking ID is required.',
                ],
            ]);
        }

        return (int) $value;
    }

    /**
     * Load all standard booking relationships.
     */
    protected function loadBookingRelations(
        $booking
    ): void {
        $booking->load(
            $this->bookingRelations
        );
    }

    /**
     * Transform paginator items into BookingResource instances.
     *
     * The paginator itself remains intact so ApiResponse::paginated()
     * can continue generating pagination metadata and links.
     */
    protected function transformPaginator(
        LengthAwarePaginator $paginator
    ): void {
        $paginator->through(
            fn ($booking) => new BookingResource($booking)
        );
    }

    /**
     * Return normalized pagination size.
     *
     * Final maximum enforcement remains in BookingService/Repository.
     */
    protected function perPage(
        Request $request
    ): int {
        $perPage = (int) $request->input(
            'per_page',
            15
        );

        return max(
            1,
            min(
                100,
                $perPage
            )
        );
    }

    /**
     * Return normalized booking filters.
     */
    protected function filters(
        Request $request
    ): array {
        return $request->only(
            $this->bookingFilters
        );
    }

    /**
     * Return a consistent server-error response.
     *
     * Detailed exception information is exposed only in local
     * environments.
     */
    protected function serverError(
        string $message,
        Throwable $e
    ): JsonResponse {
        report($e);

        $errors = null;

        if (app()->environment('local')) {
            $errors = [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ];
        }

        return ApiResponse::serverError(
            $message,
            $errors
        );
    }
}
