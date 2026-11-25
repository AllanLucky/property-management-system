<?php

namespace App\Http\Requests\MaintenanceAssignment;

use App\Models\MaintenanceAssignment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CompleteMaintenanceAssignmentRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to complete this maintenance assignment.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        $assignment = $this->getMaintenanceAssignment();

        if (! $assignment) {
            return false;
        }

        // The assigned technician can complete their own assignment.
        if ((int) $assignment->technician_id === (int) $user->id) {
            return true;
        }

        // The user who created the assignment can manage it.
        if ((int) $assignment->assigned_by === (int) $user->id) {
            return true;
        }

        // Users with appropriate maintenance permissions.
        return $user->can('manage maintenance assignments')
            || $user->can('complete maintenance assignments');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'actual_hours' => [
                'required',
                'numeric',
                'gt:0',
                'decimal:0,2',
                'max:999999.99',
            ],

            'actual_cost' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
                'max:9999999999.99',
            ],

            'work_notes' => [
                'nullable',
                'string',
                'min:5',
                'max:5000',
            ],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $assignment = $this->getMaintenanceAssignment();

            if (! $assignment) {
                $validator->errors()->add(
                    'maintenance_assignment',
                    'The requested maintenance assignment could not be found.'
                );

                return;
            }

            // Only accepted or in-progress assignments can be completed.
            if (! in_array($assignment->status, [
                MaintenanceAssignment::STATUS_ACCEPTED,
                MaintenanceAssignment::STATUS_IN_PROGRESS,
                MaintenanceAssignment::STATUS_ON_HOLD,
            ], true)) {
                $validator->errors()->add(
                    'status',
                    'Only accepted, in-progress, or on-hold maintenance assignments can be completed.'
                );
            }

            // Work must have started before completion.
            if ($assignment->started_at === null) {
                $validator->errors()->add(
                    'started_at',
                    'This maintenance assignment must be started before it can be completed.'
                );
            }

            // Ensure the actual hours are greater than zero.
            if (
                $this->filled('actual_hours')
                && is_numeric($this->input('actual_hours'))
                && (float) $this->input('actual_hours') <= 0
            ) {
                $validator->errors()->add(
                    'actual_hours',
                    'Actual working hours must be greater than zero.'
                );
            }
        });
    }

    /**
     * Retrieve the maintenance assignment from the route.
     */
    protected function getMaintenanceAssignment(): ?MaintenanceAssignment
    {
        $assignment = $this->route('maintenanceAssignment')
            ?? $this->route('assignment')
            ?? $this->route('id');

        if ($assignment instanceof MaintenanceAssignment) {
            return $assignment;
        }

        if (! is_numeric($assignment)) {
            return null;
        }

        return MaintenanceAssignment::find($assignment);
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'actual_hours.required' =>
                'Please provide the actual hours spent on this maintenance assignment.',

            'actual_hours.numeric' =>
                'Actual working hours must be a valid number.',

            'actual_hours.gt' =>
                'Actual working hours must be greater than zero.',

            'actual_hours.decimal' =>
                'Actual working hours must have no more than two decimal places.',

            'actual_hours.max' =>
                'Actual working hours exceed the maximum allowed value.',

            'actual_cost.required' =>
                'Please provide the actual cost of completing this maintenance assignment.',

            'actual_cost.numeric' =>
                'Actual cost must be a valid number.',

            'actual_cost.min' =>
                'Actual cost cannot be negative.',

            'actual_cost.decimal' =>
                'Actual cost must have no more than two decimal places.',

            'actual_cost.max' =>
                'Actual cost exceeds the maximum allowed value.',

            'work_notes.string' =>
                'Work notes must be valid text.',

            'work_notes.min' =>
                'Work notes must contain at least 5 characters when provided.',

            'work_notes.max' =>
                'Work notes cannot exceed 5000 characters.',
        ];
    }

    /**
     * Get custom attribute names.
     */
    public function attributes(): array
    {
        return [
            'actual_hours' => 'actual working hours',
            'actual_cost' => 'actual maintenance cost',
            'work_notes' => 'work notes',
        ];
    }
}
