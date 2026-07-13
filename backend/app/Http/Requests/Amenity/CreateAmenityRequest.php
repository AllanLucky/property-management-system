<?php

namespace App\Http\Requests\Amenity;

use Illuminate\Foundation\Http\FormRequest;

class CreateAmenityRequest extends FormRequest
{
    /**
     * AUTHORIZE
     * Only admin or super-admin should manage amenities
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return $user && (
            $user->hasRole('super-admin') ||
            $user->hasRole('admin') ||
            $user->can('amenities.create')
        );
    }

    /**
     * VALIDATION RULES
     */
    public function rules(): array
    {
        return [
            /*
            |------------------------------------------
            | CORE AMENITY DATA
            |------------------------------------------
            */
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:amenities,name',
            ],

            'display_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                'unique:amenities,slug',
            ],

            /*
            |------------------------------------------
            | UI / DISPLAY SETTINGS
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
                'nullable',
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
     * CUSTOM MESSAGES
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Amenity name is required.',
            'name.unique' => 'This amenity already exists.',

            'slug.unique' => 'This slug is already taken.',
        ];
    }
}