<?php

namespace App\Services;

use App\Models\Region;
use App\Repositories\Interfaces\RegionRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RegionService
{
    /*
    |--------------------------------------------------------------------------
    | CONSTRUCTOR
    |--------------------------------------------------------------------------
    */

    protected RegionRepositoryInterface $regionRepository;

    public function __construct(
        RegionRepositoryInterface $regionRepository
    ) {
        $this->regionRepository = $regionRepository;
    }

    /*
    |--------------------------------------------------------------------------
    | GET ALL REGIONS
    |--------------------------------------------------------------------------
    */

    public function all(array $filters = []): Collection
    {
        return $this->regionRepository->all($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | GET PAGINATED REGIONS
    |--------------------------------------------------------------------------
    */

    public function paginate(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {

        return $this->regionRepository->paginate(
            $perPage,
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FIND REGION BY ID
    |--------------------------------------------------------------------------
    */

    public function findById(int $id): Region
    {
        $region = $this->regionRepository->findById($id);

        if (!$region) {
            throw (new ModelNotFoundException())
                ->setModel(Region::class, [$id]);
        }

        return $region;
    }

    /*
    |--------------------------------------------------------------------------
    | FIND REGION BY SLUG
    |--------------------------------------------------------------------------
    */

    public function findBySlug(string $slug): Region
    {
        $region = $this->regionRepository->findBySlug($slug);

        if (!$region) {
            throw (new ModelNotFoundException())
                ->setModel(Region::class);
        }

        return $region;
    }

    /*
    |--------------------------------------------------------------------------
    | FIND REGION BY CODE
    |--------------------------------------------------------------------------
    */

    public function findByCode(string $code): Region
    {
        $region = $this->regionRepository->findByCode(
            strtoupper(trim($code))
        );

        if (!$region) {
            throw (new ModelNotFoundException())
                ->setModel(Region::class);
        }

        return $region;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE REGION
    |--------------------------------------------------------------------------
    */

    public function create(array $data): Region
    {
        return DB::transaction(function () use ($data) {

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE INPUT
            |--------------------------------------------------------------------------
            */

            $data = $this->normalizeData($data);

            /*
            |--------------------------------------------------------------------------
            | GENERATE SLUG
            |--------------------------------------------------------------------------
            */

            if (empty($data['slug'])) {
                $data['slug'] = Str::slug($data['name']);
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK DUPLICATE CODE
            |--------------------------------------------------------------------------
            */

            if ($this->regionRepository->codeExists($data['code'])) {
                throw ValidationException::withMessages([
                    'code' => [
                        'This region code is already registered.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK DUPLICATE SLUG
            |--------------------------------------------------------------------------
            */

            if ($this->regionRepository->slugExists($data['slug'])) {
                throw ValidationException::withMessages([
                    'slug' => [
                        'This region slug is already registered.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | DEFAULT STATUS
            |--------------------------------------------------------------------------
            */

            $data['is_active'] = $data['is_active'] ?? true;

            /*
            |--------------------------------------------------------------------------
            | CREATE REGION
            |--------------------------------------------------------------------------
            */

            return $this->regionRepository->create($data);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE REGION
    |--------------------------------------------------------------------------
    */

    public function update(int $id, array $data): Region
    {
        return DB::transaction(function () use ($id, $data) {

            /*
            |--------------------------------------------------------------------------
            | FIND REGION
            |--------------------------------------------------------------------------
            */

            $region = $this->findById($id);

            /*
            |--------------------------------------------------------------------------
            | NORMALIZE INPUT
            |--------------------------------------------------------------------------
            */

            $data = $this->normalizeData($data);

            /*
            |--------------------------------------------------------------------------
            | GENERATE SLUG WHEN NAME CHANGES
            |--------------------------------------------------------------------------
            */

            if (
                isset($data['name'])
                && !array_key_exists('slug', $data)
            ) {
                $data['slug'] = Str::slug($data['name']);
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK DUPLICATE CODE
            |--------------------------------------------------------------------------
            */

            if (
                isset($data['code'])
                && $this->regionRepository->codeExists(
                    $data['code'],
                    $id
                )
            ) {
                throw ValidationException::withMessages([
                    'code' => [
                        'This region code is already registered.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK DUPLICATE SLUG
            |--------------------------------------------------------------------------
            */

            if (
                isset($data['slug'])
                && $data['slug'] !== null
                && $this->regionRepository->slugExists(
                    $data['slug'],
                    $id
                )
            ) {
                throw ValidationException::withMessages([
                    'slug' => [
                        'This region slug is already registered.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | UPDATE REGION
            |--------------------------------------------------------------------------
            */

            $updatedRegion = $this->regionRepository->update(
                $region->id,
                $data
            );

            if (!$updatedRegion) {
                throw (new ModelNotFoundException())
                    ->setModel(Region::class, [$id]);
            }

            return $updatedRegion;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE REGION
    |--------------------------------------------------------------------------
    */

    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $region = $this->findById($id);

            /*
            |--------------------------------------------------------------------------
            | CHECK DEPENDENCIES
            |--------------------------------------------------------------------------
            */

            if ($this->regionRepository->hasDependencies($id)) {
                throw ValidationException::withMessages([
                    'region' => [
                        'This region cannot be deleted because it has associated counties.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | DELETE REGION
            |--------------------------------------------------------------------------
            */

            return $this->regionRepository->delete($region->id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE REGION
    |--------------------------------------------------------------------------
    */

    public function activate(int $id): Region
    {
        $region = $this->findById($id);

        if (!$this->regionRepository->activate($id)) {
            throw ValidationException::withMessages([
                'region' => [
                    'Unable to activate this region.',
                ],
            ]);
        }

        return $this->findById($region->id);
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE REGION
    |--------------------------------------------------------------------------
    */

    public function deactivate(int $id): Region
    {
        $region = $this->findById($id);

        if (!$this->regionRepository->deactivate($id)) {
            throw ValidationException::withMessages([
                'region' => [
                    'Unable to deactivate this region.',
                ],
            ]);
        }

        return $this->findById($region->id);
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE REGION STATUS
    |--------------------------------------------------------------------------
    */

    public function toggleStatus(int $id): Region
    {
        $region = $this->findById($id);

        if (!$this->regionRepository->toggleStatus($id)) {
            throw ValidationException::withMessages([
                'region' => [
                    'Unable to change the region status.',
                ],
            ]);
        }

        return $this->findById($region->id);
    }

    /*
    |--------------------------------------------------------------------------
    | GET REGION STATISTICS
    |--------------------------------------------------------------------------
    */

    public function statistics(array $filters = []): array
    {
        return $this->regionRepository->statistics($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | GET REGION REPORTS
    |--------------------------------------------------------------------------
    */

    public function reports(array $filters = []): array
    {
        return $this->regionRepository->reports($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | GET REGIONS BY COUNTRY
    |--------------------------------------------------------------------------
    */

    public function getByCountry(int $countryId): Collection
    {
        return $this->regionRepository->getByCountry($countryId);
    }

    /*
    |--------------------------------------------------------------------------
    | GET ACTIVE REGIONS
    |--------------------------------------------------------------------------
    */

    public function getActive(): Collection
    {
        return $this->regionRepository->getActive();
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK REGION EXISTENCE
    |--------------------------------------------------------------------------
    */

    public function exists(int $id): bool
    {
        return $this->regionRepository->exists($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK REGION CODE
    |--------------------------------------------------------------------------
    */

    public function codeExists(
        string $code,
        ?int $ignoreId = null
    ): bool {

        return $this->regionRepository->codeExists(
            strtoupper(trim($code)),
            $ignoreId
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK REGION SLUG
    |--------------------------------------------------------------------------
    */

    public function slugExists(
        string $slug,
        ?int $ignoreId = null
    ): bool {

        return $this->regionRepository->slugExists(
            Str::slug($slug),
            $ignoreId
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE REGION
    |--------------------------------------------------------------------------
    */

    public function restore(int $id): Region
    {
        return DB::transaction(function () use ($id) {

            $region = $this->regionRepository
                ->findTrashedById($id);

            if (!$region) {
                throw (new ModelNotFoundException())
                    ->setModel(Region::class, [$id]);
            }

            /*
            |--------------------------------------------------------------------------
            | RESTORE REGION
            |--------------------------------------------------------------------------
            */

            if (!$this->regionRepository->restore($id)) {
                throw ValidationException::withMessages([
                    'region' => [
                        'Unable to restore this region.',
                    ],
                ]);
            }

            return $this->findById($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE REGION
    |--------------------------------------------------------------------------
    */

    public function forceDelete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $region = $this->regionRepository
                ->findTrashedById($id);

            if (!$region) {
                throw (new ModelNotFoundException())
                    ->setModel(Region::class, [$id]);
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK DEPENDENCIES
            |--------------------------------------------------------------------------
            */

            if ($this->regionRepository->hasDependencies($id)) {
                throw ValidationException::withMessages([
                    'region' => [
                        'This region cannot be permanently deleted because it has associated counties.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | PERMANENT DELETE
            |--------------------------------------------------------------------------
            */

            if (!$this->regionRepository->forceDelete($id)) {
                throw ValidationException::withMessages([
                    'region' => [
                        'Unable to permanently delete this region.',
                    ],
                ]);
            }

            return true;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | GET DELETED REGIONS
    |--------------------------------------------------------------------------
    */

    public function getTrashed(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {

        return $this->regionRepository->getTrashed(
            $perPage,
            $filters
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FIND DELETED REGION
    |--------------------------------------------------------------------------
    */

    public function findTrashedById(int $id): Region
    {
        $region = $this->regionRepository
            ->findTrashedById($id);

        if (!$region) {
            throw (new ModelNotFoundException())
                ->setModel(Region::class, [$id]);
        }

        return $region;
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK REGION DEPENDENCIES
    |--------------------------------------------------------------------------
    */

    public function hasDependencies(int $id): bool
    {
        return $this->regionRepository->hasDependencies($id);
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE REGION DATA
    |--------------------------------------------------------------------------
    */

    protected function normalizeData(array $data): array
    {
        /*
        |--------------------------------------------------------------------------
        | NORMALIZE NAME
        |--------------------------------------------------------------------------
        */

        if (isset($data['name'])) {
            $data['name'] = trim($data['name']);
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZE SLUG
        |--------------------------------------------------------------------------
        */

        if (isset($data['slug']) && $data['slug'] !== '') {
            $data['slug'] = Str::slug($data['slug']);
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZE CODE
        |--------------------------------------------------------------------------
        */

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZE COUNTRY ID
        |--------------------------------------------------------------------------
        */

        if (isset($data['country_id'])) {
            $data['country_id'] = (int) $data['country_id'];
        }

        /*
        |--------------------------------------------------------------------------
        | NORMALIZE STATUS
        |--------------------------------------------------------------------------
        */

        if (array_key_exists('is_active', $data)) {
            $data['is_active'] = filter_var(
                $data['is_active'],
                FILTER_VALIDATE_BOOLEAN
            );
        }

        return $data;
    }
}
