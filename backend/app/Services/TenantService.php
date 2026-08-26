<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;

class TenantService
{
    /*
    |--------------------------------------------------------------------------
    | Relationship Loading
    |--------------------------------------------------------------------------
    */

    /**
     * Relationships required by TenantResource.
     *
     * Tenant
     *   ├── User
     *   └── Tenancies
     *        ├── Property
     *        ├── Apartment
     *        └── Unit
     */
    protected function tenantRelations(): array
    {
        return [
            'user',

            'tenancies.property',
            'tenancies.apartment',
            'tenancies.unit',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Base Tenant Query
    |--------------------------------------------------------------------------
    */

    /**
     * Get the base tenant query.
     *
     * IMPORTANT:
     * Only tenants that have a valid user_id are returned.
     *
     * This prevents API responses such as:
     *
     * "user_id": null,
     * "user": null
     *
     * from appearing in the normal tenant API.
     */
    protected function tenantQuery()
    {
        return Tenant::query()
            ->whereNotNull('user_id')
            ->with($this->tenantRelations());
    }

    /*
    |--------------------------------------------------------------------------
    | Tenant Listing
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated tenants.
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $query = $this->tenantQuery()

            /*
            |--------------------------------------------------------------------------
            | Search
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['search']),
                function ($query) use ($filters) {
                    $search = trim($filters['search']);

                    $query->where(function ($query) use ($search) {
                        $query
                            ->where('tenant_number', 'like', "%{$search}%")
                            ->orWhere('first_name', 'like', "%{$search}%")
                            ->orWhere('last_name', 'like', "%{$search}%")
                            ->orWhere('other_names', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone', 'like', "%{$search}%")
                            ->orWhere('id_number', 'like', "%{$search}%")
                            ->orWhere('passport_number', 'like', "%{$search}%")

                            // Location search
                            ->orWhere('country', 'like', "%{$search}%")
                            ->orWhere('region', 'like', "%{$search}%")
                            ->orWhere('county', 'like', "%{$search}%")
                            ->orWhere('city', 'like', "%{$search}%")
                            ->orWhere('area', 'like', "%{$search}%")
                            ->orWhere('postal_code', 'like', "%{$search}%")
                            ->orWhere('address', 'like', "%{$search}%");
                    });
                }
            )

            /*
            |--------------------------------------------------------------------------
            | User ID
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['user_id']),
                fn ($query) =>
                    $query->where(
                        'user_id',
                        $filters['user_id']
                    )
            )

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['status']),
                fn ($query) =>
                    $query->where(
                        'status',
                        $filters['status']
                    )
            )

            /*
            |--------------------------------------------------------------------------
            | Active Filter
            |--------------------------------------------------------------------------
            |
            | The current tenants table derives active state from status.
            | We intentionally do NOT query tenants.is_active.
            |
            */

            ->when(
                isset($filters['is_active']),
                function ($query) use ($filters) {
                    $value = filter_var(
                        $filters['is_active'],
                        FILTER_VALIDATE_BOOLEAN,
                        FILTER_NULL_ON_FAILURE
                    );

                    if ($value !== null) {
                        if ($value) {
                            $query->where(
                                'status',
                                Tenant::STATUS_ACTIVE
                            );
                        } else {
                            $query->where(
                                'status',
                                '!=',
                                Tenant::STATUS_ACTIVE
                            );
                        }
                    }
                }
            )

            /*
            |--------------------------------------------------------------------------
            | Gender
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['gender']),
                fn ($query) =>
                    $query->where(
                        'gender',
                        $filters['gender']
                    )
            )

            /*
            |--------------------------------------------------------------------------
            | Country
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['country']),
                fn ($query) =>
                    $query->where(
                        'country',
                        $filters['country']
                    )
            )

            /*
            |--------------------------------------------------------------------------
            | Region
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['region']),
                fn ($query) =>
                    $query->where(
                        'region',
                        $filters['region']
                    )
            )

            /*
            |--------------------------------------------------------------------------
            | County
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['county']),
                fn ($query) =>
                    $query->where(
                        'county',
                        $filters['county']
                    )
            )

            /*
            |--------------------------------------------------------------------------
            | City
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['city']),
                fn ($query) =>
                    $query->where(
                        'city',
                        $filters['city']
                    )
            )

            /*
            |--------------------------------------------------------------------------
            | Area
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['area']),
                fn ($query) =>
                    $query->where(
                        'area',
                        $filters['area']
                    )
            )

            /*
            |--------------------------------------------------------------------------
            | Postal Code
            |--------------------------------------------------------------------------
            */

            ->when(
                !empty($filters['postal_code']),
                fn ($query) =>
                    $query->where(
                        'postal_code',
                        $filters['postal_code']
                    )
            )

            /*
            |--------------------------------------------------------------------------
            | Verification
            |--------------------------------------------------------------------------
            */

            ->when(
                isset($filters['is_verified']),
                function ($query) use ($filters) {
                    $value = filter_var(
                        $filters['is_verified'],
                        FILTER_VALIDATE_BOOLEAN,
                        FILTER_NULL_ON_FAILURE
                    );

                    if ($value !== null) {
                        $query->where(
                            'is_verified',
                            $value
                        );
                    }
                }
            );

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */

        $allowedSorts = [
            'id',
            'user_id',
            'tenant_number',
            'first_name',
            'last_name',
            'email',
            'phone',
            'country',
            'region',
            'county',
            'city',
            'area',
            'status',
            'is_verified',
            'created_at',
            'updated_at',
        ];

        $sortBy = $filters['sort_by'] ?? 'created_at';

        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }

        $sortDirection = strtolower(
            $filters['sort_direction'] ?? 'desc'
        );

        if (!in_array($sortDirection, ['asc', 'desc'], true)) {
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
            $filters['per_page'] ?? 15
        );

        $perPage = max(
            1,
            min($perPage, 100)
        );

        return $query->paginate($perPage);
    }

