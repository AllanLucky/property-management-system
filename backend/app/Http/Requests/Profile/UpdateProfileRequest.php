<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    /*
    |--------------------------------------------------------------------------
    | AUTHORIZE
    |--------------------------------------------------------------------------
    */
    public function authorize(): bool
    {
        return auth()->check();
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDATION RULES
    |--------------------------------------------------------------------------
    */
    public function rules(): array
    {
        $userId = $this->user()?->id;

        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */
            'first_name' => [
                'sometimes',
                'string',
                'max:100',
            ],

            'last_name' => [
                'sometimes',
                'string',
                'max:100',
            ],


            /*
            |--------------------------------------------------------------------------
            | CONTACT INFORMATION
            |--------------------------------------------------------------------------
            */
            'phone' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('users', 'phone')
                    ->ignore($userId),
            ],


            /*
            |--------------------------------------------------------------------------
            | PROFILE INFORMATION
            |--------------------------------------------------------------------------
            */
            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'bio' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'gender' => [
                'nullable',
                Rule::in([
                    'male',
                    'female',
                    'other',
                ]),
            ],

            'nationality' => [
                'nullable',
                'string',
                'max:100',
            ],

            'date_of_birth' => [
                'nullable',
                'date',
                'before:today',
            ],


            /*
            |--------------------------------------------------------------------------
            | PROFILE IMAGE
            |--------------------------------------------------------------------------
            */
            'image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp,gif',
                'max:5120', // 5MB
            ],
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOM VALIDATION MESSAGES
    |--------------------------------------------------------------------------
    */
    public function messages(): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | PHONE
            |--------------------------------------------------------------------------
            */
            'phone.unique' =>
                'This phone number is already in use.',


            /*
            |--------------------------------------------------------------------------
            | GENDER
            |--------------------------------------------------------------------------
            */
            'gender.in' =>
                'Gender must be male, female, or other.',


            /*
            |--------------------------------------------------------------------------
            | DATE OF BIRTH
            |--------------------------------------------------------------------------
            */
            'date_of_birth.date' =>
                'Date of birth must be a valid date.',

            'date_of_birth.before' =>
                'Date of birth must be in the past.',


            /*
            |--------------------------------------------------------------------------
            | IMAGE
            |--------------------------------------------------------------------------
            */
            'image.image' =>
                'The uploaded file must be an image.',

            'image.mimes' =>
                'Profile image must be JPG, JPEG, PNG, WEBP, or GIF format.',

            'image.max' =>
                'Profile image size must not exceed 5MB.',
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOM ATTRIBUTE NAMES
    |--------------------------------------------------------------------------
    */
    public function attributes(): array
    {
        return [
            'first_name' =>
                'first name',

            'last_name' =>
                'last name',

            'date_of_birth' =>
                'date of birth',

            'phone' =>
                'phone number',

            'image' =>
                'profile image',
        ];
    }
}