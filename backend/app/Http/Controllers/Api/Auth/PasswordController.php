<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Services\Auth\PasswordService;
use App\Helpers\ApiResponse;
use Illuminate\Http\Request;

class PasswordController extends Controller
{
    public function __construct(
        protected PasswordService $passwordService
    ) {}

    /*
    |--------------------------------------------------------------------------
    | FORGOT PASSWORD
    |--------------------------------------------------------------------------
    */
    public function forgotPassword(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email|exists:users,email',
        ]);

        $this->passwordService->sendResetLink($data['email']);

        // 🔥 Always return success (avoid email enumeration attack)
        return ApiResponse::success(
            null,
            'If the email exists, a reset link has been sent.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RESET PASSWORD
    |--------------------------------------------------------------------------
    */
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email|exists:users,email',
            'token'    => 'required|string',
            'password' => 'required|min:6|confirmed',
        ]);

        $result = $this->passwordService->resetPassword(
            $data['email'],
            $data['token'],
            $data['password']
        );

        if (!$result) {
            return ApiResponse::error(
                'Invalid or expired reset token',
                422
            );
        }

        return ApiResponse::success(
            null,
            'Password reset successful'
        );
    }
}