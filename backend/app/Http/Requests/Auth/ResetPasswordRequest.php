<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ResetPasswordRequest extends FormRequest
{
    /**
     * Allow request
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules
     */
    public function rules(): array
    {
        return [
            'email'                 => 'required|email|exists:users,email',
            'otp'                  => 'required|string|size:6',
            'password'             => 'required|string|min:6|confirmed',
        ];
    }

    /**
     * Custom messages (optional)
     */
    public function messages(): array
    {
        return [
            'email.exists' => 'No account found with this email.',
            'otp.size' => 'OTP must be exactly 6 digits.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }
}