<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
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
     * Relationships required by TenantResource and tenant screens.
     *
     * The User model remains the source of truth for account identity.
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
    | Base Queries
    |--------------------------------------------------------------------------
    */

    /**
     * Base query used when returning tenant records.
     *
     * Soft-deleted tenants are automatically excluded by SoftDeletes.
     *
     * Only tenants linked to an existing user account are returned.
     */
    protected function tenantQuery(): Builder
    {
        return Tenant::query()
            ->whereNotNull('user_id')
            ->with($this->tenantRelations());
    }

    /**
     * Lightweight query used for statistics and reports.
     *
     * Relationships are intentionally not loaded.
     */
    protected function reportQuery(): Builder
    {
        return Tenant::query()
            ->whereNotNull('user_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Available Tenant Users
    |--------------------------------------------------------------------------
    */

    /**
     * Get existing users who:
     *
     * - have the tenant role
     * - are not already linked to a tenant profile
     *
     * This method NEVER creates a User.
     */
    public function getAvailableTenantUsers(
        ?string $search = null,
        int $limit = 100
    ): Collection {
        $limit = max(1, min($limit, 100));

        $query = User::query()
            ->role('tenant')
            ->whereDoesntHave('tenant')
            ->orderBy('first_name')
            ->orderBy('last_name');

        if ($search !== null) {
            $search = trim($search);

            if ($search !== '') {
                $query->where(function (Builder $userQuery) use ($search): void {
                    $userQuery
                        ->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%");
                });
            }
        }

        return $query
            ->limit($limit)
            ->get();
    }

    /**
     * Get one available tenant user.
     */
    public function getAvailableTenantUser(
        int|string $userId
    ): User {
        $user = User::query()
            ->role('tenant')
            ->whereDoesntHave('tenant')
            ->find($userId);

        if (!$user) {
            throw new ModelNotFoundException(
                'The selected tenant user does not exist, does not have the tenant role, or is already linked to a tenant.'
            );
        }

        return $user;
    }

    /*
    |--------------------------------------------------------------------------
    | User Validation
    |--------------------------------------------------------------------------
    */

    /**
     * Get the User linked to a tenant.
     *
     * A tenant must always be associated with a User
     * who has the tenant role.
     */
    protected function getTenantUser(
        int|string $userId
    ): User {
        $user = User::query()->find($userId);

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
     * Ensure a User is not already linked to another tenant.
     */
    protected function ensureUserIsAvailable(
        int|string $userId,
        ?Tenant $except = null
    ): void {
        $query = Tenant::query()
            ->where('user_id', $userId);

        if ($except) {
            $query->where('id', '!=', $except->id);
        }

        if ($query->exists()) {
            throw new RuntimeException(
                'This user account is already linked to another tenant.'
            );
        }
    }

    /**
     * Synchronize identity information from User to Tenant.
     *
     * User remains the source of truth for:
     *
     * - first_name
     * - last_name
     * - email
     * - phone
     */
    protected function syncUserIdentity(
        array &$data,
        User $user
    ): void {
        $data['first_name'] = $user->first_name;
        $data['last_name'] = $user->last_name;
        $data['email'] = $user->email;
        $data['phone'] = $user->phone;

        unset($data['name']);
    }

    /*
    |--------------------------------------------------------------------------
    | Tenant Listing
    |--------------------------------------------------------------------------
    */

    /**
     * Get paginated tenants.
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
            $search = trim((string) $filters['search']);

            if ($search !== '') {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('tenant_number', 'like', "%{$search}%")
                        ->orWhere('other_names', 'like', "%{$search}%")
                        ->orWhere('id_number', 'like', "%{$search}%")
                        ->orWhere('passport_number', 'like', "%{$search}%")
                        ->orWhere('nationality', 'like', "%{$search}%")
                        ->orWhere('country', 'like', "%{$search}%")
                        ->orWhere('region', 'like', "%{$search}%")
                        ->orWhere('county', 'like', "%{$search}%")
                        ->orWhere('city', 'like', "%{$search}%")
                        ->orWhere('area', 'like', "%{$search}%")
                        ->orWhere('postal_code', 'like', "%{$search}%")
                        ->orWhere('address', 'like', "%{$search}%")
                        ->orWhereHas(
                            'user',
                            function (Builder $userQuery) use ($search): void {
                                $userQuery
                                    ->where('name', 'like', "%{$search}%")
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
            $status = (string) $filters['status'];

            if (Tenant::isValidStatus($status)) {
                $query->where(
                    'status',
                    $status
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Active Filter
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        |
        | There is NO is_active database column.
        |
        | Active state is derived from:
        |
        |     status = active
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
        | Active Tenancy
        |--------------------------------------------------------------------------
        */

        if (isset($filters['has_active_tenancy'])) {
            $hasActiveTenancy = filter_var(
                $filters['has_active_tenancy'],
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );

            if ($hasActiveTenancy !== null) {
                if ($hasActiveTenancy) {
                    $query->withActiveTenancy();
                } else {
                    $query->withoutActiveTenancy();
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
        | Nationality
        |--------------------------------------------------------------------------
        */

        if (
            isset($filters['nationality']) &&
            $filters['nationality'] !== ''
        ) {
            $query->where(
                'nationality',
                $filters['nationality']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Location
        |--------------------------------------------------------------------------
        */

        foreach (
            [
                'country',
                'region',
                'county',
                'city',
                'area',
                'postal_code',
            ] as $field
        ) {
            if (
                isset($filters[$field]) &&
                $filters[$field] !== ''
            ) {
                $query->where(
                    $field,
                    $filters[$field]
                );
            }
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
        | Registration Date Range
        |--------------------------------------------------------------------------
        */

        if (
            !empty($filters['start_date']) ||
            !empty($filters['end_date'])
        ) {
            try {
                $startDate = !empty($filters['start_date'])
                    ? Carbon::parse(
                        $filters['start_date']
                    )->startOfDay()
                    : now()->startOfYear();

                $endDate = !empty($filters['end_date'])
                    ? Carbon::parse(
                        $filters['end_date']
                    )->endOfDay()
                    : now()->endOfDay();
            } catch (Throwable) {
                throw new RuntimeException(
                    'Invalid registration date supplied.'
                );
            }

            if ($startDate->gt($endDate)) {
                throw new RuntimeException(
                    'The start date cannot be after the end date.'
                );
            }

            $query->whereBetween(
                'created_at',
                [
                    $startDate,
                    $endDate,
                ]
            );
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
            'nationality',
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

        $sortBy = (string) (
            $filters['sort_by'] ?? 'created_at'
        );

        if (!in_array($sortBy, $allowedSorts, true)) {
            $sortBy = 'created_at';
        }

        $sortDirection = strtolower(
            (string) (
                $filters['sort_direction'] ?? 'desc'
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
    | Create Tenant
    |--------------------------------------------------------------------------
    */

    /**
     * Create tenant profile from an existing User account.
     *
     * No User account is created here.
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
            ): Tenant {
                if (
                    !isset($data['user_id']) ||
                    !filled($data['user_id'])
                ) {
                    throw new RuntimeException(
                        'A valid user_id is required when creating a tenant.'
                    );
                }

                $user = $this->getTenantUser(
                    (int) $data['user_id']
                );

                $this->ensureUserIsAvailable(
                    $user->id
                );

                /*
                |--------------------------------------------------------------------------
                | Identity
                |--------------------------------------------------------------------------
                */

                $this->syncUserIdentity(
                    $data,
                    $user
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

                $data['user_id'] = $user->id;

                /*
                |--------------------------------------------------------------------------
                | Defaults
                |--------------------------------------------------------------------------
                */

                $data['country'] =
                    filled($data['country'] ?? null)
                    ? trim((string) $data['country'])
                    : 'Kenya';

                if (
                    !array_key_exists(
                        'nationality',
                        $data
                    ) ||
                    !filled($data['nationality'])
                ) {
                    $data['nationality'] = 'Kenyan';
                } else {
                    $data['nationality'] = trim(
                        (string) $data['nationality']
                    );
                }

                $data['status'] =
                    $data['status']
                    ?? Tenant::STATUS_PENDING;

                if (!Tenant::isValidStatus(
                    $data['status']
                )) {
                    throw new RuntimeException(
                        'Invalid tenant status.'
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | is_active
                |--------------------------------------------------------------------------
                |
                | The database does not contain an is_active column.
                |
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
                | Create
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

                return $tenant->fresh(
                    $this->tenantRelations()
                );
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Update Tenant
    |--------------------------------------------------------------------------
    */

    /**
     * Update tenant profile.
     *
     * user_id and tenant_number cannot be changed here.
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
            ): Tenant {
                $user = $tenant->user;

                if (!$user) {
                    throw new RuntimeException(
                        'This tenant does not have a linked user account.'
                    );
                }

                /*
                |--------------------------------------------------------------------------
                | Protected Fields
                |--------------------------------------------------------------------------
                */

                unset(
                    $data['tenant_number'],
                    $data['user_id'],
                    $data['is_active']
                );

                /*
                |--------------------------------------------------------------------------
                | Synchronize User Identity
                |--------------------------------------------------------------------------
                */

                $this->syncUserIdentity(
                    $data,
                    $user
                );

                /*
                |--------------------------------------------------------------------------
                | Status
                |--------------------------------------------------------------------------
                */

                if (
                    array_key_exists(
                        'status',
                        $data
                    )
                ) {
                    $status = (string) $data['status'];

                    if (!Tenant::isValidStatus(
                        $status
                    )) {
                        throw new RuntimeException(
                            'Invalid tenant status.'
                        );
                    }

                    $data['status'] = $status;
                }

                /*
                |--------------------------------------------------------------------------
                | Nationality
                |--------------------------------------------------------------------------
                */

                if (
                    array_key_exists(
                        'nationality',
                        $data
                    )
                ) {
                    $data['nationality'] =
                        filled($data['nationality'])
                        ? trim(
                            (string) $data['nationality']
                        )
                        : null;
                }

                /*
                |--------------------------------------------------------------------------
                | Country
                |--------------------------------------------------------------------------
                */

                if (
                    array_key_exists(
                        'country',
                        $data
                    )
                ) {
                    $data['country'] =
                        filled($data['country'])
                        ? trim(
                            (string) $data['country']
                        )
                        : null;
                }

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
                | Update
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

                return $tenant->fresh(
                    $this->tenantRelations()
                );
            }
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Delete / Restore
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete tenant.
     *
     * A tenant with an active tenancy cannot be deleted.
     */
    public function delete(
        Tenant $tenant
    ): bool {
        return DB::transaction(
            function () use ($tenant): bool {
                if (
                    $tenant
                        ->activeTenancies()
                        ->exists()
                ) {
                    throw new RuntimeException(
                        'This tenant cannot be deleted because they have an active tenancy.'
                    );
                }

                return (bool) $tenant->delete();
            }
        );
    }

    /**
     * Restore a soft-deleted tenant.
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
     * Permanently delete a tenant.
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
            $tenant
                ->activeTenancies()
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
        return DB::transaction(
            function () use (
                $tenant,
                $file
            ): Tenant {
                $oldPath = $tenant->photo;

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
     * Upload front ID document.
     */
    public function uploadIdFront(
        Tenant $tenant,
        UploadedFile $file
    ): Tenant {
        return DB::transaction(
            function () use (
                $tenant,
                $file
            ): Tenant {
                $oldPath = $tenant->id_front;

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
     * Upload back ID document.
     */
    public function uploadIdBack(
        Tenant $tenant,
        UploadedFile $file
    ): Tenant {
        return DB::transaction(
            function () use (
                $tenant,
                $file
            ): Tenant {
                $oldPath = $tenant->id_back;

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
     * Delete tenant documents from storage.
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
     * Delete a stored public-disk file safely.
     */
    protected function deleteFile(
        string $path
    ): void {
        try {
            $disk = Storage::disk('public');

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
     * Get tenant dashboard statistics.
     *
     * IMPORTANT:
     *
     * There is no `is_active` database column.
     *
     * Active state is always derived from:
     *
     *     status = active
     */
    public function statistics(): array
    {
        $query = $this->reportQuery();

        $total = (clone $query)->count();

        $active = (clone $query)
            ->active()
            ->count();

        $inactive = (clone $query)
            ->inactive()
            ->count();

        $pending = (clone $query)
            ->pending()
            ->count();

        $blacklisted = (clone $query)
            ->blacklisted()
            ->count();

        $verified = (clone $query)
            ->verified()
            ->count();

        $unverified = (clone $query)
            ->unverified()
            ->count();

        $withActiveTenancy = (clone $query)
            ->withActiveTenancy()
            ->count();

        $withoutActiveTenancy = (clone $query)
            ->withoutActiveTenancy()
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Registration Statistics
        |--------------------------------------------------------------------------
        */

        $registeredToday = (clone $query)
            ->createdToday()
            ->count();

        $registeredThisWeek = (clone $query)
            ->createdThisWeek()
            ->count();

        $registeredThisMonth = (clone $query)
            ->createdThisMonth()
            ->count();

        $registeredThisYear = (clone $query)
            ->createdThisYear()
            ->count();

        $withoutUser = Tenant::query()
            ->whereNull('user_id')
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

            /*
             * Kept for backwards compatibility.
             *
             * This means all accounts that are not active,
             * not only tenants whose status is "inactive".
             */
            'inactive_accounts' =>
                max(0, $total - $active),

            'non_active_accounts' =>
                max(0, $total - $active),

            'with_user' => $total,

            'without_user' => $withoutUser,

            'with_active_tenancy' =>
                $withActiveTenancy,

            'without_active_tenancy' =>
                $withoutActiveTenancy,

            'registered_today' =>
                $registeredToday,

            'registered_this_week' =>
                $registeredThisWeek,

            'registered_this_month' =>
                $registeredThisMonth,

            'registered_this_year' =>
                $registeredThisYear,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Tenant Reports
    |--------------------------------------------------------------------------
    */

    /**
     * Generate a tenant report.
     *
     * Supported filters:
     *
     * [
     *     'start_date' => '2026-01-01',
     *     'end_date'   => '2026-09-05',
     * ]
     *
     * If no date filters are provided, the report covers all
     * non-deleted tenant records.
     */
    public function reports(
        array $filters = []
    ): array {
        $query = $this->reportQuery();

        $startDate = null;
        $endDate = null;

        /*
        |--------------------------------------------------------------------------
        | Resolve Date Range
        |--------------------------------------------------------------------------
        */

        try {
            if (!empty($filters['start_date'])) {
                $startDate = Carbon::parse(
                    $filters['start_date']
                )->startOfDay();
            }

            if (!empty($filters['end_date'])) {
                $endDate = Carbon::parse(
                    $filters['end_date']
                )->endOfDay();
            }
        } catch (Throwable) {
            throw new RuntimeException(
                'One or more report dates are invalid.'
            );
        }

        if (
            $startDate &&
            $endDate &&
            $startDate->gt($endDate)
        ) {
            throw new RuntimeException(
                'The start date cannot be after the end date.'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Apply Period
        |--------------------------------------------------------------------------
        */

        if ($startDate && $endDate) {
            $query->whereBetween(
                'created_at',
                [
                    $startDate,
                    $endDate,
                ]
            );
        } elseif ($startDate) {
            $query->where(
                'created_at',
                '>=',
                $startDate
            );
        } elseif ($endDate) {
            $query->where(
                'created_at',
                '<=',
                $endDate
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Summary
        |--------------------------------------------------------------------------
        */

        $total = (clone $query)->count();

        $active = (clone $query)
            ->active()
            ->count();

        $inactive = (clone $query)
            ->inactive()
            ->count();

        $pending = (clone $query)
            ->pending()
            ->count();

        $blacklisted = (clone $query)
            ->blacklisted()
            ->count();

        $verified = (clone $query)
            ->verified()
            ->count();

        $unverified = (clone $query)
            ->unverified()
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Tenancy Statistics
        |--------------------------------------------------------------------------
        */

        $withActiveTenancy = (clone $query)
            ->withActiveTenancy()
            ->count();

        $withoutActiveTenancy = (clone $query)
            ->withoutActiveTenancy()
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Status Breakdown
        |--------------------------------------------------------------------------
        */

        $statusBreakdown = [
            Tenant::STATUS_ACTIVE =>
                $active,

            Tenant::STATUS_INACTIVE =>
                $inactive,

            Tenant::STATUS_PENDING =>
                $pending,

            Tenant::STATUS_BLACKLISTED =>
                $blacklisted,
        ];

        /*
        |--------------------------------------------------------------------------
        | Verification Breakdown
        |--------------------------------------------------------------------------
        */

        $verificationBreakdown = [
            'verified' =>
                $verified,

            'unverified' =>
                $unverified,
        ];

        /*
        |--------------------------------------------------------------------------
        | Tenancy Breakdown
        |--------------------------------------------------------------------------
        */

        $tenancyBreakdown = [
            'with_active_tenancy' =>
                $withActiveTenancy,

            'without_active_tenancy' =>
                $withoutActiveTenancy,
        ];

        /*
        |--------------------------------------------------------------------------
        | Registration Breakdown
        |--------------------------------------------------------------------------
        |
        | These values are calculated from the report period when a period
        | is supplied. For the global report, they represent current
        | calendar-day/month/year registrations.
        |
        */

        $registeredToday = (clone $query)
            ->whereDate(
                'created_at',
                now()->toDateString()
            )
            ->count();

        $registeredThisMonth = (clone $query)
            ->whereBetween(
                'created_at',
                [
                    now()->startOfMonth(),
                    now()->endOfMonth(),
                ]
            )
            ->count();

        $registeredThisYear = (clone $query)
            ->whereBetween(
                'created_at',
                [
                    now()->startOfYear(),
                    now()->endOfYear(),
                ]
            )
            ->count();

        /*
        |--------------------------------------------------------------------------
        | Selected Period Registration Summary
        |--------------------------------------------------------------------------
        */

        $periodRegistered = $total;

        $periodActive = $active;

        $periodPending = $pending;

        /*
        |--------------------------------------------------------------------------
        | Final Report
        |--------------------------------------------------------------------------
        */

        return [
            'summary' => [
                'total' =>
                    $total,

                'active' =>
                    $active,

                'inactive' =>
                    $inactive,

                'pending' =>
                    $pending,

                'blacklisted' =>
                    $blacklisted,

                'verified' =>
                    $verified,

                'unverified' =>
                    $unverified,

                'with_active_tenancy' =>
                    $withActiveTenancy,

                'without_active_tenancy' =>
                    $withoutActiveTenancy,
            ],

            'status_breakdown' =>
                $statusBreakdown,

            'verification_breakdown' =>
                $verificationBreakdown,

            'tenancy_breakdown' =>
                $tenancyBreakdown,

            'registration' => [
                'total' =>
                    $periodRegistered,

                'active' =>
                    $periodActive,

                'pending' =>
                    $periodPending,

                'today' =>
                    $registeredToday,

                'this_month' =>
                    $registeredThisMonth,

                'this_year' =>
                    $registeredThisYear,
            ],

            'period' => [
                'start_date' =>
                    $startDate?->toDateString(),

                'end_date' =>
                    $endDate?->toDateString(),
            ],

            'generated_at' =>
                now()->toISOString(),
        ];
    }

    /**
     * Backwards-compatible singular report method.
     *
     * Existing controllers can continue using:
     *
     *     $service->report($filters)
     */
    public function report(
        array $filters = []
    ): array {
        return $this->reports($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | Search
    |--------------------------------------------------------------------------
    */

    /**
     * Search tenants across tenant and User fields.
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
            ->where(function (Builder $query) use ($search): void {
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
                    ->orWhere(
                        'nationality',
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
                    ->orWhereHas(
                        'user',
                        function (Builder $userQuery) use ($search): void {
                            $userQuery
                                ->where(
                                    'name',
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
     * Generate a unique tenant number.
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
    | Tenant Collections
    |--------------------------------------------------------------------------
    */

    /**
     * Get active tenants.
     */
    public function getActive(): Collection
    {
        return $this->tenantQuery()
            ->active()
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
            ->inactive()
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
            ->blacklisted()
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
            ->pending()
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
            ->verified()
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
            ->unverified()
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /**
     * Get tenants with active tenancies.
     */
    public function getTenantsWithActiveTenancy(): Collection
    {
        return $this->tenantQuery()
            ->withActiveTenancy()
            ->orderBy(
                'created_at',
                'desc'
            )
            ->get();
    }

    /**
     * Get tenants without active tenancies.
     */
    public function getTenantsWithoutActiveTenancy(): Collection
    {
        return $this->tenantQuery()
            ->withoutActiveTenancy()
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
     * Get tenants by User ID.
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
     * Determine whether a tenant can be activated.
     */
    public function canActivate(
        Tenant $tenant
    ): bool {
        return $tenant->status !==
            Tenant::STATUS_BLACKLISTED;
    }
}