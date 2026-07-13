<?php

namespace App\Http\Requests\PropertyAmenity;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreatePropertyAmenityRequest extends FormRequest
{
    /**
     * Authorization
     */
    public function authorize(): bool
    {
        return $this->user()?->can('amenities.create')
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
            | RELATIONSHIP FIELDS
            |--------------------------------------------------------------------------
            */
            'property_id' => [
                'required',
                'integer',
                'exists:properties,id',
            ],

            'amenity_id' => [
                'required',
                'integer',
                'exists:amenities,id',

                /*
                | Prevent duplicate assignment (clean + safe)
                */
                Rule::unique('property_amenities')
                    ->where(fn ($query) =>
                        $query->where('property_id', $this->property_id)
                    ),
            ],

            /*
            |--------------------------------------------------------------------------
            | PIVOT DATA (OPTIONAL)
            |--------------------------------------------------------------------------
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

            /*
            |--------------------------------------------------------------------------
            | FUTURE-PROOF FIELD (OPTIONAL EXTENSION)
            |--------------------------------------------------------------------------
            */
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

            'property_id.required' => 'Property is required.',
            'property_id.exists' => 'The selected property does not exist.',

            'amenity_id.required' => 'Amenity is required.',
            'amenity_id.exists' => 'The selected amenity does not exist.',
            'amenity_id.unique' => 'This amenity is already assigned to this property.',

            'distance.numeric' => 'Distance must be a valid number.',
            'distance.min' => 'Distance cannot be negative.',

            'walking_minutes.integer' => 'Walking minutes must be a whole number.',
            'walking_minutes.min' => 'Walking minutes cannot be negative.',
        ];
    }
}