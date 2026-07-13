<?php

namespace App\Http\Requests\PropertyReview;

use Illuminate\Foundation\Http\FormRequest;

class CreatePropertyReviewRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // User must be authenticated
        return auth()->check();
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'title' => $this->title ? trim($this->title) : null,
            'comment' => $this->comment ? trim($this->comment) : null,
        ]);
    }

    /**
     * Get the validation rules.
     */
    public function rules(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | REVIEW
            |--------------------------------------------------------------------------
            */

            'rating' => [
                'required',
                'integer',
                'between:1,5',
            ],

            'title' => [
                'nullable',
                'string',
                'max:255',
            ],

            'comment' => [
                'required',
                'string',
                'min:10',
                'max:3000',
            ],

            /*
            |--------------------------------------------------------------------------
            | RECOMMENDATION
            |--------------------------------------------------------------------------
            */

            'would_recommend' => [
                'sometimes',
                'boolean',
            ],
        ];
    }

    /**
     * Custom validation messages.
     */
    public function messages(): array
    {
        return [

            'rating.required' => 'Please provide a rating.',
            'rating.integer' => 'Rating must be a number.',
            'rating.between' => 'Rating must be between 1 and 5 stars.',

            'title.max' => 'The review title may not be greater than 255 characters.',

            'comment.required' => 'Please write your review.',
            'comment.min' => 'Your review must contain at least 10 characters.',
            'comment.max' => 'Your review may not exceed 3000 characters.',

            'would_recommend.boolean' => 'The recommendation field must be true or false.',
        ];
    }

    /**
     * Custom attribute names.
     */
    public function attributes(): array
    {
        return [
            'rating' => 'rating',
            'title' => 'review title',
            'comment' => 'review',
            'would_recommend' => 'recommendation',
        ];
    }

    /**
     * Get the validated data.
     */
    public function validated($key = null, $default = null): array
    {
        $data = parent::validated();

        $data['would_recommend'] = $data['would_recommend']
            ?? ($data['rating'] >= 4);

        return $data;
    }
}