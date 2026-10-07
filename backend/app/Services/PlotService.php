<?php

namespace App\Services;

use App\Repositories\Interfaces\PlotRepositoryInterface;
use App\Models\Plot;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class PlotService
{
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
        return $this->plotRepository->getAll(
            $filters
        );
    }

    /**
     * Get paginated plots.
     */
    public function paginatePlots(
        array $filters = [],
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->plotRepository->paginate(
            $filters,
            $perPage
        );
    }

    /**
     * Get a plot by ID.
     */
    public function getPlot(
        int|string $id
    ): Plot {
        return $this->plotRepository->findOrFail(
            $id
        );
    }

    /**
     * Find a plot by ID without throwing an exception.
     */
    public function findPlot(
        int|string $id
    ): ?Plot {
        return $this->plotRepository->findById(
            $id
        );
    }

    /**
     * Find a plot by code.
     */
    public function findByCode(
        string $code
    ): ?Plot {
        return $this->plotRepository->findByCode(
            $code
        );
    }

    /**
     * Find a plot by title number.
     */
    public function findByTitleNumber(
        string $titleNumber
    ): ?Plot {
        return $this->plotRepository->findByTitleNumber(
            $titleNumber
        );
    }

    /**
     * Search plots.
     */
    public function searchPlots(
        string $search,
        array $filters = []
    ): LengthAwarePaginator {
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
            /*
            |--------------------------------------------------------------------------
            | Defaults
            |--------------------------------------------------------------------------
            */

            $data = $this->preparePlotData(
                $data
            );

            /*
            |--------------------------------------------------------------------------
            | Generate Plot Code
            |--------------------------------------------------------------------------
            */

            if (
                empty($data['code'])
            ) {
                $data['code'] = $this->generatePlotCode();
            }

            /*
            |--------------------------------------------------------------------------
            | Default Status
            |--------------------------------------------------------------------------
            */

            if (
                !isset($data['status']) ||
                $data['status'] === ''
            ) {
                $data['status'] = 'available';
            }

            /*
            |--------------------------------------------------------------------------
            | Default Active State
            |--------------------------------------------------------------------------
            */

            if (
                !array_key_exists(
                    'is_active',
                    $data
                )
            ) {
                $data['is_active'] = true;
            }

            /*
            |--------------------------------------------------------------------------
            | Create
            |--------------------------------------------------------------------------
            */

            return $this->plotRepository->create(
                $data
            );
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
            /*
            |--------------------------------------------------------------------------
            | Resolve Plot
            |--------------------------------------------------------------------------
            */

            $plotModel = $plot instanceof Plot
                ? $plot
                : $this->plotRepository->findOrFail(
                    $plot
                );

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
            | Prepare Data
            |--------------------------------------------------------------------------
            */

            $data = $this->preparePlotData(
                $data
            );

            /*
            |--------------------------------------------------------------------------
            | Update
            |--------------------------------------------------------------------------
            */

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
        return DB::transaction(function () use (
            $plot
        ): bool {
            $plotModel = $plot instanceof Plot
                ? $plot
                : $this->plotRepository->findOrFail(
                    $plot
                );

            /*
            |--------------------------------------------------------------------------
            | Business Protection
            |--------------------------------------------------------------------------
            |
            | A sold or reserved plot should not normally be deleted.
            |
            */

            if (
                in_array(
                    $plotModel->status,
                    [
                        'sold',
                        'reserved',
                    ],
                    true
                )
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'This plot cannot be deleted while it is '
                        . strtolower($plotModel->status)
                        . '.',
                    ],
                ]);
            }

            return $this->plotRepository->delete(
                $plotModel
            );
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
        return DB::transaction(function () use (
            $id
        ): Plot {
            return $this->plotRepository->restore(
                $id
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Force Delete
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a plot.
     */
    public function forceDeletePlot(
        int|string $id
    ): bool {
        return DB::transaction(function () use (
            $id
        ): bool {
            return $this->plotRepository->forceDelete(
                $id
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Availability
    |--------------------------------------------------------------------------
    */

    /**
     * Get available plots.
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
        return $this->plotRepository->isAvailable(
            $id
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    /**
     * Get plots by status.
     */
    public function getPlotsByStatus(
        string $status,
        array $filters = []
    ): LengthAwarePaginator {
        $allowedStatuses = [
            'available',
            'reserved',
            'sold',
            'unavailable',
        ];

        if (
            !in_array(
                $status,
                $allowedStatuses,
                true
            )
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'The selected plot status is invalid.',
                ],
            ]);
        }

        return $this->plotRepository->getByStatus(
            $status,
            $filters
        );
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
                : $this->plotRepository->findOrFail(
                    $plot
                );

            $this->validateStatus(
                $status
            );

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
     * Get plot with the default relationships.
     */
    public function getPlotDetails(
        int|string $id
    ): Plot {
        $plot = $this->plotRepository->findOrFail(
            $id
        );

        return $this->plotRepository->loadRelations(
            $plot
        );
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

        foreach (
            [
                'title',
                'title_number',
                'plot_number',
                'address',
            ] as $field
        ) {
            if (
                isset($data[$field]) &&
                is_string($data[$field])
            ) {
                $data[$field] = trim(
                    $data[$field]
                );
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

        if (
            array_key_exists(
                'is_active',
                $data
            )
        ) {
            $data['is_active'] = filter_var(
                $data['is_active'],
                FILTER_VALIDATE_BOOLEAN
            );
        }

        return $data;
    }

    /**
     * Generate a unique plot code.
     *
     * Format:
     *
     * PLT-YYYYMMDD-000001
     */
    protected function generatePlotCode(): string
    {
        $date = now()->format('Ymd');

        $prefix = "PLT-{$date}-";

        $lastPlot = Plot::query()
            ->withTrashed()
            ->where(
                'code',
                'like',
                "{$prefix}%"
            )
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

            $exists = Plot::query()
                ->withTrashed()
                ->where('code', $code)
                ->exists();

            if ($exists) {
                $nextNumber++;
            }
        } while ($exists);

        return $code;
    }

    /**
     * Validate a supplied status.
     */
    protected function validateStatus(
        string $status
    ): void {
        $allowedStatuses = [
            'available',
            'reserved',
            'sold',
            'unavailable',
        ];

        if (
            !in_array(
                $status,
                $allowedStatuses,
                true
            )
        ) {
            throw ValidationException::withMessages([
                'status' => [
                    'The selected plot status is invalid.',
                ],
            ]);
        }
    }

    /**
     * Validate a status change included in an update request.
     *
     * @param array<string, mixed> $data
     */
    protected function validateStatusChange(
        Plot $plot,
        array $data
    ): void {
        if (
            !array_key_exists(
                'status',
                $data
            )
        ) {
            return;
        }

        $newStatus = strtolower(
            trim((string) $data['status'])
        );

        $this->validateStatus(
            $newStatus
        );

        $this->validateStatusTransition(
            $plot,
            $newStatus
        );
    }

    /**
     * Validate business rules around status transitions.
     */
    protected function validateStatusTransition(
        Plot $plot,
        string $newStatus
    ): void {
        $currentStatus = $plot->status;

        /*
        |--------------------------------------------------------------------------
        | No Change
        |--------------------------------------------------------------------------
        */

        if (
            $currentStatus === $newStatus
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Sold Plots
        |--------------------------------------------------------------------------
        |
        | Once a plot is sold, it should not normally be returned
        | to available/reserved without a proper sale reversal process.
        |
        */

        if (
            $currentStatus === 'sold' &&
            in_array(
                $newStatus,
                [
                    'available',
                    'reserved',
                ],
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
        | Reserved Plots
        |--------------------------------------------------------------------------
        |
        | Reserved → sold is allowed.
        | Reserved → available is allowed when the reservation
        | has been released.
        |
        */

        if (
            $currentStatus === 'reserved' &&
            $newStatus === 'available'
        ) {
            return;
        }

        if (
            $currentStatus === 'reserved' &&
            $newStatus === 'sold'
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Available Plots
        |--------------------------------------------------------------------------
        */

        if (
            $currentStatus === 'available' &&
            in_array(
                $newStatus,
                [
                    'reserved',
                    'sold',
                    'unavailable',
                ],
                true
            )
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Unavailable Plots
        |--------------------------------------------------------------------------
        */

        if (
            $currentStatus === 'unavailable' &&
            in_array(
                $newStatus,
                [
                    'available',
                    'reserved',
                ],
                true
            )
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Default
        |--------------------------------------------------------------------------
        |
        | Allow other transitions unless a more specific business
        | rule has been defined.
        |
        */
    }
}
