<?php

namespace App\Repositories\Eloquent;

use App\Models\Property;
use App\Repositories\Interfaces\PropertyRepositoryInterface;
use Illuminate\Support\Collection;

class PropertyRepository implements PropertyRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | RELATIONS
    |--------------------------------------------------------------------------
    */

    protected array $lightRelations = [
        'user',
    ];

    protected array $fullRelations = [
        'user',
        'propertyType',
        'propertyCategory',
        'features',
        'apartments',
        'apartments.units', // <-- IMPORTANT
        'units',
    ];

    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    protected function baseQuery()
    {
        return Property::query()->withCount([
            'apartments',
            'units',

            'units as occupied_units_count' => function ($query) {
                $query->where('status', 'occupied');
            },

            'units as vacant_units_count' => function ($query) {
                $query->where('status', 'vacant');
            },

            'units as maintenance_units_count' => function ($query) {
                $query->where('status', 'maintenance');
            },

            'units as reserved_units_count' => function ($query) {
                $query->where('status', 'reserved');
            },
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */

    public function all(): Collection
    {
        return $this->baseQuery()
            ->with($this->lightRelations)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL WITH RELATIONS
    |--------------------------------------------------------------------------
    */

    public function allWithRelations(): Collection
    {
        return $this->baseQuery()
            ->with($this->fullRelations)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND
    |--------------------------------------------------------------------------
    */

    public function find(int $id): ?Property
    {
        return $this->baseQuery()
            ->with($this->lightRelations)
            ->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND WITH RELATIONS
    |--------------------------------------------------------------------------
    */

    public function findWithRelations(int $id): ?Property
    {
        return $this->baseQuery()
            ->with($this->fullRelations)
            ->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Property
    {
        return Property::create($data);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(int $id, array $data): Property
    {
        $property = Property::findOrFail($id);

        $property->update($data);

        return $property
            ->refresh()
            ->load($this->fullRelations)
            ->loadCount([
                'apartments',
                'units',
                'units as occupied_units_count' => fn($q) => $q->where('status', 'occupied'),
                'units as vacant_units_count' => fn($q) => $q->where('status', 'vacant'),
                'units as maintenance_units_count' => fn($q) => $q->where('status', 'maintenance'),
                'units as reserved_units_count' => fn($q) => $q->where('status', 'reserved'),
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function delete(int $id): bool
    {
        return (bool) Property::findOrFail($id)->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN OWNER
    |--------------------------------------------------------------------------
    */

    public function assignOwner(int $propertyId, int $userId): Property
    {
        $property = Property::findOrFail($propertyId);

        $property->update([
            'user_id' => $userId,
        ]);

        return $property
            ->refresh()
            ->load($this->fullRelations)
            ->loadCount([
                'apartments',
                'units',
                'units as occupied_units_count' => fn($q) => $q->where('status', 'occupied'),
                'units as vacant_units_count' => fn($q) => $q->where('status', 'vacant'),
                'units as maintenance_units_count' => fn($q) => $q->where('status', 'maintenance'),
                'units as reserved_units_count' => fn($q) => $q->where('status', 'reserved'),
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | BY OWNER
    |--------------------------------------------------------------------------
    */

    public function getByOwner(int $userId): Collection
    {
        return $this->baseQuery()
            ->with($this->lightRelations)
            ->where('user_id', $userId)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | BY STATUS
    |--------------------------------------------------------------------------
    */

    public function getByStatus(string $status): Collection
    {
        return $this->baseQuery()
            ->with($this->lightRelations)
            ->where('status', $status)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE
    |--------------------------------------------------------------------------
    */

    public function getActive(): Collection
    {
        return $this->baseQuery()
            ->with($this->lightRelations)
            ->where('is_published', true)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | FEATURED
    |--------------------------------------------------------------------------
    */

    public function getFeatured(): Collection
    {
        return $this->baseQuery()
            ->with($this->lightRelations)
            ->where('is_featured', true)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | VACANT
    |--------------------------------------------------------------------------
    */

    public function getVacant(): Collection
    {
        return $this->baseQuery()
            ->with($this->lightRelations)
            ->whereHas('units', function ($query) {
                $query->where('status', 'vacant');
            })
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | FULLY OCCUPIED
    |--------------------------------------------------------------------------
    */

    public function getFullyOccupied(): Collection
    {
        return $this->baseQuery()
            ->with($this->lightRelations)
            ->whereDoesntHave('units', function ($query) {
                $query->where('status', 'vacant');
            })
            ->whereHas('units')
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | SAFE RELATIONS
    |--------------------------------------------------------------------------
    */

    public function getWithSafeRelations(array $requested = []): Collection
    {
        $relations = array_intersect($requested, $this->fullRelations);

        return $this->baseQuery()
            ->with(!empty($relations) ? $relations : $this->lightRelations)
            ->latest()
            ->get();
    }
}