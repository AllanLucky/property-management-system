<?php

namespace App\Http\Requests\MaintenanceAssignment;

use App\Models\MaintenanceAssignment;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class RejectMaintenanceAssignmentRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to reject this maintenance assignment.
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

        // The assigned technician can reject their own assignment.
        if ((int) $assignment->technician_id === (int) $user->id) {
            return true;
        }

        // Authorized maintenance administrators can reject assignments.
        return $user->can('manage maintenance assignments')
            || $user->can('reject maintenance assignments');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'rejection_reason' => [
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
        $validator->after(function (Validator $validator): void {
            $assignment = $this->getMaintenanceAssignment();

            if (! $assignment) {
                $validator->errors()->add(
                    'maintenance_assignment',
                    'The requested maintenance assignment could not be found.'
                );

                return;
            }

            // Only pending assignments can be rejected.
            if (! $assignment->isPending()) {
                $validator->errors()->add(
                    'status',
                    'Only pending maintenance assignments can be rejected.'
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

        return MaintenanceAssignment::query()->find((int) $assignment);
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'rejection_reason.required' =>
                'Please provide a reason for rejecting this maintenance assignment.',

            'rejection_reason.string' =>
                'The rejection reason must be valid text.',

            'rejection_reason.min' =>
                'The rejection reason must contain at least 5 characters.',

            'rejection_reason.max' =>
                'The rejection reason cannot exceed 1000 characters.',

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
            'rejection_reason' => 'rejection reason',
            'work_notes' => 'work notes',
        ];
    }
}
