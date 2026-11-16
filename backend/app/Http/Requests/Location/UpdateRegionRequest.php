<?php

namespace App\Http\Requests\Location;

use App\Models\Region;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdateRegionRequest extends FormRequest
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
            || $user->can('regions.update');
    }

    /*
    |--------------------------------------------------------------------------
    | REGION ROUTE PARAMETER
    |--------------------------------------------------------------------------
    */

    protected function currentRegion(): ?Region
    {
        $region = $this->route('region');

        if ($region instanceof Region) {
            return $region;
        }

        if (!$region) {
            return null;
        }

        // Support numeric region IDs.
        if (is_numeric($region)) {
            return Region::find((int) $region);
        }

        // Support slug-based region identifiers.
        return Region::where('slug', $region)->first();
    }

    protected function regionId(): ?int
    {
        return $this->currentRegion()?->id;
    }

    /*
    |--------------------------------------------------------------------------
    | PREPARE INPUT FOR VALIDATION
    |--------------------------------------------------------------------------
    */

    protected function prepareForValidation(): void
    {
        $data = [];

        if (is_string($this->input('name'))) {
            $data['name'] = trim($this->input('name'));
        }

        if (is_string($this->input('slug'))) {
            $slug = trim($this->input('slug'));

            $data['slug'] = $slug !== ''
                ? Str::slug($slug)
                : $slug;
        } elseif (
            is_string($this->input('name'))
            && trim($this->input('name')) !== ''
            && !$this->has('slug')
        ) {
            $data['slug'] = Str::slug(
                trim($this->input('name'))
            );
        }

        if (is_string($this->input('code'))) {
            $data['code'] = strtoupper(
                trim($this->input('code'))
            );
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION RULES
    |--------------------------------------------------------------------------
    */

    public function rules(): array
    {
        $region = $this->currentRegion();

        $regionId = $region?->id;

        // Use the submitted country or retain the current region's country.
        $countryId = $this->input(
            'country_id',
            $region?->country_id
        );

        return [
            /*
            |--------------------------------------------------------------
            | COUNTRY
            |--------------------------------------------------------------
            */

            'country_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('countries', 'id'),
            ],

            /*
            |--------------------------------------------------------------
            | REGION NAME
            |--------------------------------------------------------------
            */

            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\pL\pM\s\'-]+$/u',
            ],

            /*
            |--------------------------------------------------------------
            | REGION SLUG
            |--------------------------------------------------------------
            */

            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
                'alpha_dash',

                Rule::unique('regions', 'slug')
                    ->ignore($regionId)
                    ->where(function ($query) use ($countryId) {
                        return $query->where(
                            'country_id',
                            $countryId
                        );
                    }),
            ],

            /*
            |--------------------------------------------------------------
            | REGION CODE
            |--------------------------------------------------------------
            */

            'code' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:10',
                'alpha_dash',

                Rule::unique('regions', 'code')
                    ->ignore($regionId)
                    ->where(function ($query) use ($countryId) {
                        return $query->where(
                            'country_id',
                            $countryId
                        );
                    }),
            ],

            /*
            |--------------------------------------------------------------
            | ACTIVE STATUS
            |--------------------------------------------------------------
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
            'country_id.required' => 'Please select a country.',
            'country_id.integer' => 'The selected country is invalid.',
            'country_id.exists' => 'The selected country does not exist.',

            'name.required' => 'The region name is required.',
            'name.string' => 'The region name must be a valid string.',
            'name.min' => 'The region name must contain at least 2 characters.',
            'name.max' => 'The region name cannot exceed 100 characters.',
            'name.regex' => 'The region name may only contain letters, spaces, apostrophes and hyphens.',

            'slug.string' => 'The region slug must be a valid string.',
            'slug.max' => 'The region slug cannot exceed 150 characters.',
            'slug.alpha_dash' => 'The region slug may only contain letters, numbers, dashes and underscores.',
            'slug.unique' => 'This region slug is already registered for the selected country.',

            'code.required' => 'The region code is required.',
            'code.string' => 'The region code must be a valid string.',
            'code.min' => 'The region code must contain at least 2 characters.',
            'code.max' => 'The region code cannot exceed 10 characters.',
            'code.alpha_dash' => 'The region code may only contain letters, numbers, dashes and underscores.',
            'code.unique' => 'This region code is already registered for the selected country.',

            'is_active.boolean' => 'The region status must be active or inactive.',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CUSTOM ATTRIBUTE NAMES
    |--------------------------------------------------------------------------
    */

    public function attributes(): array
    {
        return [
            'country_id' => 'country',
            'name' => 'region name',
            'slug' => 'region slug',
            'code' => 'region code',
            'is_active' => 'region status',
        ];
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
