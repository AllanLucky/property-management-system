<?php

namespace App\Services;

use App\Models\Unit;
use App\Models\Property;
use App\Repositories\Interfaces\UnitRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Exception;

class UnitService
{
    public function __construct(
        protected UnitRepositoryInterface $unitRepository
    ) {}

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */
    public function getAll(): Collection
    {
        return $this->unitRepository->all();
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY ID
    |--------------------------------------------------------------------------
    */
    public function getById(int $id): ?Unit
    {
        return $this->unitRepository->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | SAFE UNIQUE UNIT NUMBER GENERATOR
    |--------------------------------------------------------------------------
    */
    private function generateUniqueUnitNumber(string $name): string
    {
        $prefix = strtoupper(substr(
            preg_replace('/[^A-Za-z]/', '', $name ?? 'UNT'),
            0,
            3
        ));

        do {
            $random = random_int(1000, 9999);

            $unitNumber = $prefix . '-' . $random;

        } while (Unit::where('unit_number', $unitNumber)->exists());

        return $unitNumber;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIT (FIXED DUPLICATE ISSUE)
    |--------------------------------------------------------------------------
    */
    public function create(array $data): Unit
    {
        return DB::transaction(function () use ($data) {

            $property = Property::find($data['property_id']);

            if (!$property) {
                throw new Exception('Property not found.');
            }

            // SAFE UNIQUE GENERATION (NO COLLISION)
            if (empty($data['unit_number'])) {
                $data['unit_number'] = $this->generateUniqueUnitNumber(
                    $data['name'] ?? 'UNIT'
                );
            }

            $data['status'] = $data['status'] ?? Unit::STATUS_VACANT;
            $data['deposit_amount'] = $data['deposit_amount'] ?? 0;

            return $this->unitRepository->create($data);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE UNIT
    |--------------------------------------------------------------------------
    */
    public function update(int $id, array $data): Unit
    {
        return DB::transaction(function () use ($id, $data) {

            $unit = $this->unitRepository->find($id);

            if (!$unit) {
                throw new Exception('Unit not found.');
            }

            $allowedStatuses = [
                Unit::STATUS_VACANT,
                Unit::STATUS_OCCUPIED,
                Unit::STATUS_RESERVED,
                Unit::STATUS_MAINTENANCE,
                Unit::STATUS_INACTIVE,
            ];

            if (isset($data['status']) && !in_array($data['status'], $allowedStatuses)) {
                throw new Exception('Invalid unit status.');
            }

            if (
                $unit->status === Unit::STATUS_OCCUPIED &&
                ($data['status'] ?? null) === Unit::STATUS_VACANT
            ) {
                throw new Exception('Cannot mark occupied unit as vacant.');
            }

            return $this->unitRepository->update($id, $data);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */
    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $unit = $this->unitRepository->find($id);

            if (!$unit) {
                return false;
            }

            if ($unit->status === Unit::STATUS_OCCUPIED) {
                throw new Exception('Cannot delete occupied unit.');
            }

            return $this->unitRepository->delete($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN TO PROPERTY
    |--------------------------------------------------------------------------
    */
    public function assignToProperty(int $unitId, int $propertyId): Unit
    {
        return DB::transaction(function () use ($unitId, $propertyId) {

            $property = Property::find($propertyId);

            if (!$property) {
                throw new Exception('Property not found.');
            }

            return $this->unitRepository->assignToProperty($unitId, $propertyId);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CHANGE STATUS
    |--------------------------------------------------------------------------
    */
    public function changeStatus(int $unitId, string $status): Unit
    {
        return DB::transaction(function () use ($unitId, $status) {

            $unit = $this->unitRepository->find($unitId);

            if (!$unit) {
                throw new Exception('Unit not found.');
            }

            $allowed = [
                Unit::STATUS_VACANT,
                Unit::STATUS_OCCUPIED,
                Unit::STATUS_RESERVED,
                Unit::STATUS_MAINTENANCE,
                Unit::STATUS_INACTIVE,
            ];

            if (!in_array($status, $allowed)) {
                throw new Exception('Invalid status.');
            }

            return $this->unitRepository->update($unitId, [
                'status' => $status
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY PROPERTY
    |--------------------------------------------------------------------------
    */
    public function getByProperty(int $propertyId): Collection
    {
        return $this->unitRepository->getByProperty($propertyId);
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERS
    |--------------------------------------------------------------------------
    */
    public function getVacantUnits(): Collection
    {
        return $this->unitRepository->getByStatus(Unit::STATUS_VACANT);
    }

    public function getOccupiedUnits(): Collection
    {
        return $this->unitRepository->getByStatus(Unit::STATUS_OCCUPIED);
    }

    public function getMaintenanceUnits(): Collection
    {
        return $this->unitRepository->getByStatus(Unit::STATUS_MAINTENANCE);
    }

    /*
    |--------------------------------------------------------------------------
    | STATS
    |--------------------------------------------------------------------------
    */
    public function getStats(int $id): array
    {
        $unit = $this->unitRepository->find($id);

        if (!$unit) {
            throw new Exception('Unit not found.');
        }

        return [
            'id' => $unit->id,
            'name' => $unit->name,
            'unit_number' => $unit->unit_number,
            'type' => $unit->type,

            'status' => $unit->status,
            'is_occupied' => $unit->is_occupied,
            'is_vacant' => $unit->is_vacant,
            'is_reserved' => $unit->is_reserved,
            'is_under_maintenance' => $unit->is_under_maintenance,

            'rent_amount' => $unit->rent_amount,
            'deposit_amount' => $unit->deposit_amount,

            'property_id' => $unit->property_id,
            'apartment_id' => $unit->apartment_id,
        ];
    }
}