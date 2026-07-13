<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Notifications\PasswordResetNotification;

class PasswordService
{
    /**
     * SEND RESET LINK (TOKEN + EMAIL)
     */
    public function sendResetLink(string $email)
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            return false;
        }

        // Generate raw token
        $token = Str::random(64);

        // Store HASHED token in DB (security best practice)
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => Hash::make($token),
                'created_at' => Carbon::now()
            ]
        );

        // 🔥 SEND EMAIL (THIS WAS MISSING BEFORE)
        $resetLink = url("/reset-password?token={$token}&email={$email}");

        $user->notify(new PasswordResetNotification($resetLink));

        return true;
    }

    /**
     * RESET PASSWORD USING TOKEN
     */
    public function resetPassword(string $email, string $token, string $newPassword)
    {
        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->first();

        if (!$record) {
            return false;
        }

        // Validate token
        if (!Hash::check($token, $record->token)) {
            return false;
        }

        // Expiry check (60 minutes)
        if (Carbon::parse($record->created_at)->addMinutes(60)->isPast()) {
            return false;
        }

        // Update password
        User::where('email', $email)->update([
            'password' => Hash::make($newPassword)
        ]);

        // Delete token after success
        DB::table('password_reset_tokens')
            ->where('email', $email)
            ->delete();

        return true;
    }
}