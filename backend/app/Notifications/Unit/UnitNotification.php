<?php

namespace App\Notifications\Unit;

use App\Models\Unit;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class UnitNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Unit instance
     */
    public Unit $unit;

    /**
     * Action type:
     * created | assigned | status_changed
     */
    public string $type;

    /**
     * Optional extra data (e.g tenant, status)
     */
    public array $meta;

    /**
     * Create a new notification instance.
     */
    public function __construct(Unit $unit, string $type = 'created', array $meta = [])
    {
        $this->unit = $unit;
        $this->type = $type;
        $this->meta = $meta;
    }

    /**
     * Delivery channels
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Mail notification
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->getSubject())
            ->greeting('Hello ' . ($notifiable->full_name ?? 'User'))
            ->line($this->getMessage())
            ->line('Unit: ' . $this->unit->name . ' (#' . $this->unit->unit_number . ')')
            ->line('Status: ' . $this->unit->status)
            ->when($this->unit->property, function ($mail) {
                return $mail->line('Property: ' . $this->unit->property->name);
            })
            ->action('View Unit', url('/units/' . $this->unit->id))
            ->line('Thank you for using the estate management system.');
    }

    /**
     * Database notification (frontend)
     */
    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => $this->getSubject(),
            'message' => $this->getMessage(),

            'unit' => [
                'id'          => $this->unit->id,
                'name'        => $this->unit->name,
                'unit_number' => $this->unit->unit_number,
                'status'      => $this->unit->status,
            ],

            'property' => $this->unit->relationLoaded('property')
                ? [
                    'id'   => $this->unit->property->id,
                    'name' => $this->unit->property->name,
                ]
                : null,

            'meta' => $this->meta,
            'type' => $this->type,
        ];
    }

    /**
     * Array fallback
     */
    public function toArray(object $notifiable): array
    {
        return [
            'unit_id' => $this->unit->id,
            'type'    => $this->type,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MESSAGE HELPERS
    |--------------------------------------------------------------------------
    */

    private function getSubject(): string
    {
        return match ($this->type) {
            'created'        => 'New Unit Created',
            'assigned'       => 'Unit Assigned',
            'status_changed' => 'Unit Status Updated',
            default          => 'Unit Notification',
        };
    }

    private function getMessage(): string
    {
        return match ($this->type) {
            'created' =>
                'A new unit has been created in the system.',

            'assigned' =>
                'A unit has been assigned to you.',

            'status_changed' =>
                'The status of a unit has been updated.',

            default =>
                'You have a new unit update notification.',
        };
    }
}