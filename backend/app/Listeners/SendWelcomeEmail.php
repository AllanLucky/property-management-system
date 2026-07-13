<?php

namespace App\Listeners;

use App\Events\UserRegistered;
use App\Notifications\OtpNotification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendWelcomeEmail implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     */
    public function handle(UserRegistered $event): void
    {
        $user = $event->user;

        try {
            // Generate OTP
            $otp = rand(100000, 999999);

            // Store OTP in DB
            $user->update([
                'otp' => $otp,
                'otp_expires_at' => now()->addMinutes(5),
            ]);

            // Send Email Notification
            $user->notify(new OtpNotification($otp));

            // Success log
            Log::info("OTP SENT SUCCESSFULLY to: {$user->email}", [
                'otp' => $otp
            ]);

        } catch (\Throwable $e) {

            // Failure log
            Log::error("OTP SENDING FAILED", [
                'email' => $user->email ?? null,
                'error' => $e->getMessage()
            ]);

            // DO NOT THROW AGAIN
        }
    }
}