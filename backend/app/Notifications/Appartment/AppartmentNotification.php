<?php

namespace App\Notifications\Appartment;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppartmentNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Apartment data
     */
    public $apartment;

    public $action;

    /**
     * Create a new notification instance.
     */
    public function __construct($apartment, string $action = 'created')
    {
        $this->apartment = $apartment;
        $this->action = $action;
    }

    /**
     * Delivery channels
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Mail message
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Apartment {$this->action} - {$this->apartment->name}")
            ->greeting("Hello {$notifiable->first_name} 👋")
            ->line("An apartment block has been {$this->action} in the system.")

            ->line("📌 Apartment Name: {$this->apartment->name}")
            ->line("🏢 Property ID: {$this->apartment->property_id}")
            ->line("🏢 Status: {$this->apartment->status}")

            ->line("📊 Total Units: {$this->apartment->total_units}")
            ->line("🏠 Occupied Units: {$this->apartment->occupied_units}")
            ->line("🏠 Vacant Units: {$this->apartment->vacant_units}")

            ->action(
                'View Apartment',
                url("/super-admin/apartments/{$this->apartment->id}")
            )

            ->line('You can manage units inside this apartment (Block A, Block B).')
            ->line('Thank you for using the system!');
    }

    /**
     * Array representation
     */
    public function toArray(object $notifiable): array
    {
        return [
            'apartment_id' => $this->apartment->id,
            'name'         => $this->apartment->name,
            'property_id'  => $this->apartment->property_id,
            'status'       => $this->apartment->status,
            'action'       => $this->action,
        ];
    }
}