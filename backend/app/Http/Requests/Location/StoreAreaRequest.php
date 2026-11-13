<?php

namespace App\Http\Requests\Location;

use App\Models\City;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class StoreAreaRequest extends FormRequest
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
     * Get the validation rules.
     */
    public function rules(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | LOCATION HIERARCHY
            |--------------------------------------------------------------------------
            */

            'country_id' => [
                'required',
                'integer',
                'exists:countries,id',
            ],

            'region_id' => [
                'required',
                'integer',
                'exists:regions,id',
            ],

            'county_id' => [
                'required',
                'integer',
                'exists:counties,id',
            ],

            'city_id' => [
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
                'required',
                'string',
                'min:2',
                'max:255',
                Rule::unique('areas', 'name')
                    ->where('city_id', $this->input('city_id')),
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                'unique:areas,slug',
            ],

            'code' => [
                'required',
                'string',
                'min:2',
                'max:50',
                'unique:areas,code',
            ],

            /*
            |--------------------------------------------------------------------------
            | GEOGRAPHIC COORDINATES
            |--------------------------------------------------------------------------
            */

            'latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
            ],

            'longitude' => [
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
     * Validate that the selected city belongs to the supplied hierarchy.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {

            $countryId = $this->input('country_id');
            $regionId = $this->input('region_id');
            $countyId = $this->input('county_id');
            $cityId = $this->input('city_id');

            // Avoid hierarchy queries when required IDs are missing.
            if (
                !$countryId ||
                !$regionId ||
                !$countyId ||
                !$cityId
            ) {
                return;
            }

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
