<?php

namespace App\Events;

use App\Models\Property;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PropertyAssigned
{
    use Dispatchable, SerializesModels;

    /**
     * The property instance.
     */
    public Property $property;

    /**
     * Create a new event instance.
     */
    public function __construct(Property $property)
    {
        $this->property = $property;
    }

    /**
     * Get the channels the event should broadcast on.
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('properties'),
        ];
    }
}