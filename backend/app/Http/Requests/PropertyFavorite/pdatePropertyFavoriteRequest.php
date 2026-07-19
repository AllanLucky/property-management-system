<?php

namespace App\Http\Requests\PropertyFavorite;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePropertyFavoriteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check();
    }


    public function rules(): array
    {
        return [

            'is_active' => [
                'sometimes',
                'boolean',
            ],


            'source' => [
                'nullable',
                'string',
                'max:50',
            ],


            'apartment_id' => [
                'nullable',
                'exists:apartments,id',
            ],


            'unit_id' => [
                'nullable',
                'exists:units,id',
            ],

        ];
    }
}