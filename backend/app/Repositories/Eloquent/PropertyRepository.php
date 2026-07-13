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
    protected array $lightRelations = ['user'];

    // ❌ REMOVED: images (no longer exists)
    protected array $fullRelations = [
        'user',
        'units',
        'apartments',
        'features'
    ];

    /*
    |--------------------------------------------------------------------------
    | GET ALL
    |--------------------------------------------------------------------------
    */
    public function all(): Collection
    {
        return Property::query()
            ->with($this->lightRelations)
            ->withCount(['units', 'apartments'])
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
        return Property::query()
            ->with($this->fullRelations)
            ->withCount(['units', 'apartments'])
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND BASIC
    |--------------------------------------------------------------------------
    */
    public function find(int $id): ?Property
    {
        return Property::query()
            ->with($this->lightRelations)
            ->withCount(['units', 'apartments'])
            ->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND FULL
    |--------------------------------------------------------------------------
    */
    public function findWithRelations(int $id): ?Property
    {
        return Property::query()
            ->with($this->fullRelations)
            ->withCount(['units', 'apartments'])
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

        return $property->refresh()->load($this->fullRelations);
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
        $property->update(['user_id' => $userId]);

        return $property->refresh()->load($this->fullRelations);
    }

    /*
    |--------------------------------------------------------------------------
    | BY OWNER
    |--------------------------------------------------------------------------
    */
    public function getByOwner(int $userId): Collection
    {
        return Property::query()
            ->with($this->lightRelations)
            ->withCount(['units', 'apartments'])
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
        return Property::query()
            ->with($this->lightRelations)
            ->withCount(['units', 'apartments'])
            ->where('status', $status)
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVE PROPERTIES
    |--------------------------------------------------------------------------
    */
    public function getActive(): Collection
    {
        return Property::query()
            ->with($this->lightRelations)
            ->withCount(['units', 'apartments'])
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
        return Property::query()
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
        return Property::query()
            ->with($this->lightRelations)
            ->withCount(['units'])
            ->whereHas('units', function ($q) {
                $q->where('status', 'vacant');
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
        return Property::query()
            ->with($this->lightRelations)
            ->withCount(['units'])
            ->whereDoesntHave('units', function ($q) {
                $q->where('status', 'vacant');
            })
            ->whereHas('units')
            ->latest()
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | SAFE RELATIONS FILTER
    |--------------------------------------------------------------------------
    */
    public function getWithSafeRelations(array $requested = []): Collection
    {
        $relations = array_intersect($requested, $this->fullRelations);

        return Property::query()
            ->with($relations ?: $this->lightRelations)
            ->withCount(['units', 'apartments'])
            ->latest()
            ->get();
    }
}