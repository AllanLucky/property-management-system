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
    | Tenant Listing
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated tenants.
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        $query = Tenant::query()
            ->with([
                'user',
                'tenancies',
            ])
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
                            ->orWhere('passport_number', 'like', "%{$search}%");
                    });
                }
            )
            ->when(
                !empty($filters['status']),
                fn ($query) =>
                    $query->where(
                        'status',
                        $filters['status']
                    )
            )
            ->when(
                isset($filters['is_active']),
                function ($query) use ($filters) {
                    $value = filter_var(
                        $filters['is_active'],
                        FILTER_VALIDATE_BOOLEAN,
                        FILTER_NULL_ON_FAILURE
                    );

                    if ($value !== null) {
                        $query->where(
                            'is_active',
                            $value
                        );
                    }
                }
            )
            ->when(
                !empty($filters['gender']),
                fn ($query) =>
                    $query->where(
                        'gender',
                        $filters['gender']
                    )
            )
            ->when(
                !empty($filters['country']),
                fn ($query) =>
                    $query->where(
                        'country',
                        $filters['country']
                    )
            )
            ->when(
                !empty($filters['county']),
                fn ($query) =>
                    $query->where(
                        'county',
                        $filters['county']
                    )
            )
            ->when(
                !empty($filters['city']),
                fn ($query) =>
                    $query->where(
                        'city',
                        $filters['city']
                    )
            )
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

        $perPage = (int) ($filters['per_page'] ?? 15);

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
     */
    public function find(
        int|string $id
    ): Tenant {
        $tenant = Tenant::query()
            ->with([
                'user',
                'tenancies',
            ])
            ->find($id);

        if (!$tenant) {
            throw new ModelNotFoundException(
                'Tenant not found.'
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
        $tenant = Tenant::query()
            ->with([
                'user',
                'tenancies',
            ])
            ->where(
                'tenant_number',
                $tenantNumber
            )
            ->first();

        if (!$tenant) {
            throw new ModelNotFoundException(
                'Tenant not found.'
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
        return Tenant::query()
            ->with([
                'user',
                'tenancies',
            ])
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
        return Tenant::query()
            ->with([
                'user',
                'tenancies',
            ])
            ->where(
                'email',
                $email
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
                $data['status'] ?? Tenant::STATUS_PENDING;

            $data['is_active'] =
                $data['is_active'] ?? (
                    $data['status'] === Tenant::STATUS_ACTIVE
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
            | Upload Documents
            |--------------------------------------------------------------------------
            */

            if ($photo) {
                $this->uploadPhoto(
                    $tenant,
                    $photo
                );
            }

            if ($idFront) {
                $this->uploadIdFront(
                    $tenant,
                    $idFront
                );
            }

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

            return $tenant->fresh([
                'user',
                'tenancies',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    /**
     * Update tenant.
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
            | Tenant numbers should not be changed after creation.
            |
            */

            unset(
                $data['tenant_number']
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
            | Status / Active State
            |--------------------------------------------------------------------------
            */

            if (
                array_key_exists(
                    'status',
                    $data
                )
            ) {
                if (
                    $data['status'] ===
                    Tenant::STATUS_ACTIVE
                ) {
                    $data['is_active'] = true;
                }

                if (
                    in_array(
                        $data['status'],
                        [
                            Tenant::STATUS_INACTIVE,
                            Tenant::STATUS_BLACKLISTED,
                        ],
                        true
                    )
                ) {
                    $data['is_active'] = false;
                }

                if (
                    $data['status'] ===
                    Tenant::STATUS_PENDING
                ) {
                    $data['is_active'] = false;
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
            | Documents
            |--------------------------------------------------------------------------
            */

            if ($photo) {
                $this->uploadPhoto(
                    $tenant,
                    $photo
                );
            }

            if ($idFront) {
                $this->uploadIdFront(
                    $tenant,
                    $idFront
                );
            }

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

            return $tenant->fresh([
                'user',
                'tenancies',
            ]);
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
            /*
            |--------------------------------------------------------------------------
            | Prevent Deletion With Active Tenancy
            |--------------------------------------------------------------------------
            */

            if (method_exists($tenant, 'tenancies')) {
                $hasActiveTenancy = $tenant
                    ->tenancies()
                    ->whereIn(
                        'status',
                        ['active']
                    )
                    ->exists();

                if ($hasActiveTenancy) {
                    throw new RuntimeException(
                        'This tenant cannot be deleted because they have an active tenancy.'
                    );
                }
            }

            return (bool) $tenant->delete();
        });
    }

    /**
     * Restore soft-deleted tenant.
     */
    public function restore(
        int|string $id
    ): Tenant {
        $tenant = Tenant::withTrashed()
            ->find($id);

        if (!$tenant) {
            throw new ModelNotFoundException(
                'Tenant not found.'
            );
        }

        $tenant->restore();

        return $tenant->fresh([
            'user',
            'tenancies',
        ]);
    }

    /**
     * Permanently delete tenant.
     */
    public function forceDelete(
        int|string $id
    ): bool {
        $tenant = Tenant::withTrashed()
            ->find($id);

        if (!$tenant) {
            throw new ModelNotFoundException(
                'Tenant not found.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Prevent Permanent Deletion With Active Tenancy
        |--------------------------------------------------------------------------
        */

        if (
            $tenant->tenancies()
                ->whereIn(
                    'status',
                    ['active']
                )
                ->exists()
        ) {
            throw new RuntimeException(
                'This tenant cannot be permanently deleted because they have an active tenancy.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Delete Documents
        |--------------------------------------------------------------------------
        */

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
            'is_active' => true,
        ]);

        return $tenant->fresh([
            'user',
            'tenancies',
        ]);
    }

    /**
     * Deactivate tenant.
     */
    public function deactivate(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' => Tenant::STATUS_INACTIVE,
            'is_active' => false,
        ]);

        return $tenant->fresh([
            'user',
            'tenancies',
        ]);
    }

    /**
     * Blacklist tenant.
     */
    public function blacklist(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' => Tenant::STATUS_BLACKLISTED,
            'is_active' => false,
        ]);

        return $tenant->fresh([
            'user',
            'tenancies',
        ]);
    }

    /**
     * Set tenant to pending.
     */
    public function setPending(
        Tenant $tenant
    ): Tenant {
        $tenant->update([
            'status' => Tenant::STATUS_PENDING,
            'is_active' => false,
        ]);

        return $tenant->fresh([
            'user',
            'tenancies',
        ]);
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

        return $tenant->fresh([
            'user',
            'tenancies',
        ]);
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

        return $tenant->fresh([
            'user',
            'tenancies',
        ]);
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
            /*
            |--------------------------------------------------------------------------
            | Delete Previous File
            |--------------------------------------------------------------------------
            */

            if ($tenant->photo) {
                $this->deleteFile(
                    $tenant->photo
                );
            }

            /*
            |--------------------------------------------------------------------------
            | Store File
            |--------------------------------------------------------------------------
            */

            $path = $file->store(
                'tenants/photos',
                'public'
            );

            /*
            |--------------------------------------------------------------------------
            | Update Tenant
            |--------------------------------------------------------------------------
            */

            $tenant->update([
                'photo' => $path,
                'photo_public_id' => null,
            ]);

            return $tenant->fresh([
                'user',
                'tenancies',
            ]);
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

            return $tenant->fresh([
                'user',
                'tenancies',
            ]);
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

            return $tenant->fresh([
                'user',
                'tenancies',
            ]);
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
     */
    public function statistics(): array
    {
        return [
            'total' =>
                Tenant::count(),

            'active' =>
                Tenant::where(
                    'status',
                    Tenant::STATUS_ACTIVE
                )->count(),

            'inactive' =>
                Tenant::where(
                    'status',
                    Tenant::STATUS_INACTIVE
                )->count(),

            'pending' =>
                Tenant::where(
                    'status',
                    Tenant::STATUS_PENDING
                )->count(),

            'blacklisted' =>
                Tenant::where(
                    'status',
                    Tenant::STATUS_BLACKLISTED
                )->count(),

            'verified' =>
                Tenant::where(
                    'is_verified',
                    true
                )->count(),

            'unverified' =>
                Tenant::where(
                    'is_verified',
                    false
                )->count(),

            'active_accounts' =>
                Tenant::where(
                    'is_active',
                    true
                )->count(),

            'inactive_accounts' =>
                Tenant::where(
                    'is_active',
                    false
                )->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    /**
     * Search tenants.
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
            ->with([
                'user',
                'tenancies',
            ])
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
     */
    public function getActive(): Collection
    {
        return Tenant::active()
            ->with([
                'user',
                'tenancies',
            ])
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();
    }

    /**
     * Get pending tenants.
     */
    public function getPending(): Collection
    {
        return Tenant::pending()
            ->with([
                'user',
                'tenancies',
            ])
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /**
     * Get verified tenants.
     */
    public function getVerified(): Collection
    {
        return Tenant::query()
            ->where(
                'is_verified',
                true
            )
            ->with([
                'user',
                'tenancies',
            ])
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