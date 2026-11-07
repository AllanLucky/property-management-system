<?php

namespace App\Http\Requests\Location;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCountryRequest extends FormRequest
{
    /*
    |--------------------------------------------------------------------------
    | AUTHORIZATION
    |--------------------------------------------------------------------------
    */

    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (!$user) {
            return false;
        }

        // Super-admin bypass.
        if ($user->hasRole('super-admin')) {
            return true;
        }

        return $user->can('countries.update');
    }

    /*
    |--------------------------------------------------------------------------
    | COUNTRY ID
    |--------------------------------------------------------------------------
    */

    /**
     * Get the country ID from the route.
     */
    protected function getCountryId(): ?int
    {
        $country = $this->route('country');

        if ($country instanceof \App\Models\Country) {
            return (int) $country->id;
        }

        if (is_numeric($country)) {
            return (int) $country;
        }

        $id = $this->route('id');

        return is_numeric($id) ? (int) $id : null;
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION RULES
    |--------------------------------------------------------------------------
    */

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $countryId = $this->getCountryId();

        return [
            /*
            |--------------------------------------------------------------------------
            | COUNTRY NAME
            |--------------------------------------------------------------------------
            */

            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:100',
                Rule::unique('countries', 'name')
                    ->ignore($countryId)
                    ->whereNull('deleted_at'),
            ],

            /*
            |--------------------------------------------------------------------------
            | COUNTRY SLUG
            |--------------------------------------------------------------------------
            */

            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:120',
                'alpha_dash',
                Rule::unique('countries', 'slug')
                    ->ignore($countryId)
                    ->whereNull('deleted_at'),
            ],

            /*
            |--------------------------------------------------------------------------
            | ISO COUNTRY CODE
            |--------------------------------------------------------------------------
            */

            'code' => [
                'sometimes',
                'required',
                'string',
                'size:2',
                'alpha',
                'uppercase',
                Rule::unique('countries', 'code')
                    ->ignore($countryId)
                    ->whereNull('deleted_at'),
            ],

            /*
            |--------------------------------------------------------------------------
            | INTERNATIONAL PHONE CODE
            |--------------------------------------------------------------------------
            */

            'phone_code' => [
                'sometimes',
                'required',
                'string',
                'max:10',
                'regex:/^\+[1-9][0-9]{0,8}$/',
                Rule::unique('countries', 'phone_code')
                    ->ignore($countryId)
                    ->whereNull('deleted_at'),
            ],

            /*
            |--------------------------------------------------------------------------
            | CURRENCY CODE
            |--------------------------------------------------------------------------
            */

            'currency' => [
                'sometimes',
                'required',
                'string',
                'size:3',
                'alpha',
                'uppercase',
            ],

            /*
            |--------------------------------------------------------------------------
            | COUNTRY STATUS
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

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Country name cannot be empty.',
            'name.string' => 'Country name must be a valid string.',
            'name.min' => 'Country name must contain at least 2 characters.',
            'name.max' => 'Country name cannot exceed 100 characters.',
            'name.unique' => 'This country name is already registered.',

            'slug.string' => 'Country slug must be a valid string.',
            'slug.max' => 'Country slug cannot exceed 120 characters.',
            'slug.alpha_dash' => 'Country slug may only contain letters, numbers, dashes and underscores.',
            'slug.unique' => 'This country slug is already registered.',

            'code.required' => 'Country ISO code cannot be empty.',
            'code.size' => 'Country ISO code must contain exactly 2 characters.',
            'code.alpha' => 'Country ISO code must contain letters only.',
            'code.uppercase' => 'Country ISO code must be uppercase.',
            'code.unique' => 'This country ISO code is already registered.',

            'phone_code.required' => 'International phone code cannot be empty.',
            'phone_code.max' => 'Phone code cannot exceed 10 characters.',
            'phone_code.regex' => 'Enter a valid international phone code, e.g. +254.',
            'phone_code.unique' => 'This phone code is already registered.',

            'currency.required' => 'Currency code cannot be empty.',
            'currency.size' => 'Currency code must contain exactly 3 characters.',
            'currency.alpha' => 'Currency code must contain letters only.',
            'currency.uppercase' => 'Currency code must be uppercase.',

            'is_active.boolean' => 'Country status must be active or inactive.',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATION ATTRIBUTES
    |--------------------------------------------------------------------------
    */

    /**
     * Get custom attribute names.
     */
    public function attributes(): array
    {
        return [
            'name' => 'country name',
            'slug' => 'country slug',
            'code' => 'ISO country code',
            'phone_code' => 'international phone code',
            'currency' => 'currency code',
            'is_active' => 'country status',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PREPARE INPUT
    |--------------------------------------------------------------------------
    */

    /**
     * Normalize input before validation.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        if ($this->has('name')) {
            $data['name'] = trim($this->input('name'));
        }

        if ($this->has('slug')) {
            $data['slug'] = trim($this->input('slug'));
        }

        if ($this->has('code')) {
            $data['code'] = strtoupper(
                trim($this->input('code'))
            );
        }

        if ($this->has('phone_code')) {
            $data['phone_code'] = trim(
                $this->input('phone_code')
            );
        }

        if ($this->has('currency')) {
            $data['currency'] = strtoupper(
                trim($this->input('currency'))
            );
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }
}
