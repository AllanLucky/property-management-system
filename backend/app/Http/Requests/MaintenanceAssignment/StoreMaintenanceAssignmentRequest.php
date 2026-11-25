<?php

namespace App\Http\Requests\MaintenanceAssignment;

use App\Models\MaintenanceRequest;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMaintenanceAssignmentRequest extends FormRequest
{
    /**
     * Determine if the authenticated user is authorized
     * to create a maintenance assignment.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if (! $user) {
            return false;
        }

        return $user->can('manage maintenance assignments')
            || $user->can('create maintenance assignments')
            || $user->can('assign maintenance requests');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'maintenance_request_id' => [
                'required',
                'integer',
                'exists:maintenance_requests,id',
            ],

            'technician_id' => [
                'required',
                'integer',
                'exists:users,id',
            ],

            'scheduled_at' => [
                'nullable',
                'date',
                'after:now',
            ],

            'estimated_hours' => [
                'nullable',
                'numeric',
                'gt:0',
                'decimal:0,2',
                'max:999999.99',
            ],

            'estimated_cost' => [
                'nullable',
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
            /*
            |--------------------------------------------------------------------------
            | Validate Maintenance Request
            |--------------------------------------------------------------------------
            */

            if (
                $this->filled('maintenance_request_id')
                && is_numeric($this->input('maintenance_request_id'))
            ) {
                $maintenanceRequest = MaintenanceRequest::find(
                    $this->input('maintenance_request_id')
                );

                if (! $maintenanceRequest) {
                    $validator->errors()->add(
                        'maintenance_request_id',
                        'The selected maintenance request could not be found.'
                    );
                }
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
            }
        });
    }

    /**
     * Get custom validation messages.
     */
    public function messages(): array
    {
        return [
            'maintenance_request_id.required' =>
                'Please select a maintenance request.',

            'maintenance_request_id.integer' =>
                'The maintenance request ID must be a valid integer.',

            'maintenance_request_id.exists' =>
                'The selected maintenance request does not exist.',

            'technician_id.required' =>
                'Please select a technician for this maintenance assignment.',

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
            'maintenance_request_id' => 'maintenance request',
            'technician_id' => 'technician',
            'scheduled_at' => 'scheduled date and time',
            'estimated_hours' => 'estimated working hours',
            'estimated_cost' => 'estimated maintenance cost',
            'work_notes' => 'work notes',
        ];
    }
}
