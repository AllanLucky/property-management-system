<?php

namespace App\Notifications\Property;

use App\Models\Property;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class PropertyAssignedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public Property $property;

    public function __construct(Property $property)
    {
        $this->property = $property;
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /*
    |--------------------------------------------------------------------------
    | MAIL NOTIFICATION
    |--------------------------------------------------------------------------
    */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('🏠 New Property Assigned')
            ->greeting('Hello ' . ($notifiable->full_name ?? 'User'))
            ->line('You have been assigned a new property to manage.')
            ->line('-------------------------------------')
            ->line('Property Title: ' . $this->property->title)
            ->line('Property Code: ' . ($this->property->property_code ?? 'N/A'))
            ->line('Location: ' . $this->property->city . ', ' . $this->property->county)
            ->line('Status: ' . ucfirst($this->property->status))
            ->action(
                'View Property',
                config('app.frontend_url') . '/properties/' . $this->property->id
            )
            ->line('You can now manage units, tenants, bookings, and maintenance.');
    }

    /*
    |--------------------------------------------------------------------------
    | DATABASE NOTIFICATION
    |--------------------------------------------------------------------------
    */
    public function toDatabase(object $notifiable): array
    {
        return [
            'type' => 'property_assigned',
            'title' => 'New Property Assigned',

            'message' => "You have been assigned: {$this->property->title}",

            'property' => [
                'id' => $this->property->id,
                'title' => $this->property->title,
                'property_code' => $this->property->property_code,
                'city' => $this->property->city,
                'county' => $this->property->county,
                'status' => $this->property->status,
                'thumbnail' => $this->property->thumbnail,
                'price' => $this->property->price,
            ],

            'action_url' => '/properties/' . $this->property->id,

            'timestamp' => now()->toDateTimeString(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | ARRAY (API FALLBACK)
    |--------------------------------------------------------------------------
    */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'property_assigned',
            'property_id' => $this->property->id,
            'property_title' => $this->property->title,
            'property_code' => $this->property->property_code,
        ];
    }
}