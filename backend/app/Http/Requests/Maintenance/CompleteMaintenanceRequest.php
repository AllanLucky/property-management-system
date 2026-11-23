<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CompleteMaintenanceRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to complete a maintenance request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Prepare request data before validation.
     */
    protected function prepareForValidation(): void
    {
        $data = [];

        /*
        |--------------------------------------------------------------------------
        | Normalize Completion Notes
        |--------------------------------------------------------------------------
        */
        if (is_string($this->input('completion_notes'))) {
            $data['completion_notes'] = trim(
                $this->input('completion_notes')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Total Cost
        |--------------------------------------------------------------------------
        */
        if ($this->has('total_cost')) {
            $value = $this->input('total_cost');

            $data['total_cost'] = $value === '' || $value === null
                ? null
                : (is_numeric($value) ? (float) $value : $value);
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Actual Working Hours
        |--------------------------------------------------------------------------
        */
        if ($this->has('actual_hours')) {
            $value = $this->input('actual_hours');

            $data['actual_hours'] = $value === '' || $value === null
                ? null
                : (is_numeric($value) ? (float) $value : $value);
        }

        /*
        |--------------------------------------------------------------------------
        | Normalize Checklist Completion
        |--------------------------------------------------------------------------
        */
        if ($this->has('checklist_completed')) {
            $value = $this->input('checklist_completed');

            if (in_array($value, ['true', '1', 1, true], true)) {
                $data['checklist_completed'] = true;
            } elseif (in_array($value, ['false', '0', 0, false], true)) {
                $data['checklist_completed'] = false;
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Merge Normalized Data
        |--------------------------------------------------------------------------
        */
        if (!empty($data)) {
            $this->merge($data);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            /*
            |--------------------------------------------------------------------------
            | Completion Notes
            |--------------------------------------------------------------------------
            */
            'completion_notes' => [
                'required',
                'string',
                'min:5',
                'max:2000',
            ],

            /*
            |--------------------------------------------------------------------------
            | Total Maintenance Cost
            |--------------------------------------------------------------------------
            */
            'total_cost' => [
                'nullable',
                'numeric',
                'min:0',
                'max:999999999.99',
            ],

            /*
            |--------------------------------------------------------------------------
            | Actual Working Hours
            |--------------------------------------------------------------------------
            */
            'actual_hours' => [
                'nullable',
                'numeric',
                'min:0',
                'max:10000',
            ],

            /*
            |--------------------------------------------------------------------------
            | Completion Date
            |--------------------------------------------------------------------------
            */
            'completed_at' => [
                'nullable',
                'date',
                'before_or_equal:now',
            ],

            /*
            |--------------------------------------------------------------------------
            | Checklist Completion
            |--------------------------------------------------------------------------
            */
            'checklist_completed' => [
                'sometimes',
                'boolean',
            ],

            /*
            |--------------------------------------------------------------------------
            | Additional Metadata
            |--------------------------------------------------------------------------
            */
            'metadata' => [
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
            'completion_notes.required' =>
                'Please provide completion notes before completing the maintenance request.',

            'completion_notes.string' =>
                'Completion notes must be valid text.',

            'completion_notes.min' =>
                'Completion notes must contain at least 5 characters.',

            'completion_notes.max' =>
                'Completion notes cannot exceed 2000 characters.',

            'total_cost.numeric' =>
                'The total maintenance cost must be a valid number.',

            'total_cost.min' =>
                'The total maintenance cost cannot be negative.',

            'total_cost.max' =>
                'The total maintenance cost exceeds the allowed limit.',

            'actual_hours.numeric' =>
                'Actual working hours must be a valid number.',

            'actual_hours.min' =>
                'Actual working hours cannot be negative.',

            'actual_hours.max' =>
                'Actual working hours cannot exceed 10000.',

            'completed_at.date' =>
                'Please provide a valid completion date and time.',

            'completed_at.before_or_equal' =>
                'The completion date cannot be in the future.',

            'checklist_completed.boolean' =>
                'The checklist completion field must be true or false.',

            'metadata.array' =>
                'Metadata must be provided as a valid array.',
        ];
    }

    /**
     * Get custom attribute names for validation errors.
     */
    public function attributes(): array
    {
        return [
            'completion_notes' => 'completion notes',
            'total_cost' => 'total maintenance cost',
            'actual_hours' => 'actual working hours',
            'completed_at' => 'completion date',
            'checklist_completed' => 'checklist completion',
            'metadata' => 'metadata',
        ];
    }
}
