<?php

namespace App\Notifications\PropertyFeature;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class PropertyFeatureNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /*
    |--------------------------------------------------------------------------
    | PROPERTIES
    |--------------------------------------------------------------------------
    */

    protected $propertyFeature;

    protected string $action;

    /*
    |--------------------------------------------------------------------------
    | CREATE NOTIFICATION
    |--------------------------------------------------------------------------
    */

    public function __construct(
        $propertyFeature,
        string $action = 'created'
    ) {
        $this->propertyFeature = $propertyFeature;

        $this->action = $action;
    }

    /*
    |--------------------------------------------------------------------------
    | DELIVERY CHANNELS
    |--------------------------------------------------------------------------
    */

    public function via(object $notifiable): array
    {
        return [

            'mail',
            'database',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MAIL REPRESENTATION
    |--------------------------------------------------------------------------
    */

    public function toMail(object $notifiable): MailMessage
    {
        $featureTitle = $this->propertyFeature->title ?? 'Property Feature';

        $propertyName = optional(
            $this->propertyFeature->property
        )->name ?? 'Property';

        return (new MailMessage)

            ->subject(
                'Property Feature ' .
                ucfirst($this->action)
            )

            ->greeting(
                'Hello ' .
                ($notifiable->first_name ?? 'User') .
                ','
            )

            ->line(
                'A property feature has been ' .
                $this->action .
                ' successfully.'
            )

            ->line(
                'Feature: ' .
                $featureTitle
            )

            ->line(
                'Property: ' .
                $propertyName
            )

            ->line(
                'Feature Value: ' .
                ($this->propertyFeature->value ?? 'N/A')
            )

            ->line(
                'Feature Type: ' .
                ($this->propertyFeature->type ?? 'N/A')
            )

            ->action(
                'View Property',
                url(
                    '/properties/' .
                    optional(
                        $this->propertyFeature->property
                    )->slug
                )
            )

            ->line(
                'Thank you for using our application.'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | ARRAY REPRESENTATION
    |--------------------------------------------------------------------------
    */

    public function toArray(object $notifiable): array
    {
        return [

            /*
            |--------------------------------------------------------------------------
            | NOTIFICATION DETAILS
            |--------------------------------------------------------------------------
            */

            'title' => 'Property Feature ' .
                ucfirst($this->action),

            'message' => 'Property feature "' .
                ($this->propertyFeature->title ?? 'N/A') .
                '" has been ' .
                $this->action .
                '.',

            /*
            |--------------------------------------------------------------------------
            | FEATURE DETAILS
            |--------------------------------------------------------------------------
            */

            'property_feature' => [

                'id' => $this->propertyFeature->id ?? null,

                'property_id' => $this->propertyFeature->property_id ?? null,

                'title' => $this->propertyFeature->title ?? null,

                'slug' => $this->propertyFeature->slug ?? null,

                'value' => $this->propertyFeature->value ?? null,

                'type' => $this->propertyFeature->type ?? null,

                'icon' => $this->propertyFeature->icon ?? null,

                'description' => $this->propertyFeature->description ?? null,

                'is_active' => (bool) (
                    $this->propertyFeature->is_active ?? false
                ),

                'is_highlighted' => (bool) (
                    $this->propertyFeature->is_highlighted ?? false
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | PROPERTY DETAILS
            |--------------------------------------------------------------------------
            */

            'property' => [

                'id' => optional(
                    $this->propertyFeature->property
                )->id,

                'name' => optional(
                    $this->propertyFeature->property
                )->name,

                'slug' => optional(
                    $this->propertyFeature->property
                )->slug,
            ],

            /*
            |--------------------------------------------------------------------------
            | ACTION
            |--------------------------------------------------------------------------
            */

            'action' => $this->action,

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMP
            |--------------------------------------------------------------------------
            */

            'created_at' => now()->toDateTimeString(),
        ];
    }
}