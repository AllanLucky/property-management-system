<?php

namespace App\Http\Requests\Property_feature;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class CreatePropertyFeatureRequest extends FormRequest
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
    | VALIDATION RULES
    |--------------------------------------------------------------------------
    */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP
            |--------------------------------------------------------------------------
            */
            'property_id' => [
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
                'required',
                'string',
                'min:2',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('property_features', 'slug'),
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
    | AUTO FIX INPUT BEFORE VALIDATION
    |--------------------------------------------------------------------------
    */
    protected function prepareForValidation(): void
    {
        $this->merge([

            // AUTO-GENERATE SLUG IF NOT PROVIDED
            'slug' => $this->slug ?: Str::slug($this->name),

            // SAFE BOOLEAN CASTING
            'is_active' => filter_var(
                $this->is_active,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? true,

            'is_highlighted' => filter_var(
                $this->is_highlighted,
                FILTER_VALIDATE_BOOLEAN,
                FILTER_NULL_ON_FAILURE
            ) ?? false,

            // CLEAN SORT ORDER
            'sort_order' => is_numeric($this->sort_order)
                ? (int) $this->sort_order
                : 0,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CUSTOM ERROR MESSAGES
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
    | ATTRIBUTE NAMES
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