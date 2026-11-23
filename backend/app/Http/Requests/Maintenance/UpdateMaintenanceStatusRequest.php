<?php

namespace App\Http\Requests\Maintenance;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateMaintenanceStatusRequest extends FormRequest
{
    /**
     * Determine whether the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
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
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' => [
                'required',
                'string',
                Rule::in([
                    'pending',
                    'approved',
                    'rejected',
                    'assigned',
                    'in_progress',
                    'on_hold',
                    'completed',
                    'cancelled',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | STATUS CHANGE REASON
            |--------------------------------------------------------------------------
            */

            'reason' => [
                'nullable',
                'string',
                'max:2000',
            ],

            /*
            |--------------------------------------------------------------------------
            | APPROVAL / REJECTION
            |--------------------------------------------------------------------------
            */

            'approval_notes' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'rejection_reason' => [
                'required_if:status,rejected',
                'nullable',
                'string',
                'min:5',
                'max:2000',
            ],

            /*
            |--------------------------------------------------------------------------
            | HOLD INFORMATION
            |--------------------------------------------------------------------------
            */

            'hold_reason' => [
                'required_if:status,on_hold',
                'nullable',
                'string',
                'min:5',
                'max:2000',
            ],

            /*
            |--------------------------------------------------------------------------
            | COMPLETION INFORMATION
            |--------------------------------------------------------------------------
            */

            'completion_notes' => [
                'required_if:status,completed',
                'nullable',
                'string',
                'min:5',
                'max:2000',
            ],

            'total_cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | CANCELLATION
            |--------------------------------------------------------------------------
            */

            'cancellation_reason' => [
                'required_if:status,cancelled',
                'nullable',
                'string',
                'min:5',
                'max:2000',
            ],

            /*
            |--------------------------------------------------------------------------
            | ADDITIONAL INFORMATION
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
            'status.required' => 'Please select a maintenance request status.',

            'status.in' => 'The selected maintenance request status is invalid.',

            'reason.max' => 'The status change reason cannot exceed 2000 characters.',

            'rejection_reason.required_if' => 'Please provide a reason for rejecting this maintenance request.',
            'rejection_reason.min' => 'The rejection reason must contain at least 5 characters.',
            'rejection_reason.max' => 'The rejection reason cannot exceed 2000 characters.',

            'hold_reason.required_if' => 'Please provide a reason for putting this request on hold.',
            'hold_reason.min' => 'The hold reason must contain at least 5 characters.',
            'hold_reason.max' => 'The hold reason cannot exceed 2000 characters.',

            'completion_notes.required_if' => 'Please provide completion notes.',
            'completion_notes.min' => 'Completion notes must contain at least 5 characters.',
            'completion_notes.max' => 'Completion notes cannot exceed 2000 characters.',

            'total_cost.numeric' => 'The total maintenance cost must be a valid number.',
            'total_cost.min' => 'The total maintenance cost cannot be negative.',

            'cancellation_reason.required_if' => 'Please provide a reason for cancelling this maintenance request.',
            'cancellation_reason.min' => 'The cancellation reason must contain at least 5 characters.',
            'cancellation_reason.max' => 'The cancellation reason cannot exceed 2000 characters.',

            'metadata.array' => 'Additional metadata must be a valid array.',
        ];
    }
}
