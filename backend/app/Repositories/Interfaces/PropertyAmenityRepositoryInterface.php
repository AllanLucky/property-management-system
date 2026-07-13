<?php

namespace App\Repositories\Interfaces;

interface PropertyAmenityRepositoryInterface
{
    /**
     * Attach a single amenity to a property
     */
    public function attachAmenity(int $propertyId, int $amenityId, array $data = []);

    /**
     * Update pivot data for a specific amenity on a property
     */
    public function updateAmenity(int $propertyId, int $amenityId, array $data);

    /**
     * Remove amenity from property
     */
    public function detachAmenity(int $propertyId, int $amenityId);

    /**
     * Sync multiple amenities (replace all)
     */
    public function syncAmenities(int $propertyId, array $amenities);

    /**
     * Get all amenities for a property
     */
    public function getByProperty(int $propertyId);
}