<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Notifications\Password\OtpNotification;
use App\Helpers\ApiResponse;

class VerificationController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | VERIFY OTP
    |--------------------------------------------------------------------------
    */
    public function verifyOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
            'otp'   => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validation($validator->errors());
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return ApiResponse::error('User not found', 404);
        }

        // ❌ expired check
        if (!$user->otp_expires_at || now()->isAfter($user->otp_expires_at)) {
            return ApiResponse::error('OTP expired', 422);
        }

        // ❌ wrong OTP check
        if ((string) $user->otp !== (string) $request->otp) {
            return ApiResponse::unauthorized('Invalid OTP');
        }

        // ✅ verify user
        $user->update([
            'is_verified'       => true,
            'email_verified_at' => now(),
            'otp'              => null,
            'otp_expires_at'   => null,
        ]);

        return ApiResponse::success(
            null,
            'Account verified successfully'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RESEND OTP
    |--------------------------------------------------------------------------
    */
    public function resendOtp(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ]);

        if ($validator->fails()) {
            return ApiResponse::validation($validator->errors());
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return ApiResponse::error('User not found', 404);
        }

        /*
        |--------------------------------------------------------------------------
        | RATE LIMIT (basic anti-spam)
        |--------------------------------------------------------------------------
        | Prevent resend within 4 minutes
        */
        if ($user->otp_expires_at && now()->diffInSeconds($user->otp_expires_at) > -240) {
            return ApiResponse::error(
                'Please wait before requesting another OTP',
                429
            );
        }

        // Generate new OTP
        $otp = random_int(100000, 999999);

        // Update user OTP
        $user->update([
            'otp' => $otp,
            'otp_expires_at' => now()->addMinutes(5),
        ]);

        // Send notification (queued)
        $user->notify(new OtpNotification($otp));

        return ApiResponse::success(
            null,
            'OTP resent successfully'
        );
    }
}