<?php

namespace App\Repositories\Eloquent;

use App\Models\Booking;
use App\Models\Maintenance;
use App\Models\Tenancy;
use App\Models\Unit;
use App\Repositories\Interfaces\UnitRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class UnitRepository implements UnitRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | LIGHT RELATIONS
    |--------------------------------------------------------------------------
    |
    | Used for unit listing and lightweight responses.
    |
    | Only select the columns actually needed from related tables.
    |
    */

    protected array $lightRelations = [
        'property:id,name',
        'apartment:id,name,property_id',
    ];

    /*
    |--------------------------------------------------------------------------
    | FULL RELATIONS
    |--------------------------------------------------------------------------
    |
    | Used for unit details, editing and operations where complete
    | relationship information is required.
    |
    */

    protected array $fullRelations = [
        'property',
        'apartment',
        'tenancies.tenant',
        'bookings',
        'maintenances',
    ];

    /*
    |--------------------------------------------------------------------------
    | DEFAULT PER PAGE
    |--------------------------------------------------------------------------
    */

    protected int $defaultPerPage = 25;

    /*
    |--------------------------------------------------------------------------
    | MAX PER PAGE
    |--------------------------------------------------------------------------
    |
    | Prevents a client from requesting thousands of records at once.
    |
    */

    protected int $maxPerPage = 100;

    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    |
    | Centralized lightweight Unit query.
    |
    */

    protected function baseQuery(): Builder
    {
        return Unit::query()
            ->with($this->lightRelations);
    }

    /*
    |--------------------------------------------------------------------------
    | LIST QUERY
    |--------------------------------------------------------------------------
    |
    | Adds lightweight relationship existence flags without loading
    | complete bookings, tenancies or maintenance collections.
    |
    */

    protected function listingQuery(): Builder
    {
        return $this->baseQuery()
            ->withExists([
                /*
                |--------------------------------------------------------------------------
                | Any bookings
                |--------------------------------------------------------------------------
                */

                'bookings as has_bookings',

                /*
                |--------------------------------------------------------------------------
                | Active booking
                |--------------------------------------------------------------------------
                */

                'bookings as has_active_booking' => function (
                    Builder $query
                ): void {
                    $query->whereIn('status', [
                        Booking::STATUS_PENDING,
                        Booking::STATUS_CONFIRMED,
                        Booking::STATUS_APPROVED,
                    ]);
                },

                /*
                |--------------------------------------------------------------------------
                | Any maintenance
                |--------------------------------------------------------------------------
                */

                'maintenances as has_maintenance',

                /*
                |--------------------------------------------------------------------------
                | Active maintenance
                |--------------------------------------------------------------------------
                */

                'maintenances as has_active_maintenance' => function (
                    Builder $query
                ): void {
                    $query->whereIn('status', [
                        Maintenance::STATUS_PENDING,
                        Maintenance::STATUS_ASSIGNED,
                        Maintenance::STATUS_IN_PROGRESS,
                        Maintenance::STATUS_ON_HOLD,
                    ]);
                },

                /*
                |--------------------------------------------------------------------------
                | Active tenancy
                |--------------------------------------------------------------------------
                */

                'tenancies as has_active_tenancy' => function (
                    Builder $query
                ): void {
                    $query->where(
                        'status',
                        Tenancy::STATUS_ACTIVE
                    );
                },
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL UNITS
    |--------------------------------------------------------------------------
    |
    | Kept for backwards compatibility with the existing interface.
    |
    | IMPORTANT:
    |
    | This method should only be used when the application genuinely
    | needs every unit.
    |
    | For normal UI listing, prefer paginate().
    |
    */

    public function all(): Collection
    {
        return $this->listingQuery()
            ->latest('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATE UNITS
    |--------------------------------------------------------------------------
    |
    | Recommended method for the frontend Unit list.
    |
    */

    public function paginate(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = max(
            1,
            min($perPage, $this->maxPerPage)
        );

        $query = $this->listingQuery();

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND UNIT
    |--------------------------------------------------------------------------
    |
    | Detail query.
    |
    */

    public function find(int $id): ?Unit
    {
        return Unit::query()
            ->with($this->fullRelations)
            ->find($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FIND UNIT BY SLUG
    |--------------------------------------------------------------------------
    */

    public function findBySlug(string $slug): ?Unit
    {
        return Unit::query()
            ->with($this->fullRelations)
            ->where('slug', $slug)
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE UNIT
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Unit
    {
        $unit = Unit::create($data);

        return $unit->fresh($this->lightRelations);
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
        $unit = Unit::findOrFail($id);

        $unit->update($data);

        return $unit->fresh($this->fullRelations);
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE UNIT
    |--------------------------------------------------------------------------
    */

    public function delete(int $id): bool
    {
        $unit = Unit::findOrFail($id);

        return (bool) $unit->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE UNIT
    |--------------------------------------------------------------------------
    */

    public function restore(int $id): ?Unit
    {
        $unit = Unit::withTrashed()
            ->find($id);

        if (!$unit) {
            return null;
        }

        $unit->restore();

        return $unit->fresh($this->lightRelations);
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE UNIT
    |--------------------------------------------------------------------------
    */

    public function forceDelete(int $id): bool
    {
        $unit = Unit::withTrashed()
            ->findOrFail($id);

        return (bool) $unit->forceDelete();
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN UNIT TO PROPERTY
    |--------------------------------------------------------------------------
    */

    public function assignToProperty(
        int $unitId,
        int $propertyId
    ): Unit {
        $unit = Unit::findOrFail($unitId);

        $unit->update([
            'property_id' => $propertyId,
        ]);

        return $unit->fresh($this->lightRelations);
    }

    /*
    |--------------------------------------------------------------------------
    | ASSIGN UNIT TO APARTMENT
    |--------------------------------------------------------------------------
    */

    public function assignToApartment(
        int $unitId,
        int $apartmentId
    ): Unit {
        $unit = Unit::findOrFail($unitId);

        $unit->update([
            'apartment_id' => $apartmentId,
        ]);

        return $unit->fresh($this->lightRelations);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS
    |--------------------------------------------------------------------------
    */

    public function updateStatus(
        int $id,
        string $status
    ): Unit {
        $unit = Unit::findOrFail($id);

        $unit->update([
            'status' => $status,
        ]);

        return $unit->fresh($this->lightRelations);
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY PROPERTY
    |--------------------------------------------------------------------------
    |
    | Lightweight query.
    |
    */

    public function getByProperty(
        int $propertyId
    ): Collection {
        return $this->listingQuery()
            ->where('property_id', $propertyId)
            ->latest('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY APARTMENT
    |--------------------------------------------------------------------------
    */

    public function getByApartment(
        int $apartmentId
    ): Collection {
        return $this->listingQuery()
            ->where('apartment_id', $apartmentId)
            ->latest('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET BY STATUS
    |--------------------------------------------------------------------------
    */

    public function getByStatus(
        string $status
    ): Collection {
        return $this->listingQuery()
            ->where('status', $status)
            ->latest('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET VACANT UNITS
    |--------------------------------------------------------------------------
    */

    public function getVacant(): Collection
    {
        return $this->listingQuery()
            ->where(
                'status',
                Unit::STATUS_VACANT
            )
            ->latest('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET OCCUPIED UNITS
    |--------------------------------------------------------------------------
    */

    public function getOccupied(): Collection
    {
        return $this->listingQuery()
            ->where(
                'status',
                Unit::STATUS_OCCUPIED
            )
            ->latest('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET MAINTENANCE UNITS
    |--------------------------------------------------------------------------
    */

    public function getMaintenance(): Collection
    {
        return $this->listingQuery()
            ->where(
                'status',
                Unit::STATUS_MAINTENANCE
            )
            ->latest('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | GET RESERVED UNITS
    |--------------------------------------------------------------------------
    */

    public function getReserved(): Collection
    {
        return $this->listingQuery()
            ->where(
                'status',
                Unit::STATUS_RESERVED
            )
            ->latest('id')
            ->get();
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
        $perPage = max(
            1,
            min($perPage, $this->maxPerPage)
        );

        $search = trim($search);

        $query = $this->listingQuery();

        if ($search !== '') {
            $query->where(function (
                Builder $query
            ) use ($search): void {
                $query
                    ->where('unit_number', 'like', "%{$search}%")
                    ->orWhere('unit_name', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | APPLY FILTERS
    |--------------------------------------------------------------------------
    */

    protected function applyFilters(
        Builder $query,
        array $filters
    ): Builder {

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['search']) &&
            filled($filters['search'])
        ) {
            $search = trim(
                (string) $filters['search']
            );

            $query->where(function (
                Builder $searchQuery
            ) use ($search): void {
                $searchQuery
                    ->where(
                        'unit_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'unit_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'type',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'slug',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Property
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['property_id']) &&
            is_numeric($filters['property_id'])
        ) {
            $query->where(
                'property_id',
                (int) $filters['property_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Apartment
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['apartment_id']) &&
            is_numeric($filters['apartment_id'])
        ) {
            $query->where(
                'apartment_id',
                (int) $filters['apartment_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['status']) &&
            filled($filters['status'])
        ) {
            $status = $filters['status'];

            if (
                is_array($status)
            ) {
                $query->whereIn(
                    'status',
                    $status
                );
            } else {
                $query->where(
                    'status',
                    $status
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Type
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['type']) &&
            filled($filters['type'])
        ) {
            $query->where(
                'type',
                $filters['type']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Floor
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['floor']) &&
            is_numeric($filters['floor'])
        ) {
            $query->where(
                'floor',
                (int) $filters['floor']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Bedrooms
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['bedrooms']) &&
            is_numeric($filters['bedrooms'])
        ) {
            $query->where(
                'bedrooms',
                (int) $filters['bedrooms']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Furnished
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists(
                'has_furnished',
                $filters
            ) &&
            $filters['has_furnished'] !== null &&
            $filters['has_furnished'] !== ''
        ) {
            $query->where(
                'has_furnished',
                filter_var(
                    $filters['has_furnished'],
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | WiFi
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists(
                'has_wifi',
                $filters
            ) &&
            $filters['has_wifi'] !== null &&
            $filters['has_wifi'] !== ''
        ) {
            $query->where(
                'has_wifi',
                filter_var(
                    $filters['has_wifi'],
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Balcony
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists(
                'has_balcony',
                $filters
            ) &&
            $filters['has_balcony'] !== null &&
            $filters['has_balcony'] !== ''
        ) {
            $query->where(
                'has_balcony',
                filter_var(
                    $filters['has_balcony'],
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Air Conditioning
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists(
                'has_air_conditioning',
                $filters
            ) &&
            $filters['has_air_conditioning'] !== null &&
            $filters['has_air_conditioning'] !== ''
        ) {
            $query->where(
                'has_air_conditioning',
                filter_var(
                    $filters['has_air_conditioning'],
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Minimum Price
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['min_price']) &&
            is_numeric($filters['min_price'])
        ) {
            $query->where(
                'price',
                '>=',
                (float) $filters['min_price']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Maximum Price
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['max_price']) &&
            is_numeric($filters['max_price'])
        ) {
            $query->where(
                'price',
                '<=',
                (float) $filters['max_price']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */

        $allowedSorts = [
            'id',
            'unit_number',
            'unit_name',
            'price',
            'status',
            'floor',
            'created_at',
            'updated_at',
        ];

        $sortBy = $filters['sort_by'] ?? 'id';

        if (
            !in_array(
                $sortBy,
                $allowedSorts,
                true
            )
        ) {
            $sortBy = 'id';
        }

        $sortDirection = strtolower(
            (string) (
                $filters['sort_direction'] ?? 'desc'
            )
        );

        if (
            !in_array(
                $sortDirection,
                ['asc', 'desc'],
                true
            )
        ) {
            $sortDirection = 'desc';
        }

        $query->orderBy(
            $sortBy,
            $sortDirection
        );

        return $query;
    }

    /*
    |--------------------------------------------------------------------------
    | FILTERED UNITS
    |--------------------------------------------------------------------------
    */

    public function filter(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {
        $perPage = max(
            1,
            min($perPage, $this->maxPerPage)
        );

        $query = $this->listingQuery();

        $this->applyFilters(
            $query,
            $filters
        );

        return $query
            ->paginate($perPage)
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD STATS BY PROPERTY
    |--------------------------------------------------------------------------
    |
    | Uses independent COUNT queries.
    |
    | No Unit models or relationships are loaded.
    |
    */

    public function statsByProperty(
        int $propertyId
    ): array {
        $query = Unit::query()
            ->where(
                'property_id',
                $propertyId
            );

        return [
            'total' => (clone $query)->count(),

            'occupied' => (clone $query)
                ->where(
                    'status',
                    Unit::STATUS_OCCUPIED
                )
                ->count(),

            'vacant' => (clone $query)
                ->where(
                    'status',
                    Unit::STATUS_VACANT
                )
                ->count(),

            'maintenance' => (clone $query)
                ->where(
                    'status',
                    Unit::STATUS_MAINTENANCE
                )
                ->count(),

            'reserved' => (clone $query)
                ->where(
                    'status',
                    Unit::STATUS_RESERVED
                )
                ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | GLOBAL DASHBOARD STATS
    |--------------------------------------------------------------------------
    */

    public function stats(): array
    {
        $query = Unit::query();

        return [
            'total' => (clone $query)->count(),

            'occupied' => (clone $query)
                ->where(
                    'status',
                    Unit::STATUS_OCCUPIED
                )
                ->count(),

            'vacant' => (clone $query)
                ->where(
                    'status',
                    Unit::STATUS_VACANT
                )
                ->count(),

            'maintenance' => (clone $query)
                ->where(
                    'status',
                    Unit::STATUS_MAINTENANCE
                )
                ->count(),

            'reserved' => (clone $query)
                ->where(
                    'status',
                    Unit::STATUS_RESERVED
                )
                ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK AVAILABILITY
    |--------------------------------------------------------------------------
    |
    | Fast database existence check.
    |
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
            return false;
        }

        if (
            $unit->status !== Unit::STATUS_VACANT
        ) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | Active booking
        |--------------------------------------------------------------------------
        */

        $hasActiveBooking = $unit->bookings()
            ->whereIn('status', [
                Booking::STATUS_PENDING,
                Booking::STATUS_CONFIRMED,
                Booking::STATUS_APPROVED,
            ])
            ->exists();

        if ($hasActiveBooking) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | Active maintenance
        |--------------------------------------------------------------------------
        */

        $hasActiveMaintenance = $unit->maintenances()
            ->whereIn('status', [
                Maintenance::STATUS_PENDING,
                Maintenance::STATUS_ASSIGNED,
                Maintenance::STATUS_IN_PROGRESS,
                Maintenance::STATUS_ON_HOLD,
            ])
            ->exists();

        if ($hasActiveMaintenance) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | Active tenancy
        |--------------------------------------------------------------------------
        */

        $hasActiveTenancy = $unit->tenancies()
            ->where(
                'status',
                Tenancy::STATUS_ACTIVE
            )
            ->exists();

        return !$hasActiveTenancy;
    }
}

