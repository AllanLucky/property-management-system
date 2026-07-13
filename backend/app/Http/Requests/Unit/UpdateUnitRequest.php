<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUnitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }

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
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'name' => [
                'sometimes',
                'string',
                'min:2',
                'max:150',
            ],

            'unit_number' => [
                'sometimes',
                'nullable',
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
            | UNIT TYPE (FIXED TO MATCH CREATE REQUEST)
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
            | STRUCTURE
            |--------------------------------------------------------------------------
            */
            'floor' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:200'],
            'bedrooms' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:20'],
            'bathrooms' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:20'],
            'size' => ['sometimes', 'nullable', 'numeric', 'min:0'],

            /*
            |--------------------------------------------------------------------------
            | FINANCIALS
            |--------------------------------------------------------------------------
            */
            'rent_amount' => ['sometimes', 'numeric', 'min:0'],
            'deposit_amount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'service_charge' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'late_fee' => ['sometimes', 'nullable', 'numeric', 'min:0'],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            'status' => [
                'sometimes',
                'string',
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
            | FLAGS
            |--------------------------------------------------------------------------
            */
            'is_featured' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],
            'is_furnished' => ['sometimes', 'boolean'],
            'is_short_term' => ['sometimes', 'boolean'],

            /*
            |--------------------------------------------------------------------------
            | AMENITIES
            |--------------------------------------------------------------------------
            */
            'amenities' => ['sometimes', 'nullable', 'array'],
            'amenities.*' => ['string', 'max:100'],

            /*
            |--------------------------------------------------------------------------
            | GEO
            |--------------------------------------------------------------------------
            */
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],

            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */
            'cover_image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            /*
            |--------------------------------------------------------------------------
            | NOTES
            |--------------------------------------------------------------------------
            */
            'notes' => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [

            'property_id.exists' => 'Selected property does not exist.',
            'apartment_id.exists' => 'Selected apartment does not exist.',

            'name.min' => 'Unit name must be at least 2 characters.',
            'name.max' => 'Unit name may not exceed 150 characters.',

            'type.in' => 'Invalid unit type selected.',

            'rent_amount.numeric' => 'Rent amount must be a valid number.',
            'rent_amount.min' => 'Rent amount cannot be negative.',

            'deposit_amount.numeric' => 'Deposit amount must be a valid number.',
            'deposit_amount.min' => 'Deposit amount cannot be negative.',

            'status.in' => 'Invalid unit status selected.',

            'latitude.between' => 'Latitude must be between -90 and 90.',
            'longitude.between' => 'Longitude must be between -180 and 180.',
        ];
    }

    public function attributes(): array
    {
        return [
            'property_id' => 'property',
            'apartment_id' => 'apartment',
            'unit_number' => 'unit number',
            'rent_amount' => 'rent amount',
            'deposit_amount' => 'deposit amount',
            'cover_image' => 'cover image',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([

            'name' => $this->has('name')
                ? trim((string) $this->name)
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

            'is_featured' => filter_var($this->is_featured, FILTER_VALIDATE_BOOLEAN),
            'is_published' => filter_var($this->is_published, FILTER_VALIDATE_BOOLEAN),
            'is_furnished' => filter_var($this->is_furnished, FILTER_VALIDATE_BOOLEAN),
            'is_short_term' => filter_var($this->is_short_term, FILTER_VALIDATE_BOOLEAN),
        ]);
    }
}