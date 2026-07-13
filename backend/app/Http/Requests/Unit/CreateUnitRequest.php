<?php

namespace App\Http\Requests\Unit;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateUnitRequest extends FormRequest
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
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'name' => [
                'required',
                'string',
                'min:2',
                'max:150',
            ],

            'unit_number' => [
                'nullable',
                'string',
                'max:50',
            ],

            'description' => [
                'nullable',
                'string',
                'max:5000',
            ],

            /*
            |--------------------------------------------------------------------------
            | UNIT TYPE (FIXED - MATCH YOUR FRONTEND)
            |--------------------------------------------------------------------------
            */
            'type' => [
                'required',
                'string',
                Rule::in([
                    'bedsitter',
                    'studio',
                    'single_room',
                    'double_room',

                    // FIXED THESE (your frontend uses this)
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
            'floor' => ['nullable', 'integer', 'min:0', 'max:200'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'bathrooms' => ['nullable', 'integer', 'min:0', 'max:20'],
            'size' => ['nullable', 'numeric', 'min:0'],

            /*
            |--------------------------------------------------------------------------
            | FINANCIALS
            |--------------------------------------------------------------------------
            */
            'rent_amount' => [
                'required',
                'numeric',
                'min:0',
            ],

            'deposit_amount' => [
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
            'is_featured' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],
            'is_furnished' => ['nullable', 'boolean'],
            'is_short_term' => ['nullable', 'boolean'],

            /*
            |--------------------------------------------------------------------------
            | AMENITIES
            |--------------------------------------------------------------------------
            */
            'features' => ['nullable', 'array'],
            'features.*' => ['string', 'max:100'],

            /*
            |--------------------------------------------------------------------------
            | GEO
            |--------------------------------------------------------------------------
            */
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */
            'cover_image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ];
    }

    public function messages(): array
    {
        return [

            'property_id.required' => 'Property is required.',
            'property_id.exists' => 'Selected property does not exist.',

            'name.required' => 'Unit name is required.',

            'type.required' => 'Unit type is required.',
            'type.in' => 'Invalid unit type selected.',

            'rent_amount.required' => 'Rent amount is required.',
            'rent_amount.numeric' => 'Rent amount must be a valid number.',

            'status.in' => 'Invalid unit status selected.',
        ];
    }

    public function prepareForValidation(): void
    {
        $this->merge([

            'name' => $this->name ? trim($this->name) : null,
            'description' => $this->description ? trim($this->description) : null,

            'unit_number' => $this->unit_number
                ? strtoupper(trim($this->unit_number))
                : null,

            // IMPORTANT FIX → match frontend safely
            'type' => $this->type
                ? strtolower(trim($this->type))
                : null,

            'status' => $this->status
                ? strtolower(trim($this->status))
                : 'vacant',
        ]);
    }
}