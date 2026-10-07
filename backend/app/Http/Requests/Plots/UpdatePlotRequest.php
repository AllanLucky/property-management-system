<?php

namespace App\Http\Requests\Plots;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlotRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Require an authenticated user.
        // Enforce plots.update through your permission middleware or policy.
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $plotId = $this->route('plot');

        // Support both route-model binding and numeric route parameters.
        if ($plotId instanceof \App\Models\Plot) {
            $plotId = $plotId->getKey();
        }

        return [
            /*
            |--------------------------------------------------------------------------
            | Property
            |--------------------------------------------------------------------------
            */
            'property_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:properties,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | Plot Identification
            |--------------------------------------------------------------------------
            */
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('plots', 'code')->ignore($plotId),
            ],

            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'title_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
                Rule::unique('plots', 'title_number')->ignore($plotId),
            ],

            'plot_number' => [
                'sometimes',
                'nullable',
                'string',
                'max:100',
            ],

            /*
            |--------------------------------------------------------------------------
            | Plot Size
            |--------------------------------------------------------------------------
            */
            'size' => [
                'sometimes',
                'required',
                'numeric',
                'gt:0',
                'decimal:0,2',
            ],

            'size_unit' => [
                'sometimes',
                'required',
                'string',
                Rule::in([
                    'sqm',
                    'sqft',
                    'acre',
                    'hectare',
                ]),
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:10000',
            ],

            /*
            |--------------------------------------------------------------------------
            | Location
            |--------------------------------------------------------------------------
            */
            'country_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:countries,id',
            ],

            'region_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:regions,id',
            ],

            'county_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:counties,id',
            ],

            'city_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:cities,id',
            ],

            'area_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:areas,id',
            ],

            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:500',
            ],

            'latitude' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-90,90',
                'decimal:0,8',
            ],

            'longitude' => [
                'sometimes',
                'nullable',
                'numeric',
                'between:-180,180',
                'decimal:0,8',
            ],

            /*
            |--------------------------------------------------------------------------
            | Pricing
            |--------------------------------------------------------------------------
            */
            'asking_price' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'currency' => [
                'sometimes',
                'required',
                'string',
                'size:3',
                Rule::in([
                    'KES',
                    'UGX',
                    'TZS',
                    'RWF',
                    'NGN',
                    'USD',
                    'EUR',
                    'GBP',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            'status' => [
                'sometimes',
                'required',
                'string',
                Rule::in([
                    'available',
                    'reserved',
                    'sold',
                    'unavailable',
                ]),
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'property_id.exists' =>
                'The selected property does not exist.',

            'code.required' =>
                'The plot code is required when supplied.',

            'code.unique' =>
                'This plot code is already registered to another plot.',

            'title.required' =>
                'The plot title cannot be empty.',

            'title.max' =>
                'The plot title cannot exceed 255 characters.',

            'title_number.unique' =>
                'This title number is already registered to another plot.',

            'size.required' =>
                'The plot size is required when updating its size.',

            'size.numeric' =>
                'The plot size must be a valid number.',

            'size.gt' =>
                'The plot size must be greater than zero.',

            'size.decimal' =>
                'The plot size cannot have more than two decimal places.',

            'size_unit.required' =>
                'Please select a plot size unit when updating the size unit.',

            'size_unit.in' =>
                'The selected plot size unit is invalid.',

            'country_id.exists' =>
                'The selected country does not exist.',

            'region_id.exists' =>
                'The selected region does not exist.',

            'county_id.exists' =>
                'The selected county does not exist.',

            'city_id.exists' =>
                'The selected city does not exist.',

            'area_id.exists' =>
                'The selected area does not exist.',

            'latitude.between' =>
                'Latitude must be between -90 and 90.',

            'longitude.between' =>
                'Longitude must be between -180 and 180.',

            'asking_price.required' =>
                'The asking price is required when updating the price.',

            'asking_price.numeric' =>
                'The asking price must be a valid number.',

            'asking_price.min' =>
                'The asking price cannot be negative.',

            'currency.required' =>
                'The currency is required when updating the currency.',

            'currency.size' =>
                'The currency must be a three-letter currency code.',

            'currency.in' =>
                'The selected currency is not supported.',

            'status.required' =>
                'The plot status cannot be empty.',

            'status.in' =>
                'The selected plot status is invalid.',

            'is_active.boolean' =>
                'The active status must be true or false.',
        ];
    }

    /**
     * Get custom attribute names for validation errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'property_id' => 'property',
            'title_number' => 'title number',
            'plot_number' => 'plot number',
            'size_unit' => 'plot size unit',
            'country_id' => 'country',
            'region_id' => 'region',
            'county_id' => 'county',
            'city_id' => 'city',
            'area_id' => 'area',
            'asking_price' => 'asking price',
            'is_active' => 'active status',
        ];
    }
}

