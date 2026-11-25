<?php

namespace App\Http\Requests\MaintenanceAssignment;

use App\Models\MaintenanceAssignment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class HoldMaintenanceAssignmentRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to put this maintenance assignment on hold.
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

        // The assigned technician can put their assignment on hold.
        if ((int) $assignment->technician_id === (int) $user->id) {
            return true;
        }

        // The user who created the assignment can manage it.
        if ((int) $assignment->assigned_by === (int) $user->id) {
            return true;
        }

        // Users with appropriate maintenance permissions.
        return $user->can('manage maintenance assignments')
            || $user->can('hold maintenance assignments');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'hold_reason' => [
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

            // Only accepted or in-progress assignments can be put on hold.
            if (! in_array($assignment->status, [
                MaintenanceAssignment::STATUS_ACCEPTED,
                MaintenanceAssignment::STATUS_IN_PROGRESS,
            ], true)) {
                $validator->errors()->add(
                    'status',
                    'Only accepted or in-progress maintenance assignments can be put on hold.'
                );
            }

            // Work must have started before an assignment can be put on hold.
            if (
                $assignment->status === MaintenanceAssignment::STATUS_IN_PROGRESS
                && $assignment->started_at === null
            ) {
                $validator->errors()->add(
                    'started_at',
                    'The maintenance assignment must have a recorded start time before it can be put on hold.'
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
            'hold_reason.required' =>
                'Please provide a reason for putting this maintenance assignment on hold.',

            'hold_reason.string' =>
                'The hold reason must be valid text.',

            'hold_reason.min' =>
                'The hold reason must contain at least 5 characters.',

            'hold_reason.max' =>
                'The hold reason cannot exceed 1000 characters.',

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
            'hold_reason' => 'hold reason',
            'work_notes' => 'work notes',
        ];
    }
}
