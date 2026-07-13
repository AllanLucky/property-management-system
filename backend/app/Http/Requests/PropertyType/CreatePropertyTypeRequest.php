<?php

namespace App\Http\Requests\PropertyType;

use Illuminate\Foundation\Http\FormRequest;

class CreatePropertyTypeRequest extends FormRequest
{
    /**
     * Authorize request
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', 'unique:property_types,name'],
            'description' => ['nullable', 'string'],
            'icon' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string', 'max:255'],

            'status' => ['required', 'string', 'in:active,inactive'],

            'is_featured' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Optional: clean data before validation
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_featured' => $this->boolean('is_featured'),
        ]);
    }
}