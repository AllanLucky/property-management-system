<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Interfaces\PlotRepositoryInterface;
use App\Models\Plot;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

class PlotRepository implements PlotRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | Model
    |--------------------------------------------------------------------------
    */

    protected Plot $model;

    /**
     * Create a new repository instance.
     */
    public function __construct(Plot $model)
    {
        $this->model = $model;
    }

    /*
    |--------------------------------------------------------------------------
    | Plot Retrieval
    |--------------------------------------------------------------------------
    */

    /**
     * Get all plots.
     *
     * @param array<string, mixed> $filters
     * @return Collection<int, Plot>|LengthAwarePaginator
     */
    public function getAll(array $filters = []): Collection|LengthAwarePaginator
    {
        $query = $this->buildQuery($filters);

        if ($this->shouldPaginate($filters)) {
            return $query->paginate(
                $this->getPerPage($filters)
            )->withQueryString();
        }

        return $query->get();
    }

    /**
     * Get paginated plots.
     *
     * @param array<string, mixed> $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function paginate(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        $perPage = max(1, min($perPage, 100));

        return $this->buildQuery($filters)
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Find a plot by ID.
     */
    public function findById(int|string $id): ?Plot
    {
        return $this->buildQuery([
            'include_deleted' => false,
        ])->find($id);
    }

    /**
     * Find a plot or throw an exception.
     */
    public function findOrFail(int|string $id): Plot
    {
        return $this->buildQuery([
            'include_deleted' => false,
        ])->findOrFail($id);
    }

    /**
     * Find a plot by code.
     */
    public function findByCode(string $code): ?Plot
    {
        return $this->model
            ->newQuery()
            ->where('code', $code)
            ->first();
    }

    /**
     * Find a plot by title number.
     */
    public function findByTitleNumber(string $titleNumber): ?Plot
    {
        return $this->model
            ->newQuery()
            ->where('title_number', $titleNumber)
            ->first();
    }

    /**
     * Search plots by keyword and filters.
     */
    public function search(
        string $search,
        array $filters = []
    ): LengthAwarePaginator {
        $filters['search'] = $search;

        return $this->buildQuery($filters)
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Plot Creation, Updates, and Deletion
    |--------------------------------------------------------------------------
    */

    /**
     * Create a plot.
     */
    public function create(array $data): Plot
    {
        return DB::transaction(function () use ($data): Plot {
            $plot = $this->model->newInstance();

            $plot->fill($data);
            $plot->save();

            return $plot->fresh($this->defaultRelations());
        });
    }

    /**
     * Update a plot.
     */
    public function update(Plot $plot, array $data): Plot
    {
        return DB::transaction(function () use ($plot, $data): Plot {
            $plot->fill($data);
            $plot->save();

            return $plot->fresh($this->defaultRelations());
        });
    }

    /**
     * Soft delete a plot.
     */
    public function delete(Plot $plot): bool
    {
        return DB::transaction(function () use ($plot): bool {
            return (bool) $plot->delete();
        });
    }

    /**
     * Restore a soft-deleted plot.
     */
    public function restore(int|string $id): Plot
    {
        return DB::transaction(function () use ($id): Plot {
            $plot = $this->model
                ->newQuery()
                ->withTrashed()
                ->findOrFail($id);

            $plot->restore();

            return $plot->fresh($this->defaultRelations());
        });
    }

    /**
     * Permanently delete a plot.
     */
    public function forceDelete(int|string $id): bool
    {
        return DB::transaction(function () use ($id): bool {
            $plot = $this->model
                ->newQuery()
                ->withTrashed()
                ->findOrFail($id);

            return (bool) $plot->forceDelete();
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Plot Status and Availability
    |--------------------------------------------------------------------------
    */

    /**
     * Get available plots.
     */
    public function getAvailable(
        array $filters = []
    ): LengthAwarePaginator {
        $filters['status'] = 'available';
        $filters['is_active'] = true;

        return $this->buildQuery($filters)
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /**
     * Get plots by status.
     */
    public function getByStatus(
        string $status,
        array $filters = []
    ): LengthAwarePaginator {
        $filters['status'] = $status;

        return $this->buildQuery($filters)
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /**
     * Update plot status.
     */
    public function updateStatus(
        Plot $plot,
        string $status
    ): Plot {
        return DB::transaction(function () use ($plot, $status): Plot {
            $plot->status = $status;
            $plot->save();

            return $plot->fresh($this->defaultRelations());
        });
    }

    /**
     * Check whether a plot is available.
     */
    public function isAvailable(int|string $id): bool
    {
        $plot = $this->model
            ->newQuery()
            ->find($id);

        if (!$plot) {
            return false;
        }

        return $plot->isAvailable();
    }

    /*
    |--------------------------------------------------------------------------
    | Location-Based Retrieval
    |--------------------------------------------------------------------------
    */

    /**
     * Get plots by county.
     */
    public function getByCounty(
        int|string $countyId,
        array $filters = []
    ): LengthAwarePaginator {
        $filters['county_id'] = $countyId;

        return $this->buildQuery($filters)
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /**
     * Get plots by city.
     */
    public function getByCity(
        int|string $cityId,
        array $filters = []
    ): LengthAwarePaginator {
        $filters['city_id'] = $cityId;

        return $this->buildQuery($filters)
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /**
     * Get plots by area.
     */
    public function getByArea(
        int|string $areaId,
        array $filters = []
    ): LengthAwarePaginator {
        $filters['area_id'] = $areaId;

        return $this->buildQuery($filters)
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Statistics and Reports
    |--------------------------------------------------------------------------
    */

    /**
     * Get the base query used by statistics and reports.
     */
    public function getReportQuery(
        array $filters = []
    ): Builder {
        return $this->buildQuery($filters);
    }

    /**
     * Get aggregate plot statistics.
     *
     * These are inventory-level statistics.
     *
     * Sales and payment-specific statistics should be handled
     * by PlotService using PlotSale and PlotPayment.
     */
    public function getStatistics(
        array $filters = []
    ): array {
        $query = $this->buildQuery($filters);

        $totalPlots = (clone $query)->count();

        $availablePlots = (clone $query)
            ->where('status', 'available')
            ->count();

        $reservedPlots = (clone $query)
            ->where('status', 'reserved')
            ->count();

        $soldPlots = (clone $query)
            ->where('status', 'sold')
            ->count();

        $unavailablePlots = (clone $query)
            ->where('status', 'unavailable')
            ->count();

        $activePlots = (clone $query)
            ->where('is_active', true)
            ->count();

        $inactivePlots = (clone $query)
            ->where('is_active', false)
            ->count();

        $totalSize = (clone $query)
            ->sum('size');

        $totalAskingPrice = (clone $query)
            ->sum('asking_price');

        $averageAskingPrice = (clone $query)
            ->avg('asking_price');

        return [
            'total_plots' => $totalPlots,

            'available_plots' => $availablePlots,
            'reserved_plots' => $reservedPlots,
            'sold_plots' => $soldPlots,
            'unavailable_plots' => $unavailablePlots,

            'active_plots' => $activePlots,
            'inactive_plots' => $inactivePlots,

            'total_size' => round((float) $totalSize, 2),

            'total_asking_price' => round(
                (float) $totalAskingPrice,
                2
            ),

            'average_asking_price' => round(
                (float) ($averageAskingPrice ?? 0),
                2
            ),

            'availability_rate' => $totalPlots > 0
                ? round(
                    ($availablePlots / $totalPlots) * 100,
                    2
                )
                : 0,

            'reservation_rate' => $totalPlots > 0
                ? round(
                    ($reservedPlots / $totalPlots) * 100,
                    2
                )
                : 0,

            'sold_rate' => $totalPlots > 0
                ? round(
                    ($soldPlots / $totalPlots) * 100,
                    2
                )
                : 0,
        ];
    }

    /**
     * Get statistics grouped by status.
     */
    public function getStatusStatistics(
        array $filters = []
    ): Collection {
        return $this->buildQuery($filters)
            ->select([
                'status',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(size) as total_size'),
                DB::raw('SUM(asking_price) as total_asking_price'),
                DB::raw('AVG(asking_price) as average_asking_price'),
            ])
            ->groupBy('status')
            ->orderBy('status')
            ->get();
    }

    /**
     * Get statistics grouped by location.
     *
     * Uses county_id as the main location grouping because
     * the Plot model contains county_id directly.
     */
    public function getLocationStatistics(
        array $filters = []
    ): Collection {
        return $this->buildQuery($filters)
            ->select([
                'county_id',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(size) as total_size'),
                DB::raw('SUM(asking_price) as total_asking_price'),
                DB::raw(
                    "SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available"
                ),
                DB::raw(
                    "SUM(CASE WHEN status = 'reserved' THEN 1 ELSE 0 END) as reserved"
                ),
                DB::raw(
                    "SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold"
                ),
            ])
            ->groupBy('county_id')
            ->with('county')
            ->orderByDesc('total')
            ->get();
    }

    /**
     * Get inventory report.
     */
    public function getInventoryReport(
        array $filters = []
    ): LengthAwarePaginator {
        return $this->buildQuery($filters)
            ->paginate($this->getPerPage($filters))
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | Relationship Loading
    |--------------------------------------------------------------------------
    */

    /**
     * Load relationships required by PlotResource.
     *
     * @param array<int, string> $relations
     */
    public function loadRelations(
        Plot $plot,
        array $relations = []
    ): Plot {
        $relations = !empty($relations)
            ? $relations
            : $this->defaultRelations();

        return $plot->load($relations);
    }

    /*
    |--------------------------------------------------------------------------
    | Query Builder
    |--------------------------------------------------------------------------
    */

    /**
     * Build a filtered plot query.
     *
     * Supported filters include:
     *
     * search
     * property_id
     * country_id
     * region_id
     * county_id
     * city_id
     * area_id
     * plot_id
     * status
     * statuses
     * is_active
     * include_deleted
     * include_inactive
     * min_size
     * max_size
     * size_unit
     * min_price
     * max_price
     * currency
     * sort_by
     * sort_direction
     */
    public function buildQuery(
        array $filters = []
    ): Builder {
        $query = $this->model->newQuery();

        /*
        |--------------------------------------------------------------------------
        | Deleted Records
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['include_deleted']) &&
            filter_var(
                $filters['include_deleted'],
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->withTrashed();
        }

        /*
        |--------------------------------------------------------------------------
        | Relationships
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['include_details']) &&
            filter_var(
                $filters['include_details'],
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->with($this->defaultRelations());
        } else {
            $query->with([
                'property',
                'county',
                'city',
                'area',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | ID Filters
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['plot_id']) &&
            $filters['plot_id'] !== ''
        ) {
            $query->where(
                $this->model->getTable() . '.id',
                $filters['plot_id']
            );
        }

        if (
            isset($filters['property_id']) &&
            $filters['property_id'] !== ''
        ) {
            $query->where(
                $this->model->getTable() . '.property_id',
                $filters['property_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Location Filters
        |--------------------------------------------------------------------------
        */

        $locationFields = [
            'country_id',
            'region_id',
            'county_id',
            'city_id',
            'area_id',
        ];

        foreach ($locationFields as $field) {
            if (
                isset($filters[$field]) &&
                $filters[$field] !== ''
            ) {
                $query->where(
                    $this->model->getTable() . '.' . $field,
                    $filters[$field]
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['search']) &&
            trim((string) $filters['search']) !== ''
        ) {
            $search = trim((string) $filters['search']);

            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('title', 'like', "%{$search}%")
                    ->orWhere('title_number', 'like', "%{$search}%")
                    ->orWhere('plot_number', 'like', "%{$search}%")
                    ->orWhere('address', 'like', "%{$search}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Status Filters
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['status']) &&
            $filters['status'] !== ''
        ) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        if (
            isset($filters['statuses']) &&
            is_array($filters['statuses']) &&
            count($filters['statuses']) > 0
        ) {
            $query->whereIn(
                'status',
                $filters['statuses']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Active / Inactive
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists('is_active', $filters) &&
            $filters['is_active'] !== null &&
            $filters['is_active'] !== ''
        ) {
            $isActive = filter_var(
                $filters['is_active'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($isActive !== null) {
                $query->where(
                    'is_active',
                    $isActive
                );
            }
        } elseif (
            !isset($filters['include_inactive']) ||
            !filter_var(
                $filters['include_inactive'],
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->where('is_active', true);
        }

        /*
        |--------------------------------------------------------------------------
        | Size Filters
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['min_size']) &&
            $filters['min_size'] !== ''
        ) {
            $query->where(
                'size',
                '>=',
                $filters['min_size']
            );
        }

        if (
            isset($filters['max_size']) &&
            $filters['max_size'] !== ''
        ) {
            $query->where(
                'size',
                '<=',
                $filters['max_size']
            );
        }

        if (
            isset($filters['size_unit']) &&
            $filters['size_unit'] !== ''
        ) {
            $query->where(
                'size_unit',
                $filters['size_unit']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Price Filters
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['min_price']) &&
            $filters['min_price'] !== ''
        ) {
            $query->where(
                'asking_price',
                '>=',
                $filters['min_price']
            );
        }

        if (
            isset($filters['max_price']) &&
            $filters['max_price'] !== ''
        ) {
            $query->where(
                'asking_price',
                '<=',
                $filters['max_price']
            );
        }

        if (
            isset($filters['currency']) &&
            $filters['currency'] !== ''
        ) {
            $query->where(
                'currency',
                $filters['currency']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */

        $allowedSortColumns = [
            'id',
            'created_at',
            'updated_at',
            'code',
            'title',
            'size',
            'asking_price',
            'status',
        ];

        $sortBy = $filters['sort_by'] ?? 'created_at';

        if (!in_array($sortBy, $allowedSortColumns, true)) {
            $sortBy = 'created_at';
        }

        $sortDirection = strtolower(
            (string) ($filters['sort_direction'] ?? 'desc')
        );

        if (!in_array($sortDirection, ['asc', 'desc'], true)) {
            $sortDirection = 'desc';
        }

        $query->orderBy(
            $sortBy,
            $sortDirection
        );

        /*
        |--------------------------------------------------------------------------
        | Secondary Sorting
        |--------------------------------------------------------------------------
        */

        if ($sortBy !== 'id') {
            $query->orderByDesc('id');
        }

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | Private Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the request should be paginated.
     */
    protected function shouldPaginate(
        array $filters
    ): bool {
        if (
            !array_key_exists(
                'paginate',
                $filters
            )
        ) {
            return true;
        }

        return filter_var(
            $filters['paginate'],
            FILTER_VALIDATE_BOOLEAN
        );
    }

    /**
     * Get a safe pagination value.
     */
    protected function getPerPage(
        array $filters
    ): int {
        $perPage = (int) (
            $filters['per_page']
            ?? $filters['limit']
            ?? 15
        );

        return max(
            1,
            min($perPage, 100)
        );
    }

    /**
     * Default relationships used by the repository.
     *
     * These correspond to the relationships currently available
     * on the Plot model.
     *
     * @return array<int, string>
     */
    protected function defaultRelations(): array
    {
        return [
            'property',
            'country',
            'region',
            'county',
            'city',
            'area',
            'activeSale',
        ];
    }
}
