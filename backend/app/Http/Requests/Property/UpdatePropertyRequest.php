<?php

namespace App\Http\Requests\Property;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class UpdatePropertyRequest extends FormRequest
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
        $propertyId = $this->route('property')
            ? $this->route('property')->id
            : null;

        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC INFO
            |--------------------------------------------------------------------------
            */
            'title' => ['sometimes', 'string', 'min:2', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string'],

            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:200',
                Rule::unique('properties', 'slug')->ignore($propertyId),
            ],

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIPS
            |--------------------------------------------------------------------------
            */
            'user_id' => ['sometimes', 'nullable', 'integer', 'exists:users,id'],

            'property_type_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:property_types,id',
            ],

            'property_category_id' => [
                'sometimes',
                'integer',
                'exists:property_categories,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | LOCATION IDS
            |--------------------------------------------------------------------------
            */
            'country_id' => ['sometimes', 'nullable', 'integer', 'exists:countries,id'],
            'region_id' => ['sometimes', 'nullable', 'integer', 'exists:regions,id'],
            'county_id' => ['sometimes', 'nullable', 'integer', 'exists:counties,id'],
            'city_id' => ['sometimes', 'nullable', 'integer', 'exists:cities,id'],
            'area_id' => ['sometimes', 'nullable', 'integer', 'exists:areas,id'],

            /*
            |--------------------------------------------------------------------------
            | LOCATION TEXT
            |--------------------------------------------------------------------------
            */
            'country_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'region_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'county_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'city_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'area_name' => ['sometimes', 'nullable', 'string', 'max:100'],
            'street_address' => ['sometimes', 'nullable', 'string', 'max:255'],

            /*
            |--------------------------------------------------------------------------
            | GEO
            |--------------------------------------------------------------------------
            */
            'latitude' => ['sometimes', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'nullable', 'numeric', 'between:-180,180'],

            /*
            |--------------------------------------------------------------------------
            | LISTING
            |--------------------------------------------------------------------------
            */
            'listing_type' => [
                'sometimes',
                Rule::in(['sale', 'rent', 'lease']),
            ],

            'status' => [
                'sometimes',
                Rule::in(['draft', 'pending', 'published', 'sold', 'rented', 'inactive']),
            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURES
            |--------------------------------------------------------------------------
            */
            'bedrooms' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'bathrooms' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'toilets' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'garages' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'parking_spaces' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'floors' => ['sometimes', 'nullable', 'integer', 'min:0'],

            'size' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'size_unit' => ['sometimes', 'nullable', 'string', 'max:20'],

            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */
            'price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'discount_price' => ['sometimes', 'nullable', 'numeric', 'min:0', 'lte:price'],
            'monthly_rent' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'service_charge' => ['sometimes', 'nullable', 'numeric', 'min:0'],

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */
            'is_featured' => ['sometimes', 'boolean'],
            'is_verified' => ['sometimes', 'boolean'],
            'is_published' => ['sometimes', 'boolean'],

            'has_balcony' => ['sometimes', 'boolean'],
            'has_swimming_pool' => ['sometimes', 'boolean'],
            'has_garden' => ['sometimes', 'boolean'],
            'has_wifi' => ['sometimes', 'boolean'],
            'has_security' => ['sometimes', 'boolean'],

            /*
            |--------------------------------------------------------------------------
            | MEDIA (UPDATED)
            |--------------------------------------------------------------------------
            */

            // ✔ MAIN IMAGE (NEW IMAGE SERVICE)
            'image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120'
            ],

            'thumbnail' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120'
            ],

            'video_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'virtual_tour_url' => ['sometimes', 'nullable', 'url', 'max:500'],

            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */
            'meta_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'meta_description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'meta_keywords' => ['sometimes', 'nullable', 'string', 'max:500'],

            /*
            |--------------------------------------------------------------------------
            | PUBLISHING
            |--------------------------------------------------------------------------
            */
            'published_at' => ['sometimes', 'nullable', 'date'],

            /*
            |--------------------------------------------------------------------------
            | LOCATION SOURCE
            |--------------------------------------------------------------------------
            */
            'location_source' => ['sometimes', 'nullable', Rule::in(['openstreetmap', 'manual'])],
        ];
    }

    /**
     * CLEAN INPUT BEFORE VALIDATION
     */
    protected function prepareForValidation(): void
    {
        $this->merge([

            'slug' => $this->slug
                ? Str::slug($this->slug)
                : ($this->title ? Str::slug($this->title) : null),

            /*
            |--------------------------------------------------------------------------
            | CATEGORY SAFE CAST
            |--------------------------------------------------------------------------
            */
            'property_category_id' => $this->filled('property_category_id')
                ? (int) $this->property_category_id
                : null,

            /*
            |--------------------------------------------------------------------------
            | BOOLEAN NORMALIZATION
            |--------------------------------------------------------------------------
            */
            'is_featured' => filter_var($this->is_featured, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            'is_verified' => filter_var($this->is_verified, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            'is_published' => filter_var($this->is_published, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),

            'has_balcony' => filter_var($this->has_balcony, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            'has_swimming_pool' => filter_var($this->has_swimming_pool, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            'has_garden' => filter_var($this->has_garden, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            'has_wifi' => filter_var($this->has_wifi, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            'has_security' => filter_var($this->has_security, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),

            'location_source' => $this->location_source ?? 'openstreetmap',
        ]);
    }

    public function messages(): array
    {
        return [
            'property_category_id.exists' => 'Selected property category does not exist.',
            'image.image' => 'Uploaded file must be an image.',
            'thumbnail.image' => 'Thumbnail must be an image.',
            'listing_type.in' => 'Invalid listing type.',
        ];
    }
}