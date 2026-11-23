<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMaintenanceProgressRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to update ongoing maintenance progress.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'progress_percentage' => [
                'required',
                'integer',
                'min:1',
                'max:99',
            ],

            'work_notes' => [
                'required',
                'string',
                'min:5',
                'max:2000',
            ],

            'actual_hours' => [
                'nullable',
                'numeric',
                'min:0',
                'max:10000',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],

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
            'progress_percentage.required' =>
                'Please provide the current maintenance progress.',

            'progress_percentage.integer' =>
                'Progress percentage must be a whole number.',

            'progress_percentage.min' =>
                'Progress percentage must be at least 1%.',

            'progress_percentage.max' =>
                'Progress cannot reach 100%. Use the complete maintenance action instead.',

            'work_notes.required' =>
                'Please describe the work completed so far.',

            'work_notes.string' =>
                'Work notes must be valid text.',

            'work_notes.min' =>
                'Work notes must contain at least 5 characters.',

            'work_notes.max' =>
                'Work notes cannot exceed 2000 characters.',

            'actual_hours.numeric' =>
                'Actual working hours must be a valid number.',

            'actual_hours.min' =>
                'Actual working hours cannot be negative.',

            'actual_hours.max' =>
                'Actual working hours cannot exceed 10000.',

            'notes.string' =>
                'Additional notes must be valid text.',

            'notes.max' =>
                'Additional notes cannot exceed 2000 characters.',

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
            'progress_percentage' => 'progress percentage',
            'work_notes' => 'work notes',
            'actual_hours' => 'actual hours',
            'notes' => 'additional notes',
            'metadata' => 'metadata',
        ];
    }
}
