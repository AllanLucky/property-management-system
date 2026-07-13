<?php

namespace App\Notifications\UserActivity;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UserActivityNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Activity data payload
     */
    public function __construct(
        public string $title,
        public ?string $message = null,
        public ?string $actionUrl = null,
        public ?string $type = 'info',
        public ?array $meta = []
    ) {}

    /**
     * Delivery channels
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Email notification
     */
    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->title)
            ->greeting('Hello ' . ($notifiable->first_name ?? 'User') . ',');

        if ($this->message) {
            $mail->line($this->message);
        }

        // Action button (optional)
        if ($this->actionUrl) {
            $mail->action('View Details', $this->actionUrl);
        }

        $mail->line('This is an automated notification from your account activity system.');

        return $mail;
    }

    /**
     * Database / array representation
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => $this->title,
            'message' => $this->message,
            'type' => $this->type,
            'action_url' => $this->actionUrl,
            'meta' => $this->meta,
        ];
    }
}