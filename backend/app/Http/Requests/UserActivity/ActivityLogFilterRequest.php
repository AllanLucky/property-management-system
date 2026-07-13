<?php

namespace App\Http\Requests\UserActivity;

use Illuminate\Foundation\Http\FormRequest;

class ActivityLogFilterRequest extends FormRequest
{
    /**
     * Allow authenticated users only
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Validation rules for filtering activity logs
     */
    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'integer', 'exists:users,id'],

            'action' => ['nullable', 'string', 'max:100'],

            'subject_type' => ['nullable', 'string', 'max:255'],

            'subject_id' => ['nullable', 'integer'],

            'from' => ['nullable', 'date'],

            'to' => ['nullable', 'date', 'after_or_equal:from'],

            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],

            'search' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Normalize incoming filters
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'action' => $this->action ? strtolower(trim($this->action)) : null,
            'subject_type' => $this->subject_type ? strtolower(trim($this->subject_type)) : null,
            'search' => $this->search ? trim($this->search) : null,
        ]);
    }

    /**
     * Custom validation messages
     */
    public function messages(): array
    {
        return [
            'user_id.exists' => 'The selected user does not exist.',
            'to.after_or_equal' => 'The end date must be after or equal to the start date.',
            'per_page.max' => 'You cannot request more than 100 records per page.',
        ];
    }
}