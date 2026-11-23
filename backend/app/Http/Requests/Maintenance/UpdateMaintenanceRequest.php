<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaintenanceRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $maintenanceRequest = $this->route('maintenanceRequest');

        $requestId = is_object($maintenanceRequest)
            ? $maintenanceRequest->id
            : $maintenanceRequest;

        $currentPropertyId = is_object($maintenanceRequest)
            ? $maintenanceRequest->property_id
            : null;

        $propertyId = $this->input('property_id', $currentPropertyId);

        return [
            /*
            |--------------------------------------------------------------------------
            | PROPERTY INFORMATION
            |--------------------------------------------------------------------------
            */

            'property_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:properties,id',
            ],

            'unit_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('units', 'id')
                    ->where('property_id', $propertyId),
            ],

            /*
            |--------------------------------------------------------------------------
            | TENANT INFORMATION
            |--------------------------------------------------------------------------
            */

            'tenant_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:tenants,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | MAINTENANCE CATEGORY
            |--------------------------------------------------------------------------
            */

            'category_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:maintenance_categories,id',
            ],

            /*
            |--------------------------------------------------------------------------
            | REQUEST DETAILS
            |--------------------------------------------------------------------------
            */

            'title' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'description' => [
                'sometimes',
                'required',
                'string',
                'min:10',
            ],

            'priority' => [
                'sometimes',
                'required',
                Rule::in([
                    'low',
                    'medium',
                    'high',
                    'urgent',
                ]),
            ],

            'is_emergency' => [
                'sometimes',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | COST INFORMATION
            |--------------------------------------------------------------------------
            */

            'estimated_cost' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | ADDITIONAL INFORMATION
            |--------------------------------------------------------------------------
            */

            'notes' => [
                'sometimes',
                'nullable',
                'string',
                'max:2000',
            ],

            'metadata' => [
                'sometimes',
                'nullable',
                'array',
            ],
        ];
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'property_id.required' => 'Please select a property.',
            'property_id.exists' => 'The selected property does not exist.',

            'unit_id.exists' => 'The selected unit does not belong to the selected property.',

            'tenant_id.exists' => 'The selected tenant does not exist.',

            'category_id.exists' => 'The selected maintenance category does not exist.',

            'title.required' => 'Please provide a maintenance request title.',
            'title.max' => 'The title cannot exceed 255 characters.',

            'description.required' => 'Please describe the maintenance problem.',
            'description.min' => 'The description must contain at least 10 characters.',

            'priority.required' => 'Please select a maintenance priority.',
            'priority.in' => 'The selected maintenance priority is invalid.',

            'is_emergency.boolean' => 'Emergency status must be true or false.',

            'estimated_cost.numeric' => 'The estimated cost must be a valid number.',
            'estimated_cost.min' => 'The estimated cost cannot be negative.',

            'notes.max' => 'Additional notes cannot exceed 2000 characters.',

            'metadata.array' => 'Additional metadata must be a valid array.',
        ];
    }

    /**
     * Prepare input data before validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('is_emergency')) {
            $this->merge([
                'is_emergency' => filter_var(
                    $this->input('is_emergency'),
                    FILTER_VALIDATE_BOOLEAN,
                    FILTER_NULL_ON_FAILURE
                ),
            ]);
        }
    }
}
