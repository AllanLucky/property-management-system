<?php

namespace App\Http\Requests\MaintenanceAssignment;

use App\Models\MaintenanceAssignment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RescheduleMaintenanceAssignmentRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to reschedule this maintenance assignment.
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

        // The assigned technician can reschedule their assignment.
        if ((int) $assignment->technician_id === (int) $user->id) {
            return true;
        }

        // The user who created the assignment can manage it.
        if ((int) $assignment->assigned_by === (int) $user->id) {
            return true;
        }

        // Users with appropriate maintenance permissions.
        return $user->can('manage maintenance assignments')
            || $user->can('reschedule maintenance assignments');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'scheduled_at' => [
                'required',
                'date',
                'after:now',
            ],

            'reschedule_reason' => [
                'nullable',
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

            // Completed, rejected and cancelled assignments cannot be rescheduled.
            if (in_array($assignment->status, [
                MaintenanceAssignment::STATUS_COMPLETED,
                MaintenanceAssignment::STATUS_REJECTED,
                MaintenanceAssignment::STATUS_CANCELLED,
            ], true)) {
                $validator->errors()->add(
                    'status',
                    'This maintenance assignment cannot be rescheduled because it is already '
                    . $assignment->status_label . '.'
                );
            }

            // Ensure the new scheduled date is valid and in the future.
            if (
                $this->filled('scheduled_at')
                && strtotime((string) $this->input('scheduled_at')) !== false
                && strtotime((string) $this->input('scheduled_at')) <= now()->timestamp
            ) {
                $validator->errors()->add(
                    'scheduled_at',
                    'The new scheduled date and time must be in the future.'
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
            'scheduled_at.required' =>
                'Please provide the new scheduled date and time.',

            'scheduled_at.date' =>
                'The scheduled date and time must be a valid date.',

            'scheduled_at.after' =>
                'The new scheduled date and time must be in the future.',

            'reschedule_reason.string' =>
                'The rescheduling reason must be valid text.',

            'reschedule_reason.min' =>
                'The rescheduling reason must contain at least 5 characters.',

            'reschedule_reason.max' =>
                'The rescheduling reason cannot exceed 1000 characters.',

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
            'scheduled_at' => 'scheduled date and time',
            'reschedule_reason' => 'rescheduling reason',
            'work_notes' => 'work notes',
        ];
    }
}
