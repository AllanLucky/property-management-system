<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
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
     * IMPORTANT:
     *
     * User is the source of:
     * - name
     * - email
     * - phone
     * - account information
     * - roles
     *
     * Tenant stores only tenant-specific information.
     */
    protected function tenantRelations(): array
    {
        return [
            'user',

            'tenancies.property',
            'tenancies.apartment',
            'tenancies.unit',

            'activeTenancies.property',
            'activeTenancies.apartment',
            'activeTenancies.unit',
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
     * Only tenants connected to an existing user account are returned.
     */
    protected function tenantQuery(): Builder
    {
        return Tenant::query()
            ->whereNotNull('user_id')
            ->with($this->tenantRelations());
    }

    /*
    |--------------------------------------------------------------------------
    | User Validation
    |--------------------------------------------------------------------------
    */

    /**
     * Get the user attached to the tenant.
     *
     * A tenant MUST belong to an existing user with the tenant role.
     */
    protected function getTenantUser(
        int|string $userId
    ): User {
        $user = User::find($userId);

        if (!$user) {
            throw new RuntimeException(
                'The selected user account does not exist.'
            );
        }

        if (!$user->hasRole('tenant')) {
            throw new RuntimeException(
                'The selected user must have the tenant role.'
            );
        }

        return $user;
    }

    /**
     * Make sure the user is not already attached to another tenant.
     */
    protected function ensureUserIsAvailable(
        int|string $userId,
        ?Tenant $except = null
    ): void {
        $query = Tenant::query()
            ->where('user_id', $userId);

        if ($except) {
            $query->where(
                'id',
                '!=',
                $except->id
            );
        }

        if ($query->exists()) {
            throw new RuntimeException(
                'This user account is already linked to another tenant.'
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | Tenant Listing
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated tenants.
     *
     * User identity fields are searched through the users table.
     */
    public function paginate(
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->tenantQuery();

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */

        if (!empty($filters['search'])) {
            $search = trim(
                (string) $filters['search']
            );

            if ($search !== '') {
                $query->where(function (Builder $query) use ($search) {

                    /*
                    |--------------------------------------------------------------------------
                    | Tenant-specific fields
                    |--------------------------------------------------------------------------
                    */

                    $query
                        ->where(
                            'tenant_number',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'other_names',
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

                        /*
                        |--------------------------------------------------------------------------
                        | Location
                        |--------------------------------------------------------------------------
                        */

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
                        )
                        ->orWhere(
                            'postal_code',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'address',
                            'like',
                            "%{$search}%"
                        )

                        /*
                        |--------------------------------------------------------------------------
                        | User identity
                        |--------------------------------------------------------------------------
                        */

                        ->orWhereHas(
                            'user',
                            function (Builder $userQuery) use ($search) {

                                $userQuery
                                    ->where(
                                        'name',
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
                                    );
                            }
                        );
                });
            }
        }

        /*
        |--------------------------------------------------------------------------
        | User ID
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['user_id']) &&
            $filters['user_id'] !== ''
        ) {
            $query->where(
                'user_id',
                $filters['user_id']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Status
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['status']) &&
            $filters['status'] !== ''
        ) {
            $query->where(
                'status',
                $filters['status']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Active Filter
        |--------------------------------------------------------------------------
        |
        | There is NO is_active column.
        |
        */

        if (isset($filters['is_active'])) {

            $isActive = filter_var(
                $filters['is_active'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($isActive !== null) {

                if ($isActive) {

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

        /*
        |--------------------------------------------------------------------------
        | Gender
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['gender']) &&
            $filters['gender'] !== ''
        ) {
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

        if (
            isset($filters['country']) &&
            $filters['country'] !== ''
        ) {
            $query->where(
                'country',
                $filters['country']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Region
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['region']) &&
            $filters['region'] !== ''
        ) {
            $query->where(
                'region',
                $filters['region']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | County
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['county']) &&
            $filters['county'] !== ''
        ) {
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

        if (
            isset($filters['city']) &&
            $filters['city'] !== ''
        ) {
            $query->where(
                'city',
                $filters['city']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Area
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['area']) &&
            $filters['area'] !== ''
        ) {
            $query->where(
                'area',
                $filters['area']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Postal Code
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['postal_code']) &&
            $filters['postal_code'] !== ''
        ) {
            $query->where(
                'postal_code',
                $filters['postal_code']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Verification
        |--------------------------------------------------------------------------
        */

        if (isset($filters['is_verified'])) {

            $isVerified = filter_var(
                $filters['is_verified'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($isVerified !== null) {
                $query->where(
                    'is_verified',
                    $isVerified
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */

        $allowedSorts = [
            'id',
            'user_id',
            'tenant_number',
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

        if (!in_array(
            $sortBy,
            $allowedSorts,
            true
        )) {
            $sortBy = 'created_at';
        }

        $sortDirection = strtolower(
            (string) (
                $filters['sort_direction']
                ?? 'desc'
            )
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
    | Find Tenant
    |--------------------------------------------------------------------------
    */

    /**
     * Find tenant by ID.
     */
    public function find(
        int|string $id
    ): Tenant {
        $tenant = $this->tenantQuery()
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
                'Tenant not found.'
            );
        }

        return $tenant;
    }

    /**
     * Find tenant by phone.
     *
     * Phone now belongs to users.
     */
    public function findByPhone(
        string $phone
    ): ?Tenant {
        return $this->tenantQuery()
            ->whereHas(
                'user',
                fn (Builder $query) =>
                    $query->where(
                        'phone',
                        $phone
                    )
            )
            ->first();
    }

    /**
     * Find tenant by email.
     *
     * Email now belongs to users.
     */
    public function findByEmail(
        string $email
    ): ?Tenant {
        return $this->tenantQuery()
            ->whereHas(
                'user',
                fn (Builder $query) =>
                    $query->where(
                        'email',
                        $email
                    )
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
     * Create a tenant from an existing User account.
     *
     * IMPORTANT:
     *
     * The following values are NOT copied into tenants:
     *
     * - name
     * - email
     * - phone
     *
     * They remain in users and are returned through the user relationship.
     */
    public function create(
        array $data,
        ?UploadedFile $photo = null,
        ?UploadedFile $idFront = null,
        ?UploadedFile $idBack = null
    ): Tenant {
        return DB::transaction(
            function () use (
                $data,
                $photo,
                $idFront,
                $idBack
            ) {

                /*
                |--------------------------------------------------------------------------
                | User
                |--------------------------------------------------------------------------
                */

                if (
                    !isset($data['user_id']) ||
                    !filled($data['user_id'])
                ) {
                    throw new RuntimeException(
                        'A valid user_id is required when creating a tenant.'
                    );
                }

                $userId = (int) $data['user_id'];

                /*
                |--------------------------------------------------------------------------
                | Fetch full User details
                |--------------------------------------------------------------------------
                */

                $user = $this->getTenantUser(
                    $userId
                );

                /*
                |--------------------------------------------------------------------------
                | Prevent duplicate tenant profile
                |--------------------------------------------------------------------------
                */

                $this->ensureUserIsAvailable(
                    $user->id
                );

                /*
                |--------------------------------------------------------------------------
                | Remove User-owned fields
                |--------------------------------------------------------------------------
                |
                | These belong to users table and must NOT be duplicated.
                |
                */

                unset(
                    $data['name'],
                    $data['first_name'],
                    $data['last_name'],
                    $data['email'],
                    $data['phone']
                );

                /*
                |--------------------------------------------------------------------------
                | Tenant Number
                |--------------------------------------------------------------------------
                */

                if (
                    !isset($data['tenant_number']) ||
                    !filled($data['tenant_number'])
                ) {
                    $data['tenant_number'] =
                        $this->generateTenantNumber();
                }

                /*
                |--------------------------------------------------------------------------
                | Defaults
                |--------------------------------------------------------------------------
                */

                $data['user_id'] = $user->id;

                $data['country'] =
                    $data['country']
                    ?? 'Kenya';

                $data['status'] =
                    $data['status']
                    ?? Tenant::STATUS_PENDING;

                /*
                |--------------------------------------------------------------------------
                | Remove unsupported fields
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
                    (bool) (
                        $data['is_verified']
                        ?? false
                    );

                if (!$data['is_verified']) {

                    $data['verified_at'] = null;

                } elseif (
                    empty($data['verified_at'])
                ) {

                    $data['verified_at'] = now();
                }

                /*
                |--------------------------------------------------------------------------
                | Create Tenant
                |--------------------------------------------------------------------------
                */

                $tenant = Tenant::create(
                    $data
                );

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
                | Return complete tenant
                |--------------------------------------------------------------------------
                */

                return $tenant->fresh(
                    $this->tenantRelations()
                );
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Update
    |--------------------------------------------------------------------------
    */

    /**
     * Update tenant-specific information.
     *
     * User identity fields are NOT updated here.
     *
     * If the user's name, email or phone changes,
     * update the User record through User management.
     */
    public function update(
        Tenant $tenant,
        array $data,
        ?UploadedFile $photo = null,
        ?UploadedFile $idFront = null,
        ?UploadedFile $idBack = null
    ): Tenant {
        return DB::transaction(
            function () use (
                $tenant,
                $data,
                $photo,
                $idFront,
                $idBack
            ) {

                /*
                |--------------------------------------------------------------------------
                | Tenant Number Protection
                |--------------------------------------------------------------------------
                */

                unset(
                    $data['tenant_number']
                );

                /*
                |--------------------------------------------------------------------------
                | User ID Protection
                |--------------------------------------------------------------------------
                |
                | A tenant should remain connected to its existing user.
                |
                | If you need to transfer a tenant to another user,
                | that should be a dedicated operation.
                |
                */

                unset(
                    $data['user_id']
                );

                /*
                |--------------------------------------------------------------------------
                | Never duplicate User fields
                |--------------------------------------------------------------------------
                */

                unset(
                    $data['name'],
                    $data['first_name'],
                    $data['last_name'],
                    $data['email'],
                    $data['phone']
                );

                /*
                |--------------------------------------------------------------------------
                | Remove unsupported field
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

                    $data['is_verified'] =
                        (bool) $data['is_verified'];

                    if (
                        $data['is_verified']
                    ) {

                        $data['verified_at'] =
                            $data['verified_at']
                            ?? now();

                    } else {

                        $data['verified_at'] =
                            null;
                    }
                }

                /*
                |--------------------------------------------------------------------------
                | Update Tenant
                |--------------------------------------------------------------------------
                */

                $tenant->update(
                    $data
                );

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
                | Return complete tenant
                |--------------------------------------------------------------------------
                */

                return $tenant->fresh(
                    $this->tenantRelations()
                );
            }
        );
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
        return DB::transaction(
            function () use ($tenant) {

                $hasActiveTenancy =
                    $tenant
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
            }
        );
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

        $hasActiveTenancy =
            $tenant
                ->tenancies()
                ->where(
                    'status',
                    'active'
                )
                ->exists();

        if ($hasActiveTenancy) {
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
        return DB::transaction(
            function () use (
                $tenant,
                $file
            ) {

                $oldPath =
                    $tenant->photo;

                $path = $file->store(
                    'tenants/photos',
                    'public'
                );

                if (!$path) {
                    throw new RuntimeException(
                        'Unable to store tenant photo.'
                    );
                }

                $tenant->update([
                    'photo' => $path,
                    'photo_public_id' => null,
                ]);

                if (
                    $oldPath &&
                    $oldPath !== $path
                ) {
                    $this->deleteFile(
                        $oldPath
                    );
                }

                return $tenant->fresh(
                    $this->tenantRelations()
                );
            }
        );
    }

    /**
     * Upload front ID.
     */
    public function uploadIdFront(
        Tenant $tenant,
        UploadedFile $file
    ): Tenant {
        return DB::transaction(
            function () use (
                $tenant,
                $file
            ) {

                $oldPath =
                    $tenant->id_front;

                $path = $file->store(
                    'tenants/documents',
                    'public'
                );

                if (!$path) {
                    throw new RuntimeException(
                        'Unable to store tenant front ID.'
                    );
                }

                $tenant->update([
                    'id_front' => $path,
                    'id_front_public_id' => null,
                ]);

                if (
                    $oldPath &&
                    $oldPath !== $path
                ) {
                    $this->deleteFile(
                        $oldPath
                    );
                }

                return $tenant->fresh(
                    $this->tenantRelations()
                );
            }
        );
    }

    /**
     * Upload back ID.
     */
    public function uploadIdBack(
        Tenant $tenant,
        UploadedFile $file
    ): Tenant {
        return DB::transaction(
            function () use (
                $tenant,
                $file
            ) {

                $oldPath =
                    $tenant->id_back;

                $path = $file->store(
                    'tenants/documents',
                    'public'
                );

                if (!$path) {
                    throw new RuntimeException(
                        'Unable to store tenant back ID.'
                    );
                }

                $tenant->update([
                    'id_back' => $path,
                    'id_back_public_id' => null,
                ]);

                if (
                    $oldPath &&
                    $oldPath !== $path
                ) {
                    $this->deleteFile(
                        $oldPath
                    );
                }

                return $tenant->fresh(
                    $this->tenantRelations()
                );
            }
        );
    }

    /**
     * Delete tenant documents.
     */
    public function deleteTenantDocuments(
        Tenant $tenant
    ): void {
        $paths = [
            $tenant->photo,
            $tenant->id_front,
            $tenant->id_back,
        ];

        foreach ($paths as $path) {

            if ($path) {
                $this->deleteFile(
                    $path
                );
            }
        }
    }

    /**
     * Delete stored file.
     */
    protected function deleteFile(
        string $path
    ): void {
        try {

            $disk = Storage::disk(
                'public'
            );

            if ($disk->exists($path)) {
                $disk->delete($path);
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
     * There is no is_active database column.
     */
    public function statistics(): array
    {
        $query = Tenant::query()
            ->whereNotNull('user_id');

        $total = (clone $query)
            ->count();

        $active = (clone $query)
            ->where(
                'status',
                Tenant::STATUS_ACTIVE
            )
            ->count();

        $inactive = (clone $query)
            ->where(
                'status',
                Tenant::STATUS_INACTIVE
            )
            ->count();

        $pending = (clone $query)
            ->where(
                'status',
                Tenant::STATUS_PENDING
            )
            ->count();

        $blacklisted = (clone $query)
            ->where(
                'status',
                Tenant::STATUS_BLACKLISTED
            )
            ->count();

        $verified = (clone $query)
            ->where(
                'is_verified',
                true
            )
            ->count();

        $unverified = (clone $query)
            ->where(
                'is_verified',
                false
            )
            ->count();

        return [
            'total' => $total,

            'active' => $active,

            'inactive' => $inactive,

            'pending' => $pending,

            'blacklisted' => $blacklisted,

            'verified' => $verified,

            'unverified' => $unverified,

            'active_accounts' => $active,

            'inactive_accounts' =>
                $total - $active,

            'with_user' => $total,

            'without_user' =>
                Tenant::query()
                    ->whereNull('user_id')
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
     * Searches both tenant-specific fields and
     * the connected user's identity fields.
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
            ->where(function (Builder $query) use ($search) {

                $query
                    ->where(
                        'tenant_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'other_names',
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

                    /*
                    |--------------------------------------------------------------------------
                    | User identity
                    |--------------------------------------------------------------------------
                    */

                    ->orWhereHas(
                        'user',
                        function (Builder $userQuery) use ($search) {

                            $userQuery
                                ->where(
                                    'name',
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
                                );
                        }
                    )

                    /*
                    |--------------------------------------------------------------------------
                    | Location
                    |--------------------------------------------------------------------------
                    */

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
                    )
                    ->orWhere(
                        'postal_code',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'address',
                        'like',
                        "%{$search}%"
                    );
            })
            ->orderBy(
                'created_at',
                'desc'
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
        return $this->tenantQuery()
            ->where(
                'status',
                Tenant::STATUS_ACTIVE
            )
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /**
     * Get inactive tenants.
     */
    public function getInactive(): Collection
    {
        return $this->tenantQuery()
            ->where(
                'status',
                Tenant::STATUS_INACTIVE
            )
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /**
     * Get blacklisted tenants.
     */
    public function getBlacklisted(): Collection
    {
        return $this->tenantQuery()
            ->where(
                'status',
                Tenant::STATUS_BLACKLISTED
            )
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /**
     * Get pending tenants.
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
     */
    public function getVerified(): Collection
    {
        return $this->tenantQuery()
            ->where(
                'is_verified',
                true
            )
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /**
     * Get unverified tenants.
     */
    public function getUnverified(): Collection
    {
        return $this->tenantQuery()
            ->where(
                'is_verified',
                false
            )
            ->orderBy(
                'created_at',
                'desc'
            )
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
            ->orderBy(
                'created_at',
                'desc'
            )
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
            ->orderBy(
                'created_at',
                'desc'
            )
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
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /*
    |--------------------------------------------------------------------------
    | Activation Rules
    |--------------------------------------------------------------------------
    */

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
