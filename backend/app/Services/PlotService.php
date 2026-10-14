<?php

namespace App\Services;

use App\Models\Plot;
use App\Repositories\Interfaces\PlotRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PlotService
{
    /*
    |--------------------------------------------------------------------------
    | Constants
    |--------------------------------------------------------------------------
    */

    /**
     * Supported plot statuses.
     *
     * @var array<int, string>
     */
    private const ALLOWED_STATUSES = [
        'available',
        'reserved',
        'sold',
        'unavailable',
    ];

    /*
    |--------------------------------------------------------------------------
    | Repository
    |--------------------------------------------------------------------------
    */

    protected PlotRepositoryInterface $plotRepository;

    /**
     * Create a new PlotService instance.
     */
    public function __construct(
        PlotRepositoryInterface $plotRepository
    ) {
        $this->plotRepository = $plotRepository;
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
    public function getPlots(
        array $filters = []
    ): Collection|LengthAwarePaginator {
        return $this->plotRepository->getAll($filters);
    }

    /**
     * Get paginated plots.
     *
     * @param array<string, mixed> $filters
     */
    public function paginatePlots(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->plotRepository->paginate(
            $filters,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get a plot by ID.
     */
    public function getPlot(
        int|string $id
    ): Plot {
        return $this->plotRepository->findOrFail($id);
    }

    /**
     * Find a plot by ID without throwing an exception.
     */
    public function findPlot(
        int|string $id
    ): ?Plot {
        return $this->plotRepository->findById($id);
    }

    /**
     * Find a plot by code.
     */
    public function findByCode(
        string $code
    ): ?Plot {
        return $this->plotRepository->findByCode(
            trim($code)
        );
    }

    /**
     * Find a plot by title number.
     */
    public function findByTitleNumber(
        string $titleNumber
    ): ?Plot {
        return $this->plotRepository->findByTitleNumber(
            trim($titleNumber)
        );
    }

    /**
     * Search plots.
     *
     * @param array<string, mixed> $filters
     */
    public function searchPlots(
        string $search,
        array $filters = []
    ): LengthAwarePaginator {
        $search = trim($search);

        if ($search === '') {
            throw ValidationException::withMessages([
                'search' => [
                    'Please provide a search term.',
                ],
            ]);
        }

        return $this->plotRepository->search(
            $search,
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Create Plot
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new plot.
     *
     * @param array<string, mixed> $data
     */
    public function createPlot(
        array $data
    ): Plot {
        return DB::transaction(function () use ($data): Plot {
            $data = $this->preparePlotData($data);

            /*
            |--------------------------------------------------------------------------
            | Generate Plot Code
            |--------------------------------------------------------------------------
            */

            if (
                !isset($data['code']) ||
                $data['code'] === ''
            ) {
                $data['code'] = $this->generatePlotCode();
            }

            /*
            |--------------------------------------------------------------------------
            | Default Status
            |--------------------------------------------------------------------------
            */

            $data['status'] = $data['status'] ?? 'available';

            $this->validateStatus($data['status']);

            /*
            |--------------------------------------------------------------------------
            | Default Active State
            |--------------------------------------------------------------------------
            */

            $data['is_active'] ??= true;

            /*
            |--------------------------------------------------------------------------
            | Prevent Creating a New Plot as Sold
            |--------------------------------------------------------------------------
            |
            | Record a sale and complete the sale workflow before marking
            | a plot as sold. This avoids creating sold inventory without
            | a corresponding completed sale.
            |
            */

            if ($data['status'] === 'sold') {
                throw ValidationException::withMessages([
                    'status' => [
                        'A new plot cannot be created as sold. '
                        . 'Create the plot first and complete its sale.',
                    ],
                ]);
            }

            return $this->plotRepository->create($data);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Update Plot
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing plot.
     *
     * @param array<string, mixed> $data
     */
    public function updatePlot(
        int|string|Plot $plot,
        array $data
    ): Plot {
        return DB::transaction(function () use (
            $plot,
            $data
        ): Plot {
            $plotModel = $plot instanceof Plot
                ? $plot
                : $this->plotRepository->findOrFail($plot);

            $data = $this->preparePlotData($data);

            /*
            |--------------------------------------------------------------------------
            | Protect Business Status
            |--------------------------------------------------------------------------
            */

            $this->validateStatusChange(
                $plotModel,
                $data
            );

            /*
            |--------------------------------------------------------------------------
            | Do Not Change a Plot's Status Through General Editing
            |--------------------------------------------------------------------------
            |
            | Status changes should use updatePlotStatus() so the
            | business rules remain consistent.
            |
            */

            unset($data['status']);

            return $this->plotRepository->update(
                $plotModel,
                $data
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Delete Plot
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a plot.
     */
    public function deletePlot(
        int|string|Plot $plot
    ): bool {
        return DB::transaction(function () use ($plot): bool {
            $plotModel = $plot instanceof Plot
                ? $plot
                : $this->plotRepository->findOrFail($plot);

            /*
            |--------------------------------------------------------------------------
            | Business Protection
            |--------------------------------------------------------------------------
            */

            if (
                in_array(
                    $plotModel->status,
                    ['sold', 'reserved'],
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'This plot cannot be deleted while it is '
                        . $plotModel->status
                        . '. Resolve the sale or reservation first.',
                    ],
                ]);
            }

            if ($plotModel->sales()->exists()) {
                throw ValidationException::withMessages([
                    'plot' => [
                        'This plot has sale records and cannot be deleted. '
                        . 'Preserve the sales history and mark the plot '
                        . 'unavailable instead.',
                    ],
                ]);
            }

            return $this->plotRepository->delete($plotModel);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Restore Plot
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a deleted plot.
     */
    public function restorePlot(
        int|string $id
    ): Plot {
        return DB::transaction(function () use ($id): Plot {
            return $this->plotRepository->restore($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Force Delete
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a plot.
     *
     * Only use this when removing the plot and its associated records
     * is permitted by the application's retention rules.
     */
    public function forceDeletePlot(
        int|string $id
    ): bool {
        return DB::transaction(function () use ($id): bool {
            $plot = $this->plotRepository->findOrFail($id);

            if (
                in_array(
                    $plot->status,
                    ['sold', 'reserved'],
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'A sold or reserved plot cannot be permanently deleted.',
                    ],
                ]);
            }

            if ($plot->sales()->exists()) {
                throw ValidationException::withMessages([
                    'plot' => [
                        'This plot has sale history and cannot be '
                        . 'permanently deleted.',
                    ],
                ]);
            }

            return $this->plotRepository->forceDelete($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Availability
    |--------------------------------------------------------------------------
    */

    /**
     * Get available plots.
     *
     * @param array<string, mixed> $filters
     */
    public function getAvailablePlots(
        array $filters = []
    ): LengthAwarePaginator {
        return $this->plotRepository->getAvailable(
            $filters
        );
    }

    /**
     * Check whether a plot is available.
     */
    public function isPlotAvailable(
        int|string $id
    ): bool {
        return $this->plotRepository->isAvailable($id);
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    /**
     * Get plots by status.
     *
     * @param array<string, mixed> $filters
     */
    public function getPlotsByStatus(
        string $status,
        array $filters = []
    ): LengthAwarePaginator {
        $status = strtolower(trim($status));

        $this->validateStatus($status);

        return $this->plotRepository->getByStatus(
            $status,
            $filters
        );
    }

    /**
     * Get sold plots.
     *
     * This uses the repository's existing status-filtering method.
     *
     * @param array<string, mixed> $filters
     */
    public function getSoldPlots(
        array $filters = []
    ): LengthAwarePaginator {
        return $this->getPlotsByStatus('sold', $filters);
    }

    /**
     * Get reserved plots.
     *
     * @param array<string, mixed> $filters
     */
    public function getReservedPlots(
        array $filters = []
    ): LengthAwarePaginator {
        return $this->getPlotsByStatus('reserved', $filters);
    }

    /**
     * Update plot status.
     */
    public function updatePlotStatus(
        int|string|Plot $plot,
        string $status
    ): Plot {
        return DB::transaction(function () use (
            $plot,
            $status
        ): Plot {
            $plotModel = $plot instanceof Plot
                ? $plot
                : $this->plotRepository->findOrFail($plot);

            $status = strtolower(trim($status));

            $this->validateStatus($status);

            $this->validateStatusTransition(
                $plotModel,
                $status
            );

            return $this->plotRepository->updateStatus(
                $plotModel,
                $status
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Location Retrieval
    |--------------------------------------------------------------------------
    */

    /**
     * Get plots by county.
     *
     * @param array<string, mixed> $filters
     */
    public function getPlotsByCounty(
        int|string $countyId,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->plotRepository->getByCounty(
            $countyId,
            $filters
        );
    }

    /**
     * Get plots by city.
     *
     * @param array<string, mixed> $filters
     */
    public function getPlotsByCity(
        int|string $cityId,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->plotRepository->getByCity(
            $cityId,
            $filters
        );
    }

    /**
     * Get plots by area.
     *
     * @param array<string, mixed> $filters
     */
    public function getPlotsByArea(
        int|string $areaId,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->plotRepository->getByArea(
            $areaId,
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Relationship Loading
    |--------------------------------------------------------------------------
    */

    /**
     * Load plot relationships.
     *
     * @param array<int, string> $relations
     */
    public function loadRelations(
        Plot $plot,
        array $relations = []
    ): Plot {
        return $this->plotRepository->loadRelations(
            $plot,
            $relations
        );
    }

    /**
     * Get plot details with default relationships.
     */
    public function getPlotDetails(
        int|string $id
    ): Plot {
        $plot = $this->plotRepository->findOrFail($id);

        return $this->plotRepository->loadRelations($plot);
    }

    /*
    |--------------------------------------------------------------------------
    | Private Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Prepare plot data before persistence.
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    protected function preparePlotData(
        array $data
    ): array {
        /*
        |--------------------------------------------------------------------------
        | Normalize Currency
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['currency']) &&
            is_string($data['currency'])
        ) {
            $data['currency'] = strtoupper(
                trim($data['currency'])
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Code
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['code']) &&
            is_string($data['code'])
        ) {
            $data['code'] = strtoupper(
                trim($data['code'])
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Text
        |--------------------------------------------------------------------------
        */

        foreach ([
            'title',
            'title_number',
            'plot_number',
            'address',
            'description',
        ] as $field) {
            if (
                isset($data[$field]) &&
                is_string($data[$field])
            ) {
                $data[$field] = trim($data[$field]);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Size Unit
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['size_unit']) &&
            is_string($data['size_unit'])
        ) {
            $data['size_unit'] = strtolower(
                trim($data['size_unit'])
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Status
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['status']) &&
            is_string($data['status'])
        ) {
            $data['status'] = strtolower(
                trim($data['status'])
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Boolean
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('is_active', $data)) {
            $value = filter_var(
                $data['is_active'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($value === null) {
                throw ValidationException::withMessages([
                    'is_active' => [
                        'The active field must be true or false.',
                    ],
                ]);
            }

            $data['is_active'] = $value;
        }

        return $data;
    }

    /**
     * Generate a unique plot code.
     *
     * Format: PLT-YYYYMMDD-000001
     */
    protected function generatePlotCode(): string
    {
        $prefix = 'PLT-' . now()->format('Ymd') . '-';

        $lastPlot = Plot::withTrashed()
            ->where('code', 'like', $prefix . '%')
            ->orderByDesc('id')
            ->first();

        $nextNumber = 1;

        if (
            $lastPlot &&
            preg_match(
                '/(\d+)$/',
                (string) $lastPlot->code,
                $matches
            )
        ) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        do {
            $code = $prefix . str_pad(
                (string) $nextNumber,
                6,
                '0',
                STR_PAD_LEFT
            );

            $exists = Plot::withTrashed()
                ->where('code', $code)
                ->exists();

            if ($exists) {
                $nextNumber++;
            }
        } while ($exists);

        return $code;
    }

    /**
     * Validate a supplied plot status.
     */
    protected function validateStatus(
        string $status
    ): void {
        if (!in_array($status, self::ALLOWED_STATUSES, true)) {
            throw ValidationException::withMessages([
                'status' => [
                    'The selected plot status is invalid.',
                ],
            ]);
        }
    }

    /**
     * Validate a status supplied through general plot editing.
     *
     * @param array<string, mixed> $data
     */
    protected function validateStatusChange(
        Plot $plot,
        array $data
    ): void {
        if (!array_key_exists('status', $data)) {
            return;
        }

        $newStatus = strtolower(
            trim((string) $data['status'])
        );

        $this->validateStatus($newStatus);

        $this->validateStatusTransition(
            $plot,
            $newStatus
        );
    }

    /**
     * Validate business rules for plot status transitions.
     */
    protected function validateStatusTransition(
        Plot $plot,
        string $newStatus
    ): void {
        $currentStatus = $plot->status;

        if ($currentStatus === $newStatus) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Sold Plots
        |--------------------------------------------------------------------------
        |
        | Sold plots cannot be returned directly to available or reserved.
        | Use an explicit sale reversal/cancellation workflow instead.
        |
        */

        if (
            $currentStatus === 'sold' &&
            in_array(
                $newStatus,
                ['available', 'reserved'],
                true
            )
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'A sold plot cannot be changed to '
                    . $newStatus
                    . ' directly. Reverse or cancel the sale first.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Protect Plots With Completed Sales
        |--------------------------------------------------------------------------
        */

        if (
            $newStatus !== 'sold' &&
            $plot->sales()
                ->where('status', 'completed')
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'This plot has a completed sale. '
                    . 'Its status can only be changed after the sale '
                    . 'has been formally reversed or corrected.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Manual Sale Status Changes
        |--------------------------------------------------------------------------
        |
        | The status endpoint must not be used to mark inventory as sold
        | without a completed sale record.
        |
        */

        if (
            $newStatus === 'sold' &&
            ! $plot->sales()
                ->where('status', 'completed')
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'A plot can only be marked as sold after a sale '
                    . 'has been completed.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Reserved Plot Rules
        |--------------------------------------------------------------------------
        */

        if (
            $currentStatus === 'reserved' &&
            $newStatus === 'available'
        ) {
            $hasActiveSale = $plot->sales()
                ->where('is_active', true)
                ->whereIn('status', ['reserved', 'approved'])
                ->exists();

            if ($hasActiveSale) {
                throw ValidationException::withMessages([
                    'status' => [
                        'This plot has an active reservation or approved '
                        . 'sale. Release the reservation before making '
                        . 'the plot available.',
                    ],
                ]);
            }

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Other Supported Transitions
        |--------------------------------------------------------------------------
        */

        $allowedTransitions = [
            'available' => [
                'reserved',
                'unavailable',
            ],
            'reserved' => [
                'sold',
                'unavailable',
            ],
            'unavailable' => [
                'available',
            ],
            'sold' => [],
        ];

        if (
            !in_array(
                $newStatus,
                $allowedTransitions[$currentStatus] ?? [],
                true
            )
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    "The plot cannot transition from {$currentStatus} "
                    . "to {$newStatus}.",
                ],
            ]);
        }
    }

    /**
     * Normalize pagination size.
     */
    protected function normalizePerPage(
        int $perPage
    ): int {
        return max(1, min($perPage, 100));
    }
}
