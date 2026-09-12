<?php

namespace App\Http\Controllers\Api\Booking;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\CancelBookingRequest;
use App\Http\Requests\Booking\StoreBookingRequest;
use App\Http\Requests\Booking\UpdateBookingRequest;
use App\Http\Resources\BookingResource;
use App\Services\BookingService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class BookingController extends Controller
{
    /**
     * Booking service instance.
     */
    protected BookingService $bookingService;

    /**
     * Create a new controller instance.
     */
    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    /**
     * Display a paginated listing of bookings.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $bookings = $this->bookingService->paginate(
                (int) $request->input('per_page', 15),
                $request->only([
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
                    'start_date',
                    'end_date',
                ])
            );

            $bookings->through(
                fn ($booking) => new BookingResource($booking)
            );

            return ApiResponse::paginated(
                $bookings,
                'Bookings fetched successfully.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::serverError(
                'Unable to fetch bookings.'
            );
        }
    }

    /**
     * Store a newly created booking.
     */
    public function store(StoreBookingRequest $request): JsonResponse
    {
        try {
            $booking = $this->bookingService->create(
                $request->validated()
            );

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

            return ApiResponse::created(
                new BookingResource($booking),
                'Booking created successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Booking validation failed.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::serverError(
                'Unable to create booking.'
            );
        }
    }

    /**
     * Display the specified booking.
     */
    public function show(int|string $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->findOrFail($id);

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

            return ApiResponse::success(
                new BookingResource($booking),
                'Booking fetched successfully.'
            );
        } catch (ModelNotFoundException) {
            return ApiResponse::notFound(
                'Booking not found.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::serverError(
                'Unable to fetch booking.'
            );
        }
    }

    /**
     * Update the specified booking.
     */
    public function update(
        UpdateBookingRequest $request,
        int|string $id
    ): JsonResponse {
        try {
            $booking = $this->bookingService->update(
                $id,
                $request->validated()
            );

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to update booking.'
            );
        }
    }

    /**
     * Delete the specified booking.
     */
    public function destroy(int|string $id): JsonResponse
    {
        try {
            $this->bookingService->delete($id);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to delete booking.'
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
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $results = $this->bookingService->search(
                $request->input('search', ''),
                (int) $request->input('per_page', 15),
                $request->only([
                    'status',
                    'payment_status',
                    'booking_type',
                    'source',
                    'property_id',
                    'apartment_id',
                    'unit_id',
                    'customer_id',
                    'tenant_id',
                    'start_date',
                    'end_date',
                ])
            );

            $results->through(
                fn ($booking) => new BookingResource($booking)
            );

            return ApiResponse::paginated(
                $results,
                'Bookings search completed successfully.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::serverError(
                'Unable to search bookings.'
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
     */
    public function statistics(Request $request): JsonResponse
    {
        try {
            $statistics = $this->bookingService->getStatistics(
                $request->only([
                    'start_date',
                    'end_date',
                    'property_id',
                    'apartment_id',
                    'unit_id',
                    'booking_type',
                    'source',
                ])
            );

            return ApiResponse::success(
                $statistics,
                'Booking statistics fetched successfully.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::serverError(
                'Unable to fetch booking statistics.'
            );
        }
    }

    /**
     * Generate booking report.
     */
    public function reports(Request $request): JsonResponse
    {
        try {
            $report = $this->bookingService->getReport(
                $request->only([
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
                ])
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
            report($e);

            return ApiResponse::serverError(
                'Unable to generate booking report.'
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
    public function pending(Request $request): JsonResponse
    {
        return $this->statusList(
            'pending',
            $request
        );
    }

    /**
     * Display confirmed bookings.
     */
    public function confirmed(Request $request): JsonResponse
    {
        return $this->statusList(
            'confirmed',
            $request
        );
    }

    /**
     * Display active bookings.
     */
    public function active(Request $request): JsonResponse
    {
        try {
            $bookings = $this->bookingService->getActive(
                (int) $request->input('per_page', 15),
                $request->only([
                    'property_id',
                    'apartment_id',
                    'unit_id',
                    'customer_id',
                    'tenant_id',
                    'start_date',
                    'end_date',
                ])
            );

            $bookings->through(
                fn ($booking) => new BookingResource($booking)
            );

            return ApiResponse::paginated(
                $bookings,
                'Active bookings fetched successfully.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::serverError(
                'Unable to fetch active bookings.'
            );
        }
    }

    /**
     * Display completed bookings.
     */
    public function completed(Request $request): JsonResponse
    {
        return $this->statusList(
            'completed',
            $request
        );
    }

    /**
     * Display cancelled bookings.
     */
    public function cancelled(Request $request): JsonResponse
    {
        return $this->statusList(
            'cancelled',
            $request
        );
    }

    /**
     * Display expired bookings.
     */
    public function expired(Request $request): JsonResponse
    {
        return $this->statusList(
            'expired',
            $request
        );
    }

    /**
     * Display rejected bookings.
     */
    public function rejected(Request $request): JsonResponse
    {
        return $this->statusList(
            'rejected',
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
                (int) $request->input('per_page', 15),
                $request->only([
                    'search',
                    'payment_status',
                    'booking_type',
                    'source',
                    'property_id',
                    'apartment_id',
                    'unit_id',
                    'customer_id',
                    'tenant_id',
                    'start_date',
                    'end_date',
                ])
            );

            $bookings->through(
                fn ($booking) => new BookingResource($booking)
            );

            return ApiResponse::paginated(
                $bookings,
                ucfirst($status) . ' bookings fetched successfully.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::serverError(
                "Unable to fetch {$status} bookings."
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
    public function confirm(int|string $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->confirm($id);

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to confirm booking.'
            );
        }
    }

    /**
     * Approve a booking.
     */
    public function approve(int|string $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->approve($id);

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to approve booking.'
            );
        }
    }

    /**
     * Check in a booking.
     */
    public function checkIn(int|string $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->checkIn($id);

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to check in booking.'
            );
        }
    }

    /**
     * Complete a booking.
     */
    public function complete(int|string $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->complete($id);

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to complete booking.'
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
                $id,
                $request->validated()
            );

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to cancel booking.'
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
                $id,
                $validated['rejection_reason']
            );

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to reject booking.'
            );
        }
    }

    /**
     * Expire a booking.
     */
    public function expire(int|string $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->expire($id);

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to expire booking.'
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
     */
    public function availableUnits(Request $request): JsonResponse
    {
        try {
            $units = $this->bookingService->getAvailableUnits(
                $request->only([
                    'property_id',
                    'apartment_id',
                    'start_date',
                    'end_date',
                    'booking_id',
                ])
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
            report($e);

            return ApiResponse::serverError(
                'Unable to fetch available units.'
            );
        }
    }

    /**
     * Get users eligible to make bookings.
     */
    public function availableUsers(Request $request): JsonResponse
    {
        try {
            $users = $this->bookingService->getAvailableUsers(
                $request->input('search')
            );

            return ApiResponse::collection(
                $users,
                'Available booking users fetched successfully.'
            );
        } catch (Throwable $e) {
            report($e);

            return ApiResponse::serverError(
                'Unable to fetch available booking users.'
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
    public function restore(int|string $id): JsonResponse
    {
        try {
            $booking = $this->bookingService->restore($id);

            $booking->load([
                'user',
                'customer',
                'tenant.user',
                'property',
                'apartment',
                'unit',
                'tenancy',
            ]);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to restore booking.'
            );
        }
    }

    /**
     * Permanently delete a booking.
     */
    public function forceDelete(int|string $id): JsonResponse
    {
        try {
            $this->bookingService->forceDelete($id);

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
            report($e);

            return ApiResponse::serverError(
                'Unable to permanently delete booking.'
            );
        }
    }
}