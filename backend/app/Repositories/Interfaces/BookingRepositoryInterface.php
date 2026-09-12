<?php

namespace App\Repositories\Interfaces;

use App\Models\Booking;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface BookingRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | CRUD
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated bookings.
     *
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function paginate(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Find a booking by ID.
     *
     * @param int $id
     * @return Booking|null
     */
    public function find(int $id): ?Booking;

    /**
     * Find a booking by ID or fail.
     *
     * @param int $id
     * @return Booking
     *
     * @throws \Illuminate\Database\Eloquent\ModelNotFoundException
     */
    public function findOrFail(int $id): Booking;

    /**
     * Create a new booking.
     *
     * @param array $data
     * @return Booking
     */
    public function create(array $data): Booking;

    /**
     * Update an existing booking.
     *
     * @param Booking $booking
     * @param array   $data
     * @return Booking
     */
    public function update(
        Booking $booking,
        array $data
    ): Booking;

    /**
     * Soft delete a booking.
     *
     * @param Booking $booking
     * @return bool
     */
    public function delete(Booking $booking): bool;

    /**
     * Restore a soft-deleted booking.
     *
     * @param Booking $booking
     * @return bool
     */
    public function restore(Booking $booking): bool;

    /**
     * Permanently delete a booking.
     *
     * @param Booking $booking
     * @return bool
     */
    public function forceDelete(Booking $booking): bool;

    /*
    |--------------------------------------------------------------------------
    | FINDERS
    |--------------------------------------------------------------------------
    */

    /**
     * Find a booking by booking number.
     *
     * @param string $bookingNumber
     * @return Booking|null
     */
    public function findByBookingNumber(
        string $bookingNumber
    ): ?Booking;

    /**
     * Find a booking by reference.
     *
     * @param string $reference
     * @return Booking|null
     */
    public function findByReference(
        string $reference
    ): ?Booking;

    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Search bookings.
     *
     * Additional filters may include:
     * - status
     * - payment_status
     * - booking_type
     * - source
     * - property_id
     * - apartment_id
     * - unit_id
     * - customer_id
     * - tenant_id
     * - start_date
     * - end_date
     *
     * @param string $query
     * @param int    $perPage
     * @param array  $filters
     * @return LengthAwarePaginator
     */
    public function search(
        string $query,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Get bookings by status.
     *
     * @param string $status
     * @param int    $perPage
     * @param array  $filters
     * @return LengthAwarePaginator
     */
    public function getByStatus(
        string $status,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get bookings by payment status.
     *
     * @param string $paymentStatus
     * @param int    $perPage
     * @param array  $filters
     * @return LengthAwarePaginator
     */
    public function getByPaymentStatus(
        string $paymentStatus,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get pending bookings.
     *
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getPending(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get confirmed bookings.
     *
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getConfirmed(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get active bookings.
     *
     * Active bookings are normally confirmed/approved bookings
     * within their booking period.
     *
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getActive(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get completed bookings.
     *
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getCompleted(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get cancelled bookings.
     *
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getCancelled(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get rejected bookings.
     *
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getRejected(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get expired bookings.
     *
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getExpired(
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get bookings whose end date has passed
     * but which have not yet been marked expired.
     *
     * @return Collection
     */
    public function getEndedBookings(): Collection;

    /*
    |--------------------------------------------------------------------------
    | RELATION FILTERS
    |--------------------------------------------------------------------------
    */

    /**
     * Get bookings belonging to a specific unit.
     *
     * @param int   $unitId
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getByUnit(
        int $unitId,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get bookings belonging to a specific customer.
     *
     * @param int   $customerId
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getByCustomer(
        int $customerId,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get bookings belonging to a specific tenant.
     *
     * @param int   $tenantId
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getByTenant(
        int $tenantId,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get bookings belonging to a specific property.
     *
     * @param int   $propertyId
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getByProperty(
        int $propertyId,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /**
     * Get bookings belonging to a specific apartment.
     *
     * @param int   $apartmentId
     * @param int   $perPage
     * @param array $filters
     * @return LengthAwarePaginator
     */
    public function getByApartment(
        int $apartmentId,
        int $perPage = 15,
        array $filters = []
    ): LengthAwarePaginator;

    /*
    |--------------------------------------------------------------------------
    | AVAILABILITY
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a unit has an overlapping booking.
     *
     * Overlapping logic:
     *
     * existing_start <= requested_end
     * AND
     * existing_end >= requested_start
     *
     * Cancelled, rejected and expired bookings should not
     * normally block availability.
     *
     * @param int         $unitId
     * @param string      $startDate
     * @param string      $endDate
     * @param int|null    $exceptBookingId
     * @return bool
     */
    public function hasOverlappingBooking(
        int $unitId,
        string $startDate,
        string $endDate,
        ?int $exceptBookingId = null
    ): bool;

    /**
     * Get units available for a booking period.
     *
     * @param string   $startDate
     * @param string   $endDate
     * @param int|null $propertyId
     * @param int|null $apartmentId
     * @param int|null $exceptBookingId
     * @return Collection
     */
    public function getAvailableUnits(
        string $startDate,
        string $endDate,
        ?int $propertyId = null,
        ?int $apartmentId = null,
        ?int $exceptBookingId = null
    ): Collection;

    /*
    |--------------------------------------------------------------------------
    | USERS
    |--------------------------------------------------------------------------
    */

    /**
     * Get active users eligible to make bookings.
     *
     * @param string|null $search
     * @return Collection
     */
    public function getAvailableUsers(
        ?string $search = null
    ): Collection;

    /*
    |--------------------------------------------------------------------------
    | DATE RANGE
    |--------------------------------------------------------------------------
    */

    /**
     * Get bookings overlapping a date range.
     *
     * @param string $startDate
     * @param string $endDate
     * @param array  $filters
     * @return Collection
     */
    public function getByDateRange(
        string $startDate,
        string $endDate,
        array $filters = []
    ): Collection;

    /*
    |--------------------------------------------------------------------------
    | REPORTING
    |--------------------------------------------------------------------------
    */

    /**
     * Get booking report data.
     *
     * @param array $filters
     * @return array
     */
    public function getReport(
        array $filters = []
    ): array;

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get booking statistics.
     *
     * @param array $filters
     * @return array
     */
    public function getStatistics(
        array $filters = []
    ): array;
}