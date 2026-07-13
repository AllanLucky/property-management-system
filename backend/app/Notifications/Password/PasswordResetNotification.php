<?php

namespace App\Notifications\Password;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class PasswordResetNotification extends Notification
{
    use Queueable;

    public function __construct(public string $token) {}

    public function via($notifiable): array
    {
        return ['mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        /*
        |--------------------------------------------------------------------------
        | FRONTEND BASE URL
        |--------------------------------------------------------------------------
        | Use config instead of env directly (clean architecture)
        */
        $frontendUrl = rtrim(config('app.frontend_url', 'http://localhost:5173'), '/');

        /*
        |--------------------------------------------------------------------------
        | SAFE ENCODING
        |--------------------------------------------------------------------------
        */
        $email = urlencode($notifiable->email);
        $token = urlencode($this->token);

        /*
        |--------------------------------------------------------------------------
        | RESET LINK (CLEAN + SAFE)
        |--------------------------------------------------------------------------
        */
        $resetLink = "{$frontendUrl}/reset-password?token={$token}&email={$email}";

        return (new MailMessage)
            ->subject(config('app.name') . ' - Password Reset Request')
            ->greeting('Hello ' . ($notifiable->first_name ?? 'User'))
            ->line('We received a request to reset your password.')
            ->line(' ')
            ->line('Click the button below to proceed:')
            ->action('Reset Password', $resetLink)
            ->line(' ')
            ->line('⚠️ This link will expire in 60 minutes for security reasons.')
            ->line('If you did not request a password reset, you can safely ignore this email.')
            ->salutation('Regards, ' . config('app.name'));
    }
}