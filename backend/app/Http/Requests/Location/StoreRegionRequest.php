<?php

namespace App\Http\Requests\Location;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreRegionRequest extends FormRequest
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
            || $user->can('regions.create');
    }

    /*
    |--------------------------------------------------------------------------
    | PREPARE INPUT FOR VALIDATION
    |--------------------------------------------------------------------------
    */

    protected function prepareForValidation(): void
    {
        $name = $this->input('name');
        $slug = $this->input('slug');
        $code = $this->input('code');

        $this->merge([
            'name' => is_string($name)
                ? trim($name)
                : $name,

            'slug' => is_string($slug) && trim($slug) !== ''
                ? Str::slug(trim($slug))
                : (is_string($name) && trim($name) !== ''
                    ? Str::slug(trim($name))
                    : $slug),

            'code' => is_string($code)
                ? strtoupper(trim($code))
                : $code,
        ]);
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
            'country_id' => [
                'required',
                'integer',
                Rule::exists('countries', 'id'),
            ],

            'name' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'regex:/^[\pL\pM\s\'-]+$/u',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:150',
                'alpha_dash',
                Rule::unique('regions', 'slug')
                    ->where(fn ($query) => $query->where(
                        'country_id',
                        $countryId
                    )),
            ],

            'code' => [
                'required',
                'string',
                'min:2',
                'max:10',
                'alpha_dash',
                Rule::unique('regions', 'code')
                    ->where(fn ($query) => $query->where(
                        'country_id',
                        $countryId
                    )),
            ],

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
            'slug.unique' => 'This region slug is already registered for this country.',

            'code.required' => 'The region code is required.',
            'code.string' => 'The region code must be a valid string.',
            'code.min' => 'The region code must contain at least 2 characters.',
            'code.max' => 'The region code cannot exceed 10 characters.',
            'code.alpha_dash' => 'The region code may only contain letters, numbers, dashes and underscores.',
            'code.unique' => 'This region code is already registered for this country.',

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
        $data = $this->validated();

        $data['is_active'] = $data['is_active'] ?? true;

        return $data;
    }
}
