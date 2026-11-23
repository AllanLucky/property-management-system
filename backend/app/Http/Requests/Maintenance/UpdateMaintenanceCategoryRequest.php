<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaintenanceCategoryRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to update a maintenance category.
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
        $categoryId = $this->route('id');

        return [
            /*
            |--------------------------------------------------------------------------
            | Category Name
            |--------------------------------------------------------------------------
            */
            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:100',
                Rule::unique('maintenance_categories', 'name')
                    ->ignore($categoryId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Category Slug
            |--------------------------------------------------------------------------
            */
            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:150',
                Rule::unique('maintenance_categories', 'slug')
                    ->ignore($categoryId),
            ],

            /*
            |--------------------------------------------------------------------------
            | Category Description
            |--------------------------------------------------------------------------
            */
            'description' => [
                'sometimes',
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
                'sometimes',
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
                'sometimes',
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
        $data = [];

        if (is_string($this->input('name'))) {
            $data['name'] = trim($this->input('name'));
        }

        if (is_string($this->input('slug'))) {
            $data['slug'] = trim($this->input('slug'));
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }
}
