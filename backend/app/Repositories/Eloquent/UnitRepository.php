<?php

namespace App\Repositories\Eloquent;

use App\Models\Unit;
use App\Repositories\Interfaces\UnitRepositoryInterface;
use Illuminate\Support\Collection;

class UnitRepository implements UnitRepositoryInterface
{
    /*
    |----------------------------------------------------------------------
    | LIGHT RELATIONS (FAST LISTING)
    |----------------------------------------------------------------------
    */
    protected array $lightRelations = [
        'property',
    ];

    /*
    |----------------------------------------------------------------------
    | FULL RELATIONS (USE ONLY FOR DETAIL PAGE)
    |----------------------------------------------------------------------
    */
    protected array $fullRelations = [
        'property',
        'tenancies',
        'bookings',
        'maintenances',
        'apartment',
    ];

    /*
    |----------------------------------------------------------------------
    | GET ALL UNITS (FAST - LIST PAGE)
    |----------------------------------------------------------------------
    */
    public function all(): Collection
    {
        return Unit::with($this->lightRelations)
            ->withCount([
                'tenancies',
                'bookings',
                'maintenances',
            ])
            ->latest()
            ->get();
    }

    /*
    |----------------------------------------------------------------------
    | FIND UNIT (DETAIL SAFE)
    |----------------------------------------------------------------------
    */
    public function find(int $id): ?Unit
    {
        return Unit::with($this->fullRelations)
            ->find($id);
    }

    /*
    |----------------------------------------------------------------------
    | CREATE UNIT
    |----------------------------------------------------------------------
    */
    public function create(array $data): Unit
    {
        return Unit::create($data);
    }

    /*
    |----------------------------------------------------------------------
    | UPDATE UNIT
    |----------------------------------------------------------------------
    */
    public function update(int $id, array $data): Unit
    {
        $unit = Unit::findOrFail($id);

        $unit->update($data);

        return $unit->fresh($this->fullRelations);
    }

    /*
    |----------------------------------------------------------------------
    | DELETE UNIT
    |----------------------------------------------------------------------
    */
    public function delete(int $id): bool
    {
        $unit = Unit::findOrFail($id);

        return (bool) $unit->delete();
    }

    /*
    |----------------------------------------------------------------------
    | ASSIGN UNIT TO PROPERTY
    |----------------------------------------------------------------------
    */
    public function assignToProperty(int $unitId, int $propertyId): Unit
    {
        $unit = Unit::findOrFail($unitId);

        $unit->update([
            'property_id' => $propertyId
        ]);

        return $unit->fresh($this->lightRelations);
    }

    /*
    |----------------------------------------------------------------------
    | GET BY PROPERTY (FAST)
    |----------------------------------------------------------------------
    */
    public function getByProperty(int $propertyId): Collection
    {
        return Unit::with($this->lightRelations)
            ->withCount([
                'tenancies',
                'bookings',
            ])
            ->where('property_id', $propertyId)
            ->latest()
            ->get();
    }

    /*
    |----------------------------------------------------------------------
    | GET BY STATUS (FAST)
    |----------------------------------------------------------------------
    */
    public function getByStatus(string $status): Collection
    {
        return Unit::with($this->lightRelations)
            ->where('status', $status)
            ->latest()
            ->get();
    }

    /*
    |----------------------------------------------------------------------
    | OPTIONAL: DASHBOARD STATS QUERY (VERY FAST)
    |----------------------------------------------------------------------
    */
    public function statsByProperty(int $propertyId): array
    {
        $units = Unit::where('property_id', $propertyId);

        return [
            'total' => (clone $units)->count(),
            'occupied' => (clone $units)->occupied()->count(),
            'vacant' => (clone $units)->vacant()->count(),
            'maintenance' => (clone $units)->maintenance()->count(),
        ];
    }
}