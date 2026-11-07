<?php

namespace App\Services;

use App\Models\Country;
use App\Repositories\Interfaces\CountryRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpException;

class CountryService
{
    /*
    |--------------------------------------------------------------------------
    | CONSTRUCTOR
    |--------------------------------------------------------------------------
    */

    public function __construct(
        protected CountryRepositoryInterface $countryRepository
    ) {
    }

    /*
    |--------------------------------------------------------------------------
    | GET COUNTRIES
    |--------------------------------------------------------------------------
    */

    /**
     * Get all countries.
     */
    public function getAllCountries(array $filters = []): Collection
    {
        return $this->countryRepository->all($filters);
    }

    /**
     * Get paginated countries.
     */
    public function getCountries(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {
        $perPage = max(1, min($perPage, 100));

        return $this->countryRepository->paginate(
            $filters,
            $perPage
        );
    }

    /**
     * Get active countries.
     */
    public function getActiveCountries(): Collection
    {
        return $this->countryRepository->getActive();
    }

    /**
     * Get inactive countries.
     */
    public function getInactiveCountries(): Collection
    {
        return $this->countryRepository->getInactive();
    }

    /*
    |--------------------------------------------------------------------------
    | FIND COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Get country details.
     */
    public function getCountry(int $id): Country
    {
        return $this->countryRepository->findOrFail($id);
    }

    /**
     * Find country by ISO code.
     */
    public function getCountryByCode(string $code): ?Country
    {
        return $this->countryRepository->findByCode($code);
    }

    /**
     * Find country by slug.
     */
    public function getCountryBySlug(string $slug): ?Country
    {
        return $this->countryRepository->findBySlug($slug);
    }

    /**
     * Find country by phone code.
     */
    public function getCountryByPhoneCode(
        string $phoneCode
    ): ?Country {
        return $this->countryRepository->findByPhoneCode(
            $phoneCode
        );
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Create a new country.
     */
    public function createCountry(array $data): Country
    {
        return DB::transaction(function () use ($data) {

            $data = $this->prepareCountryData($data);

            $this->validateUniqueFields($data);

            /*
            |--------------------------------------------------------------------------
            | CREATE COUNTRY
            |--------------------------------------------------------------------------
            */

            return $this->countryRepository->create($data);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Update an existing country.
     */
    public function updateCountry(
        int $id,
        array $data
    ): Country {
        return DB::transaction(function () use ($id, $data) {

            $country = $this->countryRepository->findOrFail($id);

            $data = $this->prepareCountryData(
                $data,
                $country
            );

            $this->validateUniqueFields(
                $data,
                $country->id
            );

            return $this->countryRepository->update(
                $country->id,
                $data
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PREPARE COUNTRY DATA
    |--------------------------------------------------------------------------
    */

    /**
     * Normalize and prepare country data.
     */
    protected function prepareCountryData(
        array $data,
        ?Country $country = null
    ): array {
        /*
        |--------------------------------------------------------------------------
        | COUNTRY NAME
        |--------------------------------------------------------------------------
        */

        if (isset($data['name'])) {
            $data['name'] = Str::title(trim($data['name']));
        }

        /*
        |--------------------------------------------------------------------------
        | COUNTRY SLUG
        |--------------------------------------------------------------------------
        |
        | Generate slug automatically when a new country is created
        | or when the country name changes without a supplied slug.
        */

        if (
            !empty($data['name']) &&
            (
                !isset($data['slug']) ||
                trim($data['slug']) === ''
            )
        ) {
            if (
                !$country ||
                $country->name !== $data['name']
            ) {
                $data['slug'] = Str::slug($data['name']);
            }
        }

        if (isset($data['slug'])) {
            $data['slug'] = Str::slug($data['slug']);
        }

        /*
        |--------------------------------------------------------------------------
        | ISO COUNTRY CODE
        |--------------------------------------------------------------------------
        */

        if (isset($data['code'])) {
            $data['code'] = strtoupper(trim($data['code']));
        }

        /*
        |--------------------------------------------------------------------------
        | PHONE CODE
        |--------------------------------------------------------------------------
        */

        if (isset($data['phone_code'])) {
            $data['phone_code'] = trim($data['phone_code']);
        }

        /*
        |--------------------------------------------------------------------------
        | CURRENCY
        |--------------------------------------------------------------------------
        */

        if (isset($data['currency'])) {
            $data['currency'] = strtoupper(trim($data['currency']));
        }

        return $data;
    }

    /*
    |--------------------------------------------------------------------------
    | UNIQUE FIELD VALIDATION
    |--------------------------------------------------------------------------
    */

    /**
     * Check country code and slug uniqueness.
     */
    protected function validateUniqueFields(
        array $data,
        ?int $exceptId = null
    ): void {
        /*
        |--------------------------------------------------------------------------
        | COUNTRY CODE
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['code']) &&
            $this->countryRepository->codeExists(
                $data['code'],
                $exceptId
            )
        ) {
            throw ValidationException::withMessages([
                'code' => [
                    'This country code is already registered.',
                ],
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | COUNTRY SLUG
        |--------------------------------------------------------------------------
        */

        if (
            isset($data['slug']) &&
            $this->countryRepository->slugExists(
                $data['slug'],
                $exceptId
            )
        ) {
            throw ValidationException::withMessages([
                'slug' => [
                    'This country slug is already registered.',
                ],
            ]);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Soft delete a country.
     *
     * Countries with associated geographical records or properties
     * cannot be deleted.
     */
    public function deleteCountry(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $country = $this->countryRepository->findOrFail($id);

            if (
                $this->countryRepository->hasDependencies(
                    $country->id
                )
            ) {
                throw ValidationException::withMessages([
                    'country' => [
                        'This country cannot be deleted because it has associated regions, counties, cities, areas or properties.',
                    ],
                ]);
            }

            return $this->countryRepository->delete(
                $country->id
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RESTORE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Restore a soft-deleted country.
     */
    public function restoreCountry(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $country = $this->countryRepository->findTrashed($id);

            if (!$country) {
                throw new HttpException(
                    404,
                    'Soft-deleted country not found.'
                );
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK DUPLICATE COUNTRY CODE
            |--------------------------------------------------------------------------
            */

            if (
                $this->countryRepository->codeExists(
                    $country->code
                )
            ) {
                throw ValidationException::withMessages([
                    'code' => [
                        'This country cannot be restored because its ISO code is already in use.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | CHECK DUPLICATE SLUG
            |--------------------------------------------------------------------------
            */

            if (
                $this->countryRepository->slugExists(
                    $country->slug
                )
            ) {
                throw ValidationException::withMessages([
                    'slug' => [
                        'This country cannot be restored because its slug is already in use.',
                    ],
                ]);
            }

            return $this->countryRepository->restore($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | FORCE DELETE COUNTRY
    |--------------------------------------------------------------------------
    */

    /**
     * Permanently delete a country.
     *
     * This operation should only be exposed through a
     * super-admin protected controller action.
     */
    public function forceDeleteCountry(int $id): bool
    {
        return DB::transaction(function () use ($id) {

            $country = Country::withTrashed()->findOrFail($id);

            if (
                $this->countryRepository->hasDependencies(
                    $country->id
                )
            ) {
                throw ValidationException::withMessages([
                    'country' => [
                        'This country cannot be permanently deleted because it has associated geographical records or properties.',
                    ],
                ]);
            }

            return $this->countryRepository->forceDelete(
                $country->id
            );
        });
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTRY STATUS
    |--------------------------------------------------------------------------
    */

    /**
     * Activate a country.
     */
    public function activateCountry(int $id): Country
    {
        return DB::transaction(function () use ($id) {

            $country = $this->countryRepository->findOrFail($id);

            if ($country->is_active) {
                throw ValidationException::withMessages([
                    'is_active' => [
                        'This country is already active.',
                    ],
                ]);
            }

            return $this->countryRepository->activate($id);
        });
    }

    /**
     * Deactivate a country.
     */
    public function deactivateCountry(int $id): Country
    {
        return DB::transaction(function () use ($id) {

            $country = $this->countryRepository->findOrFail($id);

            if (!$country->is_active) {
                throw ValidationException::withMessages([
                    'is_active' => [
                        'This country is already inactive.',
                    ],
                ]);
            }

            return $this->countryRepository->deactivate($id);
        });
    }

    /**
     * Toggle country status.
     */
    public function toggleCountryStatus(int $id): Country
    {
        return DB::transaction(function () use ($id) {

            $this->countryRepository->findOrFail($id);

            return $this->countryRepository->toggleStatus($id);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTRY STATISTICS
    |--------------------------------------------------------------------------
    */

    /**
     * Get country statistics.
     */
    public function getCountryStatistics(): array
    {
        return $this->countryRepository->getStatistics();
    }

    /*
    |--------------------------------------------------------------------------
    | TRASHED COUNTRIES
    |--------------------------------------------------------------------------
    */

    /**
     * Get all soft-deleted countries.
     */
    public function getTrashedCountries(): Collection
    {
        return $this->countryRepository->getTrashed();
    }

    /**
     * Get paginated soft-deleted countries.
     */
    public function getTrashedCountriesPaginated(
        array $filters = [],
        int $perPage = 25
    ): LengthAwarePaginator {
        $perPage = max(1, min($perPage, 100));

        return $this->countryRepository->paginateTrashed(
            $filters,
            $perPage
        );
    }

    /**
     * Get a soft-deleted country.
     */
    public function getTrashedCountry(int $id): Country
    {
        $country = $this->countryRepository->findTrashed($id);

        if (!$country) {
            throw new HttpException(
                404,
                'Soft-deleted country not found.'
            );
        }

        return $country;
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTRY EXISTENCE
    |--------------------------------------------------------------------------
    */

    /**
     * Check whether a country exists.
     */
    public function countryExists(int $id): bool
    {
        return $this->countryRepository->exists($id);
    }
}
