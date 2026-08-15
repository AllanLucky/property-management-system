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
    | Used by Unit listing endpoints.
    |
    | IMPORTANT:
    | properties table uses `title`, NOT `name`.
    | apartments table uses `name`.
    |
    */

    protected array $lightRelations = [
        'property:id,title,slug,property_code',
        'apartment:id,name,property_id',
    ];

    /*
    |--------------------------------------------------------------------------
    | FULL RELATIONS
    |--------------------------------------------------------------------------
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
    | PAGINATION
    |--------------------------------------------------------------------------
    */

    protected int $defaultPerPage = 25;

    protected int $maxPerPage = 100;

    /*
    |--------------------------------------------------------------------------
    | BASE QUERY
    |--------------------------------------------------------------------------
    */

    protected function baseQuery(): Builder
    {
        return Unit::query()
            ->with($this->lightRelations);
    }

    /*
    |--------------------------------------------------------------------------
    | LISTING QUERY
    |--------------------------------------------------------------------------
    |
    | Optimized for Unit lists.
    |
    | We use EXISTS instead of loading bookings, tenancies and maintenance
    | collections. This keeps the response lightweight.
    |
    */

    protected function listingQuery(): Builder
    {
        return $this->baseQuery()
            ->withExists([
                /*
                |--------------------------------------------------------------------------
                | BOOKINGS
                |--------------------------------------------------------------------------
                */

                'bookings as has_bookings',

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
                | MAINTENANCE
                |--------------------------------------------------------------------------
                */

                'maintenances as has_maintenance',

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
                | TENANCY
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
    | Backwards-compatible method.
    |
    | For large datasets, use paginate() instead.
    |
    */

    public function all(): Collection
    {
        return $this->listingQuery()
            ->orderByDesc('id')
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | PAGINATE UNITS
    |--------------------------------------------------------------------------
    */

    public function paginate(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {
        $perPage = max(
            1,
            min(
                $perPage ?: $this->defaultPerPage,
                $this->maxPerPage
            )
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
    | FIND UNIT
    |--------------------------------------------------------------------------
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
    */

    public function getByProperty(
        int $propertyId
    ): Collection {
        return $this->listingQuery()
            ->where('property_id', $propertyId)
            ->orderByDesc('id')
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
            ->orderByDesc('id')
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
            ->orderByDesc('id')
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
            ->orderByDesc('id')
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
            ->orderByDesc('id')
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
            ->orderByDesc('id')
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
            ->orderByDesc('id')
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
            min(
                $perPage ?: $this->defaultPerPage,
                $this->maxPerPage
            )
        );

        $search = trim($search);

        $query = $this->listingQuery();

        if ($search !== '') {
            $this->applySearch(
                $query,
                $search
            );
        }

        return $query
            ->paginate($perPage)
            ->withQueryString();
    }

    /*
    |--------------------------------------------------------------------------
    | APPLY SEARCH
    |--------------------------------------------------------------------------
    */

    protected function applySearch(
        Builder $query,
        string $search
    ): Builder {
        return $query->where(function (
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
    | APPLY FILTERS
    |--------------------------------------------------------------------------
    */

    protected function applyFilters(
        Builder $query,
        array $filters
    ): Builder {
        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['search']) &&
            filled($filters['search'])
        ) {
            $this->applySearch(
                $query,
                trim((string) $filters['search'])
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PROPERTY
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
        | APARTMENT
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
        | STATUS
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['status']) &&
            filled($filters['status'])
        ) {
            $status = $filters['status'];

            if (is_array($status)) {
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
        | TYPE
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
        | FLOOR
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
        | BEDROOMS
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
        | FURNISHED
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
        | WIFI
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
        | BALCONY
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
        | AIR CONDITIONING
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
        | MINIMUM PRICE
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
        | MAXIMUM PRICE
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
        | SORTING
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
            min(
                $perPage ?: $this->defaultPerPage,
                $this->maxPerPage
            )
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
    | Uses EXISTS queries and does not load bookings, maintenance or
    | tenancy records into memory.
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
        | ACTIVE BOOKING
        |--------------------------------------------------------------------------
        */

        if (
            $unit->bookings()
                ->whereIn('status', [
                    Booking::STATUS_PENDING,
                    Booking::STATUS_CONFIRMED,
                    Booking::STATUS_APPROVED,
                ])
                ->exists()
        ) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | ACTIVE MAINTENANCE
        |--------------------------------------------------------------------------
        */

        if (
            $unit->maintenances()
                ->whereIn('status', [
                    Maintenance::STATUS_PENDING,
                    Maintenance::STATUS_ASSIGNED,
                    Maintenance::STATUS_IN_PROGRESS,
                    Maintenance::STATUS_ON_HOLD,
                ])
                ->exists()
        ) {
            return false;
        }

        /*
        |--------------------------------------------------------------------------
        | ACTIVE TENANCY
        |--------------------------------------------------------------------------
        */

        if (
            $unit->tenancies()
                ->where(
                    'status',
                    Tenancy::STATUS_ACTIVE
                )
                ->exists()
        ) {
            return false;
        }

        return true;
    }
}