    /*
    |--------------------------------------------------------------------------
    | Find Tenant
    |--------------------------------------------------------------------------
    */

    /**
     * Find tenant by ID.
     *
     * Only tenants with user_id are returned.
     */
    public function find(
        int|string $id
    ): Tenant {
        $tenant = $this->tenantQuery()
            ->whereNotNull('user_id')
            ->find($id);

        if (!$tenant) {
            throw new ModelNotFoundException(
                'Tenant not found or tenant does not have a linked user account.'
            );
        }

        return $tenant;
    }

    /**
     * Find tenant by tenant number.
     */
    public function findByTenantNumber(
        string $tenantNumber
    ): Tenant {
        $tenant = $this->tenantQuery()
            ->where(
                'tenant_number',
                $tenantNumber
            )
            ->first();

        if (!$tenant) {
            throw new ModelNotFoundException(
                'Tenant not found or tenant does not have a linked user account.'
            );
        }

        return $tenant;
    }

    /**
     * Find tenant by phone.
     */
    public function findByPhone(
        string $phone
    ): ?Tenant {
        return $this->tenantQuery()
            ->where(
                'phone',
                $phone
            )
            ->first();
    }

    /**
     * Find tenant by email.
     */
    public function findByEmail(
        string $email
    ): ?Tenant {
        return $this->tenantQuery()
            ->where(
                'email',
                $email
            )
            ->first();
    }

    /**
     * Find tenant by user ID.
     */
    public function findByUserId(
        int|string $userId
    ): ?Tenant {
        return $this->tenantQuery()
            ->where(
                'user_id',
                $userId
            )
            ->first();
    }

    /*
    |--------------------------------------------------------------------------
    | Create
    |--------------------------------------------------------------------------
    */

