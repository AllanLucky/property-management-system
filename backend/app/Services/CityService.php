<?php

namespace App\Services;

use App\Models\City;
use App\Repositories\Interfaces\CityRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CityService
{
    public function __construct(
        protected CityRepositoryInterface $cityRepository
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | GET CITIES
    |--------------------------------------------------------------------------
    */

    public function all(array $filters = []): Collection
    {
        return $this->cityRepository->all($filters);
    }

    public function paginate(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->cityRepository->paginate(
            min(max($perPage, 1), 100),
            $filters
        );
    }

    public function findById(int $id): City
    {
        $city = $this->cityRepository->findById($id);

        if (!$city) {
            throw ValidationException::withMessages([
                'city' => ['The selected city does not exist.'],
            ]);
        }

        return $city;
    }

    public function findBySlug(string $slug): City
    {
        $city = $this->cityRepository->findBySlug($slug);

        if (!$city) {
            throw ValidationException::withMessages([
                'slug' => ['The selected city does not exist.'],
            ]);
        }

        return $city;
    }

    public function findByCode(string $code): City
    {
        $city = $this->cityRepository->findByCode(
            strtoupper(trim($code))
        );

        if (!$city) {
            throw ValidationException::withMessages([
                'code' => ['The selected city code does not exist.'],
            ]);
        }

        return $city;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE CITY
    |--------------------------------------------------------------------------
    */

    public function create(array $data): City
    {
        return DB::transaction(function () use ($data) {

            $data = $this->normalizeData($data);

            $this->validateLocationHierarchy(
                $data['country_id'],
                $data['region_id'],
                $data['county_id']
            );

            $this->validateUniqueCode(
                $data['code'] ?? null
            );

            $data['slug'] = $this->generateUniqueSlug(
                $data['country_id'],
                $data['region_id'],
                $data['county_id'],
                $data['name']
            );

            $city = $this->cityRepository->create($data);

            /*
             * The City model may generate a name-only slug in its
             * saving event. Save the hierarchical slug explicitly.
             */
            $city->slug = $data['slug'];
            $city->saveQuietly();

            return $this->findById($city->id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE CITY
    |--------------------------------------------------------------------------
    */

    public function update(int $id, array $data): City
    {
        return DB::transaction(function () use ($id, $data) {

            $city = $this->findById($id);

            $data = $this->normalizeData($data);

            $countryId = (int) (
                $data['country_id'] ?? $city->country_id
            );

            $regionId = (int) (
                $data['region_id'] ?? $city->region_id
            );

            $countyId = (int) (
                $data['county_id'] ?? $city->county_id
            );

            $name = $data['name'] ?? $city->name;

            $this->validateLocationHierarchy(
                $countryId,
                $regionId,
                $countyId
            );

            $this->validateUniqueCode(
                $data['code'] ?? $city->code,
                $id
            );

            $slug = $this->generateUniqueSlug(
                $countryId,
                $regionId,
                $countyId,
                $name,
                $id
            );

            $data['country_id'] = $countryId;
            $data['region_id'] = $regionId;
            $data['county_id'] = $countyId;
            $data['name'] = $name;
            $data['slug'] = $slug;

            $updatedCity = $this->cityRepository->update(
                $id,
                $data
            );

            if (!$updatedCity) {
                throw ValidationException::withMessages([
                    'city' => ['Unable to update the selected city.'],
                ]);
            }

            /*
             * Ensure the hierarchical slug is preserved even if
             * the model saving event generates another slug.
             */
            $updatedCity->slug = $slug;
            $updatedCity->saveQuietly();

            return $this->findById($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE CITY
    |--------------------------------------------------------------------------
    */

    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $this->findById($id);

            if ($this->cityRepository->hasDependencies($id)) {
                throw ValidationException::withMessages([
                    'city' => [
                        'This city cannot be deleted because it has associated areas or properties.',
                    ],
                ]);
            }

            return $this->cityRepository->delete($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE CITY
    |--------------------------------------------------------------------------
    */

    public function restore(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $city = $this->cityRepository->findTrashedById($id);

            if (!$city) {
                throw ValidationException::withMessages([
                    'city' => [
                        'The deleted city could not be found.',
                    ],
                ]);
            }

            $this->validateLocationHierarchy(
                (int) $city->country_id,
                (int) $city->region_id,
                (int) $city->county_id
            );

            if (
                $this->cityRepository->slugExists(
                    $city->slug,
                    $id
                )
            ) {
                throw ValidationException::withMessages([
                    'slug' => [
                        'This city cannot be restored because its slug is already in use.',
                    ],
                ]);
            }

            return $this->cityRepository->restore($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE CITY
    |--------------------------------------------------------------------------
    */

    public function forceDelete(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $city = $this->cityRepository->findTrashedById($id);

            if (!$city) {
                throw ValidationException::withMessages([
                    'city' => [
                        'The deleted city could not be found.',
                    ],
                ]);
            }

            if ($this->cityRepository->hasDependencies($id)) {
                throw ValidationException::withMessages([
                    'city' => [
                        'This city cannot be permanently deleted because it has associated areas or properties.',
                    ],
                ]);
            }

            return $this->cityRepository->forceDelete($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | ACTIVATE / DEACTIVATE
    |--------------------------------------------------------------------------
    */

    public function activate(int $id): bool
    {
        $this->findById($id);

        return $this->cityRepository->activate($id);
    }

    public function deactivate(int $id): bool
    {
        $this->findById($id);

        return $this->cityRepository->deactivate($id);
    }

    public function toggleStatus(int $id): bool
    {
        $this->findById($id);

        return $this->cityRepository->toggleStatus($id);
    }

    /*
    |--------------------------------------------------------------------------
    | FILTER CITIES BY LOCATION
    |--------------------------------------------------------------------------
    */

    public function getByCountry(int $countryId): Collection
    {
        return $this->cityRepository->getByCountry($countryId);
    }

    public function getByRegion(int $regionId): Collection
    {
        return $this->cityRepository->getByRegion($regionId);
    }

    public function getByCounty(int $countyId): Collection
    {
        return $this->cityRepository->getByCounty($countyId);
    }

    public function getActive(): Collection
    {
        return $this->cityRepository->getActive();
    }

    public function getInactive(): Collection
    {
        return $this->cityRepository->getInactive();
    }

    /*
    |--------------------------------------------------------------------------
    | STATISTICS AND REPORTS
    |--------------------------------------------------------------------------
    */

    public function statistics(array $filters = []): array
    {
        return $this->cityRepository->statistics($filters);
    }

    public function reports(array $filters = []): array
    {
        return $this->cityRepository->reports($filters);
    }

    /*
    |--------------------------------------------------------------------------
    | TRASHED CITIES
    |--------------------------------------------------------------------------
    */

    public function getTrashed(
        int $perPage = 25,
        array $filters = []
    ): LengthAwarePaginator {
        return $this->cityRepository->getTrashed(
            min(max($perPage, 1), 100),
            $filters
        );
    }

    public function findTrashedById(int $id): City
    {
        $city = $this->cityRepository->findTrashedById($id);

        if (!$city) {
            throw ValidationException::withMessages([
                'city' => ['The deleted city could not be found.'],
            ]);
        }

        return $city;
    }

    /*
    |--------------------------------------------------------------------------
    | EXISTENCE CHECKS
    |--------------------------------------------------------------------------
    */

    public function exists(int $id): bool
    {
        return $this->cityRepository->exists($id);
    }

    public function codeExists(
        string $code,
        ?int $ignoreId = null
    ): bool {
        return $this->cityRepository->codeExists(
            strtoupper(trim($code)),
            $ignoreId
        );
    }

    public function slugExists(
        string $slug,
        ?int $ignoreId = null
    ): bool {
        return $this->cityRepository->slugExists(
            Str::slug($slug),
            $ignoreId
        );
    }

    public function hasDependencies(int $id): bool
    {
        return $this->cityRepository->hasDependencies($id);
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE INPUT DATA
    |--------------------------------------------------------------------------
    */

    protected function normalizeData(array $data): array
    {
        if (isset($data['name'])) {
            $data['name'] = trim($data['name']);
        }

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));

            if ($data['code'] === '') {
                $data['code'] = null;
            }
        }

        foreach (['country_id', 'region_id', 'county_id'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = (int) $data[$field];
            }
        }

        if (isset($data['is_active'])) {
            $data['is_active'] = (bool) $data['is_active'];
        }

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE LOCATION HIERARCHY
    |--------------------------------------------------------------------------
    |
    | Uses DB table queries to avoid relying on deleted_at columns
    | or global scopes on the parent geographical models.
    |
    */

    protected function validateLocationHierarchy(
        int $countryId,
        int $regionId,
        int $countyId
    ): void {
        $countryExists = DB::table('countries')
            ->where('id', $countryId)
            ->where('is_active', true)
            ->exists();

        if (!$countryExists) {
            throw ValidationException::withMessages([
                'country_id' => [
                    'The selected country does not exist or is inactive.',
                ],
            ]);
        }

        $regionExists = DB::table('regions')
            ->where('id', $regionId)
            ->where('country_id', $countryId)
            ->where('is_active', true)
            ->exists();

        if (!$regionExists) {
            throw ValidationException::withMessages([
                'region_id' => [
                    'The selected region does not belong to the selected country or is inactive.',
                ],
            ]);
        }

        $countyExists = DB::table('counties')
            ->where('id', $countyId)
            ->where('country_id', $countryId)
            ->where('region_id', $regionId)
            ->where('is_active', true)
            ->exists();

        if (!$countyExists) {
            throw ValidationException::withMessages([
                'county_id' => [
                    'The selected county does not belong to the selected country and region, or is inactive.',
                ],
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE UNIQUE CITY CODE
    |--------------------------------------------------------------------------
    */

    protected function validateUniqueCode(
        ?string $code,
        ?int $ignoreId = null
    ): void {
        if (!$code) {
            return;
        }

        if (
            $this->cityRepository->codeExists(
                strtoupper(trim($code)),
                $ignoreId
            )
        ) {
            throw ValidationException::withMessages([
                'code' => [
                    'This city code is already registered.',
                ],
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE HIERARCHICAL CITY SLUG
    |--------------------------------------------------------------------------
    |
    | Example:
    | kenya-nairobi-region-nairobi-county-nairobi
    |
    */

    protected function generateUniqueSlug(
        int $countryId,
        int $regionId,
        int $countyId,
        string $cityName,
        ?int $ignoreId = null
    ): string {
        $country = DB::table('countries')
            ->where('id', $countryId)
            ->value('name');

        $region = DB::table('regions')
            ->where('id', $regionId)
            ->value('name');

        $county = DB::table('counties')
            ->where('id', $countyId)
            ->value('name');

        $baseSlug = Str::slug(
            implode('-', array_filter([
                $country,
                $region,
                $county,
                $cityName,
            ]))
        );

        if ($baseSlug === '') {
            $baseSlug = 'city';
        }

        $slug = $baseSlug;
        $counter = 1;

        while (
            $this->cityRepository->slugExists(
                $slug,
                $ignoreId
            )
        ) {
            $slug = $baseSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
