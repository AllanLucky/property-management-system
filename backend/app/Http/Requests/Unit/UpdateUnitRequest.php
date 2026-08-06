<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnitRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized.
     */
    public function authorize(): bool
    {
        return auth()->check();
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
            | APARTMENT
            |--------------------------------------------------------------------------
            */
            'apartment_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:apartments,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */
            'unit_name' => [
                'sometimes',
                'nullable',
                'string',
                'min:2',
                'max:150',
            ],

            'unit_number' => [
                'sometimes',
                'string',
                'max:50',
            ],

            'description' => [
                'sometimes',
                'nullable',
                'string',
                'max:5000',
            ],

            /*
            |--------------------------------------------------------------------------
            | UNIT TYPE
            |--------------------------------------------------------------------------
            */
            'type' => [
                'sometimes',
                'string',
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
            | STATUS
            |--------------------------------------------------------------------------
            */
            'status' => [
                'sometimes',
                Rule::in([
                    'vacant',
                    'occupied',
                    'reserved',
                    'maintenance',
                    'inactive',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | UNIT DETAILS
            |--------------------------------------------------------------------------
            */
            'floor' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],

            'bedrooms' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],

            'bathrooms' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],

            'toilets' => [
                'sometimes',
                'nullable',
                'integer',
                'min:0',
            ],

            'size' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'size_unit' => [
                'sometimes',
                'nullable',
                'string',
                'max:20',
            ],

            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */
            'price' => [
                'sometimes',
                'numeric',
                'min:0',
            ],

            'deposit' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            'service_charge' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */
            'has_balcony' => [
                'sometimes',
                'boolean',
            ],

            'has_wifi' => [
                'sometimes',
                'boolean',
            ],

            'has_furnished' => [
                'sometimes',
                'boolean',
            ],

            'has_air_conditioning' => [
                'sometimes',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */
            'thumbnail' => [
                'sometimes',
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
                'sometimes',
                'nullable',
                'date',
            ],

            /*
            |--------------------------------------------------------------------------
            | NOTES
            |--------------------------------------------------------------------------
            */
            'notes' => [
                'sometimes',
                'nullable',
                'string',
            ],
        ];
    }

    /**
     * Custom Messages
     */
    public function messages(): array
    {
        return [

            'property_id.exists' => 'Selected property does not exist.',

            'apartment_id.exists' => 'Selected apartment does not exist.',

            'unit_name.min' => 'Unit name must be at least 2 characters.',

            'unit_name.max' => 'Unit name may not exceed 150 characters.',

            'type.in' => 'Invalid unit type selected.',

            'status.in' => 'Invalid unit status selected.',

            'price.numeric' => 'Price must be a valid number.',

            'price.min' => 'Price cannot be negative.',

            'deposit.numeric' => 'Deposit must be a valid number.',

            'deposit.min' => 'Deposit cannot be negative.',

            'service_charge.numeric' => 'Service charge must be a valid number.',

            'service_charge.min' => 'Service charge cannot be negative.',

            'thumbnail.image' => 'Thumbnail must be an image.',

            'thumbnail.mimes' => 'Thumbnail must be JPG, JPEG, PNG or WEBP.',

            'thumbnail.max' => 'Thumbnail may not be greater than 5 MB.',
        ];
    }

    /**
     * Custom Attributes
     */
    public function attributes(): array
    {
        return [

            'property_id' => 'property',

            'apartment_id' => 'apartment',

            'unit_name' => 'unit name',

            'unit_number' => 'unit number',

            'price' => 'price',

            'deposit' => 'deposit',

            'service_charge' => 'service charge',

            'thumbnail' => 'thumbnail',
        ];
    }

    /**
     * Prepare data before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([

            'unit_name' => $this->has('unit_name')
                ? trim((string) $this->unit_name)
                : null,

            'description' => $this->has('description')
                ? trim((string) $this->description)
                : null,

            'unit_number' => $this->has('unit_number')
                ? strtoupper(trim((string) $this->unit_number))
                : null,

            'type' => $this->has('type')
                ? strtolower(trim((string) $this->type))
                : null,

            'status' => $this->has('status')
                ? strtolower(trim((string) $this->status))
                : null,

            'has_balcony' => filter_var(
                $this->has_balcony,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),

            'has_wifi' => filter_var(
                $this->has_wifi,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),

            'has_furnished' => filter_var(
                $this->has_furnished,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),

            'has_air_conditioning' => filter_var(
                $this->has_air_conditioning,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),
        ]);
    }
}