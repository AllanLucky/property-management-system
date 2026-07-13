<?php

namespace App\Http\Requests\Apartment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApartmentRequest extends FormRequest
{
    /**
     * Authorize request
     */
    public function authorize(): bool
    {
        // TODO: Replace with real RBAC later
        // return auth()->user()->can('apartments.create');
        return true;
    }

    /**
     * Validation rules
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP
            |--------------------------------------------------------------------------
            */
            'property_id' => ['required', 'exists:properties,id'],

            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'name'        => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255', 'unique:apartments,slug'],
            'code'        => ['nullable', 'string', 'max:50'],
            'description' => ['nullable', 'string'],

            /*
            |--------------------------------------------------------------------------
            | STRUCTURE (MATCH DB)
            |--------------------------------------------------------------------------
            */
            'total_floors' => ['nullable', 'integer', 'min:0'],

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */
            'status' => [
                'nullable',
                Rule::in(['active', 'inactive', 'maintenance']),
            ],

            /*
            |--------------------------------------------------------------------------
            | IMAGE UPLOAD
            |--------------------------------------------------------------------------
            */
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ];
    }

    /**
     * Custom messages
     */
    public function messages(): array
    {
        return [

            'property_id.required' => 'Property is required.',
            'property_id.exists'   => 'Selected property does not exist.',

            'name.required' => 'Apartment name is required.',
            'name.string'   => 'Apartment name must be a valid string.',
            'name.max'      => 'Apartment name must not exceed 255 characters.',

            'slug.unique'   => 'This slug is already taken.',

            'code.string' => 'Code must be a valid string.',
            'code.max'    => 'Code must not exceed 50 characters.',

            'total_floors.integer' => 'Total floors must be a valid number.',
            'total_floors.min'     => 'Total floors cannot be negative.',

            'status.in' => 'Invalid status. Allowed: active, inactive, maintenance.',

            'image.image' => 'Uploaded file must be an image.',
            'image.mimes' => 'Allowed formats: jpg, jpeg, png, webp.',
            'image.max'   => 'Image must not exceed 5MB.',
        ];
    }

    /**
     * Prepare data before validation
     */
    protected function prepareForValidation(): void
    {
        $this->merge([

            /*
            |--------------------------------------------------------------------------
            | DEFAULT STATUS
            |--------------------------------------------------------------------------
            */
            'status' => $this->status ?? 'active',

            /*
            |--------------------------------------------------------------------------
            | SAFE DEFAULT FOR STRUCTURE
            |--------------------------------------------------------------------------
            */
            'total_floors' => $this->total_floors ?? 0,
        ]);
    }
}