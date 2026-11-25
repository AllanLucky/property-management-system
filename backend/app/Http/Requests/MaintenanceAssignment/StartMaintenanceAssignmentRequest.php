<?php

namespace App\Http\Requests\MaintenanceAssignment;

use App\Models\MaintenanceAssignment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StartMaintenanceAssignmentRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to start this maintenance assignment.
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

        // The assigned technician can start their own assignment.
        if ((int) $assignment->technician_id === (int) $user->id) {
            return true;
        }

        // Authorized maintenance administrators can start assignments.
        return $user->can('manage maintenance assignments')
            || $user->can('start maintenance assignments');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
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

            // Only accepted assignments can be started.
            if (! $assignment->isAccepted()) {
                $validator->errors()->add(
                    'status',
                    'Only accepted maintenance assignments can be started.'
                );
            }

            // Prevent starting an assignment that already has a start timestamp.
            if ($assignment->started_at !== null) {
                $validator->errors()->add(
                    'started_at',
                    'This maintenance assignment has already been started.'
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
            'work_notes' => 'work notes',
        ];
    }
}
