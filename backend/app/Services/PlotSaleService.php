<?php

namespace App\Services;

use App\Models\PlotSale;
use App\Repositories\Interfaces\PlotSaleRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

class PlotSaleService
{
    public function __construct(
        protected PlotSaleRepositoryInterface $plotSaleRepository
    ) {
    }

    /**
     * Get paginated plot sales.
     */
    public function getAll(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        return $this->plotSaleRepository->getAll(
            $filters,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Find a plot sale by ID.
     */
    public function findById(int $id): PlotSale
    {
        $plotSale = $this->plotSaleRepository->findById($id);

        if (! $plotSale) {
            throw new InvalidArgumentException(
                "Plot sale with ID {$id} was not found."
            );
        }

        return $plotSale;
    }

    /**
     * Find a plot sale by sale number.
     */
    public function findBySaleNumber(string $saleNumber): PlotSale
    {
        $plotSale = $this->plotSaleRepository->findBySaleNumber($saleNumber);

        if (! $plotSale) {
            throw new InvalidArgumentException(
                "Plot sale {$saleNumber} was not found."
            );
        }

        return $plotSale;
    }

    /**
     * Create a new plot sale.
     */
    public function create(array $data): PlotSale
    {
        $this->validateSaleData($data);

        if (! empty($data['sale_number'])) {
            if ($this->plotSaleRepository->findBySaleNumber($data['sale_number'])) {
                throw ValidationException::withMessages([
                    'sale_number' => ['This sale number already exists.'],
                ]);
            }
        }

        return DB::transaction(function () use ($data) {
            return $this->plotSaleRepository->create($data);
        });
    }

    /**
     * Update an existing plot sale.
     */
    public function update(int $id, array $data): PlotSale
    {
        $plotSale = $this->findById($id);

        $this->ensureSaleCanBeUpdated($plotSale);

        $this->validateSaleData($data, $plotSale);

        if (
            ! empty($data['sale_number']) &&
            $data['sale_number'] !== $plotSale->sale_number
        ) {
            $existingSale = $this->plotSaleRepository->findBySaleNumber(
                $data['sale_number']
            );

            if ($existingSale && $existingSale->id !== $plotSale->id) {
                throw ValidationException::withMessages([
                    'sale_number' => ['This sale number already exists.'],
                ]);
            }
        }

        return DB::transaction(function () use ($plotSale, $data) {
            return $this->plotSaleRepository->update($plotSale, $data);
        });
    }

    /**
     * Delete a plot sale.
     */
    public function delete(int $id): bool
    {
        $plotSale = $this->findById($id);

        if (($plotSale->status ?? null) === 'completed') {
            throw ValidationException::withMessages([
                'sale' => ['Completed sales cannot be deleted.'],
            ]);
        }

        return DB::transaction(function () use ($plotSale) {
            return $this->plotSaleRepository->delete($plotSale);
        });
    }

    /**
     * Restore a soft-deleted plot sale.
     */
    public function restore(int $id): PlotSale
    {
        $plotSale = $this->plotSaleRepository->restore($id);

        if (! $plotSale) {
            throw new InvalidArgumentException(
                "Deleted plot sale with ID {$id} was not found."
            );
        }

        return $plotSale;
    }

    /**
     * Permanently delete a plot sale.
     */
    public function forceDelete(int $id): bool
    {
        $plotSale = PlotSale::withTrashed()->find($id);

        if (! $plotSale) {
            throw new InvalidArgumentException(
                "Plot sale with ID {$id} was not found."
            );
        }

        if (($plotSale->status ?? null) === 'completed') {
            throw ValidationException::withMessages([
                'sale' => ['Completed sales cannot be permanently deleted.'],
            ]);
        }

        return DB::transaction(function () use ($id) {
            return $this->plotSaleRepository->forceDelete($id);
        });
    }

    /**
     * Get sales filtered by status.
     */
    public function getByStatus(
        string $status,
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->plotSaleRepository->getByStatus(
            $status,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get sales for a specific plot.
     */
    public function getByPlot(
        int $plotId,
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->plotSaleRepository->getByPlot(
            $plotId,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get sales for a specific buyer.
     */
    public function getByBuyer(
        int $buyerId,
        int $perPage = 15
    ): LengthAwarePaginator {
        return $this->plotSaleRepository->getByBuyer(
            $buyerId,
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get sales with outstanding balances.
     */
    public function getOutstanding(int $perPage = 15): LengthAwarePaginator
    {
        return $this->plotSaleRepository->getOutstanding(
            $this->normalizePerPage($perPage)
        );
    }

    /**
     * Get plot sales statistics.
     */
    public function getStatistics(array $filters = []): array
    {
        return $this->plotSaleRepository->getStatistics($filters);
    }

    /**
     * Get plot sales for reports.
     */
    public function getForReport(array $filters = []): Collection
    {
        return $this->plotSaleRepository->getForReport($filters);
    }

    /**
     * Approve a plot sale.
     */
    public function approve(int $id): PlotSale
    {
        $plotSale = $this->findById($id);

        if (! in_array($plotSale->status, ['pending', 'reserved'], true)) {
            throw ValidationException::withMessages([
                'status' => ['Only pending or reserved sales can be approved.'],
            ]);
        }

        return DB::transaction(function () use ($plotSale) {
            return $this->plotSaleRepository->update($plotSale, [
                'status' => 'approved',
            ]);
        });
    }

    /**
     * Cancel a plot sale.
     */
    public function cancel(int $id, ?string $reason = null): PlotSale
    {
        $plotSale = $this->findById($id);

        if (in_array($plotSale->status, ['completed', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => ['This sale cannot be cancelled.'],
            ]);
        }

        $data = [
            'status' => 'cancelled',
        ];

        if ($reason !== null) {
            $data['notes'] = trim(
                ($plotSale->notes ? $plotSale->notes . PHP_EOL : '') .
                'Cancellation reason: ' . $reason
            );
        }

        return DB::transaction(function () use ($plotSale, $data) {
            return $this->plotSaleRepository->update($plotSale, $data);
        });
    }

    /**
     * Complete a plot sale.
     */
    public function complete(int $id): PlotSale
    {
        $plotSale = $this->findById($id);

        if (in_array($plotSale->status, ['completed', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'status' => ['This sale cannot be completed.'],
            ]);
        }

        if ((float) $plotSale->balance > 0) {
            throw ValidationException::withMessages([
                'balance' => ['The outstanding balance must be cleared before completion.'],
            ]);
        }

        return DB::transaction(function () use ($plotSale) {
            return $this->plotSaleRepository->update($plotSale, [
                'status' => 'completed',
            ]);
        });
    }

    /**
     * Validate core financial values supplied to the service.
     *
     * Detailed request validation should also be implemented in FormRequests.
     */
    protected function validateSaleData(
        array $data,
        ?PlotSale $existingSale = null
    ): void {
        $numericFields = [
            'sale_price',
            'deposit_amount',
            'discount_amount',
            'additional_charges',
            'total_amount',
            'amount_paid',
            'balance',
            'installment_amount',
        ];

        foreach ($numericFields as $field) {
            if (
                array_key_exists($field, $data) &&
                $data[$field] !== null &&
                (! is_numeric($data[$field]) || (float) $data[$field] < 0)
            ) {
                throw ValidationException::withMessages([
                    $field => ['This field must be a non-negative number.'],
                ]);
            }
        }

        if (
            isset($data['amount_paid'], $data['total_amount']) &&
            (float) $data['amount_paid'] > (float) $data['total_amount']
        ) {
            throw ValidationException::withMessages([
                'amount_paid' => [
                    'The amount paid cannot exceed the total sale amount.',
                ],
            ]);
        }

        if (
            isset($data['discount_amount'], $data['sale_price']) &&
            (float) $data['discount_amount'] > (float) $data['sale_price']
        ) {
            throw ValidationException::withMessages([
                'discount_amount' => [
                    'The discount cannot exceed the sale price.',
                ],
            ]);
        }
    }

    /**
     * Prevent edits to completed or cancelled sales.
     */
    protected function ensureSaleCanBeUpdated(PlotSale $plotSale): void
    {
        if (in_array($plotSale->status, ['completed', 'cancelled'], true)) {
            throw ValidationException::withMessages([
                'sale' => ['Completed or cancelled sales cannot be edited.'],
            ]);
        }
    }

    /**
     * Normalize pagination limits.
     */
    protected function normalizePerPage(int $perPage): int
    {
        return max(1, min($perPage, 100));
    }
}