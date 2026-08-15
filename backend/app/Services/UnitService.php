<?php


namespace App\Services;

use App\Models\Property;
use App\Models\Unit;
use App\Repositories\Interfaces\UnitRepositoryInterface;
use Exception;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class UnitService
{
    /*
    |--------------------------------------------------------------------------
    | CONSTRUCTOR
    |--------------------------------------------------------------------------
    */

    public function __construct(
        protected UnitRepositoryInterface $unitRepository
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    |
    | Backwards-compatible method.
    |
    | For large datasets, prefer getPaginated().
    |
    */

    public function getAll(): Collection
    {
        return $this->unitRepository->all();
    }

    /*
    |--------------------------------------------------------------------------
    | GET PAGINATED UNITS
    |--------------------------------------------------------------------------
    |
    | Recommended method for the frontend Unit listing.
    |
    */

    public function getPaginated(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        return $this->unitRepository->paginate(
            $perPage,
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | GET FILTERED UNITS
    |--------------------------------------------------------------------------
    */

    public function filter(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {
        $perPage = $this->normalizePerPage($perPage);

        return $this->unitRepository->filter(
            $filters,
            $perPage
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH UNITS
    |--------------------------------------------------------------------------
    */

    public function search(
        string $search,
        int $perPage = 25
    ): LengthAwarePaginator {
        $search = trim($search);

        if ($search === '') {
            return $this->getPaginated($perPage);
        }

        return $this->unitRepository->search(
            $search,
            $this->normalizePerPage($perPage)
        );
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY ID
    |--------------------------------------------------------------------------
    */

    public function getById(int $id): ?Unit
    {
        if ($id <= 0) {
            return null;
        }

        return $this->unitRepository->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY SLUG
    |--------------------------------------------------------------------------
    */

    public function getBySlug(string $slug): ?Unit
    {
        $slug = trim($slug);

        if ($slug === '') {
            return null;
        }

        return $this->unitRepository->findBySlug($slug);
    }

    /*
    |--------------------------------------------------------------------------
    | SAFE UNIQUE UNIT NUMBER GENERATOR
    |--------------------------------------------------------------------------
    |
    | Generates a unique unit number when one was not supplied.
    |
    */

    private function generateUniqueUnitNumber(
        string $name = 'UNIT'
    ): string {
        $cleanName = preg_replace(
            '/[^A-Za-z]/',
            '',
            $name
        );

        $cleanName = $cleanName ?: 'UNT';

        $prefix = strtoupper(
            substr(
                $cleanName,
                0,
                3
            )
        );

        do {
            $random = random_int(
                1000,
                9999
            );

            $unitNumber = $prefix . '-' . $random;
        } while (
            Unit::query()
                ->where(
                    'unit_number',
                    $unitNumber
                )
                ->exists()
        );

        return $unitNumber;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIT
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Unit
    {
        return DB::transaction(function () use ($data): Unit {

            /*
            |--------------------------------------------------------------------------
            | Validate property
            |--------------------------------------------------------------------------
            */

            $propertyId = $data['property_id'] ?? null;

            if (!$propertyId) {
                throw new Exception(
                    'Property is required.'
                );
            }

            $propertyExists = Property::query()
                ->whereKey($propertyId)
                ->exists();

            if (!$propertyExists) {
                throw new Exception(
                    'Property not found.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Validate apartment when supplied
            |--------------------------------------------------------------------------
            */

            if (
                isset($data['apartment_id']) &&
                $data['apartment_id'] !== null
            ) {
                $apartmentExists = Unit::query()
                    ->whereKey($data['id'] ?? 0)
                    ->exists();

                /*
                |--------------------------------------------------------------------------
                | Do not perform an incorrect Unit lookup here.
                |
                | Apartment validation can be handled by the request/database
                | foreign key or by the Apartment model/service.
                |--------------------------------------------------------------------------
                */
            }

            /*
            |--------------------------------------------------------------------------
            | Generate unit number
            |--------------------------------------------------------------------------
            */

            if (
                !isset($data['unit_number']) ||
                blank($data['unit_number'])
            ) {
                $data['unit_number'] =
                    $this->generateUniqueUnitNumber(
                        $data['unit_name']
                            ?? $data['name']
                            ?? 'UNIT'
                    );
            } else {
                /*
                |--------------------------------------------------------------------------
                | Prevent duplicate supplied unit number.
                |--------------------------------------------------------------------------
                */

                $exists = Unit::query()
                    ->where(
                        'unit_number',
                        $data['unit_number']
                    )
                    ->exists();

                if ($exists) {
                    throw new Exception(
                        'The unit number already exists.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Defaults
            |--------------------------------------------------------------------------
            */

            $data['status'] =
                $data['status']
                ?? Unit::STATUS_VACANT;

            /*
            |--------------------------------------------------------------------------
            | Validate status
            |--------------------------------------------------------------------------
            */

            $this->validateStatus(
                $data['status']
            );

            /*
            |--------------------------------------------------------------------------
            | Normalize legacy price fields
            |--------------------------------------------------------------------------
            |
            | The current Unit model uses:
            |
            | price
            | deposit
            | service_charge
            |
            | while older code used:
            |
            | rent_amount
            | deposit_amount
            |
            */

            if (
                !isset($data['price']) &&
                isset($data['rent_amount'])
            ) {
                $data['price'] =
                    $data['rent_amount'];
            }

            if (
                !isset($data['deposit']) &&
                isset($data['deposit_amount'])
            ) {
                $data['deposit'] =
                    $data['deposit_amount'];
            }

            /*
            |--------------------------------------------------------------------------
            | Default financial values
            |--------------------------------------------------------------------------
            */

            $data['price'] =
                $data['price'] ?? 0;

            $data['deposit'] =
                $data['deposit'] ?? 0;

            $data['service_charge'] =
                $data['service_charge'] ?? 0;

            /*
            |--------------------------------------------------------------------------
            | Remove legacy fields that aren't fillable
            |--------------------------------------------------------------------------
            */

            unset(
                $data['name'],
                $data['rent_amount'],
                $data['deposit_amount']
            );

            /*
            |--------------------------------------------------------------------------
            | Create
            |--------------------------------------------------------------------------
            */

            return $this->unitRepository->create(
                $data
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE UNIT
    |--------------------------------------------------------------------------
    */

    public function update(
        int $id,
        array $data
    ): Unit {
        return DB::transaction(function () use (
            $id,
            $data
        ): Unit {

            $unit = $this->unitRepository->find(
                $id
            );

            if (!$unit) {
                throw new Exception(
                    'Unit not found.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Status validation
            |--------------------------------------------------------------------------
            */

            if (
                isset($data['status']) &&
                $data['status'] !== ''
            ) {
                $this->validateStatus(
                    $data['status']
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Prevent invalid occupied -> vacant transition.
            |--------------------------------------------------------------------------
            */

            if (
                $unit->status === Unit::STATUS_OCCUPIED &&
                isset($data['status']) &&
                $data['status'] === Unit::STATUS_VACANT
            ) {
                throw new Exception(
                    'Cannot mark an occupied unit as vacant.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Prevent changing unit number to duplicate
            |--------------------------------------------------------------------------
            */

            if (
                isset($data['unit_number']) &&
                filled($data['unit_number']) &&
                $data['unit_number'] !== $unit->unit_number
            ) {
                $exists = Unit::query()
                    ->where(
                        'unit_number',
                        $data['unit_number']
                    )
                    ->where(
                        'id',
                        '!=',
                        $id
                    )
                    ->exists();

                if ($exists) {
                    throw new Exception(
                        'The unit number already exists.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Normalize legacy financial fields
            |--------------------------------------------------------------------------
            */

            if (
                !isset($data['price']) &&
                isset($data['rent_amount'])
            ) {
                $data['price'] =
                    $data['rent_amount'];
            }

            if (
                !isset($data['deposit']) &&
                isset($data['deposit_amount'])
            ) {
                $data['deposit'] =
                    $data['deposit_amount'];
            }

            unset(
                $data['name'],
                $data['rent_amount'],
                $data['deposit_amount']
            );

            /*
            |--------------------------------------------------------------------------
            | Update
            |--------------------------------------------------------------------------
            */

            return $this->unitRepository->update(
                $id,
                $data
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */

    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id): bool {

            /*
            |--------------------------------------------------------------------------
            | Lightweight lookup
            |--------------------------------------------------------------------------
            */

            $unit = Unit::query()
                ->select([
                    'id',
                    'status',
                ])
                ->find($id);

            if (!$unit) {
                return false;
            }

            /*
            |--------------------------------------------------------------------------
            | Do not delete occupied unit
            |--------------------------------------------------------------------------
            */

            if (
                $unit->status === Unit::STATUS_OCCUPIED
            ) {
                throw new Exception(
                    'Cannot delete an occupied unit.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Do not delete unit with active tenancy
            |--------------------------------------------------------------------------
            */

            if (
                $unit->tenancies()
                    ->where(
                        'status',
                        \App\Models\Tenancy::STATUS_ACTIVE
                    )
                    ->exists()
            ) {
                throw new Exception(
                    'Cannot delete a unit with an active tenancy.'
                );
            }

            return $this->unitRepository->delete(
                $id
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE UNIT
    |--------------------------------------------------------------------------
    */

    public function restore(int $id): ?Unit
    {
        return DB::transaction(
            function () use ($id): ?Unit {
                return $this->unitRepository->restore(
                    $id
                );
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE
    |--------------------------------------------------------------------------
    */

    public function forceDelete(int $id): bool
    {
        return DB::transaction(
            function () use ($id): bool {
                return $this->unitRepository->forceDelete(
                    $id
                );
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN TO PROPERTY
    |--------------------------------------------------------------------------
    */

    public function assignToProperty(
        int $unitId,
        int $propertyId
    ): Unit {
        return DB::transaction(function () use (
            $unitId,
            $propertyId
        ): Unit {

            /*
            |--------------------------------------------------------------------------
            | Validate property
            |--------------------------------------------------------------------------
            */

            $propertyExists = Property::query()
                ->whereKey($propertyId)
                ->exists();

            if (!$propertyExists) {
                throw new Exception(
                    'Property not found.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Validate unit
            |--------------------------------------------------------------------------
            */

            $unitExists = Unit::query()
                ->whereKey($unitId)
                ->exists();

            if (!$unitExists) {
                throw new Exception(
                    'Unit not found.'
                );
            }

            return $this->unitRepository
                ->assignToProperty(
                    $unitId,
                    $propertyId
                );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN TO APARTMENT
    |--------------------------------------------------------------------------
    */

    public function assignToApartment(
        int $unitId,
        int $apartmentId
    ): Unit {
        return DB::transaction(function () use (
            $unitId,
            $apartmentId
        ): Unit {

            /*
            |--------------------------------------------------------------------------
            | Validate unit
            |--------------------------------------------------------------------------
            */

            $unitExists = Unit::query()
                ->whereKey($unitId)
                ->exists();

            if (!$unitExists) {
                throw new Exception(
                    'Unit not found.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Validate apartment
            |--------------------------------------------------------------------------
            */

            $apartmentExists = \App\Models\Apartment::query()
                ->whereKey($apartmentId)
                ->exists();

            if (!$apartmentExists) {
                throw new Exception(
                    'Apartment not found.'
                );
            }

            return $this->unitRepository
                ->assignToApartment(
                    $unitId,
                    $apartmentId
                );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CHANGE STATUS
    |--------------------------------------------------------------------------
    */

    public function changeStatus(
        int $unitId,
        string $status
    ): Unit {
        return DB::transaction(function () use (
            $unitId,
            $status
        ): Unit {

            /*
            |--------------------------------------------------------------------------
            | Validate status
            |--------------------------------------------------------------------------
            */

            $this->validateStatus(
                $status
            );

            /*
            |--------------------------------------------------------------------------
            | Lightweight lookup
            |--------------------------------------------------------------------------
            */

            $unit = Unit::query()
                ->select([
                    'id',
                    'status',
                ])
                ->find($unitId);

            if (!$unit) {
                throw new Exception(
                    'Unit not found.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Occupied -> vacant protection
            |--------------------------------------------------------------------------
            */

            if (
                $unit->status === Unit::STATUS_OCCUPIED &&
                $status === Unit::STATUS_VACANT
            ) {
                throw new Exception(
                    'Cannot mark an occupied unit as vacant.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Prevent invalid maintenance transition
            |--------------------------------------------------------------------------
            */

            if (
                $unit->status === Unit::STATUS_OCCUPIED &&
                $status === Unit::STATUS_MAINTENANCE
            ) {
                throw new Exception(
                    'An occupied unit cannot be placed under maintenance.'
                );
            }

            return $this->unitRepository
                ->updateStatus(
                    $unitId,
                    $status
                );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY PROPERTY
    |--------------------------------------------------------------------------
    */

    public function getByProperty(
        int $propertyId
    ): Collection {
        $propertyExists = Property::query()
            ->whereKey($propertyId)
            ->exists();

        if (!$propertyExists) {
            throw new Exception(
                'Property not found.'
            );
        }

        return $this->unitRepository
            ->getByProperty(
                $propertyId
            );
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY APARTMENT
    |--------------------------------------------------------------------------
    */

    public function getByApartment(
        int $apartmentId
    ): Collection {
        return $this->unitRepository
            ->getByApartment(
                $apartmentId
            );
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY STATUS
    |--------------------------------------------------------------------------
    */

    public function getByStatus(
        string $status
    ): Collection {
        $this->validateStatus(
            $status
        );

        return $this->unitRepository
            ->getByStatus(
                $status
            );
    }

    /*
    |--------------------------------------------------------------------------
    | GET VACANT UNITS
    |--------------------------------------------------------------------------
    */

    public function getVacantUnits(): Collection
    {
        return $this->unitRepository
            ->getVacant();
    }

    /*
    |--------------------------------------------------------------------------
    | GET OCCUPIED UNITS
    |--------------------------------------------------------------------------
    */

    public function getOccupiedUnits(): Collection
    {
        return $this->unitRepository
            ->getOccupied();
    }

    /*
    |--------------------------------------------------------------------------
    | GET MAINTENANCE UNITS
    |--------------------------------------------------------------------------
    */

    public function getMaintenanceUnits(): Collection
    {
        return $this->unitRepository
            ->getMaintenance();
    }

    /*
    |--------------------------------------------------------------------------
    | GET RESERVED UNITS
    |--------------------------------------------------------------------------
    */

    public function getReservedUnits(): Collection
    {
        return $this->unitRepository
            ->getReserved();
    }

    /*
    |--------------------------------------------------------------------------
    | GET DASHBOARD STATS BY PROPERTY
    |--------------------------------------------------------------------------
    */

    public function getPropertyStats(
        int $propertyId
    ): array {
        $propertyExists = Property::query()
            ->whereKey($propertyId)
            ->exists();

        if (!$propertyExists) {
            throw new Exception(
                'Property not found.'
            );
        }

        return $this->unitRepository
            ->statsByProperty(
                $propertyId
            );
    }

    /*
    |--------------------------------------------------------------------------
    | GET GLOBAL STATS
    |--------------------------------------------------------------------------
    */

    public function getGlobalStats(): array
    {
        return $this->unitRepository
            ->stats();
    }

    /*
    |--------------------------------------------------------------------------
    | GET UNIT STATS
    |--------------------------------------------------------------------------
    */

    public function getStats(
        int $id
    ): array {
        /*
        |--------------------------------------------------------------------------
        | Get only the fields needed for statistics.
        |--------------------------------------------------------------------------
        */

        $unit = Unit::query()
            ->select([
                'id',
                'unit_number',
                'unit_name',
                'type',
                'status',
                'price',
                'deposit',
                'property_id',
                'apartment_id',
            ])
            ->find($id);

        if (!$unit) {
            throw new Exception(
                'Unit not found.'
            );
        }

        return [
            'id' => $unit->id,

            'name' =>
                $unit->unit_name
                ?? $unit->unit_number,

            'unit_number' =>
                $unit->unit_number,

            'type' =>
                $unit->type,

            'status' =>
                $unit->status,

            'status_label' =>
                $unit->status_label,

            'is_occupied' =>
                $unit->isOccupied(),

            'is_vacant' =>
                $unit->isVacant(),

            'is_reserved' =>
                $unit->isReserved(),

            'is_under_maintenance' =>
                $unit->isUnderMaintenance(),

            'is_available' =>
                $unit->isAvailable(),

            'rent_amount' =>
                $unit->price,

            'deposit_amount' =>
                $unit->deposit,

            'price' =>
                $unit->price,

            'deposit' =>
                $unit->deposit,

            'property_id' =>
                $unit->property_id,

            'apartment_id' =>
                $unit->apartment_id,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK AVAILABILITY
    |--------------------------------------------------------------------------
    */

    public function checkAvailability(
        int $unitId
    ): bool {
        $unit = Unit::query()
            ->select([
                'id',
                'status',
            ])
            ->find($unitId);

        if (!$unit) {
            throw new Exception(
                'Unit not found.'
            );
        }

        return $this->unitRepository
            ->checkAvailability(
                $unitId
            );
    }

    /*
    |--------------------------------------------------------------------------
    | PRIVATE STATUS VALIDATOR
    |--------------------------------------------------------------------------
    */

    private function validateStatus(
        string $status
    ): void {
        /*
        |--------------------------------------------------------------------------
        | Use statuses defined by the Unit model.
        |--------------------------------------------------------------------------
        */

        $allowedStatuses = Unit::STATUSES;

        /*
        |--------------------------------------------------------------------------
        | Backwards compatibility:
        |
        | Some existing code may still send "inactive".
        |
        | Only keep this if your database enum / migration supports it.
        |--------------------------------------------------------------------------
        */

        if (
            defined(Unit::class . '::STATUS_INACTIVE')
        ) {
            $allowedStatuses[] =
                Unit::STATUS_INACTIVE;
        }

        if (
            !in_array(
                $status,
                $allowedStatuses,
                true
            )
        ) {
            throw new Exception(
                'Invalid unit status.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE PER PAGE
    |--------------------------------------------------------------------------
    */

    private function normalizePerPage(
        int $perPage
    ): int {
        if ($perPage < 1) {
            return 25;
        }

        return min(
            $perPage,
            100
        );
    }
}

