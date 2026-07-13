<?php

namespace App\Http\Requests\PropertyCategory;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePropertyCategoryRequest extends FormRequest
{
    /**
     * --------------------------------------------------------------------------
     * AUTHORIZE
     * --------------------------------------------------------------------------
     */
    public function authorize(): bool
    {
        return auth()->check() && (
            auth()->user()->hasRole('SuperAdmin') ||
            auth()->user()->can('edit property categories')
        );
    }

    /**
     * --------------------------------------------------------------------------
     * VALIDATION RULES
     * --------------------------------------------------------------------------
     */
    public function rules(): array
    {
        /*
        |--------------------------------------------------------------------------
        | Resolve Current Category
        |--------------------------------------------------------------------------
        */
        $category = $this->route('propertyCategory')
            ?? $this->route('property_category')
            ?? $this->route('id');

        $categoryId = is_object($category)
            ? $category->id
            : $category;

        return [

            /*
            |--------------------------------------------------------------------------
            | HIERARCHY
            |--------------------------------------------------------------------------
            */
            'parent_id' => [
                'nullable',
                'integer',
                'exists:property_categories,id',
                Rule::notIn([$categoryId]),
            ],

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('property_categories', 'name')
                    ->ignore($categoryId),
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('property_categories', 'slug')
                    ->ignore($categoryId),
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
                'sometimes',
                'boolean',
            ],

            'show_in_homepage' => [
                'sometimes',
                'boolean',
            ],

            'is_popular' => [
                'sometimes',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | PROPERTY ASSIGNMENTS
            |--------------------------------------------------------------------------
            */
            'property_ids' => [
                'sometimes',
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
            | DISPLAY
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
                'max:50',
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
     * CUSTOM MESSAGES
     * --------------------------------------------------------------------------
     */
    public function messages(): array
    {
        return [

            'name.required' => 'Category name is required.',
            'name.unique' => 'This category name already exists.',
            'name.max' => 'Category name must not exceed 255 characters.',

            'slug.unique' => 'This slug is already taken.',
            'slug.max' => 'Slug must not exceed 255 characters.',

            'parent_id.exists' => 'Selected parent category does not exist.',
            'parent_id.not_in' => 'A category cannot be its own parent.',

            'image.image' => 'Uploaded file must be an image.',
            'image.mimes' => 'Only JPG, JPEG, PNG and WEBP images are allowed.',
            'image.max' => 'Image size must not exceed 2MB.',

            'banner.image' => 'Banner must be an image.',
            'banner.mimes' => 'Only JPG, JPEG, PNG and WEBP images are allowed.',
            'banner.max' => 'Banner image must not exceed 4MB.',

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
     * PREPARE DATA FOR VALIDATION
     * --------------------------------------------------------------------------
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        /*
        |--------------------------------------------------------------------------
        | Trim Text Fields
        |--------------------------------------------------------------------------
        */
        foreach ([
            'name',
            'slug',
            'description',
            'meta_title',
            'meta_description',
            'meta_keywords',
            'color',
        ] as $field) {

            if ($this->has($field) && is_string($this->{$field})) {
                $data[$field] = trim($this->{$field});
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Empty Slug => NULL
        |--------------------------------------------------------------------------
        */
        if ($this->has('slug') && blank($this->slug)) {
            $data['slug'] = null;
        }

        /*
        |--------------------------------------------------------------------------
        | Empty Parent => NULL
        |--------------------------------------------------------------------------
        */
        if ($this->has('parent_id') && blank($this->parent_id)) {
            $data['parent_id'] = null;
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Boolean Flags
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
                array_filter(
                    (array) $this->property_ids,
                    fn ($id) => !empty($id)
                )
            );
        }

        if (!empty($data)) {
            $this->merge($data);
        }
    }
}