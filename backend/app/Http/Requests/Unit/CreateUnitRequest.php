<?php

namespace App\Http\Requests\Unit;

use App\Models\Unit;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateUnitRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized.
     */
    public function authorize(): bool
    {
        return auth()->check();
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
            | APARTMENT
            |--------------------------------------------------------------------------
            */

            'apartment_id' => [
                'nullable',
                'integer',
                'exists:apartments,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            'unit_number' => [
                'required',
                'string',
                'max:50',
            ],

            'unit_name' => [
                'nullable',
                'string',
                'max:150',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                'unique:units,slug',
            ],

            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],

            /*
            |--------------------------------------------------------------------------
            | TYPE
            |--------------------------------------------------------------------------
            */

            'type' => [
                'required',
                Rule::in([
                    'bedsitter',
                    'studio',
                    'single_room',
                    'double_room',
                    'one_bedroom',
                    'two_bedroom',
                    'three_bedroom',
                    'penthouse',
                    'office',
                    'shop',
                    'warehouse',
                    'villa',
                    'airbnb',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | STRUCTURE
            |--------------------------------------------------------------------------
            */

            'floor' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'bedrooms' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'bathrooms' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'toilets' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'size' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'size_unit' => [
                'nullable',
                Rule::in([
                    'sqm',
                    'sqft',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */

            'price' => [
                'required',
                'numeric',
                'min:0',
            ],

            'deposit' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'service_charge' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' => [
                'nullable',
                Rule::in([
                    Unit::STATUS_VACANT,
                    Unit::STATUS_OCCUPIED,
                    Unit::STATUS_RESERVED,
                    Unit::STATUS_MAINTENANCE,
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */

            'has_balcony' => [
                'nullable',
                'boolean',
            ],

            'has_wifi' => [
                'nullable',
                'boolean',
            ],

            'has_furnished' => [
                'nullable',
                'boolean',
            ],

            'has_air_conditioning' => [
                'nullable',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | MEDIA
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
            | AVAILABILITY
            |--------------------------------------------------------------------------
            */

            'available_from' => [
                'nullable',
                'date',
            ],

            /*
            |--------------------------------------------------------------------------
            | NOTES
            |--------------------------------------------------------------------------
            */

            'notes' => [
                'nullable',
                'string',
                'max:5000',
            ],
        ];
    }

    /**
     * Custom messages.
     */
    public function messages(): array
    {
        return [

            'property_id.required' => 'Property is required.',
            'property_id.exists' => 'Selected property does not exist.',

            'apartment_id.exists' => 'Selected apartment does not exist.',

            'unit_number.required' => 'Unit number is required.',

            'type.required' => 'Unit type is required.',
            'type.in' => 'Invalid unit type selected.',

            'price.required' => 'Price is required.',
            'price.numeric' => 'Price must be a valid number.',

            'deposit.numeric' => 'Deposit must be a valid number.',

            'service_charge.numeric' => 'Service charge must be a valid number.',

            'status.in' => 'Invalid unit status selected.',

            'thumbnail.image' => 'Thumbnail must be an image.',
            'thumbnail.mimes' => 'Thumbnail must be JPG, JPEG, PNG or WEBP.',
            'thumbnail.max' => 'Thumbnail may not exceed 5 MB.',
        ];
    }

    /**
     * Prepare data before validation.
     */
    protected function prepareForValidation(): void
    {
        foreach ([
            'has_balcony',
            'has_wifi',
            'has_furnished',
            'has_air_conditioning',
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

        $this->merge([

            'unit_number' => $this->unit_number
                ? strtoupper(trim($this->unit_number))
                : null,

            'unit_name' => $this->unit_name
                ? trim($this->unit_name)
                : null,

            'description' => $this->description
                ? trim($this->description)
                : null,

            'type' => $this->type
                ? strtolower(trim($this->type))
                : null,

            'status' => $this->status
                ? strtolower(trim($this->status))
                : Unit::STATUS_VACANT,

            'size_unit' => $this->size_unit
                ? strtolower(trim($this->size_unit))
                : 'sqm',
        ]);
    }
}