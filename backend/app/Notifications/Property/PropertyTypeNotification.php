<?php

namespace App\Notifications\Property;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PropertyTypeNotification extends Notification implements ShouldQueue
{
    use Queueable;

    private string $action;
    private mixed $propertyType;

    /**
     * Create a new notification instance.
     */
    public function __construct(string $action, mixed $propertyType)
    {
        $this->action = $action;
        $this->propertyType = $propertyType;
    }

    /**
     * Delivery channels
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Mail notification
     */
    public function toMail(object $notifiable): MailMessage
    {
        $title = match ($this->action) {
            'created' => 'New Property Type Created',
            'updated' => 'Property Type Updated',
            'deleted' => 'Property Type Deleted',
            default => 'Property Type Notification',
        };

        return (new MailMessage)
            ->subject($title)
            ->greeting("Hello {$notifiable->name},")
            ->line("A property type has been **{$this->action}** successfully.")
            ->line('--- Details ---')
            ->line('Name: ' . data_get($this->propertyType, 'name', 'N/A'))
            ->line('Slug: ' . data_get($this->propertyType, 'slug', 'N/A'))
            ->line('Status: ' . data_get($this->propertyType, 'status', 'N/A'))
            ->action('View Property Types', url('/super-admin/property-types'))
            ->line('Thank you for using our property management system.');
    }

    /**
     * Array representation (DB / broadcast ready)
     */
    public function toArray(object $notifiable): array
    {
        return [
            'action' => $this->action,
            'property_type_id' => data_get($this->propertyType, 'id'),
            'name' => data_get($this->propertyType, 'name'),
            'slug' => data_get($this->propertyType, 'slug'),
            'status' => data_get($this->propertyType, 'status'),
        ];
    }
}