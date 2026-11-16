<?php

namespace App\Http\Requests\Location;

use App\Models\Area;
use App\Models\City;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAreaRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare input before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => is_string($this->name)
                ? trim($this->name)
                : $this->name,

            'slug' => is_string($this->slug)
                ? strtolower(trim($this->slug))
                : $this->slug,

            'code' => is_string($this->code)
                ? strtoupper(trim($this->code))
                : $this->code,
        ]);
    }

    /**
     * Get the area being updated using its numeric ID.
     */
    protected function getArea(): ?Area
    {
        // Your current route uses {id}.
        $routeId = $this->route('id');

        // Also support {area} for compatibility.
        if ($routeId === null) {
            $routeId = $this->route('area');
        }

        if ($routeId instanceof Area) {
            return $routeId;
        }

        if (!is_numeric($routeId)) {
            return null;
        }

        return Area::query()->find((int) $routeId);
    }

    /**
     * Get the validation rules.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $area = $this->getArea();

        $areaId = $area?->id ?? $this->route('id');

        if ($areaId === null) {
            $areaId = $this->route('area');
        }

        return [
            /*
            |--------------------------------------------------------------------------
            | LOCATION HIERARCHY
            |--------------------------------------------------------------------------
            */

            'country_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:countries,id',
            ],

            'region_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:regions,id',
            ],

            'county_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:counties,id',
            ],

            'city_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:cities,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | AREA INFORMATION
            |--------------------------------------------------------------------------
            */

            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:255',
                Rule::unique('areas', 'name')
                    ->where('city_id', $this->input(
                        'city_id',
                        $area?->city_id
                    ))
                    ->ignore($areaId),
            ],

            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('areas', 'slug')
                    ->ignore($areaId),
            ],

            'code' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:50',
                Rule::unique('areas', 'code')
                    ->ignore($areaId),
            ],

            /*
            |--------------------------------------------------------------------------
            | GEOGRAPHIC COORDINATES
            |--------------------------------------------------------------------------
            */

            'latitude' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-90,90',
            ],

            'longitude' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-180,180',
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Additional validation after the main rules.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {

            $area = $this->getArea();

            if (!$area) {
                $validator->errors()->add(
                    'area',
                    'The area you are trying to update does not exist.'
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | RESOLVE LOCATION HIERARCHY
            |--------------------------------------------------------------------------
            */

            $countryId = $this->input(
                'country_id',
                $area->country_id
            );

            $regionId = $this->input(
                'region_id',
                $area->region_id
            );

            $countyId = $this->input(
                'county_id',
                $area->county_id
            );

            $cityId = $this->input(
                'city_id',
                $area->city_id
            );

            /*
            |--------------------------------------------------------------------------
            | VALIDATE CITY HIERARCHY
            |--------------------------------------------------------------------------
            */

            $validCity = City::query()
                ->whereKey($cityId)
                ->where('country_id', $countryId)
                ->where('region_id', $regionId)
                ->where('county_id', $countyId)
                ->exists();

            if (!$validCity) {
                $validator->errors()->add(
                    'city_id',
                    'The selected city does not belong to the selected country, region and county.'
                );
            }
        });
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'country_id.required' => 'Please select a country.',
            'country_id.exists' => 'The selected country does not exist.',

            'region_id.required' => 'Please select a region.',
            'region_id.exists' => 'The selected region does not exist.',

            'county_id.required' => 'Please select a county.',
            'county_id.exists' => 'The selected county does not exist.',

            'city_id.required' => 'Please select a city.',
            'city_id.exists' => 'The selected city does not exist.',

            'name.required' => 'Please enter the area name.',
            'name.min' => 'The area name must contain at least 2 characters.',
            'name.max' => 'The area name cannot exceed 255 characters.',
            'name.unique' => 'This area name is already registered in the selected city.',

            'slug.unique' => 'This area slug is already registered.',

            'code.required' => 'Please enter the area code.',
            'code.min' => 'The area code must contain at least 2 characters.',
            'code.max' => 'The area code cannot exceed 50 characters.',
            'code.unique' => 'This area code is already registered.',

            'latitude.numeric' => 'Latitude must be a valid number.',
            'latitude.between' => 'Latitude must be between -90 and 90.',

            'longitude.numeric' => 'Longitude must be a valid number.',
            'longitude.between' => 'Longitude must be between -180 and 180.',

            'is_active.boolean' => 'Area status must be active or inactive.',
        ];
    }

    /**
     * Custom attribute names.
     */
    public function attributes(): array
    {
        return [
            'country_id' => 'country',
            'region_id' => 'region',
            'county_id' => 'county',
            'city_id' => 'city',
            'name' => 'area name',
            'slug' => 'area slug',
            'code' => 'area code',
            'latitude' => 'latitude',
            'longitude' => 'longitude',
            'is_active' => 'status',
        ];
    }
}
