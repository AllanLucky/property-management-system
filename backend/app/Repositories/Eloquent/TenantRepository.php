<?php

namespace App\Repositories\Eloquent;

use App\Repositories\Interfaces\TenantRepositoryInterface;
use App\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Str;

class TenantRepository implements TenantRepositoryInterface
{
    /*
    |--------------------------------------------------------------------------
    | Relations
    |--------------------------------------------------------------------------
    */

    protected array $relations = [
        'tenancies',
    ];

    /*
    |--------------------------------------------------------------------------
    | Listing
    |--------------------------------------------------------------------------
    */

    public function paginate(
        array $filters = []
    ): LengthAwarePaginator {
        $query = Tenant::query()
            ->with($this->relations);

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['search'])) {
            $search = trim(
                $filters['search']
            );

            $query->where(function ($query) use ($search) {

                $query
                    ->where(
                        'tenant_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'first_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'last_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'other_names',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'email',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'id_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'passport_number',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['status'])) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Active
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists(
                'is_active',
                $filters
            )
        ) {
            $query->where(
                'is_active',
                filter_var(
                    $filters['is_active'],
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Verification
        |--------------------------------------------------------------------------
        */

        if (
            array_key_exists(
                'is_verified',
                $filters
            )
        ) {
            $query->where(
                'is_verified',
                filter_var(
                    $filters['is_verified'],
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Gender
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['gender'])) {
            $query->where(
                'gender',
                $filters['gender']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Country
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['country'])) {
            $query->where(
                'country',
                $filters['country']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | County
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['county'])) {
            $query->where(
                'county',
                $filters['county']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | City
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['city'])) {
            $query->where(
                'city',
                $filters['city']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */

        $allowedSorts = [
            'id',
            'tenant_number',
            'first_name',
            'last_name',
            'email',
            'phone',
            'status',
            'is_active',
            'is_verified',
            'created_at',
            'updated_at',
        ];

        $sortBy = $filters['sort_by']
            ?? 'created_at';

        if (!in_array(
            $sortBy,
            $allowedSorts,
            true
        )) {
            $sortBy = 'created_at';
        }

        $sortDirection = strtolower(
            $filters['sort_direction']
                ?? 'desc'
        );

        if (!in_array(
            $sortDirection,
            ['asc', 'desc'],
            true
        )) {
            $sortDirection = 'desc';
        }

        $query->orderBy(
            $sortBy,
            $sortDirection
        );

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */

        $perPage = (int) (
            $filters['per_page']
                ?? 15
        );

        $perPage = max(
            1,
            min($perPage, 100)
        );

        return $query->paginate(
            $perPage
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Find
    |--------------------------------------------------------------------------
    */

    public function find(
        int|string $id
    ): ?Tenant {
        return Tenant::with(
            $this->relations
        )->find($id);
    }

    public function findOrFail(
        int|string $id
    ): Tenant {
        $tenant = $this->find($id);

        if (!$tenant) {
            throw new ModelNotFoundException(
                'Tenant not found.'
            );
        }

        return $tenant;
    }

    public function findByTenantNumber(
        string $tenantNumber
    ): ?Tenant {
        return Tenant::with(
            $this->relations
        )
            ->where(
                'tenant_number',
                $tenantNumber
            )
            ->first();
    }

    public function findByPhone(
        string $phone
    ): ?Tenant {
        return Tenant::where(
            'phone',
            $phone
        )->first();
    }

    public function findByEmail(
        string $email
    ): ?Tenant {
        return Tenant::where(
            'email',
            $email
        )->first();
    }

    public function findByIdNumber(
        string $idNumber
    ): ?Tenant {
        return Tenant::where(
            'id_number',
            $idNumber
        )->first();
    }

    public function findByPassportNumber(
        string $passportNumber
    ): ?Tenant {
        return Tenant::where(
            'passport_number',
            $passportNumber
        )->first();
    }

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    public function create(
        array $data
    ): Tenant {
        if (
            empty(
                $data['tenant_number']
            )
        ) {
            $data['tenant_number'] =
                $this->generateTenantNumber();
        }

        return Tenant::create(
            $data
        )->fresh(
            $this->relations
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    public function update(
        Tenant $tenant,
        array $data
    ): Tenant {
        $tenant->update(
            $data
        );

        return $tenant->fresh(
            $this->relations
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    public function delete(
        Tenant $tenant
    ): bool {
        return (bool) $tenant->delete();
    }

    public function restore(
        int|string $id
    ): ?Tenant {
        $tenant = Tenant::withTrashed()
            ->find($id);

        if (!$tenant) {
            return null;
        }

        $tenant->restore();

        return $tenant->fresh(
            $this->relations
        );
    }

    public function forceDelete(
        int|string $id
    ): bool {
        $tenant = Tenant::withTrashed()
            ->find($id);

        if (!$tenant) {
            return false;
        }

        return (bool) $tenant->forceDelete();
    }

    /*
    |--------------------------------------------------------------------------
    | Status Management
    |--------------------------------------------------------------------------
    */

    public function activate(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' =>
                Tenant::STATUS_ACTIVE,

            'is_active' => true,
        ]);

        return $tenant->fresh(
            $this->relations
        );
    }

    public function deactivate(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' =>
                Tenant::STATUS_INACTIVE,

            'is_active' => false,
        ]);

        return $tenant->fresh(
            $this->relations
        );
    }

    public function blacklist(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' =>
                Tenant::STATUS_BLACKLISTED,

            'is_active' => false,
        ]);

        return $tenant->fresh(
            $this->relations
        );
    }

    public function setPending(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' =>
                Tenant::STATUS_PENDING,

            'is_active' => false,
        ]);

        return $tenant->fresh(
            $this->relations
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Verification
    |--------------------------------------------------------------------------
    */

    public function verify(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'is_verified' => true,
            'verified_at' => now(),
        ]);

        return $tenant->fresh(
            $this->relations
        );
    }

    public function unverify(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'is_verified' => false,
            'verified_at' => null,
        ]);

        return $tenant->fresh(
            $this->relations
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Active / Status Collections
    |--------------------------------------------------------------------------
    */

    public function getActive(): Collection
    {
        return Tenant::active()
            ->with($this->relations)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    public function getInactive(): Collection
    {
        return Tenant::inactive()
            ->with($this->relations)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    public function getPending(): Collection
    {
        return Tenant::pending()
            ->with($this->relations)
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    public function getBlacklisted(): Collection
    {
        return Tenant::blacklisted()
            ->with($this->relations)
            ->orderBy(
                'updated_at',
                'desc'
            )
            ->get();
    }

    public function getVerified(): Collection
    {
        return Tenant::where(
            'is_verified',
            true
        )
            ->with($this->relations)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    public function getUnverified(): Collection
    {
        return Tenant::where(
            'is_verified',
            false
        )
            ->with($this->relations)
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    public function search(
        string $search,
        int $limit = 20
    ): Collection {
        $search = trim($search);

        if ($search === '') {
            return new Collection();
        }

        $limit = max(
            1,
            min($limit, 100)
        );

        return Tenant::query()
            ->with($this->relations)
            ->where(function ($query) use ($search) {

                $query
                    ->where(
                        'tenant_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'first_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'last_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'other_names',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'email',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'phone',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'id_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'passport_number',
                        'like',
                        "%{$search}%"
                    );
            })
            ->orderBy(
                'first_name'
            )
            ->orderBy(
                'last_name'
            )
            ->limit($limit)
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    public function count(): int
    {
        return Tenant::count();
    }

    public function countActive(): int
    {
        return Tenant::active()->count();
    }

    public function countInactive(): int
    {
        return Tenant::inactive()->count();
    }

    public function countPending(): int
    {
        return Tenant::pending()->count();
    }

    public function countBlacklisted(): int
    {
        return Tenant::blacklisted()->count();
    }

    public function countVerified(): int
    {
        return Tenant::where(
            'is_verified',
            true
        )->count();
    }

    public function countUnverified(): int
    {
        return Tenant::where(
            'is_verified',
            false
        )->count();
    }

    public function statistics(): array
    {
        return [
            'total' =>
                $this->count(),

            'active' =>
                $this->countActive(),

            'inactive' =>
                $this->countInactive(),

            'pending' =>
                $this->countPending(),

            'blacklisted' =>
                $this->countBlacklisted(),

            'verified' =>
                $this->countVerified(),

            'unverified' =>
                $this->countUnverified(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Tenant Number
    |--------------------------------------------------------------------------
    */

    public function tenantNumberExists(
        string $tenantNumber
    ): bool {
        return Tenant::withTrashed()
            ->where(
                'tenant_number',
                $tenantNumber
            )
            ->exists();
    }

    public function generateTenantNumber(): string
    {
        do {
            $tenantNumber =
                'TNT-' .
                strtoupper(
                    Str::random(8)
                );
        } while (
            $this->tenantNumberExists(
                $tenantNumber
            )
        );

        return $tenantNumber;
    }
}