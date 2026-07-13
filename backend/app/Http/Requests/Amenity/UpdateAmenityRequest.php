<?php

namespace App\Http\Requests\Amenity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAmenityRequest extends FormRequest
{
    /**
     * AUTHORIZE
     * Only admin / super-admin or users with permission can update amenities
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && (
            $user->hasRole('super-admin') ||
            $user->hasRole('admin') ||
            $user->can('amenities.edit')
        );
    }

    /**
     * VALIDATION RULES
     */
    public function rules(): array
    {
        // Works whether you use route model binding or ID
        $amenityId = $this->route('amenity')?->id
            ?? $this->route('amenity');

        return [
            /*
            |------------------------------------------
            | CORE FIELDS (OPTIONAL ON UPDATE)
            |------------------------------------------
            */
            'name' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('amenities', 'name')->ignore($amenityId),
            ],

            'display_name' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'slug' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
                Rule::unique('amenities', 'slug')->ignore($amenityId),
            ],

            /*
            |------------------------------------------
            | UI FIELDS
            |------------------------------------------
            */
            'icon' => [
                'nullable',
                'string',
                'max:255',
            ],

            'color' => [
                'nullable',
                'string',
                'max:50',
            ],

            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            /*
            |------------------------------------------
            | SYSTEM FLAGS
            |------------------------------------------
            */
            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],
        ];
    }

    /**
     * CUSTOM ERROR MESSAGES
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'This amenity name is already taken.',
            'slug.unique' => 'This slug is already in use.',
        ];
    }
}