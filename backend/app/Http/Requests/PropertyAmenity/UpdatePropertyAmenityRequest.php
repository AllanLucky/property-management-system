<?php

namespace App\Http\Requests\PropertyAmenity;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyAmenityRequest extends FormRequest
{
    /**
     * Authorization
     */
    public function authorize(): bool
    {
        return $this->user()?->can('amenities.edit')
            || $this->user()?->can('amenities.manage');
    }

    /**
     * Validation rules
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | PIVOT DATA ONLY (RECOMMENDED)
            |--------------------------------------------------------------------------
            | We DO NOT allow changing property_id or amenity_id here
            | because they come from route.
            */
            'value' => [
                'nullable',
                'string',
                'max:255',
            ],

            'distance' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'walking_minutes' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'note' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'is_available' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    /**
     * Custom validation messages
     */
    public function messages(): array
    {
        return [

            'distance.numeric' => 'Distance must be a valid number.',
            'distance.min' => 'Distance cannot be negative.',

            'walking_minutes.integer' => 'Walking minutes must be a valid number.',
            'walking_minutes.min' => 'Walking minutes cannot be negative.',
        ];
    }
}