<?php

namespace App\Http\Requests\PropertyCategory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePropertyCategoryRequest extends FormRequest
{
    /**
     * --------------------------------------------------------------------------
     * AUTHORIZE
     * --------------------------------------------------------------------------
     */
    public function authorize(): bool
    {
        return auth()->check() &&
            (
                auth()->user()->hasRole('SuperAdmin') ||
                auth()->user()->can('create property categories')
            );
    }

    /**
     * --------------------------------------------------------------------------
     * VALIDATION RULES
     * --------------------------------------------------------------------------
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */
            'parent_id' => [
                'nullable',
                'integer',
                'exists:property_categories,id',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('property_categories', 'name'),
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('property_categories', 'slug'),
            ],

            'description' => [
                'nullable',
                'string',
            ],

            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */
            'icon' => [
                'nullable',
                'string',
                'max:255',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'banner' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:4096',
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS & FLAGS
            |--------------------------------------------------------------------------
            */
            'status' => [
                'nullable',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            'is_featured' => [
                'nullable',
                'boolean',
            ],

            'show_in_homepage' => [
                'nullable',
                'boolean',
            ],

            'is_popular' => [
                'nullable',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | PROPERTY ASSIGNMENTS
            |--------------------------------------------------------------------------
            */
            'property_ids' => [
                'nullable',
                'array',
            ],

            'property_ids.*' => [
                'integer',
                'exists:properties,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */
            'meta_title' => [
                'nullable',
                'string',
                'max:255',
            ],

            'meta_description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'meta_keywords' => [
                'nullable',
                'string',
                'max:1000',
            ],

            /*
            |--------------------------------------------------------------------------
            | DISPLAY SETTINGS
            |--------------------------------------------------------------------------
            */
            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'color' => [
                'nullable',
                'string',
                'max:20',
            ],

            /*
            |--------------------------------------------------------------------------
            | STATS
            |--------------------------------------------------------------------------
            */
            'views_count' => [
                'nullable',
                'integer',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | SETTINGS
            |--------------------------------------------------------------------------
            */
            'settings' => [
                'nullable',
                'array',
            ],

            /*
            |--------------------------------------------------------------------------
            | PUBLISHING
            |--------------------------------------------------------------------------
            */
            'published_at' => [
                'nullable',
                'date',
            ],
        ];
    }

    /**
     * --------------------------------------------------------------------------
     * CUSTOM VALIDATION MESSAGES
     * --------------------------------------------------------------------------
     */
    public function messages(): array
    {
        return [

            'name.required' => 'Category name is required.',
            'name.unique' => 'This category name already exists.',
            'name.max' => 'Category name must not exceed 255 characters.',

            'slug.unique' => 'This slug already exists.',
            'slug.max' => 'Slug must not exceed 255 characters.',

            'parent_id.exists' => 'Selected parent category does not exist.',

            'image.image' => 'Image must be a valid image file.',
            'image.mimes' => 'Image must be jpg, jpeg, png, or webp.',
            'image.max' => 'Image size must not exceed 2MB.',

            'banner.image' => 'Banner must be a valid image file.',
            'banner.mimes' => 'Banner must be jpg, jpeg, png, or webp.',
            'banner.max' => 'Banner size must not exceed 4MB.',

            'status.in' => 'Invalid category status selected.',

            'property_ids.array' => 'Properties must be provided as an array.',
            'property_ids.*.exists' => 'One or more selected properties do not exist.',

            'sort_order.integer' => 'Sort order must be a number.',
            'sort_order.min' => 'Sort order cannot be negative.',

            'published_at.date' => 'Published date must be a valid date.',
        ];
    }

    /**
     * --------------------------------------------------------------------------
     * SANITIZE INPUTS
     * --------------------------------------------------------------------------
     */
    protected function prepareForValidation(): void
    {
        $data = [

            'name' => $this->name
                ? trim($this->name)
                : null,

            'slug' => $this->slug
                ? trim($this->slug)
                : null,

            'description' => $this->description
                ? trim($this->description)
                : null,

            'meta_title' => $this->meta_title
                ? trim($this->meta_title)
                : null,

            'meta_description' => $this->meta_description
                ? trim($this->meta_description)
                : null,

            'meta_keywords' => $this->meta_keywords
                ? trim($this->meta_keywords)
                : null,
        ];

        /*
        |--------------------------------------------------------------------------
        | Normalize Boolean Values
        |--------------------------------------------------------------------------
        */
        foreach ([
            'is_featured',
            'show_in_homepage',
            'is_popular',
        ] as $field) {
            if ($this->has($field)) {
                $data[$field] = $this->boolean($field);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Property IDs
        |--------------------------------------------------------------------------
        */
        if ($this->has('property_ids')) {
            $data['property_ids'] = array_values(
                array_filter((array) $this->property_ids)
            );
        }

        $this->merge($data);
    }
}