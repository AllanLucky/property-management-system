<?php

namespace App\Notifications\Password;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class OtpNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $otp,
        public int $expiresInMinutes = 5
    ) {}

    /*
    |--------------------------------------------------------------------------
    | DELIVERY CHANNELS
    |--------------------------------------------------------------------------
    */
    public function via($notifiable): array
    {
        return ['mail'];
    }

    /*
    |--------------------------------------------------------------------------
    | EMAIL CONTENT
    |--------------------------------------------------------------------------
    */
    public function toMail($notifiable): MailMessage
    {
        $name = $notifiable->first_name ?? 'User';
        $appName = config('app.name', 'Application');

        return (new MailMessage)
            ->subject("{$appName} - OTP Verification Code")
            ->greeting("Hello {$name},")
            ->line('You requested a one-time password (OTP) for account verification.')
            ->line(' ')
            ->line('## 🔐 Your OTP Code')
            ->line("### {$this->otp}")
            ->line(' ')
            ->line("⏱ This code will expire in {$this->expiresInMinutes} minutes.")
            ->line(' ')
            ->line('### ⚠️ Security Notice')
            ->line('• Do not share this code with anyone.')
            ->line('• Our team will never ask for your OTP.')
            ->line('• If you did not request this, please ignore this email.')
            ->line(' ')
            ->salutation("Regards, {$appName}");
    }
}