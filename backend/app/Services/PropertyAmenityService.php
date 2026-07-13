<?php

namespace App\Services;

use App\Repositories\Interfaces\PropertyAmenityRepositoryInterface;
use App\Models\Property;
use App\Models\Amenity;
use App\Notifications\Amenity\PropertyAmenityNotification;
use App\Models\User;

class PropertyAmenityService
{
    protected PropertyAmenityRepositoryInterface $repo;

    public function __construct(PropertyAmenityRepositoryInterface $repo)
    {
        $this->repo = $repo;
    }

    /*
    |--------------------------------------------------------------------------
    | ATTACH AMENITY
    |--------------------------------------------------------------------------
    */
    public function attachAmenity(
        Property $property,
        Amenity $amenity,
        array $data = [],
        ?User $actor = null
    ) {
        $this->repo->attachAmenity(
            $property->id,
            $amenity->id,
            $data
        );

        $this->notify($property, $amenity, 'created', $actor);

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PIVOT DATA
    |--------------------------------------------------------------------------
    */
    public function updateAmenity(
        Property $property,
        Amenity $amenity,
        array $data = [],
        ?User $actor = null
    ) {
        // safer + consistent update (no pivot ID needed)
        $this->repo->updateByPropertyAndAmenity(
            $property->id,
            $amenity->id,
            $data
        );

        $this->notify($property, $amenity, 'updated', $actor);

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE AMENITY
    |--------------------------------------------------------------------------
    */
    public function detachAmenity(
        Property $property,
        Amenity $amenity,
        ?User $actor = null
    ) {
        $this->repo->detachAmenity(
            $property->id,
            $amenity->id
        );

        $this->notify($property, $amenity, 'removed', $actor);

        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | SYNC MULTIPLE
    |--------------------------------------------------------------------------
    */
    public function syncAmenities(Property $property, array $amenities)
    {
        return $this->repo->syncAmenities(
            $property->id,
            $amenities
        );
    }

    /*
    |--------------------------------------------------------------------------
    | GET PROPERTY AMENITIES
    |--------------------------------------------------------------------------
    */
    public function getAmenities(Property $property)
    {
        return $this->repo->getByProperty($property->id);
    }

    /*
    |--------------------------------------------------------------------------
    | NOTIFICATIONS
    |--------------------------------------------------------------------------
    */
    private function notify(Property $property, Amenity $amenity, string $action, ?User $actor = null)
    {
        if ($property->owner) {
            $property->owner->notify(
                new PropertyAmenityNotification(
                    $property,
                    $amenity,
                    $action,
                    $actor
                )
            );
        }
    }
}