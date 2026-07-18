<?php

namespace App\Http\Requests\PropertyFavorite;

use Illuminate\Foundation\Http\FormRequest;

class CreatePropertyFavoriteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }


    public function rules(): array
    {
        return [

            'property_id' => [
                'required',
                'exists:properties,id',
            ],

            'apartment_id' => [
                'nullable',
                'exists:apartments,id',
            ],

            'unit_id' => [
                'nullable',
                'exists:units,id',
            ],

            'source' => [
                'nullable',
                'string',
                'max:50',
            ],

        ];
    }


    public function messages(): array
    {
        return [

            'property_id.required'
                => 'Property is required.',

            'property_id.exists'
                => 'Property not found.',

            'apartment_id.exists'
                => 'Apartment not found.',

            'unit_id.exists'
                => 'Unit not found.',

        ];
    }
}