<?php

namespace App\Http\Requests\Location;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCityRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by controller middleware/policies.
        return true;
    }

    /**
     * Get the city ID from the route.
     */
    protected function cityId(): ?int
    {
        $city = $this->route('city') ?? $this->route('id');

        if (is_object($city)) {
            return isset($city->id) ? (int) $city->id : null;
        }

        return is_numeric($city) ? (int) $city : null;
    }

    /**
     * Prepare input before validation.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('name') && is_string($this->input('name'))) {
            $data['name'] = trim($this->input('name'));
        }

        if ($this->has('code')) {
            $code = $this->input('code');

            $data['code'] = is_string($code) && trim($code) !== ''
                ? strtoupper(trim($code))
                : null;
        }

        if ($this->has('is_active')) {
            $data['is_active'] = filter_var(
                $this->input('is_active'),
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            );
        }

        if ($data !== []) {
            $this->merge($data);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $cityId = $this->cityId();

        $countryId = $this->input('country_id');
        $regionId = $this->input('region_id');
        $countyId = $this->input('county_id');

        return [
            /*
            |--------------------------------------------------------------------------
            | Location Relationships
            |--------------------------------------------------------------------------
            */

            'country_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('countries', 'id')
                    ->where('is_active', true),
            ],

            'region_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('regions', 'id')
                    ->where('country_id', $countryId)
                    ->where('is_active', true),
            ],

            'county_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('counties', 'id')
                    ->where('country_id', $countryId)
                    ->where('region_id', $regionId)
                    ->where('is_active', true),
            ],

            /*
            |--------------------------------------------------------------------------
            | City Information
            |--------------------------------------------------------------------------
            */

            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:150',
                Rule::unique('cities', 'name')
                    ->where(function ($query) use (
                        $countryId,
                        $regionId,
                        $countyId
                    ) {
                        // Scope uniqueness to the supplied location fields.
                        if ($countryId !== null) {
                            $query->where('country_id', $countryId);
                        }

                        if ($regionId !== null) {
                            $query->where('region_id', $regionId);
                        }

                        if ($countyId !== null) {
                            $query->where('county_id', $countyId);
                        }

                        return $query->whereNull('deleted_at');
                    })
                    ->ignore($cityId),
            ],

            'code' => [
                'sometimes',
                'nullable',
                'string',
                'min:2',
                'max:20',
                Rule::unique('cities', 'code')
                    ->whereNull('deleted_at')
                    ->ignore($cityId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'country_id.required' => 'Please select a country.',
            'country_id.exists' => 'The selected country does not exist or is inactive.',

            'region_id.required' => 'Please select a region.',
            'region_id.exists' => 'The selected region does not belong to the selected country or is inactive.',

            'county_id.required' => 'Please select a county.',
            'county_id.exists' => 'The selected county does not belong to the selected region and country or is inactive.',

            'name.required' => 'Please enter the city name.',
            'name.min' => 'The city name must contain at least 2 characters.',
            'name.max' => 'The city name cannot exceed 150 characters.',
            'name.unique' => 'This city is already registered under the selected location.',

            'code.min' => 'The city code must contain at least 2 characters.',
            'code.max' => 'The city code cannot exceed 20 characters.',
            'code.unique' => 'This city code is already registered.',

            'is_active.boolean' => 'The city status must be active or inactive.',
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
            'name' => 'city name',
            'code' => 'city code',
            'is_active' => 'city status',
        ];
    }
}
