<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePropertyRequest extends FormRequest
{
    /**
     * AUTHORIZE
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * VALIDATION RULES
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'title' => ['required', 'string', 'min:2', 'max:150'],
            'description' => ['nullable', 'string'],
            'slug' => ['nullable', 'string', 'max:200', 'unique:properties,slug'],

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */
            'user_id' => ['nullable', 'integer', 'exists:users,id'],
            'property_type_id' => ['nullable', 'integer', 'exists:property_types,id'],

            'property_category_id' => [
                'required',
                'integer',
                'exists:property_categories,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | LOCATION IDS
            |--------------------------------------------------------------------------
            */
            'country_id' => ['nullable', 'integer', 'exists:countries,id'],
            'region_id' => ['nullable', 'integer', 'exists:regions,id'],
            'county_id' => ['nullable', 'integer', 'exists:counties,id'],
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'area_id' => ['nullable', 'integer', 'exists:areas,id'],

            /*
            |--------------------------------------------------------------------------
            | LOCATION TEXT
            |--------------------------------------------------------------------------
            */
            'country_name' => ['nullable', 'string', 'max:100'],
            'region_name' => ['nullable', 'string', 'max:100'],
            'county_name' => ['nullable', 'string', 'max:100'],
            'city_name' => ['nullable', 'string', 'max:100'],
            'area_name' => ['nullable', 'string', 'max:100'],
            'street_address' => ['nullable', 'string', 'max:255'],

            /*
            |--------------------------------------------------------------------------
            | GEO
            |--------------------------------------------------------------------------
            */
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            /*
            |--------------------------------------------------------------------------
            | LISTING
            |--------------------------------------------------------------------------
            */
            'listing_type' => [
                'required',
                Rule::in(['sale', 'rent', 'lease']),
            ],

            'status' => [
                'nullable',
                Rule::in(['draft', 'pending', 'published', 'sold', 'rented', 'inactive']),
            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */
            'bedrooms' => ['nullable', 'integer', 'min:0'],
            'bathrooms' => ['nullable', 'integer', 'min:0'],
            'toilets' => ['nullable', 'integer', 'min:0'],
            'garages' => ['nullable', 'integer', 'min:0'],
            'parking_spaces' => ['nullable', 'integer', 'min:0'],
            'floors' => ['nullable', 'integer', 'min:0'],

            'size' => ['nullable', 'numeric', 'min:0'],
            'size_unit' => ['nullable', 'string', 'max:20'],

            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */
            'price' => ['nullable', 'numeric', 'min:0'],
            'discount_price' => ['nullable', 'numeric', 'min:0', 'lte:price'],
            'monthly_rent' => ['nullable', 'numeric', 'min:0'],
            'service_charge' => ['nullable', 'numeric', 'min:0'],

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */
            'is_featured' => ['nullable', 'boolean'],
            'is_verified' => ['nullable', 'boolean'],
            'is_published' => ['nullable', 'boolean'],

            'has_balcony' => ['nullable', 'boolean'],
            'has_swimming_pool' => ['nullable', 'boolean'],
            'has_garden' => ['nullable', 'boolean'],
            'has_wifi' => ['nullable', 'boolean'],
            'has_security' => ['nullable', 'boolean'],

            /*
            |--------------------------------------------------------------------------
            | MEDIA (UPDATED FOR IMAGE SERVICE)
            |--------------------------------------------------------------------------
            */

            // ✔ MAIN IMAGE (NEW STANDARD)
            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120'
            ],

            // optional fallback if still used
            'thumbnail' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120'
            ],

            'video_url' => ['nullable', 'url', 'max:500'],
            'virtual_tour_url' => ['nullable', 'url', 'max:500'],

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:1000'],
            'meta_keywords' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * CLEAN INPUT BEFORE VALIDATION
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'property_category_id' => $this->filled('property_category_id')
                ? (int) $this->property_category_id
                : null,
        ]);
    }

    /**
     * CUSTOM MESSAGES
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Property title is required.',
            'listing_type.required' => 'Listing type is required.',
            'property_category_id.required' => 'Property category is required.',
            'property_category_id.exists' => 'Selected category does not exist.',
            'price.numeric' => 'Price must be a valid number.',
        ];
    }
}