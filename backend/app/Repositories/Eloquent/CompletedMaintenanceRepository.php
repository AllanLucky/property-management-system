<?php

namespace App\Repositories\Eloquent;

use App\Models\MaintenanceRequest;
use App\Repositories\Interfaces\CompletedMaintenanceRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class CompletedMaintenanceRepository implements CompletedMaintenanceRepositoryInterface
{
    /**
     * Allowed columns for sorting completed maintenance records.
     */
    protected array $sortable = [
        'id',
        'reference',
        'completed_at',
        'total_cost',
        'created_at',
        'updated_at',
    ];

    /**
     * Maximum pagination limit.
     */
    protected int $maxPerPage = 100;

    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    /**
     * Get the base query for completed maintenance requests.
     *
     * Eager-load all relationships required by CompletedMaintenanceResource.
     *
     * Important:
     * - Tenant belongs to User through tenant.user.
     * - Technician is directly represented by the User model.
     * - Checklist completer belongs to User through completedBy.
     * - Attachment uploader belongs to User through uploader.
     */
    protected function baseQuery(): Builder
    {
        return MaintenanceRequest::query()
            ->where('status', MaintenanceRequest::STATUS_COMPLETED)
            ->with([
                'property',
                'apartment',
                'unit',

                'tenant.user',

                'category',

                'latestAssignment.technician',

                'assignments.technician',

                'updates.user',

                'checklists.completedBy',

                'expenses',

                'attachments.uploader',
            ]);
    }

    /**
     * Normalize pagination limits.
     */
    protected function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, $this->maxPerPage));
    }

    /**
     * Check whether a filter has a usable value.
     */
    protected function hasFilter(array $filters, string $key): bool
    {
        return array_key_exists($key, $filters)
            && $filters[$key] !== null
            && $filters[$key] !== '';
    }

    /*
    |--------------------------------------------------------------------------
    | BASIC RETRIEVAL
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve all completed maintenance requests.
     */
    public function all(): Collection
    {
        return $this->baseQuery()
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Retrieve paginated completed maintenance requests.
     */
    public function paginate(int $perPage = 20): LengthAwarePaginator
    {
        return $this->baseQuery()
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->paginate($this->normalizePerPage($perPage));
    }

    /**
     * Find a completed maintenance request by ID.
     */
    public function find(int $id): ?MaintenanceRequest
    {
        return $this->baseQuery()->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERING AND SEARCH
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve filtered and paginated completed maintenance requests.
     */
    public function filter(
        array $filters,
        int $perPage = 20
    ): LengthAwarePaginator {
        $query = $this->baseQuery();

        $this->applyFilters($query, $filters);

        $sortBy = $filters['sort_by'] ?? 'completed_at';

        if (!in_array($sortBy, $this->sortable, true)) {
            $sortBy = 'completed_at';
        }

        $direction = strtolower(
            (string) ($filters['sort_direction'] ?? 'desc')
        );

        $direction = $direction === 'asc' ? 'asc' : 'desc';

        return $query
            ->orderBy($sortBy, $direction)
            ->orderByDesc('id')
            ->paginate($this->normalizePerPage($perPage))
            ->withQueryString();
    }

    /**
     * Apply search and filtering constraints.
     */
    protected function applyFilters(
        Builder $query,
        array $filters
    ): Builder {
        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($this->hasFilter($filters, 'search')) {
            $search = trim((string) $filters['search']);

            if ($search !== '') {
                $query->where(function (Builder $subQuery) use ($search) {
                    $subQuery
                        ->where('reference', 'like', "%{$search}%")
                        ->orWhere('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }
        }

        /*
        |--------------------------------------------------------------------------
        | PROPERTY FILTER
        |--------------------------------------------------------------------------
        */

        if ($this->hasFilter($filters, 'property_id')) {
            $query->where(
                'property_id',
                $filters['property_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | APARTMENT FILTER
        |--------------------------------------------------------------------------
        */

        if ($this->hasFilter($filters, 'apartment_id')) {
            $query->where(
                'apartment_id',
                $filters['apartment_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UNIT FILTER
        |--------------------------------------------------------------------------
        */

        if ($this->hasFilter($filters, 'unit_id')) {
            $query->where(
                'unit_id',
                $filters['unit_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | TECHNICIAN FILTER
        |--------------------------------------------------------------------------
        |
        | Technicians are represented by User records and are associated
        | with maintenance requests through maintenance assignments.
        |
        */

        if ($this->hasFilter($filters, 'technician_id')) {
            $technicianId = (int) $filters['technician_id'];

            $query->whereHas(
                'assignments',
                function (Builder $assignmentQuery) use ($technicianId) {
                    $assignmentQuery
                        ->where('technician_id', $technicianId)
                        ->where('status', 'completed');
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CATEGORY FILTER
        |--------------------------------------------------------------------------
        */

        if ($this->hasFilter($filters, 'category_id')) {
            $query->where(
                'category_id',
                $filters['category_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | COMPLETION DATE FILTERS
        |--------------------------------------------------------------------------
        */

        if ($this->hasFilter($filters, 'date_from')) {
            $dateFrom = Carbon::parse($filters['date_from'])
                ->startOfDay();

            $query->where(
                'completed_at',
                '>=',
                $dateFrom
            );
        }

        if ($this->hasFilter($filters, 'date_to')) {
            $dateTo = Carbon::parse($filters['date_to'])
                ->endOfDay();

            $query->where(
                'completed_at',
                '<=',
                $dateTo
            );
        }

        /*
        |--------------------------------------------------------------------------
        | FINANCIAL FILTERS
        |--------------------------------------------------------------------------
        */

        if ($this->hasFilter($filters, 'min_cost')) {
            $query->where(
                'total_cost',
                '>=',
                $filters['min_cost']
            );
        }

        if ($this->hasFilter($filters, 'max_cost')) {
            $query->where(
                'total_cost',
                '<=',
                $filters['max_cost']
            );
        }

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | RELATIONSHIP QUERIES
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance requests handled by a technician.
     */
    public function findByTechnician(int $technicianId): Collection
    {
        return $this->baseQuery()
            ->whereHas(
                'assignments',
                function (Builder $query) use ($technicianId) {
                    $query
                        ->where('technician_id', $technicianId)
                        ->where('status', 'completed');
                }
            )
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Retrieve completed maintenance requests for a property.
     */
    public function findByProperty(int $propertyId): Collection
    {
        return $this->baseQuery()
            ->where('property_id', $propertyId)
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Retrieve completed maintenance requests for a unit.
     */
    public function findByUnit(int $unitId): Collection
    {
        return $this->baseQuery()
            ->where('unit_id', $unitId)
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Retrieve completed maintenance requests for a category.
     */
    public function findByCategory(int $categoryId): Collection
    {
        return $this->baseQuery()
            ->where('category_id', $categoryId)
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | COMPLETION HISTORY
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance requests within a date range.
     */
    public function completedBetween(
        string $startDate,
        string $endDate
    ): Collection {
        $start = Carbon::parse($startDate)->startOfDay();
        $end = Carbon::parse($endDate)->endOfDay();

        if ($start->gt($end)) {
            throw new \InvalidArgumentException(
                'The start date cannot be later than the end date.'
            );
        }

        return $this->baseQuery()
            ->whereBetween('completed_at', [$start, $end])
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->get();
    }

    /**
     * Retrieve recently completed maintenance requests.
     */
    public function recentlyCompleted(int $limit = 10): Collection
    {
        $limit = max(1, min($limit, $this->maxPerPage));

        return $this->baseQuery()
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | FINANCIAL QUERIES
    |--------------------------------------------------------------------------
    |
    | total_cost on maintenance_requests is treated as the authoritative
    | final maintenance cost.
    |
    | Assignment actual_cost and maintenance expenses are not added here
    | because they may already be included in total_cost.
    |
    */

    /**
     * Calculate the total maintenance cost.
     */
    public function totalMaintenanceCost(array $filters = []): float
    {
        $query = MaintenanceRequest::query()
            ->where('status', MaintenanceRequest::STATUS_COMPLETED);

        $this->applyFilters($query, $filters);

        return (float) $query->sum('total_cost');
    }

    /**
     * Calculate the average maintenance cost.
     */
    public function averageMaintenanceCost(array $filters = []): float
    {
        $query = MaintenanceRequest::query()
            ->where('status', MaintenanceRequest::STATUS_COMPLETED);

        $this->applyFilters($query, $filters);

        return (float) ($query->avg('total_cost') ?? 0);
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Retrieve completed maintenance statistics.
     */
    public function statistics(array $filters = []): array
    {
        $query = MaintenanceRequest::query()
            ->where('status', MaintenanceRequest::STATUS_COMPLETED);

        $this->applyFilters($query, $filters);

        return [
            /*
            |--------------------------------------------------------------------------
            | GENERAL STATISTICS
            |--------------------------------------------------------------------------
            */

            'total' => (clone $query)->count(),

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL STATISTICS
            |--------------------------------------------------------------------------
            */

            'total_cost' => (float) (
                (clone $query)->sum('total_cost')
            ),

            'average_cost' => (float) (
                (clone $query)->avg('total_cost') ?? 0
            ),

            'highest_cost' => (float) (
                (clone $query)->max('total_cost') ?? 0
            ),

            'lowest_cost' => (float) (
                (clone $query)->min('total_cost') ?? 0
            ),

            /*
            |--------------------------------------------------------------------------
            | COMPLETION PERIOD STATISTICS
            |--------------------------------------------------------------------------
            */

            'completed_today' => (clone $query)
                ->whereDate('completed_at', today())
                ->count(),

            'completed_this_week' => (clone $query)
                ->whereBetween('completed_at', [
                    now()->startOfWeek(),
                    now()->endOfWeek(),
                ])
                ->count(),

            'completed_this_month' => (clone $query)
                ->whereMonth('completed_at', now()->month)
                ->whereYear('completed_at', now()->year)
                ->count(),

            'completed_this_year' => (clone $query)
                ->whereYear('completed_at', now()->year)
                ->count(),
        ];
    }
}
