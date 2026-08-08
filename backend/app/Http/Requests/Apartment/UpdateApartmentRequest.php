<?php

namespace App\Http\Requests\Apartment;

use App\Models\Apartment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApartmentRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized.
     */
    public function authorize(): bool
    {
        // Later replace with Policy
        // return auth()->user()->can('update', $this->route('apartment'));

        return true;
    }

    /**
     * Validation Rules.
     */
    public function rules(): array
    {
        $apartment = $this->route('apartment');

        return [

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */

            'property_id' => [
                'sometimes',
                'integer',
                'exists:properties,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            'name' => [
                'sometimes',
                'string',
                'max:255',
            ],

            'slug' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('apartments', 'slug')
                    ->ignore($apartment?->id ?? $apartment),
            ],

            'description' => [
                'nullable',
                'string',
            ],

            /*
            |--------------------------------------------------------------------------
            | BUILDING INFORMATION
            |--------------------------------------------------------------------------
            */

            'block' => [
                'nullable',
                'string',
                'max:100',
            ],

            'total_floors' => [
                'sometimes',
                'integer',
                'min:1',
            ],

            'total_units' => [
                'sometimes',
                'integer',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' => [
                'sometimes',
                Rule::in(Apartment::STATUSES),
            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */

            'has_elevator' => [
                'sometimes',
                'boolean',
            ],

            'has_backup_generator' => [
                'sometimes',
                'boolean',
            ],

            'has_security' => [
                'sometimes',
                'boolean',
            ],

            'has_parking' => [
                'sometimes',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | THUMBNAIL
            |--------------------------------------------------------------------------
            */

            'thumbnail' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            'meta_title' => [
                'nullable',
                'string',
                'max:255',
            ],

            'meta_description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'meta_keywords' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    /**
     * Custom Messages.
     */
    public function messages(): array
    {
        return [

            'property_id.exists' => 'The selected property does not exist.',

            'name.max' => 'Apartment name may not exceed 255 characters.',

            'slug.unique' => 'This apartment slug already exists.',

            'block.max' => 'Block may not exceed 100 characters.',

            'total_floors.integer' => 'Total floors must be a valid number.',
            'total_floors.min' => 'Total floors must be at least 1.',

            'total_units.integer' => 'Total units must be a valid number.',
            'total_units.min' => 'Total units cannot be negative.',

            'status.in' => 'Invalid apartment status.',

            'thumbnail.image' => 'Thumbnail must be an image.',
            'thumbnail.mimes' => 'Thumbnail must be a JPG, JPEG, PNG or WEBP image.',
            'thumbnail.max' => 'Thumbnail may not be greater than 5 MB.',
        ];
    }

    /**
     * Prepare data before validation.
     */
    protected function prepareForValidation(): void
    {
        foreach ([
            'has_elevator',
            'has_backup_generator',
            'has_security',
            'has_parking',
        ] as $field) {

            if ($this->has($field)) {
                $this->merge([
                    $field => filter_var(
                        $this->input($field),
                        FILTER_VALIDATE_BOOLEAN,
                        FILTER_NULL_ON_FAILURE
                    ),
                ]);
            }
        }
    }
}