    /**
     * Create a tenant.
     *
     * A tenant MUST have a user_id.
     */
    public function create(
        array $data,
        ?UploadedFile $photo = null,
        ?UploadedFile $idFront = null,
        ?UploadedFile $idBack = null
    ): Tenant {
        return DB::transaction(function () use (
            $data,
            $photo,
            $idFront,
            $idBack
        ) {

            /*
            |--------------------------------------------------------------------------
            | User ID
            |--------------------------------------------------------------------------
            |
            | Tenant must be linked to an existing User.
            |
            */

            if (
                !isset($data['user_id']) ||
                empty($data['user_id'])
            ) {
                throw new RuntimeException(
                    'A valid user_id is required when creating a tenant.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
            */

            if (empty($data['tenant_number'])) {
                $data['tenant_number'] =
                    $this->generateTenantNumber();
            }

            /*
            |--------------------------------------------------------------------------
            | Defaults
            |--------------------------------------------------------------------------
            */

            $data['country'] =
                $data['country'] ?? 'Kenya';

            $data['status'] =
                $data['status']
                ?? Tenant::STATUS_PENDING;

            /*
            |--------------------------------------------------------------------------
            | Remove Non-existent is_active Column
            |--------------------------------------------------------------------------
            */

            unset(
                $data['is_active']
            );

            /*
            |--------------------------------------------------------------------------
            | Verification
            |--------------------------------------------------------------------------
            */

            $data['is_verified'] =
                $data['is_verified'] ?? false;

            if (!$data['is_verified']) {
                $data['verified_at'] = null;
            }

            /*
            |--------------------------------------------------------------------------
            | Create Tenant
            |--------------------------------------------------------------------------
            */

            $tenant = Tenant::create($data);

            /*
            |--------------------------------------------------------------------------
            | Upload Photo
            |--------------------------------------------------------------------------
            */

            if ($photo) {
                $this->uploadPhoto(
                    $tenant,
                    $photo
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Upload Front ID
            |--------------------------------------------------------------------------
            */

            if ($idFront) {
                $this->uploadIdFront(
                    $tenant,
                    $idFront
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Upload Back ID
            |--------------------------------------------------------------------------
            */

            if ($idBack) {
                $this->uploadIdBack(
                    $tenant,
                    $idBack
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Return Fresh Tenant With User
            |--------------------------------------------------------------------------
            */

            return $tenant->fresh(
                $this->tenantRelations()
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    /**
     * Update tenant.
     *
     * user_id cannot be changed to null.
     */
    public function update(
        Tenant $tenant,
        array $data,
        ?UploadedFile $photo = null,
        ?UploadedFile $idFront = null,
        ?UploadedFile $idBack = null
    ): Tenant {
        return DB::transaction(function () use (
            $tenant,
            $data,
            $photo,
            $idFront,
            $idBack
        ) {

            /*
            |--------------------------------------------------------------------------
            | Tenant Number
            |--------------------------------------------------------------------------
            |
            | Tenant numbers cannot be changed.
            |
            */

            unset(
                $data['tenant_number']
            );

            /*
            |--------------------------------------------------------------------------
            | Protect user_id
            |--------------------------------------------------------------------------
            |
            | Existing tenant must always have a user.
            |
            */

            if (
                array_key_exists(
                    'user_id',
                    $data
                )
            ) {
                if (
                    empty($data['user_id'])
                ) {
                    throw new RuntimeException(
                        'A valid user_id is required for every tenant.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Protect is_active
            |--------------------------------------------------------------------------
            */

            unset(
                $data['is_active']
            );

            /*
            |--------------------------------------------------------------------------
            | Verification
            |--------------------------------------------------------------------------
            */

            if (
                array_key_exists(
                    'is_verified',
                    $data
                )
            ) {
                if ($data['is_verified']) {
                    $data['verified_at'] =
                        $data['verified_at']
                        ?? now();
                } else {
                    $data['verified_at'] = null;
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Update Tenant
            |--------------------------------------------------------------------------
            */

            $tenant->update($data);

            /*
            |--------------------------------------------------------------------------
            | Upload Photo
            |--------------------------------------------------------------------------
            */

            if ($photo) {
                $this->uploadPhoto(
                    $tenant,
                    $photo
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Upload Front ID
            |--------------------------------------------------------------------------
            */

            if ($idFront) {
                $this->uploadIdFront(
                    $tenant,
                    $idFront
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Upload Back ID
            |--------------------------------------------------------------------------
            */

            if ($idBack) {
                $this->uploadIdBack(
                    $tenant,
                    $idBack
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Return Fresh Tenant
            |--------------------------------------------------------------------------
            */

            return $tenant->fresh(
                $this->tenantRelations()
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Delete
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete tenant.
     */
    public function delete(
        Tenant $tenant
    ): bool {
        return DB::transaction(function () use ($tenant) {

            $hasActiveTenancy = $tenant
                ->tenancies()
                ->where(
                    'status',
                    'active'
                )
                ->exists();

            if ($hasActiveTenancy) {
                throw new RuntimeException(
                    'This tenant cannot be deleted because they have an active tenancy.'
                );
            }

            return (bool) $tenant->delete();
        });
    }

    /**
     * Restore tenant.
     */
    public function restore(
        int|string $id
    ): Tenant {
        $tenant = Tenant::withTrashed()
            ->whereNotNull('user_id')
            ->find($id);

        if (!$tenant) {
            throw new ModelNotFoundException(
                'Tenant not found.'
            );
        }

        $tenant->restore();

        return $tenant->fresh(
            $this->tenantRelations()
        );
    }

    /**
     * Permanently delete tenant.
     */
    public function forceDelete(
        int|string $id
    ): bool {
        $tenant = Tenant::withTrashed()
            ->whereNotNull('user_id')
            ->find($id);

        if (!$tenant) {
            throw new ModelNotFoundException(
                'Tenant not found.'
            );
        }

        if (
            $tenant->tenancies()
                ->where(
                    'status',
                    'active'
                )
                ->exists()
        ) {
            throw new RuntimeException(
                'This tenant cannot be permanently deleted because they have an active tenancy.'
            );
        }

        $this->deleteTenantDocuments(
            $tenant
        );

        return (bool) $tenant->forceDelete();
    }

    /*
    |--------------------------------------------------------------------------
    | Status Management
    |--------------------------------------------------------------------------
    */

    /**
     * Activate tenant.
     */
    public function activate(
        Tenant $tenant
    ): Tenant {
        if (!$this->canActivate($tenant)) {
            throw new RuntimeException(
                'This tenant cannot be activated because they are blacklisted.'
            );
        }

        $tenant->update([
            'status' => Tenant::STATUS_ACTIVE,
        ]);

        return $tenant->fresh(
            $this->tenantRelations()
        );
    }

    /**
     * Deactivate tenant.
     */
    public function deactivate(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' => Tenant::STATUS_INACTIVE,
        ]);

        return $tenant->fresh(
            $this->tenantRelations()
        );
    }

    /**
     * Blacklist tenant.
     */
    public function blacklist(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' => Tenant::STATUS_BLACKLISTED,
        ]);

        return $tenant->fresh(
            $this->tenantRelations()
        );
    }

    /**
     * Set tenant to pending.
     */
    public function setPending(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' => Tenant::STATUS_PENDING,
        ]);

        return $tenant->fresh(
            $this->tenantRelations()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Verification
    |--------------------------------------------------------------------------
    */

    /**
     * Verify tenant.
     */
    public function verify(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'is_verified' => true,
            'verified_at' => now(),
        ]);

        return $tenant->fresh(
            $this->tenantRelations()
        );
    }

    /**
     * Unverify tenant.
     */
    public function unverify(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'is_verified' => false,
            'verified_at' => null,
        ]);

        return $tenant->fresh(
            $this->tenantRelations()
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Documents
    |--------------------------------------------------------------------------
    */

    /**
     * Upload tenant photo.
     */
    public function uploadPhoto(
        Tenant $tenant,
        UploadedFile $file
    ): Tenant {
        return DB::transaction(function () use (
            $tenant,
            $file
        ) {

            if ($tenant->photo) {
                $this->deleteFile(
                    $tenant->photo
                );
            }

            $path = $file->store(
                'tenants/photos',
                'public'
            );

            $tenant->update([
                'photo' => $path,
                'photo_public_id' => null,
            ]);

            return $tenant->fresh(
                $this->tenantRelations()
            );
        });
    }

    /**
     * Upload front ID.
     */
    public function uploadIdFront(
        Tenant $tenant,
        UploadedFile $file
    ): Tenant {
        return DB::transaction(function () use (
            $tenant,
            $file
        ) {

            if ($tenant->id_front) {
                $this->deleteFile(
                    $tenant->id_front
                );
            }

            $path = $file->store(
                'tenants/documents',
                'public'
            );

            $tenant->update([
                'id_front' => $path,
                'id_front_public_id' => null,
            ]);

            return $tenant->fresh(
                $this->tenantRelations()
            );
        });
    }

    /**
     * Upload back ID.
     */
    public function uploadIdBack(
        Tenant $tenant,
        UploadedFile $file
    ): Tenant {
        return DB::transaction(function () use (
            $tenant,
            $file
        ) {

            if ($tenant->id_back) {
                $this->deleteFile(
                    $tenant->id_back
                );
            }

            $path = $file->store(
                'tenants/documents',
                'public'
            );

            $tenant->update([
                'id_back' => $path,
                'id_back_public_id' => null,
            ]);

            return $tenant->fresh(
                $this->tenantRelations()
            );
        });
    }

    /**
     * Delete tenant documents.
     */
    public function deleteTenantDocuments(
        Tenant $tenant
    ): void {
        if ($tenant->photo) {
            $this->deleteFile(
                $tenant->photo
            );
        }

        if ($tenant->id_front) {
            $this->deleteFile(
                $tenant->id_front
            );
        }

        if ($tenant->id_back) {
            $this->deleteFile(
                $tenant->id_back
            );
        }
    }

    /**
     * Delete stored file.
     */
    protected function deleteFile(
        string $path
    ): void {
        try {
            if (
                Storage::disk('public')
                    ->exists($path)
            ) {
                Storage::disk('public')
                    ->delete($path);
            }
        } catch (Throwable $e) {
            report($e);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Statistics
    |--------------------------------------------------------------------------
    */

    /**
     * Get tenant statistics.
     *
     * IMPORTANT:
     * Statistics only count tenants that have user_id.
     */
    public function statistics(): array
    {
        $query = Tenant::query()
            ->whereNotNull('user_id');

        return [
            'total' =>
                (clone $query)->count(),

            'active' =>
                (clone $query)
                    ->where(
                        'status',
                        Tenant::STATUS_ACTIVE
                    )
                    ->count(),

            'inactive' =>
                (clone $query)
                    ->where(
                        'status',
                        Tenant::STATUS_INACTIVE
                    )
                    ->count(),

            'pending' =>
                (clone $query)
                    ->where(
                        'status',
                        Tenant::STATUS_PENDING
                    )
                    ->count(),

            'blacklisted' =>
                (clone $query)
                    ->where(
                        'status',
                        Tenant::STATUS_BLACKLISTED
                    )
                    ->count(),

            'verified' =>
                (clone $query)
                    ->where(
                        'is_verified',
                        true
                    )
                    ->count(),

            'unverified' =>
                (clone $query)
                    ->where(
                        'is_verified',
                        false
                    )
                    ->count(),

            'active_accounts' =>
                (clone $query)
                    ->where(
                        'status',
                        Tenant::STATUS_ACTIVE
                    )
                    ->count(),

            'inactive_accounts' =>
                (clone $query)
                    ->where(
                        'status',
                        '!=',
                        Tenant::STATUS_ACTIVE
                    )
                    ->count(),

            /*
            |--------------------------------------------------------------------------
            | User Account Statistics
            |--------------------------------------------------------------------------
            */

            'with_user' =>
                (clone $query)
                    ->count(),

            'without_user' =>
                Tenant::whereNull('user_id')
                    ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    /**
     * Search tenants.
     *
     * Only tenants with user_id are returned.
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

        return $this->tenantQuery()
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
                    )
                    ->orWhere(
                        'country',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'region',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'county',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'city',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'area',
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
    | Tenant Number
    |--------------------------------------------------------------------------
    */

    /**
     * Generate unique tenant number.
     */
    public function generateTenantNumber(): string
    {
        do {
            $number =
                'TNT-' .
                strtoupper(
                    Str::random(8)
                );
        } while (
            Tenant::withTrashed()
                ->where(
                    'tenant_number',
                    $number
                )
                ->exists()
        );

        return $number;
    }

    /*
    |--------------------------------------------------------------------------
    | Helper Methods
    |--------------------------------------------------------------------------
    */

    /**
     * Get active tenants.
     *
     * Only tenants with user_id are returned.
     */
    public function getActive(): Collection
    {
        return $this->tenantQuery()
            ->where(
                'status',
                Tenant::STATUS_ACTIVE
            )
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    /**
     * Get pending tenants.
     *
     * Only tenants with user_id are returned.
     */
    public function getPending(): Collection
    {
        return $this->tenantQuery()
            ->where(
                'status',
                Tenant::STATUS_PENDING
            )
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /**
     * Get verified tenants.
     *
     * Only tenants with user_id are returned.
     */
    public function getVerified(): Collection
    {
        return $this->tenantQuery()
            ->where(
                'is_verified',
                true
            )
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    /**
     * Get tenants by region.
     */
    public function getByRegion(
        string $region
    ): Collection {
        return $this->tenantQuery()
            ->where(
                'region',
                $region
            )
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    /**
     * Get tenants by area.
     */
    public function getByArea(
        string $area
    ): Collection {
        return $this->tenantQuery()
            ->where(
                'area',
                $area
            )
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    /**
     * Get tenants by user ID.
     */
    public function getByUserId(
        int|string $userId
    ): Collection {
        return $this->tenantQuery()
            ->where(
                'user_id',
                $userId
            )
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    /**
     * Check whether tenant can be activated.
     */
    public function canActivate(
        Tenant $tenant
    ): bool {
        return $tenant->status !==
            Tenant::STATUS_BLACKLISTED;
    }
}