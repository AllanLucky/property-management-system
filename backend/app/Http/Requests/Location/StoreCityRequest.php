<?php

namespace App\Http\Requests\Location;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCityRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization is handled by the controller's middleware/policies.
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

            'code' => is_string($this->code) && trim($this->code) !== ''
                ? strtoupper(trim($this->code))
                : null,

            'is_active' => $this->has('is_active')
                ? filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
                : true,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | Location Relationships
            |--------------------------------------------------------------------------
            */

            'country_id' => [
                'required',
                'integer',
                Rule::exists('countries', 'id')
                    ->where('is_active', true),
            ],

            'region_id' => [
                'required',
                'integer',
                Rule::exists('regions', 'id')
                    ->where('country_id', $this->input('country_id'))
                    ->where('is_active', true),
            ],

            'county_id' => [
                'required',
                'integer',
                Rule::exists('counties', 'id')
                    ->where('country_id', $this->input('country_id'))
                    ->where('region_id', $this->input('region_id'))
                    ->where('is_active', true),
            ],

            /*
            |--------------------------------------------------------------------------
            | City Information
            |--------------------------------------------------------------------------
            */

            'name' => [
                'required',
                'string',
                'min:2',
                'max:150',
                Rule::unique('cities', 'name')
                    ->where('country_id', $this->input('country_id'))
                    ->where('region_id', $this->input('region_id'))
                    ->where('county_id', $this->input('county_id'))
                    ->whereNull('deleted_at'),
            ],

            'code' => [
                'nullable',
                'string',
                'min:2',
                'max:20',
                Rule::unique('cities', 'code')
                    ->whereNull('deleted_at'),
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
            'name.unique' => 'This city is already registered under the selected county.',

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