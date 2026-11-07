<?php

namespace App\Http\Requests\Location;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCountyRequest extends FormRequest
{
    /*
    |--------------------------------------------------------------------------
    | AUTHORIZATION
    |--------------------------------------------------------------------------
    */

    public function authorize(): bool
    {
        $user = $this->user();

        if (!$user) {
            return false;
        }

        return $user->hasRole('super-admin')
            || $user->can('counties.create');
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION RULES
    |--------------------------------------------------------------------------
    */

    public function rules(): array
    {
        $countryId = $this->input('country_id');

        return [

            /*
            |--------------------------------------------------------------------------
            | COUNTRY
            |--------------------------------------------------------------------------
            */

            'country_id' => [
                'required',
                'integer',

                Rule::exists('countries', 'id')
                    ->whereNull('deleted_at')
                    ->where('is_active', true),
            ],

            /*
            |--------------------------------------------------------------------------
            | REGION
            |--------------------------------------------------------------------------
            */

            'region_id' => [
                'required',
                'integer',

                Rule::exists('regions', 'id')
                    ->where('country_id', $countryId)
                    ->where('is_active', true),
            ],

            /*
            |--------------------------------------------------------------------------
            | COUNTY NAME
            |--------------------------------------------------------------------------
            */

            'name' => [
                'required',
                'string',
                'min:2',
                'max:150',

                Rule::unique('counties', 'name')
                    ->where('country_id', $countryId)
                    ->whereNull('deleted_at'),
            ],

            /*
            |--------------------------------------------------------------------------
            | SLUG
            |--------------------------------------------------------------------------
            */

            'slug' => [
                'nullable',
                'string',
                'max:180',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',

                Rule::unique('counties', 'slug')
                    ->whereNull('deleted_at'),
            ],

            /*
            |--------------------------------------------------------------------------
            | COUNTY CODE
            |--------------------------------------------------------------------------
            */

            'code' => [
                'nullable',
                'string',
                'min:2',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',

                Rule::unique('counties', 'code')
                    ->whereNull('deleted_at'),
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

    /*
    |--------------------------------------------------------------------------
    | CUSTOM VALIDATION MESSAGES
    |--------------------------------------------------------------------------
    */

    public function messages(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | COUNTRY MESSAGES
            |--------------------------------------------------------------------------
            */

            'country_id.required' =>
                'Please select a country.',

            'country_id.integer' =>
                'The selected country is invalid.',

            'country_id.exists' =>
                'The selected country does not exist, is inactive, or is unavailable.',

            /*
            |--------------------------------------------------------------------------
            | REGION MESSAGES
            |--------------------------------------------------------------------------
            */

            'region_id.required' =>
                'Please select a region.',

            'region_id.integer' =>
                'The selected region is invalid.',

            'region_id.exists' =>
                'The selected region does not belong to the selected country or is inactive.',

            /*
            |--------------------------------------------------------------------------
            | COUNTY NAME MESSAGES
            |--------------------------------------------------------------------------
            */

            'name.required' =>
                'County name is required.',

            'name.string' =>
                'County name must be a valid text value.',

            'name.min' =>
                'County name must contain at least 2 characters.',

            'name.max' =>
                'County name cannot exceed 150 characters.',

            'name.unique' =>
                'This county name already exists in the selected country.',

            /*
            |--------------------------------------------------------------------------
            | SLUG MESSAGES
            |--------------------------------------------------------------------------
            */

            'slug.string' =>
                'County slug must be a valid text value.',

            'slug.max' =>
                'County slug cannot exceed 180 characters.',

            'slug.regex' =>
                'The slug may only contain lowercase letters, numbers and hyphens.',

            'slug.unique' =>
                'This county slug is already in use.',

            /*
            |--------------------------------------------------------------------------
            | COUNTY CODE MESSAGES
            |--------------------------------------------------------------------------
            */

            'code.string' =>
                'County code must be a valid text value.',

            'code.min' =>
                'County code must contain at least 2 characters.',

            'code.max' =>
                'County code cannot exceed 20 characters.',

            'code.regex' =>
                'County code may only contain letters, numbers, underscores and hyphens.',

            'code.unique' =>
                'This county code is already in use.',

            /*
            |--------------------------------------------------------------------------
            | STATUS MESSAGES
            |--------------------------------------------------------------------------
            */

            'is_active.boolean' =>
                'County status must be true or false.',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    public function attributes(): array
    {
        return [
            'country_id' => 'country',
            'region_id' => 'region',
            'name' => 'county name',
            'slug' => 'county slug',
            'code' => 'county code',
            'is_active' => 'county status',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PREPARE INPUT FOR VALIDATION
    |--------------------------------------------------------------------------
    */

    protected function prepareForValidation(): void
    {
        $this->merge([

            'name' => is_string($this->input('name'))
                ? trim($this->input('name'))
                : $this->input('name'),

            'slug' => is_string($this->input('slug'))
                ? strtolower(trim($this->input('slug')))
                : $this->input('slug'),

            'code' => is_string($this->input('code'))
                ? strtoupper(trim($this->input('code')))
                : $this->input('code'),

        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATED DATA
    |--------------------------------------------------------------------------
    */

    public function validatedData(): array
    {
        return $this->validated();
    }
}
