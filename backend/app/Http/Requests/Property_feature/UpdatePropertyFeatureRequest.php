<?php

namespace App\Http\Requests\Property_feature;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyFeatureRequest extends FormRequest
{
    /*
    |--------------------------------------------------------------------------
    | AUTHORIZE
    |--------------------------------------------------------------------------
    */
    public function authorize(): bool
    {
        return true;
    }

    /*
    |--------------------------------------------------------------------------
    | RULES
    |--------------------------------------------------------------------------
    */
    public function rules(): array
    {
        // ✅ FIX: route returns string/int, NOT model
        $featureId = $this->route('id');

        return [

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP
            |--------------------------------------------------------------------------
            */
            'property_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:properties,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | FEATURE DETAILS
            |--------------------------------------------------------------------------
            */
            'name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('property_features', 'slug')
                    ->ignore($featureId),
            ],

            'value' => [
                'nullable',
                'string',
                'max:255',
            ],

            'type' => [
                'nullable',
                'string',
                Rule::in([
                    'text',
                    'number',
                    'boolean',
                    'badge',
                    'icon',
                    'measurement',
                ]),
            ],

            'icon' => [
                'nullable',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],

            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */
            'is_active' => [
                'nullable',
                'boolean',
            ],

            'is_highlighted' => [
                'nullable',
                'boolean',
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
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MESSAGES
    |--------------------------------------------------------------------------
    */
    public function messages(): array
    {
        return [

            'property_id.required' => 'Property is required.',
            'property_id.exists' => 'Selected property does not exist.',

            'name.required' => 'Feature name is required.',
            'name.min' => 'Feature name must be at least 2 characters.',
            'name.max' => 'Feature name cannot exceed 255 characters.',

            'slug.unique' => 'This slug already exists.',

            'type.in' => 'Invalid feature type selected.',

            'sort_order.integer' => 'Sort order must be a number.',
            'sort_order.min' => 'Sort order cannot be negative.',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | PREPARE FOR VALIDATION
    |--------------------------------------------------------------------------
    */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'is_active' => filter_var(
                $this->is_active,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),

            'is_highlighted' => filter_var(
                $this->is_highlighted,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTES
    |--------------------------------------------------------------------------
    */
    public function attributes(): array
    {
        return [
            'property_id' => 'property',
            'name' => 'feature name',
            'value' => 'feature value',
            'sort_order' => 'sort order',
        ];
    }
}