<?php

namespace App\Http\Requests\Appartment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApartmentRequest extends FormRequest
{
    /**
     * Authorize request
     */
    public function authorize(): bool
    {
        // TODO: connect RBAC later (apartments.update)
        // return auth()->user()->can('apartments.update');
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
            'property_id' => ['sometimes', 'integer', 'exists:properties,id'],

            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'name'        => ['sometimes', 'string', 'max:255'],
            'slug'        => ['sometimes', 'string', 'max:255'],
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
            | MEDIA
            |--------------------------------------------------------------------------
            */
            'image' => [
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
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Custom messages
     */
    public function messages(): array
    {
        return [

            'property_id.exists' => 'Selected property does not exist.',

            'name.string' => 'Apartment name must be a valid string.',
            'name.max'    => 'Apartment name must not exceed 255 characters.',

            'slug.string' => 'Slug must be a valid string.',
            'slug.max'    => 'Slug must not exceed 255 characters.',

            'code.string' => 'Code must be a valid string.',
            'code.max'    => 'Code must not exceed 50 characters.',

            'total_floors.integer' => 'Total floors must be a valid number.',
            'total_floors.min'     => 'Total floors cannot be negative.',

            'status.in' => 'Status must be active, inactive, or maintenance.',

            'image.image' => 'Uploaded file must be an image.',
            'image.mimes' => 'Allowed formats: jpg, jpeg, png, webp.',
            'image.max'   => 'Image must not exceed 5MB.',
        ];
    }

    /**
     * Normalize input before validation
     */
    protected function prepareForValidation(): void
    {
        $this->merge([

            /*
            |--------------------------------------------------------------------------
            | SAFE DEFAULT STATUS HANDLING
            |--------------------------------------------------------------------------
            */
            'status' => $this->status ?? null,
        ]);
    }
}