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
        // Replace with Policy or Permission later
        // return auth()->user()->can('apartments.update');

        return true;
    }

    /**
     * Validation Rules
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
                Rule::unique('apartments', 'slug')->ignore($this->route('apartment')),
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

            'floor' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'total_floors' => [
                'nullable',
                'integer',
                'min:0',
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
     * Custom Messages
     */
    public function messages(): array
    {
        return [

            'property_id.exists' => 'The selected property does not exist.',

            'name.max' => 'Apartment name may not exceed 255 characters.',

            'slug.unique' => 'This apartment slug already exists.',

            'block.max' => 'Block may not exceed 100 characters.',

            'floor.integer' => 'Floor must be a valid number.',
            'floor.min' => 'Floor cannot be negative.',

            'total_floors.integer' => 'Total floors must be a valid number.',
            'total_floors.min' => 'Total floors cannot be negative.',

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
        $this->merge([

            'has_elevator' => filter_var(
                $this->has_elevator,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),

            'has_backup_generator' => filter_var(
                $this->has_backup_generator,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),

            'has_security' => filter_var(
                $this->has_security,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),

            'has_parking' => filter_var(
                $this->has_parking,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),
        ]);
    }
}