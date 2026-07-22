<?php

namespace App\Http\Requests\PropertyAnalytics;

use Illuminate\Foundation\Http\FormRequest;

class CreatePropertyAnalyticsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // ✅ Allow only authenticated users
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'property_id'          => ['required','exists:properties,id'],
            'views_count'          => ['required','integer','min:0'],
            'favorites_count'      => ['required','integer','min:0'],
            'inquiries_count'      => ['required','integer','min:0'],
            'average_rating'       => ['required','numeric','min:0','max:5'],
            'vacant_units_count'   => ['required','integer','min:0'],
            'occupied_units_count' => ['required','integer','min:0'],
            'snapshot_date'        => ['required','date'],
        ];
    }
}
