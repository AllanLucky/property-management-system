<?php

namespace App\Http\Requests\MaintenanceAssignment;

use App\Models\MaintenanceAssignment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CancelMaintenanceAssignmentRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to cancel this maintenance assignment.
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

        // The assigned technician can cancel their own assignment.
        if ((int) $assignment->technician_id === (int) $user->id) {
            return true;
        }

        // The user who created the assignment can cancel it.
        if ((int) $assignment->assigned_by === (int) $user->id) {
            return true;
        }

        // Administrators with maintenance management permissions.
        return $user->can('manage maintenance assignments')
            || $user->can('cancel maintenance assignments');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cancellation_reason' => [
                'required',
                'string',
                'min:5',
                'max:1000',
            ],

            'work_notes' => [
                'nullable',
                'string',
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

            if (in_array($assignment->status, [
                MaintenanceAssignment::STATUS_COMPLETED,
                MaintenanceAssignment::STATUS_REJECTED,
                MaintenanceAssignment::STATUS_CANCELLED,
            ], true)) {
                $validator->errors()->add(
                    'status',
                    'This maintenance assignment cannot be cancelled because it is already '
                    . $assignment->status_label . '.'
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
            'cancellation_reason.required' =>
                'Please provide a reason for cancelling this assignment.',

            'cancellation_reason.string' =>
                'The cancellation reason must be valid text.',

            'cancellation_reason.min' =>
                'The cancellation reason must contain at least 5 characters.',

            'cancellation_reason.max' =>
                'The cancellation reason cannot exceed 1000 characters.',

            'work_notes.string' =>
                'Work notes must be valid text.',

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
            'cancellation_reason' => 'cancellation reason',
            'work_notes' => 'work notes',
        ];
    }
}
