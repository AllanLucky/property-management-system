<?php

namespace App\Http\Controllers\Api\Lease;

use App\Helpers\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\Lease\CreateLeaseRequest;
use App\Http\Requests\Lease\UpdateLeaseRequest;
use App\Http\Resources\LeaseResource;
use App\Models\Lease;
use App\Services\LeaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Throwable;

class LeaseController extends Controller
{
    /**
     * LeaseController constructor.
     */
    public function __construct(
        protected LeaseService $leaseService
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    /**
     * Display a paginated listing of leases.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $leases = $this->leaseService->getAll(
                $request->all()
            );

            $leases->through(
                fn (Lease $lease) => new LeaseResource($lease)
            );

            return ApiResponse::paginated(
                $leases,
                'Leases fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch leases.',
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
     * Search and filter leases.
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $leases = $this->leaseService->search(
                $request->all()
            );

            $leases->through(
                fn (Lease $lease) => new LeaseResource($lease)
            );

            return ApiResponse::paginated(
                $leases,
                'Lease search completed successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to search leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    /**
     * Display the specified lease.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $lease = $this->leaseService->findOrFail($id);

            $this->authorize('view', $lease);

            return ApiResponse::success(
                new LeaseResource($lease),
                'Lease fetched successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to fetch lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BY LEASE NUMBER
    |--------------------------------------------------------------------------
    */

    /**
     * Find a lease by its lease number.
     */
    public function showByLeaseNumber(string $leaseNumber): JsonResponse
    {
        try {
            $lease = $this->leaseService->findByLeaseNumber(
                $leaseNumber
            );

            if (!$lease) {
                return ApiResponse::notFound(
                    'Lease not found.'
                );
            }

            $this->authorize('view', $lease);

            return ApiResponse::success(
                new LeaseResource($lease),
                'Lease fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new lease.
     */
    public function store(CreateLeaseRequest $request): JsonResponse
    {
        try {
            $this->authorize('create', Lease::class);

            $lease = $this->leaseService->create(
                $request->validatedData()
            );

            return ApiResponse::created(
                new LeaseResource($lease),
                'Lease created successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to create lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to create lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    /**
     * Update the specified lease.
     */
    public function update(
        UpdateLeaseRequest $request,
        int $id
    ): JsonResponse {
        try {
            $lease = $this->leaseService->findOrFail($id);

            $this->authorize('update', $lease);

            $lease = $this->leaseService->update(
                $lease,
                $request->validatedData()
            );

            return ApiResponse::updated(
                new LeaseResource($lease),
                'Lease updated successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to update lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to update lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete the specified lease.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $lease = $this->leaseService->findOrFail($id);

            $this->authorize('delete', $lease);

            $this->leaseService->delete($lease);

            return ApiResponse::deleted(
                'Lease deleted successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to delete lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to delete lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft-deleted lease.
     */
    public function restore(int $id): JsonResponse
    {
        try {
            $lease = Lease::withTrashed()->find($id);

            if (!$lease) {
                return ApiResponse::notFound(
                    'Lease not found.'
                );
            }

            $this->authorize('restore', $lease);

            $this->leaseService->restore($lease);

            $lease = $this->leaseService->findOrFail($id);

            return ApiResponse::success(
                new LeaseResource($lease),
                'Lease restored successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to restore lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to restore lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a lease.
     */
    public function forceDelete(int $id): JsonResponse
    {
        try {
            $lease = Lease::withTrashed()->find($id);

            if (!$lease) {
                return ApiResponse::notFound(
                    'Lease not found.'
                );
            }

            $this->authorize('forceDelete', $lease);

            $this->leaseService->forceDelete($lease);

            return ApiResponse::deleted(
                'Lease permanently deleted successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to permanently delete lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to permanently delete lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | BY TENANCY
    |--------------------------------------------------------------------------
    */

    /**
     * Get all leases belonging to a tenancy.
     */
    public function byTenancy(int $tenancyId): JsonResponse
    {
        try {
            $leases = $this->leaseService->getByTenancy(
                $tenancyId
            );

            return ApiResponse::success(
                LeaseResource::collection($leases),
                'Tenancy leases fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch tenancy leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE
    |--------------------------------------------------------------------------
    */

    /**
     * Get all active leases.
     */
    public function active(): JsonResponse
    {
        try {
            $leases = $this->leaseService->getActive();

            return ApiResponse::success(
                LeaseResource::collection($leases),
                'Active leases fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch active leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DRAFT
    |--------------------------------------------------------------------------
    */

    /**
     * Get all draft leases.
     */
    public function draft(): JsonResponse
    {
        try {
            $leases = $this->leaseService->getDraft();

            return ApiResponse::success(
                LeaseResource::collection($leases),
                'Draft leases fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch draft leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PENDING
    |--------------------------------------------------------------------------
    */

    /**
     * Get all pending leases.
     */
    public function pending(): JsonResponse
    {
        try {
            $leases = $this->leaseService->getPending();

            return ApiResponse::success(
                LeaseResource::collection($leases),
                'Pending leases fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch pending leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EXPIRED
    |--------------------------------------------------------------------------
    */

    /**
     * Get all expired leases.
     */
    public function expired(): JsonResponse
    {
        try {
            $leases = $this->leaseService->getExpired();

            return ApiResponse::success(
                LeaseResource::collection($leases),
                'Expired leases fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch expired leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TERMINATED
    |--------------------------------------------------------------------------
    */

    /**
     * Get all terminated leases.
     */
    public function terminated(): JsonResponse
    {
        try {
            $leases = $this->leaseService->getTerminated();

            return ApiResponse::success(
                LeaseResource::collection($leases),
                'Terminated leases fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch terminated leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CANCELLED
    |--------------------------------------------------------------------------
    */

    /**
     * Get all cancelled leases.
     */
    public function cancelled(): JsonResponse
    {
        try {
            $leases = $this->leaseService->getCancelled();

            return ApiResponse::success(
                LeaseResource::collection($leases),
                'Cancelled leases fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch cancelled leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EXPIRING
    |--------------------------------------------------------------------------
    */

    /**
     * Get leases expiring between two dates.
     */
    public function expiring(Request $request): JsonResponse
    {
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
            ]);

            $leases = $this->leaseService->getExpiringBetween(
                $validated['start_date'],
                $validated['end_date']
            );

            return ApiResponse::success(
                LeaseResource::collection($leases),
                'Expiring leases fetched successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Invalid expiration date range.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch expiring leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | UPCOMING
    |--------------------------------------------------------------------------
    */

    /**
     * Get upcoming leases.
     */
    public function upcoming(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date' => [
                    'nullable',
                    'date',
                ],
            ]);

            $leases = $this->leaseService->getUpcoming(
                $validated['date'] ?? null
            );

            return ApiResponse::success(
                LeaseResource::collection($leases),
                'Upcoming leases fetched successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Invalid upcoming lease date.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch upcoming leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get lease statistics.
     */
    public function statistics(): JsonResponse
    {
        try {
            $statistics = $this->leaseService->getStatistics();

            return ApiResponse::success(
                $statistics,
                'Lease statistics fetched successfully.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to fetch lease statistics.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a lease.
     */
    public function activate(int $id): JsonResponse
    {
        try {
            $lease = $this->leaseService->findOrFail($id);

            $this->authorize('activate', $lease);

            $lease = $this->leaseService->activate($lease);

            return ApiResponse::updated(
                new LeaseResource($lease),
                'Lease activated successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to activate lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to activate lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SET PENDING
    |--------------------------------------------------------------------------
    */

    /**
     * Move a lease to pending status.
     */
    public function setPending(int $id): JsonResponse
    {
        try {
            $lease = $this->leaseService->findOrFail($id);

            $this->authorize('setPending', $lease);

            $lease = $this->leaseService->setPending($lease);

            return ApiResponse::updated(
                new LeaseResource($lease),
                'Lease moved to pending successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to move lease to pending.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to move lease to pending.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | SET DRAFT
    |--------------------------------------------------------------------------
    */

    /**
     * Move a lease to draft status.
     */
    public function setDraft(int $id): JsonResponse
    {
        try {
            $lease = $this->leaseService->findOrFail($id);

            $this->authorize('setDraft', $lease);

            $lease = $this->leaseService->setDraft($lease);

            return ApiResponse::updated(
                new LeaseResource($lease),
                'Lease moved to draft successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to move lease to draft.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to move lease to draft.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | EXPIRE
    |--------------------------------------------------------------------------
    */

    /**
     * Mark a lease as expired.
     */
    public function expire(int $id): JsonResponse
    {
        try {
            $lease = $this->leaseService->findOrFail($id);

            $this->authorize('expire', $lease);

            $lease = $this->leaseService->expire($lease);

            return ApiResponse::updated(
                new LeaseResource($lease),
                'Lease expired successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to expire lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to expire lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | TERMINATE
    |--------------------------------------------------------------------------
    */

    /**
     * Terminate an active lease.
     */
    public function terminate(
        Request $request,
        int $id
    ): JsonResponse {
        try {
            $lease = $this->leaseService->findOrFail($id);

            $this->authorize('terminate', $lease);

            $validated = $request->validate([
                'reason' => [
                    'nullable',
                    'string',
                    'max:5000',
                ],
            ]);

            $lease = $this->leaseService->terminate(
                $lease,
                $validated['reason'] ?? null
            );

            return ApiResponse::updated(
                new LeaseResource($lease),
                'Lease terminated successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to terminate lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to terminate lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CANCEL
    |--------------------------------------------------------------------------
    */

    /**
     * Cancel a lease.
     */
    public function cancel(int $id): JsonResponse
    {
        try {
            $lease = $this->leaseService->findOrFail($id);

            $this->authorize('cancel', $lease);

            $lease = $this->leaseService->cancel($lease);

            return ApiResponse::updated(
                new LeaseResource($lease),
                'Lease cancelled successfully.'
            );
        } catch (ValidationException $e) {
            return ApiResponse::validation(
                $e->errors(),
                'Unable to cancel lease.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to cancel lease.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | AUTO EXPIRE
    |--------------------------------------------------------------------------
    */

    /**
     * Expire all active leases whose end date has passed.
     *
     * This endpoint is intended for administrative/system use.
     */
    public function expireEnded(): JsonResponse
    {
        try {
            $count = $this->leaseService->expireEndedLeases();

            return ApiResponse::success(
                [
                    'expired_count' => $count,
                ],
                $count > 0
                    ? "{$count} lease(s) expired successfully."
                    : 'No leases required expiration.'
            );
        } catch (Throwable $e) {
            return $this->serverError(
                'Unable to expire ended leases.',
                $e
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE RESPONSE HELPERS
    |--------------------------------------------------------------------------
    */

    /**
     * Return a standardized server error response.
     */
    protected function serverError(
        string $message,
        Throwable $exception
    ): JsonResponse {
        return ApiResponse::serverError(
            $message,
            config('app.debug')
                ? [
                    'message' => $exception->getMessage(),
                    'file' => $exception->getFile(),
                    'line' => $exception->getLine(),
                ]
                : null
        );
    }
}