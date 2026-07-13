<?php

namespace App\Notifications\Amenity;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use App\Models\Property;
use App\Models\Amenity;
use App\Models\User;

class PropertyAmenityNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected Property $property;
    protected Amenity $amenity;
    protected string $action; // created | updated | removed
    protected ?User $performedBy;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        Property $property,
        Amenity $amenity,
        string $action = 'updated',
        ?User $performedBy = null
    ) {
        $this->property = $property;
        $this->amenity = $amenity;
        $this->action = $action;
        $this->performedBy = $performedBy;
    }

    /**
     * Delivery channels
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Mail representation
     */
    public function toMail(object $notifiable): MailMessage
    {
        $title = match ($this->action) {
            'created' => 'New Amenity Added to Property',
            'removed' => 'Amenity Removed from Property',
            default => 'Property Amenity Updated',
        };

        return (new MailMessage)
            ->subject($title)
            ->greeting("Hello {$notifiable->name},")
            ->line("The property '{$this->property->name}' has been {$this->action} with an amenity.")
            ->line("Amenity: {$this->amenity->name}")
            ->when($this->performedBy, function ($mail) {
                $mail->line("Performed by: {$this->performedBy->name}");
            })
            ->action(
                'View Property',
                url("/properties/{$this->property->id}")
            )
            ->line('You are receiving this notification because you are assigned to this property or system role.');
    }

    /**
     * Database representation (for in-app notifications)
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'property_id' => $this->property->id,
            'property_name' => $this->property->name,
            'amenity_id' => $this->amenity->id,
            'amenity_name' => $this->amenity->name,
            'action' => $this->action,
            'performed_by' => $this->performedBy?->id,
            'message' => "Amenity '{$this->amenity->name}' was {$this->action} on property '{$this->property->name}'.",
        ];
    }

    /**
     * Array representation
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}