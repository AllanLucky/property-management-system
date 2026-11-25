<?php

namespace App\Http\Requests\MaintenanceAssignment;

use App\Models\MaintenanceAssignment;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateMaintenanceAssignmentRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to update this maintenance assignment.
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

        // The user who created the assignment can update it.
        if ((int) $assignment->assigned_by === (int) $user->id) {
            return true;
        }

        // Users with appropriate maintenance permissions.
        return $user->can('manage maintenance assignments')
            || $user->can('update maintenance assignments');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'technician_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:users,id',
            ],

            'scheduled_at' => [
                'sometimes',
                'nullable',
                'date',
                'after:now',
            ],

            'estimated_hours' => [
                'sometimes',
                'nullable',
                'numeric',
                'gt:0',
                'decimal:0,2',
                'max:999999.99',
            ],

            'estimated_cost' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'decimal:0,2',
                'max:9999999999.99',
            ],

            'work_notes' => [
                'sometimes',
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

            /*
            |--------------------------------------------------------------------------
            | Validate Assignment Status
            |--------------------------------------------------------------------------
            */

            if (in_array($assignment->status, [
                MaintenanceAssignment::STATUS_COMPLETED,
                MaintenanceAssignment::STATUS_REJECTED,
                MaintenanceAssignment::STATUS_CANCELLED,
            ], true)) {
                $validator->errors()->add(
                    'status',
                    'This maintenance assignment cannot be updated because it is already '
                    . $assignment->status_label . '.'
                );

                return;
            }

            /*
            |--------------------------------------------------------------------------
            | Validate Technician
            |--------------------------------------------------------------------------
            */

            if (
                $this->filled('technician_id')
                && is_numeric($this->input('technician_id'))
            ) {
                $technician = User::find(
                    $this->input('technician_id')
                );

                if (! $technician) {
                    return;
                }

                if (! $technician->hasRole('technician')) {
                    $validator->errors()->add(
                        'technician_id',
                        'The selected user is not registered as a technician.'
                    );
                }

                if (
                    method_exists($technician, 'trashed')
                    && $technician->trashed()
                ) {
                    $validator->errors()->add(
                        'technician_id',
                        'The selected technician account is no longer available.'
                    );
                }

                // Prevent assigning an in-progress job to another technician.
                if (
                    $assignment->status === MaintenanceAssignment::STATUS_IN_PROGRESS
                    && (int) $assignment->technician_id !== (int) $technician->id
                ) {
                    $validator->errors()->add(
                        'technician_id',
                        'An in-progress maintenance assignment cannot be reassigned. '
                        . 'Please resolve the current assignment first.'
                    );
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Validate Update Payload
            |--------------------------------------------------------------------------
            */

            if (empty($this->all())) {
                $validator->errors()->add(
                    'maintenance_assignment',
                    'Please provide at least one field to update.'
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
            'technician_id.required' =>
                'Please select a technician.',

            'technician_id.integer' =>
                'The technician ID must be a valid integer.',

            'technician_id.exists' =>
                'The selected technician does not exist.',

            'scheduled_at.date' =>
                'The scheduled date and time must be a valid date.',

            'scheduled_at.after' =>
                'The scheduled date and time must be in the future.',

            'estimated_hours.numeric' =>
                'Estimated working hours must be a valid number.',

            'estimated_hours.gt' =>
                'Estimated working hours must be greater than zero.',

            'estimated_hours.decimal' =>
                'Estimated working hours must have no more than two decimal places.',

            'estimated_hours.max' =>
                'Estimated working hours exceed the maximum allowed value.',

            'estimated_cost.numeric' =>
                'Estimated cost must be a valid number.',

            'estimated_cost.min' =>
                'Estimated cost cannot be negative.',

            'estimated_cost.decimal' =>
                'Estimated cost must have no more than two decimal places.',

            'estimated_cost.max' =>
                'Estimated cost exceeds the maximum allowed value.',

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
            'technician_id' => 'technician',
            'scheduled_at' => 'scheduled date and time',
            'estimated_hours' => 'estimated working hours',
            'estimated_cost' => 'estimated maintenance cost',
            'work_notes' => 'work notes',
        ];
    }
}
