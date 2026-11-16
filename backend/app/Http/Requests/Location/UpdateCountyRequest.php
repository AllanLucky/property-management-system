<?php

namespace App\Http\Requests\Location;

use App\Models\County;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCountyRequest extends FormRequest
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
            || $user->can('counties.update');
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTY IDENTIFICATION
    |--------------------------------------------------------------------------
    */

    protected function countyId(): ?int
    {
        $county = $this->route('county');

        if ($county instanceof County) {
            return (int) $county->id;
        }

        return is_numeric($county)
            ? (int) $county
            : null;
    }

    /*
    |--------------------------------------------------------------------------
    | CURRENT COUNTY
    |--------------------------------------------------------------------------
    */

    protected function currentCounty(): ?County
    {
        $county = $this->route('county');

        if ($county instanceof County) {
            return $county;
        }

        if (is_numeric($county)) {
            return County::query()->find((int) $county);
        }

        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION RULES
    |--------------------------------------------------------------------------
    */

    public function rules(): array
    {
        $countyId = $this->countyId();
        $currentCounty = $this->currentCounty();

        /*
        |--------------------------------------------------------------------------
        | RESOLVE COUNTRY ID
        |--------------------------------------------------------------------------
        */

        $countryId = $this->input(
            'country_id',
            $currentCounty?->country_id
        );

        /*
        |--------------------------------------------------------------------------
        | COUNTRY
        |--------------------------------------------------------------------------
        */

        $countryRules = [
            'sometimes',
            'required',
            'integer',
            Rule::exists('countries', 'id')
                ->whereNull('deleted_at')
                ->where('is_active', true),
        ];

        /*
        |--------------------------------------------------------------------------
        | REGION
        |--------------------------------------------------------------------------
        */

        $regionRules = [
            'sometimes',
            'required',
            'integer',
            Rule::exists('regions', 'id')
                ->where('is_active', true)
                ->when(
                    $countryId !== null,
                    fn ($rule) => $rule->where(
                        'country_id',
                        $countryId
                    )
                ),
        ];

        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        return [

            /*
            |--------------------------------------------------------------------------
            | COUNTRY
            |--------------------------------------------------------------------------
            */

            'country_id' => $countryRules,

            /*
            |--------------------------------------------------------------------------
            | REGION
            |--------------------------------------------------------------------------
            */

            'region_id' => $regionRules,

            /*
            |--------------------------------------------------------------------------
            | COUNTY NAME
            |--------------------------------------------------------------------------
            */

            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:150',

                Rule::unique('counties', 'name')
                    ->where(function ($query) use ($countryId) {
                        if ($countryId !== null) {
                            $query->where('country_id', $countryId);
                        }
                    })
                    ->whereNull('deleted_at')
                    ->ignore($countyId),
            ],

            /*
            |--------------------------------------------------------------------------
            | SLUG
            |--------------------------------------------------------------------------
            */

            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:180',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',

                Rule::unique('counties', 'slug')
                    ->whereNull('deleted_at')
                    ->ignore($countyId),
            ],

            /*
            |--------------------------------------------------------------------------
            | COUNTY CODE
            |--------------------------------------------------------------------------
            */

            'code' => [
                'sometimes',
                'nullable',
                'string',
                'min:2',
                'max:20',
                'regex:/^[A-Za-z0-9_-]+$/',

                Rule::unique('counties', 'code')
                    ->whereNull('deleted_at')
                    ->ignore($countyId),
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
            | COUNTRY
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
            | REGION
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
            | COUNTY NAME
            |--------------------------------------------------------------------------
            */

            'name.required' =>
                'County name is required.',

            'name.string' =>
                'County name must be a valid string.',

            'name.min' =>
                'County name must contain at least 2 characters.',

            'name.max' =>
                'County name cannot exceed 150 characters.',

            'name.unique' =>
                'This county name already exists in the selected country.',

            /*
            |--------------------------------------------------------------------------
            | SLUG
            |--------------------------------------------------------------------------
            */

            'slug.string' =>
                'County slug must be a valid string.',

            'slug.max' =>
                'County slug cannot exceed 180 characters.',

            'slug.regex' =>
                'The slug may only contain lowercase letters, numbers and hyphens.',

            'slug.unique' =>
                'This county slug is already in use.',

            /*
            |--------------------------------------------------------------------------
            | COUNTY CODE
            |--------------------------------------------------------------------------
            */

            'code.string' =>
                'County code must be a valid string.',

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
            | STATUS
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
    | PREPARE INPUT
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
