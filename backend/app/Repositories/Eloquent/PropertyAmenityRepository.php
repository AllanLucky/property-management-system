<?php

namespace App\Repositories\Eloquent;

use App\Models\Property;
use Illuminate\Support\Facades\DB;
use App\Repositories\Interfaces\PropertyAmenityRepositoryInterface;

class PropertyAmenityRepository implements PropertyAmenityRepositoryInterface
{
    /**
     * Attach single amenity to property
     */
    public function attachAmenity(int $propertyId, int $amenityId, array $data = [])
    {
        $property = Property::findOrFail($propertyId);

        $property->amenities()->attach($amenityId, $data);

        return $property->amenities()
            ->where('amenity_id', $amenityId)
            ->first();
    }

    /**
     * Update pivot record (SAFE ELOQUENT VERSION)
     */
    public function updateAmenity(int $propertyId, int $amenityId, array $data)
    {
        $property = Property::findOrFail($propertyId);

        return $property->amenities()
            ->updateExistingPivot($amenityId, array_merge($data, [
                'updated_at' => now()
            ]));
    }

    /**
     * Detach amenity from property
     */
    public function detachAmenity(int $propertyId, int $amenityId)
    {
        $property = Property::findOrFail($propertyId);

        return $property->amenities()->detach($amenityId);
    }

    /**
     * Sync multiple amenities (FULL REPLACE)
     */
    public function syncAmenities(int $propertyId, array $amenities)
    {
        $property = Property::findOrFail($propertyId);

        return $property->amenities()->sync($amenities);
    }

    /**
     * Get amenities by property
     */
    public function getByProperty(int $propertyId)
    {
        return Property::with('amenities')->findOrFail($propertyId)
            ->amenities;
    }
}