<?php

namespace App\Http\Requests\PropertyType;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePropertyTypeRequest extends FormRequest
{
    /**
     * Authorize request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Prepare data before validation.
     */
    protected function prepareForValidation(): void
    {
        $status = $this->input('status');

        /*
        |--------------------------------------------------------------------------
        | Normalize status value
        |--------------------------------------------------------------------------
        |
        | Accept:
        | "active"
        | "inactive"
        | { value: "active" }
        |
        */
        if (is_array($status)) {
            $status = $status['value'] ?? null;
        }

        $this->merge([
            'status' => $status,
            'is_featured' => $this->boolean('is_featured'),
        ]);
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        /*
        |--------------------------------------------------------------------------
        | Get current property type ID
        |--------------------------------------------------------------------------
        */
        $propertyTypeId =
            $this->route('id')
            ?? $this->route('property_type')
            ?? $this->route('propertyType');

        if (is_object($propertyTypeId)) {
            $propertyTypeId = $propertyTypeId->id;
        }

        return [

            /*
            |--------------------------------------------------------------------------
            | Basic information
            |--------------------------------------------------------------------------
            */
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('property_types', 'name')
                    ->ignore($propertyTypeId),
            ],

            'description' => [
                'nullable',
                'string',
            ],

            /*
            |--------------------------------------------------------------------------
            | Media
            |--------------------------------------------------------------------------
            */
            'icon' => [
                'nullable',
                'string',
                'max:255',
            ],

            'image' => [
                'nullable',
                'string',
                'max:255',
            ],

            /*
            |--------------------------------------------------------------------------
            | Status
            |--------------------------------------------------------------------------
            */
            'status' => [
                'required',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | Featured
            |--------------------------------------------------------------------------
            */
            'is_featured' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Property type name is required.',
            'name.unique' => 'This property type name already exists.',

            'status.required' => 'Property type status is required.',
            'status.in' => 'Status must be active or inactive.',

            'is_featured.boolean' => 'Featured status must be true or false.',
        ];
    }

    /**
     * Friendly attribute names.
     */
    public function attributes(): array
    {
        return [
            'name' => 'property type name',
            'description' => 'property type description',
            'status' => 'property type status',
            'is_featured' => 'featured status',
        ];
    }
}