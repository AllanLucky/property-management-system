<?php

namespace App\Services;

use App\Models\County;
use App\Models\Country;
use App\Models\Region;
use App\Repositories\Interfaces\CountyRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class CountyService
{
    public function __construct(
        protected CountyRepositoryInterface $countyRepository
    ) {}

    /*
    |--------------------------------------------------------------------------
    | GET ALL COUNTIES
    |--------------------------------------------------------------------------
    */

    public function getAllCounties(array $filters = []): Collection
    {
        return $this->countyRepository->all($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | GET PAGINATED COUNTIES
    |--------------------------------------------------------------------------
    */

    public function getPaginatedCounties(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {

        $perPage = max(1, min($perPage, 100));

        return $this->countyRepository->paginate(
            $filters,
            $perPage
        );
    }

    /*
    |--------------------------------------------------------------------------
    | FIND COUNTY BY ID
    |--------------------------------------------------------------------------
    */

    public function getCountyById(int $id): County
    {
        $county = $this->countyRepository->findById($id);

        if (!$county) {
            throw new RuntimeException('County not found.');
        }

        return $county;
    }

    /*
    |--------------------------------------------------------------------------
    | FIND COUNTY BY SLUG
    |--------------------------------------------------------------------------
    */

    public function getCountyBySlug(string $slug): County
    {
        $county = $this->countyRepository->findBySlug($slug);

        if (!$county) {
            throw new RuntimeException('County not found.');
        }

        return $county;
    }

    /*
    |--------------------------------------------------------------------------
    | FIND SOFT-DELETED COUNTY BY ID
    |--------------------------------------------------------------------------
    */

    public function getCountyByTrashedId(int $id): County
    {
        $county = $this->countyRepository->findTrashedById($id);

        if (!$county) {
            throw new RuntimeException(
                'Deleted county not found.'
            );
        }

        return $county;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function createCounty(array $data): County
    {
        return DB::transaction(function () use ($data) {

            $this->validateLocation(
                (int) $data['country_id'],
                (int) $data['region_id']
            );

            $data['name'] = trim($data['name']);

            if (empty($data['slug'])) {
                $data['slug'] = $this->generateHierarchicalSlug(
                    (int) $data['country_id'],
                    (int) $data['region_id'],
                    $data['name']
                );
            } else {
                $data['slug'] = Str::slug($data['slug']);
            }

            if (isset($data['code'])) {
                $data['code'] = strtoupper(trim($data['code']));
            }

            $data['is_active'] = $data['is_active'] ?? true;

            return $this->countyRepository->create($data);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function updateCounty(
        int $id,
        array $data
    ): County {

        return DB::transaction(function () use ($id, $data) {

            $county = $this->getCountyById($id);

            $countryId = (int) (
                $data['country_id'] ?? $county->country_id
            );

            $regionId = (int) (
                $data['region_id'] ?? $county->region_id
            );

            $this->validateLocation(
                $countryId,
                $regionId
            );

            if (isset($data['name'])) {
                $data['name'] = trim($data['name']);
            }

            if (isset($data['slug'])) {
                $data['slug'] = Str::slug($data['slug']);
            }

            if (isset($data['code'])) {
                $data['code'] = strtoupper(trim($data['code']));
            }

            /*
             * The repository regenerates the hierarchical slug
             * when the county name, country, or region changes
             * and no custom slug is supplied.
             */

            return $this->countyRepository->update(
                $county,
                $data
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE COUNTY
    |--------------------------------------------------------------------------
    */

    public function deleteCounty(int $id): bool
    {
        $county = $this->getCountyById($id);

        if ($this->countyRepository->hasDependencies($county)) {
            throw ValidationException::withMessages([
                'county' => [
                    'This county cannot be deleted because it has related cities, areas, or properties.',
                ],
            ]);
        }

        return $this->countyRepository->delete($county);
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE COUNTY
    |--------------------------------------------------------------------------
    */

    public function restoreCounty(int $id): County
    {
        // Retrieve only a soft-deleted county.
        $county = $this->getCountyByTrashedId($id);

        // Restore the county through the repository.
        $restored = $this->countyRepository->restore($county->id);

        if (!$restored) {
            throw new RuntimeException(
                'Unable to restore county.'
            );
        }

        return $restored;
    }

    /*
    |--------------------------------------------------------------------------
    | PERMANENTLY DELETE COUNTY
    |--------------------------------------------------------------------------
    */

    public function forceDeleteCounty(int $id): bool
    {
        $county = $this->countyRepository->findWithTrashed($id);

        if (!$county) {
            throw new RuntimeException('County not found.');
        }

        if ($this->countyRepository->hasDependencies($county)) {
            throw ValidationException::withMessages([
                'county' => [
                    'This county cannot be permanently deleted because it has related records.',
                ],
            ]);
        }

        return $this->countyRepository->forceDelete($id);
    }

    /*
    |--------------------------------------------------------------------------
    | GET ACTIVE COUNTIES
    |--------------------------------------------------------------------------
    */

    public function getActiveCounties(
        array $filters = []
    ): Collection {
        return $this->countyRepository->getActive($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | GET INACTIVE COUNTIES
    |--------------------------------------------------------------------------
    */

    public function getInactiveCounties(
        array $filters = []
    ): Collection {
        return $this->countyRepository->getInactive($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | GET COUNTIES BY COUNTRY
    |--------------------------------------------------------------------------
    */

    public function getCountiesByCountry(int $countryId): Collection
    {
        $country = Country::query()->find($countryId);

        if (!$country) {
            throw new RuntimeException('Country not found.');
        }

        return $this->countyRepository->getByCountry($countryId);
    }

    /*
    |--------------------------------------------------------------------------
    | GET COUNTIES BY REGION
    |--------------------------------------------------------------------------
    */

    public function getCountiesByRegion(int $regionId): Collection
    {
        $region = Region::query()->find($regionId);

        if (!$region) {
            throw new RuntimeException('Region not found.');
        }

        return $this->countyRepository->getByRegion($regionId);
    }

    /*
    |--------------------------------------------------------------------------
    | SEARCH COUNTIES
    |--------------------------------------------------------------------------
    */

    public function searchCounties(string $search): Collection
    {
        $search = trim($search);

        if ($search === '') {
            return new Collection();
        }

        return $this->countyRepository->search($search);
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function activateCounty(int $id): County
    {
        $county = $this->getCountyById($id);

        if ($county->is_active) {
            throw ValidationException::withMessages([
                'status' => ['This county is already active.'],
            ]);
        }

        $this->countyRepository->activate($county);

        return $county->fresh([
            'country',
            'region',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | DEACTIVATE COUNTY
    |--------------------------------------------------------------------------
    */

    public function deactivateCounty(int $id): County
    {
        $county = $this->getCountyById($id);

        if (!$county->is_active) {
            throw ValidationException::withMessages([
                'status' => ['This county is already inactive.'],
            ]);
        }

        $this->countyRepository->deactivate($county);

        return $county->fresh([
            'country',
            'region',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TOGGLE COUNTY STATUS
    |--------------------------------------------------------------------------
    */

    public function toggleCountyStatus(int $id): County
    {
        $county = $this->getCountyById($id);

        $this->countyRepository->toggleStatus($county);

        return $county->fresh([
            'country',
            'region',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | GET COUNTY STATISTICS
    |--------------------------------------------------------------------------
    */

    public function getStatistics(array $filters = []): array
    {
        return $this->countyRepository->getStatistics($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | GET TRASHED COUNTIES
    |--------------------------------------------------------------------------
    */

    public function getTrashedCounties(
        array $filters = []
    ): LengthAwarePaginator {
        return $this->countyRepository->getTrashed($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK COUNTY EXISTS
    |--------------------------------------------------------------------------
    */

    public function countyExists(int $id): bool
    {
        return $this->countyRepository->exists($id);
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK COUNTY DEPENDENCIES
    |--------------------------------------------------------------------------
    */

    public function hasDependencies(int $id): bool
    {
        $county = $this->countyRepository->findWithTrashed($id);

        if (!$county) {
            return false;
        }

        return $this->countyRepository->hasDependencies($county);
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE COUNTRY AND REGION RELATIONSHIP
    |--------------------------------------------------------------------------
    */

    protected function validateLocation(
        int $countryId,
        int $regionId
    ): void {

        $country = Country::query()
            ->whereKey($countryId)
            ->where('is_active', true)
            ->first();

        if (!$country) {
            throw ValidationException::withMessages([
                'country_id' => [
                    'The selected country does not exist or is inactive.',
                ],
            ]);
        }

        $region = Region::query()
            ->whereKey($regionId)
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->first();

        if (!$region) {
            throw ValidationException::withMessages([
                'region_id' => [
                    'The selected region does not belong to the selected country or is inactive.',
                ],
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE HIERARCHICAL SLUG
    |--------------------------------------------------------------------------
    */

    protected function generateHierarchicalSlug(
        int $countryId,
        int $regionId,
        string $countyName
    ): string {

        $country = Country::findOrFail($countryId);

        $region = Region::findOrFail($regionId);

        return Str::slug(
            $country->name . '-' .
            $region->name . '-' .
            $countyName
        );
    }
}
