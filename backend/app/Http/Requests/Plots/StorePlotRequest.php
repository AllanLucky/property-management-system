<?php

namespace App\Http\Requests\Plots;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlotRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Authorization should be enforced through your API middleware
        // and the application's permission system.
        return $this->user() !== null;
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
            | Property
            |--------------------------------------------------------------------------
            */
            'property_id' => [
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
                'nullable',
                'string',
                'max:50',
                'unique:plots,code',
            ],

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'title_number' => [
                'nullable',
                'string',
                'max:100',
                'unique:plots,title_number',
            ],

            'plot_number' => [
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
                'required',
                'numeric',
                'gt:0',
                'decimal:0,2',
            ],

            'size_unit' => [
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
                'nullable',
                'integer',
                'exists:countries,id',
            ],

            'region_id' => [
                'nullable',
                'integer',
                'exists:regions,id',
            ],

            'county_id' => [
                'nullable',
                'integer',
                'exists:counties,id',
            ],

            'city_id' => [
                'nullable',
                'integer',
                'exists:cities,id',
            ],

            'area_id' => [
                'nullable',
                'integer',
                'exists:areas,id',
            ],

            'address' => [
                'nullable',
                'string',
                'max:500',
            ],

            'latitude' => [
                'nullable',
                'numeric',
                'between:-90,90',
                'decimal:0,8',
            ],

            'longitude' => [
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
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'currency' => [
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

            'code.unique' =>
                'This plot code is already registered.',

            'title.required' =>
                'The plot title is required.',

            'title.max' =>
                'The plot title cannot exceed 255 characters.',

            'title_number.unique' =>
                'This title number is already registered.',

            'size.required' =>
                'The plot size is required.',

            'size.numeric' =>
                'The plot size must be a valid number.',

            'size.gt' =>
                'The plot size must be greater than zero.',

            'size.decimal' =>
                'The plot size cannot have more than two decimal places.',

            'size_unit.required' =>
                'Please select a plot size unit.',

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
                'The plot asking price is required.',

            'asking_price.numeric' =>
                'The asking price must be a valid number.',

            'asking_price.min' =>
                'The asking price cannot be negative.',

            'currency.required' =>
                'Please select the plot currency.',

            'currency.size' =>
                'The currency must be a three-letter currency code.',

            'currency.in' =>
                'The selected currency is not supported.',

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

