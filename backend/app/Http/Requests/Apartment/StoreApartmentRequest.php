<?php

namespace App\Http\Requests\Apartment;

use App\Models\Apartment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApartmentRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | PROPERTY
            |--------------------------------------------------------------------------
            */

            'property_id' => [
                'required',
                'integer',
                'exists:properties,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                'unique:apartments,slug',
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
                'required',
                'integer',
                'min:1',
            ],

            'total_units' => [
                'nullable',
                'integer',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' => [
                'nullable',
                Rule::in(Apartment::STATUSES),
            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */

            'has_elevator' => [
                'nullable',
                'boolean',
            ],

            'has_backup_generator' => [
                'nullable',
                'boolean',
            ],

            'has_security' => [
                'nullable',
                'boolean',
            ],

            'has_parking' => [
                'nullable',
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
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            'property_id.required' => 'Property is required.',
            'property_id.exists' => 'The selected property does not exist.',

            'name.required' => 'Apartment name is required.',
            'name.max' => 'Apartment name may not exceed 255 characters.',

            'slug.unique' => 'This apartment slug already exists.',

            'total_floors.required' => 'Total floors is required.',
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
                        $this->$field,
                        FILTER_VALIDATE_BOOLEAN,
                        FILTER_NULL_ON_FAILURE
                    ),
                ]);
            }
        }
    }
}