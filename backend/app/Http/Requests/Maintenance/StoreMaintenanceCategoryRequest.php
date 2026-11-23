<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMaintenanceCategoryRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to create a maintenance category.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | Category Name
            |--------------------------------------------------------------------------
            */
            'name' => [
                'required',
                'string',
                'min:2',
                'max:100',
                'unique:maintenance_categories,name',
            ],

            /*
            |--------------------------------------------------------------------------
            | Category Slug
            |--------------------------------------------------------------------------
            */
            'slug' => [
                'nullable',
                'string',
                'max:150',
                'unique:maintenance_categories,slug',
            ],

            /*
            |--------------------------------------------------------------------------
            | Category Description
            |--------------------------------------------------------------------------
            */
            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            /*
            |--------------------------------------------------------------------------
            | Category Icon
            |--------------------------------------------------------------------------
            */
            'icon' => [
                'nullable',
                'string',
                'max:100',
            ],

            /*
            |--------------------------------------------------------------------------
            | Category Color
            |--------------------------------------------------------------------------
            */
            'color' => [
                'nullable',
                'string',
                'max:20',
            ],

            /*
            |--------------------------------------------------------------------------
            | Category Status
            |--------------------------------------------------------------------------
            */
            'is_active' => [
                'sometimes',
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
            'name.required' => 'The maintenance category name is required.',
            'name.min' => 'The category name must contain at least 2 characters.',
            'name.max' => 'The category name cannot exceed 100 characters.',
            'name.unique' => 'A maintenance category with this name already exists.',

            'slug.unique' => 'This maintenance category slug is already in use.',
            'slug.max' => 'The category slug cannot exceed 150 characters.',

            'description.max' => 'The category description cannot exceed 1000 characters.',

            'icon.max' => 'The category icon cannot exceed 100 characters.',
            'color.max' => 'The category color cannot exceed 20 characters.',

            'is_active.boolean' => 'The category status must be true or false.',
        ];
    }

    /**
     * Customize validation attribute names.
     */
    public function attributes(): array
    {
        return [
            'name' => 'category name',
            'slug' => 'category slug',
            'description' => 'category description',
            'icon' => 'category icon',
            'color' => 'category color',
            'is_active' => 'category status',
        ];
    }

    /**
     * Prepare incoming data before validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => is_string($this->name)
                ? trim($this->name)
                : $this->name,

            'slug' => is_string($this->slug)
                ? trim($this->slug)
                : $this->slug,
        ]);
    }
}
